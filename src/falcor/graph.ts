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
  xprod, pick,
} from 'ramda';
import {
  $ref, $error, $atom,
} from '../utils/falcor';
import { IJunoRouter, AdapterSearchCountResponse, AdapterSearchCountRequest, Override, GraphDescription } from "../types";
import { Route, PathValue, StandardRange } from "falcor-router";
import { parseSearch } from "../utils/search";
import { matchKey } from "../adapters/adapter";


export const graphRoutes = [
  {
    route: 'graph[{keys:graphKeys}].search[{keys:searches}][{ranges:ranges}]',
    get([_, graphKeys, __, searches, ranges]) {
      // TODO - capture [search][range][field][range]... queries
      return from(xprod(graphKeys, searches)).pipe(
        mergeMap<[string, string], PathValue>(([graphKey, searchKey]) => {
          // TODO - allow multiple graphKeys to be included in the same query
          const graphDescription = matchKey(this.graphs, graphKey);
          if (!graphDescription) {
            return of({
              path: ['graph', graphKey],
              value: $error('404', 'NOT FOUND')
            });
          }

          const search = parseSearch(searchKey);

          if (search === null) {
            return of({
              path: ['graph', graphKey, 'search', searchKey],
              value: $error('422', '')
            });
          }

          return graphDescription.handler({ type: 'search', key: searchKey, search, ranges })
            .pipe(map(({ index, uri }) => ({
              path: ['graph', graphKey, 'search', searchKey, index],
              value: uri === null ? null : $ref(['resource', uri])
            })));
        }),
        bufferTime(0)
      );
    },
  } as Route<[string, string[], string, string[], StandardRange[]], IJunoRouter>,
  {
    route: 'graph[{keys:graphKeys}].search[{keys:searches}].length',
    get([_, graphKeys, __, searches]) {
      return from(xprod(graphKeys, searches)).pipe(
        mergeMap(([graphKey, searchKey]) => {
          // TODO - allow multiple graphKeys to be included in the same query
          const graphDescription = matchKey(this.graphs, graphKey);
          if (!graphDescription) {
            return of({
              path: ['graph', graphKey],
              value: $error('404', 'NOT FOUND')
            });
          }

          const search = parseSearch(searchKey);

          if (search === null) {
            return of({
              path: ['graph', graphKey, 'search', searchKey],
              value: $error('422', '')
            });
          }

          return graphDescription.handler<AdapterSearchCountRequest>({ type: 'search-count', key: searchKey, search })
            .pipe(map<AdapterSearchCountResponse, PathValue>(({ count }) => ({
              path: ['graph', graphKey, 'search', searchKey, 'length'],
              value: count
            })));
        }),
        bufferTime(0)
      );
    }
  } as Route<[string, string[], string, string[]], IJunoRouter>,
  {
    route: 'graphs',
    get() {
      return {
        path: ['graphs'],
        value: $atom(this.graphs
          .filter((graphDescription): graphDescription is Override<GraphDescription, { label: string }> => (
            graphDescription.label !== undefined
          ))
          .map(pick(['key', 'label']))
        )
      };
    },
  } as Route<[], IJunoRouter>,
  {
    route: 'graph[{keys:graphKeys}].types',
    get([_, graphKeys, __]) {
      return from(graphKeys).pipe(
        mergeMap((graphKey) => {
          const graphDescription = matchKey(this.graphs, graphKey);

          if (!graphDescription) {
            return of({
              path: ['graph', graphKey],
              value: $error('404', 'NOT FOUND')
            });
          }

          return graphDescription.handler({ type: 'type-list' }).pipe(
            map((types) => ({
              path: ['graph', graphKey, 'types'],
              value: $atom(types.resourceTypes),
            } as PathValue))
          );
        }),
        bufferTime(0)
      );
    }
  } as Route<[string, string[], string], IJunoRouter>,
  {
    route: 'graph[{keys:graphKeys}].type[{keys:types}].',
    get([_, graphKeys, __, resourceTypes]) {
      return from(graphKeys).pipe(
        mergeMap((graphKey) => {
          const graphDescription = matchKey(this.graphs, graphKey);

          if (!graphDescription) {
            return of({
              path: ['graph', graphKey],
              value: $error('404', 'NOT FOUND')
            });
          }

          return graphDescription.handler({ type: 'predicate-list', resourceTypes }).pipe(
            map(({ resourceType, predicates }) => ({
              path: ['graph', graphKey, 'type', resourceType],
              value: $atom(predicates)
            } as PathValue))
          );
        }),
        bufferTime(0)
      );
    }
  } as Route<[string, string[], string, string[]], IJunoRouter>
];
