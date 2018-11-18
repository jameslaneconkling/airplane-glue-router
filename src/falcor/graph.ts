import {
  of,
  from,
  Observable,
} from "rxjs";
import {
  mergeMap,
  map,
  bufferTime,
  concat,
  filter,
} from 'rxjs/operators';
import {
  xprod,
} from 'ramda';
import {
  $ref, $error,
} from '../utils/falcor';
import { IJunoRouter, AdapterSearchResponse, AdapterSearchCountResponse } from "../types";
import { Route, PathValue, StandardRange } from "falcor-router";
import { matchKey, expectedSearchResponses, isExpectedSearchCountResponse } from "../utils/adapter";
import { parseSearch } from "../utils/search";


const graphRoutes = [
  {
    route: 'graph[{keys:graphKeys}][{keys:searches}][{ranges:ranges}]',
    get([_, graphKeys, searches, ranges]) {
      // TODO - capture [search][range][field][range]... queries
      return from(xprod(graphKeys, searches)).pipe(
        mergeMap<[string, string], PathValue>(([graphKey, searchKey]) => {
          // TODO - allow multiple graphKeys to be included in the same query
          const graphDescription = matchKey(this.graphs, graphKey);
          if (!graphDescription) {
            return of({
              path: ['graph', graphKey],
              value: $error('404', '')
            });
          }

          const search = parseSearch(searchKey);

          if (search === null) {
            return of({
              path: ['graph', graphKey, searchKey],
              value: $error('422', '')
            });
          }

          const {
            isExpectedSearchResponse,
            getMissingSearchResponses,
          } = expectedSearchResponses(searchKey, ranges);

          return graphDescription.handler({ type: 'search', key: searchKey, search, ranges }).pipe(
            filter(isExpectedSearchResponse),
            concat(new Observable<AdapterSearchResponse>((observer) => {
              getMissingSearchResponses().forEach(observer.next.bind(observer));
              observer.complete();
            })),
            map(({ index, uri }) => ({
              path: ['graph', graphKey, searchKey, index],
              value: uri === null ? null : $ref(['resource', uri])
            })),
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
        mergeMap(([graphKey, searchKey]) => {
          // TODO - allow multiple graphKeys to be included in the same query
          const graphDescription = matchKey(this.graphs, graphKey);
          if (!graphDescription) {
            return of({
              path: ['graph', graphKey],
              value: $error('404', '')
            });
          }

          const search = parseSearch(searchKey);

          if (search === null) {
            return of({
              path: ['graph', graphKey, searchKey],
              value: $error('422', '')
            });
          }

          return from(graphDescription.handler({ type: 'search-count', key: searchKey, search })).pipe(
            filter(isExpectedSearchCountResponse(searchKey)),
            map<AdapterSearchCountResponse, PathValue>(({ count }) => ({
              path: ['graph', graphKey, searchKey, 'length'],
              value: count
            }))
          )
        }),
        bufferTime(0)
      );
    }
  } as Route<[string, string[], string[]], IJunoRouter>
];


export default graphRoutes;
