import levelup from 'levelup';
import levelgraph from 'levelgraph';
import levelgraphN3 from 'levelgraph-n3';
import memdown from 'memdown';
import {
  from,
} from "rxjs";
import { mergeMap, map } from 'rxjs/operators';
import { streamToRx } from 'rxjs-stream';
import { PathValue } from 'falcor';
import { unnest, xprod } from 'ramda';
import { ContextMap, DefaultRange, Adapter } from '../types';
import { defaultContext } from '../utils/rdf';
import { range2LimitOffset } from '../utils/falcor';
import { takeExactly, fromNodeStream } from '../utils/rxjs';


// TODO - update levelup and add types
const makeMemoryTripleStore = (n3: string) => {
  const db = levelgraphN3(levelgraph(levelup('memoryGraph', { db: memdown })));

  db.n3.put(n3);

  return db;
};

const cartesianProd = (a: any[], b: any[], c: any[]) => unnest(
  xprod(a, b).map((list) => c.map((item) => ([...list, item])))
);

export default ({ n3, context = defaultContext }: { n3: string, context?: ContextMap }): Adapter => {
  const db = makeMemoryTripleStore(n3);

  return {
    search(types, ranges) {
      return from(xprod(types, ranges)).pipe(
        mergeMap(([ type, range ]) => {
          const { offset, limit, levelGraphLimit } = range2LimitOffset(range);

          return fromNodeStream(
            db.getStream({
              predicate: `${defaultContext.rdf}type`,
              object: type,
              limit: levelGraphLimit,
              offset,
            })
          ).pipe(
            takeExactly(limit),
            map((a) => a),
            map(({ subject }, idx) => ({
              type,
              collectionIdx: offset + idx,
              subject,
            }))
          );

          // return streamToRx(
          //   db.getStream({
          //     predicate: `${defaultContext.rdf}type`,
          //     object: type,
          //     limit: levelGraphLimit,
          //     offset,
          //   })
          // ).pipe(
          //   takeExactly(limit),
          //   map((a) => a),
          //   map(({ subject }, idx) => ({
          //     type,
          //     collectionIdx: offset + idx,
          //     subject,
          //   }))
          // );
        })
      )
    },

    // searchCount(types) {
    //   return Observable.of(...types)
    //     .mergeMap((type) => {
    //       return fromNodeStream(
    //         db.getStream({
    //           predicate: `${rdf}type`,
    //           object: type
    //         })
    //       )
    //         .count()
    //         .map((length) => ({ type, length }));
    //     });
    // },

    // // TODO - should return triple length, preventing need for subsequent call to getTriplesCount
    // getTriples(subjects, predicates, ranges) {
    //   return from(cartesianProd(subjects, predicates, ranges)).pipe(
    //     mergeMap(([subject, predicate, range]) => {
    //       const { offset, limit, levelGraphLimit } = range2LimitOffset(range);

    //       return streamToRx(
    //         db.getStream({
    //           subject,
    //           predicate,
    //           limit: levelGraphLimit,
    //           offset
    //         })
    //       ).pipe(
    //         takeExactly(limit),
    //         map(({ object }, idx) => ({
    //           subject,
    //           predicate,
    //           object,
    //           index: offset + idx,
    //           type: getType(object),
    //           lang: getLanguage(object)
    //         }))
    //       );
    //     })
    //   )
    // },

    // getTriplesCount(subjects, predicates) {
    //   return Observable.of(...xprod(subjects, predicates))
    //     .mergeMap(([subject, predicate]) => {
    //       return fromNodeStream(
    //         db.getStream({
    //           subject,
    //           predicate,
    //         })
    //       )
    //         .count()
    //         .map(length => ({
    //           subject: subject,
    //           predicate: predicate,
    //           length
    //         }));
    //     });
    // },

    // getTypes() {
    //   return fromNodeStream(
    //     db.searchStream([
    //       {
    //         predicate: `${rdf}type`,
    //         object: db.v('type')
    //       },
    //       {
    //         subject: db.v('type'),
    //         predicate: `${skos}prefLabel`,
    //         object: db.v('label')
    //       }
    //     ])
    //   )
    //     .map(({ type, label }) => ({
    //       uri: type,
    //       label: getValue(label),
    //       lang: getLanguage(label)
    //     }))
    //     .toArray();
    // },

    // getPredicates(types) {
    //   return Observable.of(...types)
    //     .mergeMap((type) => {
    //       return fromNodeStream(
    //         db.searchStream(
    //           [
    //             {
    //               subject: db.v('predicate'),
    //               predicate: `${rdfs}domain`,
    //               object: type,
    //             },
    //             {
    //               subject: db.v('predicate'),
    //               predicate: `${skos}prefLabel`,
    //               object: db.v('label')
    //             }
    //           ],
    //           // { limit: 100 }
    //           {}
    //         )
    //       )
    //         .distinct(prop('predicate'))
    //         .reduce((acc, { predicate, label }) => {
    //           acc.predicates.push({
    //             uri: predicate,
    //             label: getValue(label),
    //             lang: getLanguage(label)
    //           });
    //           return acc;
    //         }, { type, predicates: [] });
    //     });
    // }
  };
};
