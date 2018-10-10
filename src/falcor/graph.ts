import {
  of,
} from "rxjs";
import {
  mergeMap,
  map,
  bufferTime,
} from 'rxjs/operators';
import {
  xprod,
} from 'ramda';
import { parse } from 'query-string';
import {
  $ref, $error,
} from '../utils/falcor';
import { ContextMap, StandardRange, GraphDescription, Search } from "../types";
import { Route } from "falcor-router";
import { matchKey } from "../utils/adapter";


// TODO
const searchIsValid = (search: Search) => search.type !== null && search.type !== undefined;

export default (context: ContextMap, graphs: GraphDescription[]) => ([
  {
    route: 'graph[{keys:graphKeys}][{keys:collections}][{ranges:ranges}]',
    get([_, graphKeys, collections, ranges]) {
      return of(...xprod(graphKeys, collections)).pipe(
        mergeMap(([graphKey, collection]) => {
          // TODO - allow multiple graphKeys to be included in the same query
          const graphDescription = matchKey(graphs, graphKey);
          if (!graphDescription) {
            return [{
              path: ['graph', graphKey],
              value: $error({ code: '404', message: '' })
            }];
          }

          const search: Search = parse(collection);

          if (!searchIsValid(search)) {
            return [{
              path: ['graph', graphKey, collection],
              value: $error({ code: '422', message: '' })
            }];
          }

          // TODO - can from standardize across: R[], Promise<R[]>, Observable<R>\
          return graphDescription.adapter.search(search, ranges).pipe(
            // TODO - handle search result nulls (if falcor doesn't already them?)
            map(({ index, uri }) => ({
              path: ['graph', graphKey, collection, index],
              // NOTE - an alternate graph topology could match resources to their graph via a named graph, rather than a regex against the resource URI
              // a resource's graph would be defined by the search route, not by its URI
              value: $ref(['resource', uri])
            })),
          );
        }),
        bufferTime(0)
      );
    },
  } as Route<[string, string[], string[], StandardRange[]]>,
]);
