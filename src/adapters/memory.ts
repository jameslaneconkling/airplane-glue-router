import levelup from 'levelup';
import levelgraph from 'levelgraph';
import levelgraphN3 from 'levelgraph-n3';
import memdown from 'memdown';
import { from } from "rxjs";
import { mergeMap, map, count } from 'rxjs/operators';
import { ContextMap, Adapter } from '../types';
import { context } from '../utils/rdf';
import { range2LimitOffset } from '../utils/falcor';
import { fromStream } from '../utils/rxjs';
import { cartesianProd } from '../utils/misc';
import { xprod } from 'ramda';


// TODO - update levelup and add types
const makeMemoryTripleStore = (n3: string) => {
  return new Promise<any>((resolve, reject) => {
    (memdown as any).clearGlobalStore();

    const db = levelgraphN3(levelgraph(levelup('memoryGraph', { db: memdown })));

    db.n3.put(n3, (err) => {
      if (err) {
        return reject(err)
      }
      resolve(db)
    });
  });
};

// TODO - should context be exposed to adapters?  Or just assume that the router expands all uris?
export default async ({ n3 }: { n3: string, context?: ContextMap }): Promise<Adapter> => {
  const db = await makeMemoryTripleStore(n3);

  return {
    search({ type }, ranges) {
      return from(ranges).pipe(
        mergeMap((range) => {
          const { offset, levelGraphLimit } = range2LimitOffset(range);

          return fromStream<{ subject: string }>(
            db.getStream({
              predicate: `${context.rdf}type`,
              object: type,
              limit: levelGraphLimit,
              offset,
            })
          ).pipe(
            map(({ subject }, idx) => ({
              index: offset + idx,
              uri: subject,
            }))
          );
        })
      );
    },

    searchCount(search) {
      return fromStream(
        db.getStream({
          predicate: `${context.rdf}type`,
          object: search.type
        })
      ).pipe(
        count(),
        map((count) => ({ count }))
      );
    },

    triples(subjects, predicates, ranges) {
      // TODO - compile entire s/p/r into a single query
      // TODO - catch deep s/p/r/p/r/p/r... patterns 
      return from(cartesianProd(subjects, predicates, ranges)).pipe(
        mergeMap(([subject, predicate, range]) => {
          const { offset, levelGraphLimit } = range2LimitOffset(range);

          return fromStream<{ object: string }>(
            db.getStream({
              subject,
              predicate,
              limit: levelGraphLimit,
              offset
            })
          ).pipe(
            map(({ object }, index) => ({
              subject,
              predicate,
              index,
              object,
            }))
          );
        }),
      );
    },

    tripleCount(subjects, predicates) {
      return from(xprod(subjects, predicates)).pipe(
        mergeMap(([subject, predicate]) => {
          return fromStream(
            db.getStream({
              subject,
              predicate,
            })
          ).pipe(
            count(),
            map((count) => ({
              subject: subject,
              predicate: predicate,
              count
            }))
          );
        })
      );
    },

    // getTypes() {
    //   return fromStream(
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
    //       return fromStream(
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
