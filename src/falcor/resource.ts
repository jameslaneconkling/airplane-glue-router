import {
  from,
} from "rxjs";
import {
  mergeMap,
  map,
  bufferTime,
} from 'rxjs/operators';
import { IJunoRouter } from "../types";
import { Route, StandardRange } from "falcor-router";
import { parseObject } from "../utils/rdf";
import { $error, $ref, $atom } from "../utils/falcor";
import { groupUrisByGraph } from "../adapters/adapter";


export const resourceRoutes = [
  {
    route: 'resource[{keys:subjects}][{keys:predicates}][{ranges:ranges}]',
    get([_, subjects, predicates, ranges]) {
      return from(groupUrisByGraph(this.graphs, subjects)).pipe(
        mergeMap(({ handler, key, subjects }) => {

          return handler({ type: 'triple', subjects, predicates, ranges }).pipe(
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
                  value: object.value === null ? null : $atom(object.value, object.dataType, object.language)
                };
              } else if (object.$type === 'error') {
                return {
                  path: ['resource', subject, predicate, index],
                  value: $error('500', object.value)
                };
              }

              return {
                path: ['resource', subject, predicate, index],
                value: $error('500', `Adapter ${key} triples handler returned invalid object type: ${JSON.stringify(object)}`)
              };
            })
          );
        }),
        bufferTime(0)
      );
    },
  } as Route<[string, string[], string[], StandardRange[]], IJunoRouter>,
  {
    route: 'resource[{keys:subjects}][{keys:predicates}].length',
    get([_, subjects, predicates]) {
      return from(groupUrisByGraph(this.graphs, subjects)).pipe(
        mergeMap(({ handler, subjects }) => handler({ type: 'triple-count', subjects, predicates })),
        map(({ subject, predicate, count }) => ({
          path: ['resource', subject, predicate, 'length'],
          value: $atom(count),
        })),
        bufferTime(0)
      );
    }
  } as Route<[string, string[], string[]], IJunoRouter>,
  {
    route: 'resource[{keys:subjects}]uri',
    get([_, subjects]) {
      return from(subjects).pipe(
        map(uri => ({
          path: ['resource', uri, 'uri'],
          value: uri
        }))
      );
    }
  } as Route<[string, string[]], IJunoRouter>,
];
