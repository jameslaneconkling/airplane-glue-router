import {
  of,
} from "rxjs";
import {
  mergeMap,
  map,
} from 'rxjs/operators';
import {
  xprod,
} from 'ramda';
import { parse } from 'query-string';
import {
  $ref, $error,
} from '../utils/falcor';
import {
  curie2uri,
  uri2curie,
} from '../utils/rdf';
import { ContextMap, StandardRange, GraphAdapter, Search } from "../types";
import { Route } from "falcor-router";
import { matchName } from "../utils/adapter";


// TODO
const searchIsValid = (search: Search) => search.type !== null && search.type !== undefined;

export default (context: ContextMap, graphAdapters: GraphAdapter[]) => ([
  {
    route: 'graph[{keys:graphs}][{keys:collections}][{ranges:ranges}]',
    get([_, graphs, collections, ranges]) {
      return of(...xprod(graphs, collections)).pipe(
        mergeMap(([graphName, collection]) => {
          // TODO - allow multiple graphs to be included in the same query
          const adapterDescription = matchName(graphAdapters, graphName);
          if (!adapterDescription) {
            return [{
              path: ['graph', graphName],
              value: $error({ code: '404', message: '' })
            }];
          }

          const search: Search = parse(collection);

          if (!searchIsValid(search)) {
            return [{
              path: ['graph', graphName, collection],
              value: $error({ code: '422', message: '' })
            }];
          }

          // TODO - can from standardize across: R[], Promise<R[]>, Observable<R>\
          return adapterDescription.adapter.search(search, ranges).pipe(
            // TODO - handle search result nulls (if falcor doesn't already them?)
            map(({ index, uri }) => ({
              path: ['graph', graphName, collection, index],
              // NOTE - an alternate graph topology could match resources to their graph via a named graph, rather than a regex against the resource URI
              // a resource's graph would be defined by the search route, not by its URI
              value: $ref(['resource', uri])
            })),
          );
        })
      );
    },
  } as Route<[string, string[], string[], StandardRange[]]>,
]);
