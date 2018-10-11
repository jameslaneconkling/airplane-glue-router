import {
  of,
  from,
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
import { ContextMap, GraphDescription, Search } from "../types";
import { Route, PathValue, StandardRange } from "falcor-router";
import { matchKey } from "../utils/adapter";


// TODO
const searchIsValid = (search: Search) => search.type !== null && search.type !== undefined;

export default (context: ContextMap, graphs: GraphDescription[]) => ([
  {
    route: 'graph[{keys:graphKeys}][{keys:collections}][{ranges:ranges}]',
    get([_, graphKeys, collections, ranges]) {
      return from(xprod(graphKeys, collections)).pipe(
        mergeMap<[string, string], PathValue>(([graphKey, collection]) => {
          // TODO - allow multiple graphKeys to be included in the same query
          const graphDescription = matchKey(graphs, graphKey);
          if (!graphDescription) {
            return of({
              path: ['graph', graphKey],
              value: $error('404', '')
            });
          }

          const search: Search = parse(collection);

          if (!searchIsValid(search)) {
            return of({
              path: ['graph', graphKey, collection],
              value: $error('422', '')
            });
          }

          // TODO - can from standardize across: R[], Promise<R[]>, Observable<R>\
          return from(graphDescription.adapter.search(search, ranges)).pipe(
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
