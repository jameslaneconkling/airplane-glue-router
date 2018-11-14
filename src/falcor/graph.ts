import {
  of,
  from,
  merge,
} from "rxjs";
import {
  mergeMap,
  map,
  bufferTime,
  reduce,
} from 'rxjs/operators';
import {
  xprod,
} from 'ramda';
import {
  $ref, $error, ranges2List,
} from '../utils/falcor';
import { IJunoRouter, SearchResponse } from "../types";
import { Route, PathValue, StandardRange } from "falcor-router";
import { matchKey } from "../utils/adapter";
import { parseSearch } from "../utils/search";


const graphRoutes = [
  {
    route: 'graph[{keys:graphKeys}][{keys:searches}][{ranges:ranges}]',
    get([_, graphKeys, searches, ranges]) {
      // TODO - capture [search][range][field][range]... queries
      return from(xprod(graphKeys, searches)).pipe(
        mergeMap<[string, string], PathValue>(([graphKey, searchQueryString]) => {
          // TODO - allow multiple graphKeys to be included in the same query
          const graphDescription = matchKey(this.graphs, graphKey);
          if (!graphDescription) {
            return of({
              path: ['graph', graphKey],
              value: $error('404', '')
            });
          }

          const search = parseSearch(searchQueryString);

          if (search === null) {
            return of({
              path: ['graph', graphKey, searchQueryString],
              value: $error('422', '')
            });
          }

          // TODO - can from standardize across: R[], Promise<R[]>, Observable<R>\
          const search$ = from(graphDescription.adapter.search(search, ranges));
          return merge(
            search$.pipe(
              map(({ index, uri }) => {
                // TODO - handle multiple response types (search count, optimistic resource results)
                return {
                  path: ['graph', graphKey, searchQueryString, index],
                  // NOTE - an alternate graph topology could match resources to their graph via a named graph, rather than a regex against the resource URI
                  // a resource's graph would be defined by the search route, not by its URI
                  value: $ref(['resource', uri])
                }
              }),
            ),
            search$.pipe(
              reduce<SearchResponse, Set<number>>((acc, item) => {
                acc.delete(item.index);
                return acc;
              }, new Set(ranges2List(ranges))),
              mergeMap((missingIndices) => {
                return from(Array.from(missingIndices).map((index) => ({
                  path: ['graph', graphKey, searchQueryString, index],
                  value: null
                })))
              })
            )
          );
        }),
        bufferTime(0)
      );
    },
  } as Route<[string, string[], string[], StandardRange[]], IJunoRouter>,
  {
    route: 'graph[{keys:graphKeys}][{keys:searches}].length',
    get([_, graphKeys, searches]) {
      return from(xprod(graphKeys, searches)).pipe(
        mergeMap(([graphKey, searchQueryString]) => {
          // TODO - allow multiple graphKeys to be included in the same query
          const graphDescription = matchKey(this.graphs, graphKey);
          if (!graphDescription) {
            return of({
              path: ['graph', graphKey],
              value: $error('404', '')
            });
          }

          const search = parseSearch(searchQueryString);

          if (search === null) {
            return of({
              path: ['graph', graphKey, searchQueryString],
              value: $error('422', '')
            });
          }

          return from(graphDescription.adapter.searchCount(search)).pipe(
            map(({ count }) => ({
              path: ['graph', graphKey, searchQueryString, 'length'],
              value: count
            } as PathValue))
          )
        })
      );
    }
  } as Route<[string, string[], string[]], IJunoRouter>
];


export default graphRoutes;
