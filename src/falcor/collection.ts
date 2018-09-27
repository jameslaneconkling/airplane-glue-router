import {
  of, from,
} from "rxjs";
import {
  mergeMap
} from 'rxjs/operators';
import {
  merge,
  xprod,
  tail,
} from 'ramda';
import {
  $ref,
} from '../utils/falcor';
import {
  curie2uri,
  uri2curie,
} from '../utils/rdf';
import { ContextMap, NormalizedRange } from "../types";
import { Route } from "falcor-router";



export default (context: ContextMap) => ([
  {
    route: 'collection[{keys:graphs}][{keys:collections}][{ranges:ranges}]',
    get([_, graphs, collections, ranges]) {
      // why does returning undefined typecheck in Code (but does not compile)?
      return { path: [], value: true };

      // return of(...graphs).pipe(
      //   mergeMap((graphName) => (
      //     from(graphMap[graphName].get([['collection', collections, ranges]]))
      //     .map(({ path, value }) => ({  // should this be a pipe?
      //       path: ['collection', graphName, tail(path)],
      //       value
      //     }))
      //   ))
      // );
    },
  } as Route<[string, string[], string[], NormalizedRange[]]>,
]);
