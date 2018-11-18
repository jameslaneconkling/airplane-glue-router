import {
  from,
  Observable,
} from "rxjs";
import {
  mergeMap,
  map,
  bufferTime,
  filter,
  concat,
} from 'rxjs/operators';
import { IJunoRouter, AdapterTripleResponse } from "../types";
import { Route, StandardRange } from "falcor-router";
import { groupUrisByGraph, isExpectedTripleCountResponse, expectedTripleResponses } from "../utils/adapter";
import { parseObject } from "../utils/rdf";
import { $error, $ref, $atom } from "../utils/falcor";


const resourceRoutes = [
  {
    route: 'resource[{keys:subjects}][{keys:predicates}][{ranges:ranges}]',
    get([_, subjects, predicates, ranges]) {
      return from(groupUrisByGraph(this.graphs, subjects)).pipe(
        mergeMap(({ handler, key, subjects }) => {
          const {
            isExpectedTripleResponse,
            getMissingTripleResponses,
          } = expectedTripleResponses(subjects, predicates, ranges);

          return handler({ type: 'triples', subjects, predicates, ranges }).pipe(
            filter(isExpectedTripleResponse),
            concat(new Observable<AdapterTripleResponse>((observer) => {
              getMissingTripleResponses().forEach(observer.next.bind(observer));
              observer.complete();
            })),
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
        mergeMap(({ handler, subjects }) => handler({ type: 'triples-count', subjects, predicates })),
        filter(isExpectedTripleCountResponse(new Set(subjects), new Set(predicates))),
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
