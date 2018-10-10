import {
  from,
} from "rxjs";
import {
  mergeMap,
  map,
  bufferTime,
} from 'rxjs/operators';
import {
  $ref, $atom, $error,
} from '../utils/falcor';
import { ContextMap, StandardRange, GraphDescription } from "../types";
import { Route } from "falcor-router";
import { groupUrisByGraph } from "../utils/adapter";
import { curie2URI, createObject, uri2Curie } from "../utils/rdf";


export default (context: ContextMap, graphs: GraphDescription[]) => ([
  {
    route: 'resource[{keys:subjects}][{keys:predicates}][{ranges:ranges}]',
    get([_, subjects, predicates, ranges]) {
      return from(groupUrisByGraph(graphs, subjects)).pipe(
        mergeMap(({ adapter, uris }) => adapter.triples(
          uris.map((uri) => curie2URI(context, uri)),
          predicates.map((uri) => curie2URI(context, uri)),
          ranges
        )),
        map(({ subject, predicate, index, object }) => {
          const predicateCurie = uri2Curie(context, predicate);

          if (typeof object === 'string') {
            const objectType = createObject(context, object);
            return {
              path: ['resource', subject, predicateCurie, index],
              value: objectType.type === 'literal' ?
                $atom(objectType.value, objectType.dataType, objectType.language) :
                $ref(['resource', objectType.object])
            };
          } else if (object.type === 'literal') {
            return {
              path: ['resource', subject, predicateCurie, index],
              value: $atom(object.value, object.dataType, object.language)
            };
          } else if (object.type === 'uri') {
            return {
              path: ['resource', subject, predicateCurie, index],
              value: $ref(['resource', object.object])
            };
          }

          return {
            path: ['resource', subject, predicateCurie, index],
            value: $error({ code: '500', message: '' })
          };
        }),
        bufferTime(0)
      )
    },
  } as Route<[string, string[], string[], StandardRange[]]>,
]);
