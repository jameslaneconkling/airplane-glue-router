import {
  from,
} from "rxjs";
import {
  mergeMap,
  map,
  bufferTime,
} from 'rxjs/operators';
import { GraphDescription } from "../types";
import { Route, StandardRange } from "falcor-router";
import { groupUrisByGraph } from "../utils/adapter";
import { parseObject } from "../utils/rdf";
import { $error, $ref, $atom } from "../utils/falcor";


export default (graphs: GraphDescription[]) => ([
  {
    route: 'resource[{keys:subjects}][{keys:predicates}][{ranges:ranges}]',
    get([_, subjects, predicates, ranges]) {
      return from(groupUrisByGraph(graphs, subjects)).pipe(
        mergeMap(({ adapter, key, uris }) => adapter.triples(uris, predicates, ranges).pipe(
          map(({ subject, predicate, index, object }) => {
            if (object === null || object === undefined || typeof object === 'string') {
              object = parseObject(object);
            }

            if (object.$type === 'ref') {
              return {
                path: ['resource', subject, predicate, index],
                value: $ref(['resource', object.value])
              };
            } else if (object.$type === 'atom') {
              return {
                path: ['resource', subject, predicate, index],
                value: $atom(object.value, object.dataType, object.language)
              };
            } else if (object.$type === 'error') {
              return {
                path: ['resource', subject, predicate, index],
                value: $error('500', object.value)
              };
            }

            return {
              path: ['resource', subject, predicate, index],
              value: $error('500', `Adapter ${key} triples handler returned unhandleable object type: ${JSON.stringify(object)}`)
            };
          }),
        )),
        bufferTime(0)
      );
    },
  } as Route<[string, string[], string[], StandardRange[]]>,
  {
    route: 'resource[{keys:subjects}][{keys:predicates}].length',
    get([_, subjects, predicates]) {
      return from(groupUrisByGraph(graphs, subjects)).pipe(
        mergeMap(({ adapter, uris }) => adapter.tripleCount(uris, predicates)),
        map(({ subject, predicate, count }) => ({
          path: ['resource', subject, predicate, 'length'],
          value: $atom(count),
        })),
        bufferTime(0)
      );
    }
  } as Route<[string, string[], string[]]>
]);
