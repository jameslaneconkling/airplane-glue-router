import {
  from,
  merge,
} from "rxjs";
import {
  mergeMap,
  map,
  bufferTime,
  reduce,
} from 'rxjs/operators';
import { IJunoRouter, TripleResponse } from "../types";
import { Route, StandardRange } from "falcor-router";
import { groupUrisByGraph } from "../utils/adapter";
import { parseObject } from "../utils/rdf";
import { $error, $ref, $atom, expandTriples } from "../utils/falcor";
import { equals, reject } from "ramda";


const resourceRoutes = [
  {
    route: 'resource[{keys:subjects}][{keys:predicates}][{ranges:ranges}]',
    get([_, subjects, predicates, ranges]) {
      return from(groupUrisByGraph(this.graphs, subjects)).pipe(
        mergeMap(({ adapter, key, subjects }) => {
          const triples$ = from(adapter.triples(subjects, predicates, ranges));

          return merge(
            triples$.pipe(
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
            ),
            triples$.pipe(
              reduce<TripleResponse, Array<{ subject: string, predicate: string, index: number }>>((acc, { subject, predicate, index }) => {
                const x = reject(equals({ subject, predicate, index}), acc);
                return x;
              }, expandTriples(subjects, predicates, ranges)),
              mergeMap((missingTriples) => {
                const x = from(missingTriples.map(({ subject, predicate, index }) => ({
                  path: ['resource', subject, predicate, index],
                  value: null
                })))
                return x;
              })
            )
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
        mergeMap(({ adapter, subjects }) => adapter.triplesCount(subjects, predicates)),
        map(({ subject, predicate, count }) => ({
          path: ['resource', subject, predicate, 'length'],
          value: $atom(count),
        })),
        bufferTime(0)
      );
    }
  } as Route<[string, string[], string[]], IJunoRouter>,
];


export default resourceRoutes;
