const R = require('ramda');
const Observable = require('rxjs/Observable').Observable;
const {
  range2LimitOffset
} = require('../utils/falcor');
const {
  fromNodeStream,
  takeExactly
} = require('../utils/rx.js');
const {
  curie2uri,
  uri2curie
} = require('../utils/rdf');
require('rxjs/add/observable/of');
require('rxjs/add/observable/merge');
require('rxjs/add/operator/map');
require('rxjs/add/operator/mergeMap');
require('rxjs/add/operator/count');
require('rxjs/add/operator/partition');
require('rxjs/add/operator/groupBy');
require('rxjs/add/operator/filter');
require('rxjs/add/operator/do');
require('rxjs/add/operator/distinct');
require('rxjs/add/operator/reduce');

const {
  getValue,
  context: { rdf, skos }
} = require('../utils/rdf');


exports.CollectionsFactory = (db, context) => ({
  get(collections, ranges) {
    const [nonExistantCollections$, existantCollections$] = Observable.of(...collections)
      .mergeMap(collection => {
        return fromNodeStream(
          db.getStream({ predicate: `${rdf}type`, object: curie2uri(context, collection), limit: 1 })
        )
          .count()
          .map(count => ({ collection, nonExistant: count === 0 }));
      })
      .partition(R.prop('nonExistant'));

    const existantCollectionRanges$ = existantCollections$
      .mergeMap(({ collection }) => Observable.of(...ranges).map(range => ({ collection, range })))
      .mergeMap(({ collection, range }) => {
        const { offset, limit, levelGraphLimit } = range2LimitOffset(range);

        const db$ = fromNodeStream(
          db.getStream({ predicate: `${rdf}type`, object: curie2uri(context, collection), limit: levelGraphLimit, offset })
        );

        return takeExactly(db$, limit)
          .map(({ subject }, idx) => ({ collection, collectionIdx: offset + idx, subject: uri2curie(context, subject) }));
      });

    return Observable.merge(
      existantCollectionRanges$,
      nonExistantCollections$
    );
  },

  counts(collections) {
    return Observable.of(...collections)
      .mergeMap(collection => {
        return fromNodeStream(
          db.getStream({ predicate: `${rdf}type`, object: curie2uri(context, collection) })
        )
          .count()
          .map(length => ({ collection, length }));
      });
  },

  getOntologies(collections, ranges) {
    return Observable.of(...R.xprod(collections, ranges))
      .mergeMap(([collection, range]) => {
        return fromNodeStream(
          db.searchStream([
            { subject: db.v('subject'), predicate: `${rdf}type`, object: curie2uri(context, collection) },
            { subject: db.v('subject'), predicate: db.v('predicate') }
          ], { limit: 100 })
        )
          .groupBy(R.prop('predicate'))
          .filter((group, idx) => {
            return idx >= range.from && idx <= range.to;
          })
          .mergeMap(({ key, groupSubject: group$ }, idx) => {
            return group$
              .count()
              .map(count => ({ collection, ontologyIdx: range.from + idx, predicate: uri2curie(context, key), count }));
          });
      });
  },

  getOntologiesLength(collections) {
    return Observable.of(...collections)
      .mergeMap((collection) => {
        return fromNodeStream(
          db.searchStream([
            { subject: db.v('subject'), predicate: `${rdf}type`, object: curie2uri(context, collection), limit: 1, offset: 2 },
            { subject: db.v('subject'), predicate: db.v('predicate') }
          ], { limit: 100 })
        )
          .groupBy(R.prop('predicate'))
          .count()
          .map(count => ({ collection, length: count }));
      });
  },

  getOntologiesList(collections) {
    return Observable.of(...collections)
      .mergeMap((collection) => {
        return fromNodeStream(
          db.searchStream([
            { subject: db.v('subject'), predicate: `${rdf}type`, object: curie2uri(context, collection) },
            { subject: db.v('subject'), predicate: db.v('predicate') },
            { subject: db.v('predicate'), predicate: `${skos}prefLabel`, object: db.v('label') }
          ], { limit: 100 })
        )
          .distinct(R.prop('predicate'))
          .filter(R.pipe(R.prop('predicate'), R.equals(`${skos}prefLabel`), R.not()))
          .reduce((acc, { predicate, label }) => {
            acc.list.push({ uri: uri2curie(context, predicate), label: getValue(label) });
            return acc;
          }, { collection, list: [] });
      });
  },
});
