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
import { uri2Curie } from "../utils/rdf";
import { parseSearch } from "../utils/search";


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

          const search = parseSearch(context, collection);

          if (search === null) {
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
              value: $ref(['resource', uri2Curie(context, uri)])
            })),
          );
        }),
        bufferTime(0)
      );
    },
  } as Route<[string, string[], string[], StandardRange[]]>,
]);
