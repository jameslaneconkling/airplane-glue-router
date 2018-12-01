import levelup from 'levelup';
import levelgraph from 'levelgraph';
import levelgraphN3 from 'levelgraph-n3';
import memdown from 'memdown';
import { from, merge, Subject } from "rxjs";
import { mergeMap, map, count as countStream, skip, take, multicast, refCount, toArray, distinct } from 'rxjs/operators';
import { Search, GraphAdapterQueryHandlers, AdapterSearchResponse, AdapterSearchCountResponse, AdapterTripleResponse, AdapterTripleCountResponse, AdapterPredicateListResponse, AdapterTypeListResponse, AdapterAtom } from '../types';
import { context, parseObject } from '../utils/rdf';
import { range2LimitOffset } from '../utils/falcor';
import { fromStream } from '../utils/rxjs';
import { cartesianProd } from '../utils/misc';
import { xprod, prop } from 'ramda';
import { StandardRange } from 'falcor-router';


// TODO - create typings
type LevelGraph = {
  [method: string]: any
};

type RequestMetadata = {
  user: string
};


export class MemoryGraphAdapter implements GraphAdapterQueryHandlers {
  private db: LevelGraph
  private request: RequestMetadata

  constructor(db: LevelGraph, request: RequestMetadata) {
    this.db = db;
    this.request = request;
  }

  public static createAdapter(n3: string) {
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

  public search(key: string, search: Search, ranges: StandardRange[], count: boolean) {
    if (!count) {
      return from(ranges).pipe(
        mergeMap((range) => {
          const { offset, levelGraphLimit } = range2LimitOffset(range);

          return fromStream<{ subject: string }>(
            this.db.getStream({
              predicate: `${context.rdf}type`,
              object: search.type,
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
    } else if (ranges.length === 0) {
      return fromStream(
        this.db.getStream({
          predicate: `${context.rdf}type`,
          object: search.type
        })
      ).pipe(
        countStream(),
        map((count) => ({ type: 'search-count', key, count } as AdapterSearchCountResponse))
      );
    }

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
        countStream(),
        map((count) => ({ type: 'search-count', key, count } as AdapterSearchCountResponse))
      )
    );
  }

  public triples(subjects: string[], predicates: string[], ranges: StandardRange[], count: boolean) {
    // TODO - compile entire s/p/r into a single query
    // TODO - catch deep s/p/r/p/r/p/r... patterns
    if (!count) {
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
    } else if (ranges.length === 0) {
      return from(xprod(subjects, predicates)).pipe(
        mergeMap(([subject, predicate]) => {
          return fromStream(
            this.db.getStream({
              subject,
              predicate,
            })
          ).pipe(
            countStream(),
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
            countStream(),
            map((count) => ({ type: 'triple-count', subject, predicate, count } as AdapterTripleCountResponse))
          )
        );
      }),
    );
  }

  public getTypes() {
    // TODO - should we use something more specific than rdfs:Class to find resource types?  juno:ResourceClass?
    return fromStream<{ type: string, label: string }>(
      this.db.searchStream([
        {
          subject: this.db.v('type'),
          predicate: `${context.rdf}type`,
          object: `${context.rdfs}Class`
        },
        {
          subject: this.db.v('type'),
          predicate: `${context.skos}prefLabel`,
          object: this.db.v('label')
        }
      ])
    ).pipe(
      toArray(),
      map((resourceTypes) => ({
        type: 'type-list',
        resourceTypes: resourceTypes.map(({ type, label }) => {
          const { value, language } = parseObject(label) as AdapterAtom;
          return language ? {
              uri: type,
              label: value,
              language
            } : {
              uri: type,
              label: value,
            };
        })
      } as AdapterTypeListResponse))
    );
  }

  public getPredicates(types: string[]) {
    return from(types).pipe(
      mergeMap((type) => {
        return fromStream<{ predicate: string, label: string, range: string }>(
          this.db.searchStream([{
              subject: this.db.v('predicate'),
              predicate: `${context.rdfs}domain`,
              object: type,
            }, {
              subject: this.db.v('predicate'),
              predicate: `${context.rdfs}label`,
              object: this.db.v('label')
            }, {
              subject: this.db.v('predicate'),
              predicate: `${context.rdfs}range`,
              object: this.db.v('range')
            }],
            {} /* { limit: 100 } */
          )
        ).pipe(
          distinct(prop('predicate')),
          toArray(),
          map((predicates) => {
            return {
              type: 'predicate-list',
              resourceType: type,
              predicates: predicates.map(({ predicate, label, range }) => {
                // TODO - group ranges
                const { value, language } = parseObject(label) as AdapterAtom;
                return language ? {
                    uri: predicate,
                    label: value,
                    range,
                    language,
                  } : {
                    uri: predicate,
                    label: value,
                    range,
                  };
              })
            } as AdapterPredicateListResponse;
          })
        )
      })
    );
  }
}
