import { Subject, throwError, Observable, merge, } from "rxjs";
import { filter } from "rxjs/operators";
import { StandardRange } from "falcor-router";
import { GraphAdapterQueryHandlers, AdapterSearchCountResponse, AdapterTripleResponse, AdapterSearchResponse, Search, AdapterTripleCountResponse, AdapterRequest, AdapterQuery, AdapterResponse } from "../types";
import { ranges2List } from "../utils/falcor";
import { clone, toPairs, values } from "ramda";
import { stringify } from "query-string";


export const isExpectedSearchResponse = (searchKey: string, indices: Set<number>) => (
  response: AdapterResponse
): response is AdapterSearchResponse => response.type === 'search' && response.key === searchKey && indices.has(response.index);
export const isExpectedSearchCountResponse = (searchKey: string) => (
  response: AdapterResponse
): response is AdapterSearchCountResponse => response.type === 'search-count' && response.key === searchKey;
export const isExpectedTripleResponse = (subjects: Set<string>, predicates: Set<string>, indices: Set<number>) => (
  response: AdapterResponse
): response is AdapterTripleResponse => response.type === 'triple' && subjects.has(response.subject) && predicates.has(response.predicate) && indices.has(response.index)
export const isExpectedTripleCountResponse = (subjects: Set<string>, predicates: Set<string>) => (
  response: AdapterResponse
): response is AdapterTripleCountResponse => response.type === 'triple-count' && subjects.has(response.subject) && predicates.has(response.predicate);

export class AbstractGraphAdapterQueryHandlers implements GraphAdapterQueryHandlers {
  search(_searchKey: string, _serach: Search, _ranges: StandardRange[]) {
    return throwError('Unimplemented Error') as Observable<AdapterSearchResponse>;
  }

  searchCount(_searchKey: string, _serach: Search) {
    return throwError('Unimplemented Error') as Observable<AdapterSearchCountResponse>;
  }

  triples() {
    return throwError('Unimplemented Error') as Observable<AdapterTripleResponse>;
  }

  triplesCount() {
    return throwError('Unimplemented Error') as Observable<AdapterTripleCountResponse>;
  }

  searchWithCount(_searchKey: string, _search: Search, _ranges: StandardRange[]) {
    return throwError('Unimplemented Error') as Observable<AdapterSearchResponse | AdapterSearchCountResponse>;
  }

  triplesWithCount(_subjects: string[], _predicates: string[], _ranges: StandardRange[]) {
    return throwError('Unimplemented Error') as Observable<AdapterTripleResponse | AdapterTripleCountResponse>;
  }
}


// batching occurs per router request, per graph, per time interval
export const createBatchedQuery = <Q, B, R>(
  reducer: (batchedQuery: B, query: Q) => B,
  initialValue: B,
  handler: (batchedQuery: B) => Observable<R>,
  { interval = 0 }: Partial<{ interval: number }> = {},
) => {
  let batch: {
    batchedQuery: B,
    source$: Subject<R>
  } | undefined;

  return (query: Q) => {
    if (batch === undefined) {
      batch = {
        batchedQuery: reducer(clone(initialValue), query),
        source$: new Subject<R>(),
      };

      setTimeout(() => {
        handler(batch!.batchedQuery).subscribe(batch!.source$);
        batch = undefined;
      }, interval);
    } else {
      batch.batchedQuery = reducer(batch.batchedQuery, query);
    }

    return batch.source$;
  };
};


export class BatchedHandler {
  private adapter: GraphAdapterQueryHandlers

  // TODO - is batchedQuery created for each instance, or is it shared across instances? (in which case it would need to be initialized in the constructor, not inline)
  private batchedQuery = createBatchedQuery<
    AdapterRequest,
    AdapterQuery,
    AdapterSearchResponse | AdapterSearchCountResponse
  >(
    (batchedQuery, query) => {
      if (query.type === 'search') {
        if (!batchedQuery.searches[query.key]) {
          batchedQuery.searches[query.key] = {
            search: query.search,
            ranges: query.ranges,
            count: false
          }; 
        } else {
          batchedQuery.searches[query.key].ranges.push(...query.ranges);
        }
      } else if (query.type === 'search-count') {
        if (!batchedQuery.searches[query.key]) {
          batchedQuery.searches[query.key] = {
            search: query.search,
            ranges: [],
            count: true,
          };
        } else {
          batchedQuery.searches[query.key].count = true;
        }
      } else if (query.type === 'triples') {
        // TODO - make smarter subject/predicate equality matching, possibly by sorting: ['test:1', 'test:2'] === ['test:2', 'test:1']
        const resourceKey = stringify([query.subjects, query.predicates]);
        if (!batchedQuery.resources[resourceKey]) {
          batchedQuery.resources[resourceKey] = {
            subjects: query.subjects,
            predicates: query.predicates,
            ranges: query.ranges,
            count: false,
          }
        } else {
          // TODO - dedup ranges after combining
          batchedQuery.resources[resourceKey].ranges.push(...query.ranges);
        }
      } else if (query.type === 'triples-count') {
        const resourceKey = stringify([query.subjects, query.predicates]);
        if (!batchedQuery.resources[resourceKey]) {
          batchedQuery.resources[resourceKey] = {
            subjects: query.subjects,
            predicates: query.predicates,
            ranges: [],
            count: true,
          }
        } else {
          // TODO - dedup ranges after combining
          batchedQuery.resources[resourceKey].count = true;
        }
      }

      return batchedQuery;
    },
    { searches: {}, resources: {} },
    (batchedQuery) => {
      // NOTE - this could be the adapter interface: (query: Query) => Observable<AdapterResponse>
      // instead of the current GraphAdapter interface
      // the reducer reduces a stream of search/searchCount/triples/triplesCount requests into a Query
      // the Query is compiled by the Adapter into a request
      // meaning, an Adapter is not a set of handlers, but a function that takes a Query (currently, BatchedQuery or TripleQuery) and returns an Observable of responses
      // BatchedHandler would become a BatchedHandler: Router --1+-> BatchedHandler --1--> Adapter
      return merge(
        ...toPairs(batchedQuery.searches).map(([searchKey, { search, ranges, count }]) => {
          if (ranges.length > 0 && count) {
            return this.adapter.searchWithCount(searchKey, search, ranges);
          } else if (ranges.length) {
            return this.adapter.search(searchKey, search, ranges);
          }
          return this.adapter.searchCount(searchKey, search);
        }),
        ...values(batchedQuery.resources).map(({ subjects, predicates, ranges, count }) => {
          if (ranges.length > 0 && count) {
            return this.adapter.triplesWithCount(subjects, predicates, ranges);
          } else if (ranges.length) {
            return this.adapter.triples(subjects, predicates, ranges);
          }
          return this.adapter.triplesCount(subjects, predicates);
        })
      );
    }
  )

  constructor(adapter: GraphAdapterQueryHandlers) {
    this.adapter = adapter;
  }

  // TODO - the BatchedHandler interface filters the results of batchedQuery.  This needs better pattern matching to ensure the return values are filtered down to what each handler (search/searchCount) is expecting
  // TODO - should batchedQuery() be replaced w/ a general batchedRequest(), complicating the reducer function, but allowing the handler to handle more things at once
  search(key: string, search: Search, ranges: StandardRange[]) {
    return this.batchedQuery({ type: 'search', key, search, ranges }).pipe(
      filter(isExpectedSearchResponse(key, new Set(ranges2List(ranges))))
    );
  }

  searchCount(key: string, search: Search) {
    return this.batchedQuery({ type: 'search-count', key, search }).pipe(
      filter(isExpectedSearchCountResponse(key))
    );
  }

  triples(subjects: string[], predicates: string[], ranges: StandardRange[]) {
    // return this.adapter.triples(subjects, predicates, ranges);
    return this.batchedQuery({ type: 'triples', subjects, predicates, ranges }).pipe(
      filter(isExpectedTripleResponse(new Set(subjects), new Set(predicates), new Set(ranges2List(ranges))))
    );
  }

  triplesCount(subjects: string[], predicates: string[]) {
    // return this.adapter.triplesCount(subjects, predicates);
    return this.batchedQuery({ type: 'triples-count', subjects, predicates }).pipe(
      filter(isExpectedTripleCountResponse(new Set(subjects), new Set(predicates)))
    );
  }
}
