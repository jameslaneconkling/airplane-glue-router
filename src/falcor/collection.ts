import {
  of, from,
} from "rxjs";
import {
  mergeMap,
  map,
} from 'rxjs/operators';
import {
  merge,
  xprod,
  tail,
} from 'ramda';
import { parse } from 'query-string';
import {
  $ref, $error,
} from '../utils/falcor';
import {
  curie2uri,
  uri2curie,
} from '../utils/rdf';
import { ContextMap, DefaultRange, GraphAdapter } from "../types";
import { Route } from "falcor-router";
import { matchName } from "../utils/adapter";



export default (context: ContextMap, graphAdapters: GraphAdapter[]) => ([
  {
    route: 'collection[{keys:graphs}][{keys:collections}][{ranges:ranges}]',
    get([_, graphs, collections, ranges]) {
      return of(...graphs).pipe(
        mergeMap((graphName) => {
          // TODO - allow multiple graphs to be included in the same query
          const adapterDescription = matchName(graphAdapters, graphName);
          if (!adapterDescription) {
            return [{
              path: ['collection', graphName],
              value: $error({ code: '404', message: `` })
            }];
          }

          // TODO - can from standardize across: R[], Promise<R[]>, Observable<R>
          return from(adapterDescription.adapter.search(collections, ranges)).pipe(
            map(({ path, value }) => ({ path, value }))
          );
        })
      );
    },
  } as Route<[string, string[], string[], DefaultRange[]]>,
]);
