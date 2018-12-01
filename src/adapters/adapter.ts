import {
  GraphDescription,
  AdapterResponse,
  AdapterQuery,
  AdapterRequest,
  GraphAdapterQueryHandlers,
  GraphAdapter,
  GraphHandler,
  AdapterSearchResponse,
  AdapterSearchCountResponse,
  AdapterTripleResponse,
  AdapterTripleCountResponse,
  Request2Response,
  Search,
  AdapterTypeListResponse,
  AdapterPredicateListResponse
} from '../types';
import { values, any } from 'ramda';
import { Observable, Subject, merge, empty } from 'rxjs';
import { stringify } from 'query-string';
import { filter, concat } from 'rxjs/operators';
import { neverever, cartesianProd } from '../utils/misc';
import { StandardRange } from "falcor-router";
import { ranges2List } from '../utils/falcor';


export class AbstractGraphAdapterQueryHandlers implements GraphAdapterQueryHandlers {
  public search(_searchKey: string, _serach: Search, _ranges: StandardRange[], _count: boolean) {
    return empty() as Observable<AdapterSearchResponse | AdapterSearchCountResponse>;
  }

  public triples(_subjects: string[], _predicates: string[], _ranges: StandardRange[], _count: boolean) {
    return empty() as Observable<AdapterTripleResponse | AdapterTripleCountResponse>;
  }

  public getTypes() {
    return empty() as Observable<AdapterTypeListResponse>;
  }

  public getPredicates(_types: string[]) {
    return empty() as Observable<AdapterPredicateListResponse>;
  }
}


export const requestReducer = (query: AdapterQuery, request: AdapterRequest) => {
  if (request.type === 'search') {
    if (!query.searches[request.key]) {
      query.searches[request.key] = {
        key: request.key,
        search: request.search,
        ranges: request.ranges,
        count: false
      }; 
    } else {
      query.searches[request.key].ranges.push(...request.ranges);
    }
  } else if (request.type === 'search-count') {
    if (!query.searches[request.key]) {
      query.searches[request.key] = {
        key: request.key,
        search: request.search,
        ranges: [],
        count: true,
      };
    } else {
      query.searches[request.key].count = true;
    }
  } else if (request.type === 'triple') {
    // TODO - make smarter subject/predicate equality matching, possibly by sorting: ['test:1', 'test:2'] === ['test:2', 'test:1']
    const resourceKey = stringify([request.subjects, request.predicates]);
    if (!query.resources[resourceKey]) {
      query.resources[resourceKey] = {
        subjects: request.subjects,
        predicates: request.predicates,
        ranges: request.ranges,
        count: false,
      }
    } else {
      // TODO - dedup ranges after combining
      query.resources[resourceKey].ranges.push(...request.ranges);
    }
  } else if (request.type === 'triple-count') {
    const resourceKey = stringify([request.subjects, request.predicates]);
    if (!query.resources[resourceKey]) {
      query.resources[resourceKey] = {
        subjects: request.subjects,
        predicates: request.predicates,
        ranges: [],
        count: true,
      }
    } else {
      // TODO - dedup ranges after combining
      query.resources[resourceKey].count = true;
    }
  } else if (request.type === 'type-list') {
    query.resourceTypes.list = true;
  } else if (request.type === 'predicate-list') {
    query.resourceTypes.types.push(...request.resourceTypes);
  } else {
    return neverever(request)
  }

  return query;
};


export const createGraphHandler = (
  graphAdapter: GraphAdapter
): GraphHandler => {
  // batching occurs per router request, per graph, per time interval
  let batch: {
    query: AdapterQuery,
    source$: Subject<AdapterResponse>
  } | undefined;

  return <Request extends AdapterRequest = AdapterRequest>(request: AdapterRequest) => {
    if (batch === undefined) {
      batch = {
        query: requestReducer({ searches: {}, resources: {}, resourceTypes: { list: false, types: [] } }, request),
        source$: new Subject<AdapterResponse>(),
      };

      setTimeout(() => {
        graphAdapter(batch!.query).subscribe(batch!.source$);
        batch = undefined;
      }, 0);
    } else {
      batch.query = requestReducer(batch.query, request);
    }

    const {
      isExpectedResponse,
      getMissingResponses,
    } = expectedResponses<Request>(request);

    return batch.source$.pipe(
      filter(isExpectedResponse),
      concat(new Observable<Request2Response<Request>>((observer) => {
        getMissingResponses().forEach(observer.next.bind(observer));
        observer.complete();
      })),
    );
  };
};


// export const createGraphHandler = (
//   graphAdapter: (query: Query) => Observable<AdapterResponse>,
//   { key, domains, label}: {
//     key: string,
//     domains: RegExp[],
//     label?: string,
//   }
// ) => {
//   const subject = new Subject<AdapterRequest>();
//   const response$ = subject.pipe(
//     bufferTime(0),
//     map(reduce<AdapterRequest, Query>(requestReducer, { search: {}, resources: [] })),
//     map(graphAdapter),
//     map((requests) => graphAdapter(reduce(reducer, query, { search: {}, resources: [] })).pipe(multicast(), refCount()))
//   );

//   return {
//     key,
//     domains,
//     label,
//     handler: (request: AdapterRequest) => {
//       subject.next(request);
//       // each multicasted response$ stream needs to unsubscribe when its batch is done
//       // meaning, every batch needs to create a new subject$
//       // if this can't work, use the hybrid approach adopted by createBatchedQuery()
//       return response$.pipe(
//         first(),
//         mergeAll()
//       );
//     }
//   }
// };


export const createGraph = (
  graphAdapter: GraphAdapter,
  { key, domains, label}: {
    key: string,
    domains: RegExp[],
    label?: string,
  }
): GraphDescription => ({
  key,
  domains,
  label,
  handler: createGraphHandler(graphAdapter)
});


export const createHandlerAdapter = (adapter: GraphAdapterQueryHandlers): GraphAdapter =>
  (query: AdapterQuery): Observable<AdapterResponse> => {
    return merge(
      ...values(query.searches).map(({ key, search, ranges, count }) => adapter.search(key, search, ranges, count)),
      ...values(query.resources).map(({ subjects, predicates, ranges, count }) => adapter.triples(subjects, predicates, ranges, count)),
      query.resourceTypes.list ? adapter.getTypes() : empty(),
      adapter.getPredicates(query.resourceTypes.types)
    );
  };


export const matchKey = (graphs: GraphDescription[], adapterKey: string) => (
  graphs.find((adapter) => adapterKey === adapter.key)
);

export const matchDomain = (graphs: GraphDescription[], domainName: string) => (
  graphs.find(({ domains }) => any((domain) => domain.test(domainName), domains))
);

export const missingGraph = Symbol('missing_graph');


export const groupUrisByGraph = (graphs: GraphDescription[], subjects: string[]) => {
  return values(subjects.reduce<{
    [key: string]: {
      handler: GraphHandler,
      subjects: string[],
      key: string
    }
  }>((grouped, uri) => {
    const graphDescription = matchDomain(graphs, uri);
    if (graphDescription === undefined) {
      // TODO - handle unmatched resources?
      return grouped;
    }

    if (grouped[graphDescription.key]) {
      grouped[graphDescription.key].subjects.push(uri);
    } else {
      grouped[graphDescription.key] = {
        handler: graphDescription.handler,
        key: graphDescription.key,
        subjects: [uri]
      };
    }

    return grouped;
  }, {}));
};


export const expectedResponses = <Request extends AdapterRequest>(
  request: AdapterRequest
): {
  isExpectedResponse: (response: AdapterResponse) => response is Request2Response<Request>,
  getMissingResponses: () => Map<string, Request2Response<Request>>,
} => {
  if (request.type === 'search') {
    const expected = ranges2List(request.ranges)
      .reduce((acc, index) => {
        const response: AdapterSearchResponse = ({ type: 'search', key: request.key, index, uri: null });
        acc.set(stringify(response), response);
        return acc;
      }, new Map<string, AdapterSearchResponse>());

    return {
      isExpectedResponse: (response: AdapterResponse): response is AdapterSearchResponse => (
        response.type === 'search' &&
        expected.delete(stringify({ type: 'search', key: response.key, index: response.index, uri: null }))
      ),
      getMissingResponses: () => expected,
    };
  } else if (request.type === 'search-count') {
    return {
      isExpectedResponse: (response: AdapterResponse): response is AdapterSearchCountResponse => (
        response.type === 'search-count' && response.key === request.key
      ),
      getMissingResponses: () => new Map(),
    };
  } else if (request.type === 'triple') {
    const expected = cartesianProd(request.subjects, request.predicates, ranges2List(request.ranges))
      .reduce((acc, [subject, predicate, index]) => {
        const response: AdapterTripleResponse = ({ type: 'triple', subject, predicate, index, object: null });
        acc.set(stringify(response), response);
        return acc;
      }, new Map<string, AdapterTripleResponse>());

    return {
      isExpectedResponse: (response: AdapterResponse): response is AdapterTripleResponse => (
        response.type === 'triple' &&
        expected.delete(stringify({ type: 'triple', subject: response.subject, predicate: response.predicate, index: response.index, object: null }))
      ),
      getMissingResponses: () => expected,
    };
  } else if (request.type === 'triple-count') {
    const expectedSubjects = new Set(request.subjects);
    const expectedPredicates = new Set(request.predicates);

    return {
      isExpectedResponse: (response: AdapterResponse): response is AdapterTripleCountResponse => (
        response.type === 'triple-count' && expectedSubjects.has(response.subject) && expectedPredicates.has(response.predicate)
      ),
      getMissingResponses: () => new Map(),
    };
  } else if (request.type === 'type-list') {
    return {
      isExpectedResponse: (response: AdapterResponse): response is AdapterTypeListResponse => (
        response.type === 'type-list'
      ),
      getMissingResponses: () => new Map(),
    }
  } else if (request.type === 'predicate-list') {
    const expected = new Set(request.resourceTypes);
    return {
      isExpectedResponse: (response: AdapterResponse): response is AdapterPredicateListResponse => (
        response.type === 'predicate-list' && expected.has(response.resourceType)
      ),
      getMissingResponses: () => new Map(),
    }
  }

  return neverever(request);
};
