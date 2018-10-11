import {
  from,
} from "rxjs";
import {
  mergeMap,
  map,
  bufferTime,
} from 'rxjs/operators';
import { ContextMap, GraphDescription } from "../types";
import { Route, StandardRange } from "falcor-router";
import { groupUrisByGraph } from "../utils/adapter";
import { curie2URI, createSentinel, uri2Curie } from "../utils/rdf";
import { $error, $ref, $atom } from "../utils/falcor";


export default (context: ContextMap, graphs: GraphDescription[]) => ([
  {
    route: 'resource[{keys:subjects}][{keys:predicates}][{ranges:ranges}]',
    get([_, subjects, predicates, ranges]) {
      // return { path: ['asdf'] } // TODO - why does this typecheck
      return from(groupUrisByGraph(graphs, subjects)).pipe(
        mergeMap(({ adapter, key, uris }) => adapter.triples(
          uris.map((uri) => curie2URI(context, uri)),
          predicates.map((uri) => curie2URI(context, uri)),
          ranges
        ).pipe(
          map(({ subject, predicate, index, object }) => {
            const predicateCurie = uri2Curie(context, predicate);
  
            if (typeof object === 'string') {
              object = createSentinel(context, object);
            }
            
            if (object.type === 'ref') {
              return {
                path: ['resource', subject, predicateCurie, index],
                value: $ref(['resource', object.uri])
              };
            } else if (object.type === 'error') {
              return {
                path: ['resource', subject, predicateCurie, index],
                value: $error('500', object.value)
              };     
            } if (object.type === 'atom') {
              return {
                path: ['resource', subject, predicateCurie, index],
                value: $atom(object.literal, object.dataType, object.language)
              };            
            }
  
            return {
              path: ['resource', subject, predicateCurie, index],
              value: $error('500', `Adapter ${key} triples handler returned unhandleable object type: ${JSON.stringify(object)}`)
            };
          })
        )),
        bufferTime(0)
      )
    },
  } as Route<[string, string[], string[], StandardRange[]]>,
]);
