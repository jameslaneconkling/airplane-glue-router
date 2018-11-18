import Router, { Route } from 'falcor-router';
import graphRoutes from './graph';
import resourceRoutes from './resource';
import { IJunoRouter, GraphDescription, AdapterResponse, AdapterQuery, AdapterRequest, GraphAdapterQueryHandlers, GraphAdapter, GraphHandler } from '../types';
import { PathSet } from 'falcor-json-graph';
import { toPairs, values } from 'ramda';
import { Observable, Subject, merge } from 'rxjs';
import { stringify } from 'query-string';


export default () => {
  const TopLevelRouter = Router.createClass<Route<PathSet, IJunoRouter>>([
    ...graphRoutes,
    ...resourceRoutes,
  ]);

  return class JunoGraphRouter extends TopLevelRouter implements IJunoRouter {
    public graphs: GraphDescription[]

    constructor(graphs: GraphDescription[]) {
      super();
      this.graphs = graphs;
    }
  }
};

export const requestReducer = (query: AdapterQuery, request: AdapterRequest) => {
  if (request.type === 'search') {
    if (!query.searches[request.key]) {
      query.searches[request.key] = {
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
        search: request.search,
        ranges: [],
        count: true,
      };
    } else {
      query.searches[request.key].count = true;
    }
  } else if (request.type === 'triples') {
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
  } else if (request.type === 'triples-count') {
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
  }

  return query;
};


export const createGraphHandler = (graphAdapter: GraphAdapter): GraphHandler => {
  let batch: {
    query: AdapterQuery,
    source$: Subject<AdapterResponse>
  } | undefined;

  return (request: AdapterRequest) => {
    if (batch === undefined) {
      batch = {
        query: requestReducer({ searches: {}, resources: {} }, request),
        source$: new Subject<AdapterResponse>(),
      };

      setTimeout(() => {
        graphAdapter(batch!.query).subscribe(batch!.source$);
        batch = undefined;
      }, 0);
    } else {
      batch.query = requestReducer(batch.query, request);
    }

    return batch.source$;
  };
};

// export const createGraphHandler = (graphAdapter: GraphAdapter): GraphHandler => {
//   let batch: {
//     query: AdapterQuery,
//     source$: Subject<AdapterResponse>
//   } | undefined;

//   return (request: AdapterRequest) => {
//     if (batch === undefined) {
//       const {
//         isExpectedSearchResponse,
//         getMissingSearchResponses,
//       } = expectedSearchResponses(searchKey, ranges);

//       batch = {
//         query: requestReducer({ searches: {}, resources: {} }, request),
//         source$: new Subject<AdapterResponse>(),
//       };

//       setTimeout(() => {
//         graphAdapter(batch!.query).subscribe(batch!.source$);
//         batch = undefined;
//       }, 0);
//     } else {
//       batch.query = requestReducer(batch.query, request);
//     }

//     return batch.source$.pipe(
//       filter(isExpectedSearchResponse),
//       concat(new Observable<AdapterSearchResponse>((observer) => {
//         getMissingSearchResponses().forEach(observer.next.bind(observer));
//         observer.complete();
//       })),
//     );
//   };
// };

export const createHandlerAdapter = (adapter: GraphAdapterQueryHandlers): GraphAdapter =>
  (query: AdapterQuery): Observable<AdapterResponse> => {
    return merge(
      ...toPairs(query.searches).map(([searchKey, { search, ranges, count }]) => {
        if (ranges.length > 0 && count) {
          return adapter.searchWithCount(searchKey, search, ranges);
        } else if (ranges.length) {
          return adapter.search(searchKey, search, ranges);
        }
        return adapter.searchCount(searchKey, search);
      }),
      ...values(query.resources).map(({ subjects, predicates, ranges, count }) => {
        if (ranges.length > 0 && count) {
          return adapter.triplesWithCount(subjects, predicates, ranges);
        } else if (ranges.length) {
          return adapter.triples(subjects, predicates, ranges);
        }
        return adapter.triplesCount(subjects, predicates);
      })
    );
  };


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

// export const createGraph = (
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

// const graphRoutes = [{
//   route: '...',
//   get({ key, search, ranges }) {
//     return this.handler({ searchKey: key, search, ranges }).pipe(
//       filter(expectedSearchResponse(search, ranges))
//     )
//   }
// }];
