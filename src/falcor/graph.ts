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
import {
  $ref, $error,
} from '../utils/falcor';
import { ContextMap, GraphDescription } from "../types";
import { Route, PathValue, StandardRange } from "falcor-router";
import { matchKey } from "../utils/adapter";
import { internalizeUri } from "../utils/rdf";
import { parseSearch } from "../utils/search";


export default (context: ContextMap, graphs: GraphDescription[]) => ([
  {
    route: 'graph[{keys:graphKeys}][{keys:searches}][{ranges:ranges}]',
    get([_, graphKeys, searches, ranges]) {
      // TODO - capture [search][range][field][range]... queries
      return from(xprod(graphKeys, searches)).pipe(
        mergeMap<[string, string], PathValue>(([graphKey, searchQueryString]) => {
          // TODO - allow multiple graphKeys to be included in the same query
          const graphDescription = matchKey(graphs, graphKey);
          if (!graphDescription) {
            return of({
              path: ['graph', graphKey],
              value: $error('404', '')
            });
          }

          const search = parseSearch(context, searchQueryString);

          if (search === null) {
            return of({
              path: ['graph', graphKey, searchQueryString],
              value: $error('422', '')
            });
          }

          // TODO - can from standardize across: R[], Promise<R[]>, Observable<R>\
          return from(graphDescription.adapter.search(search, ranges)).pipe(
            // TODO - handle search result nulls (if falcor doesn't already them?)
            map(({ index, uri }) => ({
              path: ['graph', graphKey, searchQueryString, index],
              // NOTE - an alternate graph topology could match resources to their graph via a named graph, rather than a regex against the resource URI
              // a resource's graph would be defined by the search route, not by its URI
              value: $ref(['resource', internalizeUri(context, uri)])
            })),
          );
        }),
        bufferTime(0)
      );
    },
  } as Route<[string, string[], string[], StandardRange[]]>,
  {
    route: 'graph[{keys:graphKeys}][{keys:searches}].length',
    get([_, graphKeys, searches]) {
      return from(xprod(graphKeys, searches)).pipe(
        mergeMap(([graphKey, searchQueryString]) => {
          // TODO - allow multiple graphKeys to be included in the same query
          const graphDescription = matchKey(graphs, graphKey);
          if (!graphDescription) {
            return of({
              path: ['graph', graphKey],
              value: $error('404', '')
            });
          }

          const search = parseSearch(context, searchQueryString);

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
  } as Route<[string, string[], string[]]>
]);
