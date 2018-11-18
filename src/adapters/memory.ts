import levelup from 'levelup';
import levelgraph from 'levelgraph';
import levelgraphN3 from 'levelgraph-n3';
import memdown from 'memdown';
import { from, merge, Subject } from "rxjs";
import { mergeMap, map, count, skip, take, multicast, refCount } from 'rxjs/operators';
import { Search, GraphAdapterQueryHandlers, AdapterSearchResponse, AdapterSearchCountResponse, AdapterTripleResponse, AdapterTripleCountResponse } from '../types';
import { context } from '../utils/rdf';
import { range2LimitOffset } from '../utils/falcor';
import { fromStream } from '../utils/rxjs';
import { cartesianProd } from '../utils/misc';
import { xprod } from 'ramda';
import { StandardRange } from 'falcor-router';


// TODO - create typings
type LevelGraph = {
  [method: string]: any
};

type RequestMetadata = {
  user: string
};


class MemoryGraphAdapter implements GraphAdapterQueryHandlers {
  public batched: true = true

  private db: LevelGraph

  constructor(db: LevelGraph, request: RequestMetadata) {
    this.db = db;
  }

  public static createStore(n3: string) {
    return new Promise<LevelGraph>((resolve, reject) => {
      (memdown as any).clearGlobalStore();
  
      const db = levelgraphN3(levelgraph(levelup('memoryGraph', { db: memdown })));
  
      db.n3.put(n3, (err) => {
        if (err) {
          return reject(err);
        }
        
        resolve(db);
      });
    });
  }

  public search(key: string, { type }: Search, ranges: StandardRange[]) {
    // console.log('search');
    return from(ranges).pipe(
      mergeMap((range) => {
        const { offset, levelGraphLimit } = range2LimitOffset(range);

        return fromStream<{ subject: string }>(
          this.db.getStream({
            predicate: `${context.rdf}type`,
            object: type,
            limit: levelGraphLimit,
            offset,
          })
        ).pipe(
          map(({ subject }, idx) => ({
            type: 'search',
            key,
            index: offset + idx,
            uri: subject,
          } as AdapterSearchResponse)),
        );
      })
    );
  }

  public searchCount(key: string, search: Search) {
    // console.log('search count', search);
    return fromStream(
      this.db.getStream({
        predicate: `${context.rdf}type`,
        object: search.type
      })
    ).pipe(
      count(),
      map((count) => ({ type: 'search-count', key, count } as AdapterSearchCountResponse))
    );
  }

  public searchWithCount(key: string, search: Search, ranges: StandardRange[]) {
    const search$ = fromStream(
      this.db.getStream({
        predicate: `${context.rdf}type`,
        object: search.type
      })
    ).pipe(
      multicast(new Subject()),
      refCount()
    );

    return merge(
      from(ranges).pipe(
        mergeMap((range) => {
          const { offset, limit } = range2LimitOffset(range);
          return search$.pipe(
            skip(offset),
            take(limit),
            map(({ subject }, idx) => ({
              type: 'search',
              key,
              index: offset + idx,
              uri: subject,
            } as AdapterSearchResponse))
          )
        })
      ),
      search$.pipe(
        count(),
        map((count) => ({ type: 'search-count', key, count } as AdapterSearchCountResponse))
      )
    );
  }

  public triples(subjects: string[], predicates: string[], ranges: StandardRange[]) {
    // TODO - compile entire s/p/r into a single query
    // TODO - catch deep s/p/r/p/r/p/r... patterns 
    return from(cartesianProd(subjects, predicates, ranges)).pipe(
      mergeMap(([subject, predicate, range]) => {
        const { offset, levelGraphLimit } = range2LimitOffset(range);

        return fromStream<{ object: string }>(
          this.db.getStream({
            subject,
            predicate,
            limit: levelGraphLimit,
            offset
          })
        ).pipe(
          map(({ object }, index) => ({
            type: 'triple',
            subject,
            predicate,
            index: offset + index,
            object,
          } as AdapterTripleResponse))
        );
      }),
    );
  }

  public triplesCount(subjects: string[], predicates: string[]) {
    return from(xprod(subjects, predicates)).pipe(
      mergeMap(([subject, predicate]) => {
        return fromStream(
          this.db.getStream({
            subject,
            predicate,
          })
        ).pipe(
          count(),
          map((count) => ({
            type: 'triple-count',
            subject,
            predicate,
            count
          } as AdapterTripleCountResponse))
        );
      })
    );
  }

  public triplesWithCount(subjects: string[], predicates: string[], ranges: StandardRange[]) {
    return from(xprod(subjects, predicates)).pipe(
      mergeMap(([subject, predicate]) => {
        const triples$ = fromStream<{ subject: string, predicate: string, object: string }>(
          this.db.getStream({
            subject,
            predicate,
          })
        ).pipe(
          multicast(new Subject()),
          refCount()
        );
        
        return merge(
          from(ranges).pipe(
            mergeMap((range) => {
              const { offset, limit } = range2LimitOffset(range);
              return triples$.pipe(
                skip(offset),
                take(limit),
                map(({ subject, predicate, object }, idx) => ({
                  type: 'triple',
                  subject,
                  predicate,
                  index: offset + idx,
                  object
                } as AdapterTripleResponse))
              );
            })
          ),
          triples$.pipe(
            count(),
            map((count) => ({ type: 'triple-count', subject, predicate, count } as AdapterTripleCountResponse))
          )
        );
      }),
    );
  }

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
}


export default MemoryGraphAdapter;
