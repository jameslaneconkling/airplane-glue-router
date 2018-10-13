import {
  from, merge,
} from "rxjs";
import {
  mergeMap,
  map,
  bufferTime,
} from 'rxjs/operators';
import { ContextMap, GraphDescription } from "../types";
import { Route, StandardRange } from "falcor-router";
import { groupUrisByGraph } from "../utils/adapter";
import { uri2Curie, URI, OBJECT } from "../utils/rdf";
import { $error, $ref, $atom } from "../utils/falcor";
import { partition } from "ramda";


export default (context: ContextMap, graphs: GraphDescription[]) => ([
  {
    route: 'resource[{keys:subjects}][{keys:predicates}][{ranges:ranges}]',
    get([_, subjects, predicates, ranges]) {
      // return { path: ['asdf'] } // TODO - why does this typecheck

      /*
        URIs that can be collapsed to Curies should reference the Curie node,
        or else graph will become inconsistent if it contains both a curie and uri for the same resource.
        e.g.

        router.get([['resource', '<http://junonetwork.com/test/james>', 'rdfs:label', 0]])
        {
          resource: {
            '<http://junonetwork.com/test/james>': { $type: 'ref', value: ['resource', 'test:james'] },
            'test:james': {
              'rdfs:label': {
                0: { $type: 'atom', value: "James Conkling", $lang: 'en' },
              }
            },
          }
        }
      */;
      const [notCollapsibleSubjects, collapsibleSubjects] = partition((uriOrCurie) => uriOrCurie === uri2Curie(context, uriOrCurie), subjects);

      const uri2CuriePathValueRefs$ = from(collapsibleSubjects.map((uri) => ({
        path: ['resource', uri],
        value: $ref(['resource', uri2Curie(context, uri)])
      })));

      const triplePathValues$ = from(groupUrisByGraph(graphs, notCollapsibleSubjects)).pipe(
        mergeMap(({ adapter, key, uris }) => (adapter.triples(
          uris.map((subject) => URI.falcor2Adapter(context, subject)),
          predicates.map((predicate) => URI.falcor2Adapter(context, predicate)),
          ranges
        )).pipe(
          map(({ subject, predicate, index, object }) => {
            const subjectCurie = URI.adapter2Falcor(context, subject);
            const predicateCurie = URI.adapter2Falcor(context, predicate);

            if (object === null || object === undefined || typeof object === 'string') {
              object = OBJECT.adapter2Falcor(context, object);
            } else if (object.$type === 'ref') {
              object.value = URI.adapter2Falcor(context, object.value);
            }

            if (object.$type === 'ref') {
              return {
                path: ['resource', subjectCurie, predicateCurie, index],
                value: $ref(['resource', object.value])
              };
            } else if (object.$type === 'atom') {
              return {
                path: ['resource', subjectCurie, predicateCurie, index],
                value: $atom(object.value, object.dataType, object.language)
              };
            } else if (object.$type === 'error') {
              return {
                path: ['resource', subjectCurie, predicateCurie, index],
                value: $error('500', object.value)
              };
            }

            return {
              path: ['resource', subjectCurie, predicateCurie, index],
              value: $error('500', `Adapter ${key} triples handler returned unhandleable object type: ${JSON.stringify(object)}`)
            };
          }),
        )),
      );

      return merge(
        uri2CuriePathValueRefs$,
        triplePathValues$
      ).pipe(bufferTime(0))
    },
  } as Route<[string, string[], string[], StandardRange[]]>,
]);
