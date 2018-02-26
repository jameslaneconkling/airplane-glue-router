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
  getValue,
  getType,
  getLanguage,
  curie2uri,
  uri2curie,
  context: { xsd }
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



exports.ResourcesFactory = (db, context) => {
  return {
    getTriples(subjects, predicates, ranges) {
      // TODO - possible to check existance of subjects in one db call?
      const [nonExistantSubjects$, existantSubjects$] = Observable.of(...subjects)
        .mergeMap((subject) => {
          return fromNodeStream(
            db.getStream({ subject: curie2uri(context, subject), limit: 1 })
          )
            .count()
            .map((count) => ({ subject, nonExistant: count === 0 }));

        })
          .partition(R.prop('nonExistant'));

      // TODO - should be possible to group some of these lists in one db call
      // rather than computing the 3d cartesian product, and a running query for each
      const existantTriples$ = existantSubjects$
        .mergeMap(({ subject }) => Observable.of(...R.xprod(predicates, ranges)).map(([ predicate, range ]) => ({ subject, predicate, range })))
        .mergeMap(({ subject, predicate, range }) => {
          const { offset, limit, levelGraphLimit } = range2LimitOffset(range);

          const db$ = fromNodeStream(
            db.getStream({ subject: curie2uri(context, subject), predicate: curie2uri(context, predicate), limit: levelGraphLimit, offset })
          );

          return takeExactly(db$, limit)
            .map(({ object }, idx) => {
              return {
                subject,
                predicate,
                objectIdx: offset + idx,
                object: uri2curie(context, getValue(object)),
                type: uri2curie(context, getType(object)),
                lang: getLanguage(object)
              };
            });
        });

      return Observable.merge(
        existantTriples$,
        nonExistantSubjects$
      );
    },

    getPredicateLengths(subjects, predicates) {
      return Observable.of(...R.xprod(subjects, predicates))
        .mergeMap(([subject, predicate]) => {
          return fromNodeStream(
            db.getStream({ subject: curie2uri(context, subject), predicate: curie2uri(context, predicate) })
          )
            .count()
            .map(length => ({
              subject: subject,
              predicate: predicate,
              length
            }));
        });
    },

    getOntologies(subjects, ranges) {
      return Observable.of(...R.xprod(subjects, ranges))
        .mergeMap(([subject, range]) => {
          // This is more expensive than it should be b/c there's no way to do a groupBy in the query
          // or to limit/offset the groups
          // TODO figure out limit
          return fromNodeStream(
            db.getStream({ subject: curie2uri(context, subject), limit: 100 }) // limit is totally arbitrary, but will prevent us from pulling too large objects
          )
            .groupBy(R.prop('predicate'))
            .filter((group, idx) => {
              return idx >= range.from && idx <= range.to;
            })
            .mergeMap(({ key, groupSubject: group$ }, idx) => {
              return group$
                .count()
                .map(count => ({
                  subject: subject,
                  ontologyIdx: range.from + idx,
                  predicate: uri2curie(context, key),
                  count
                }));
            });
        });
    },

    getOntologiesLength(subjects) {
      return Observable.of(...subjects)
        .mergeMap((subject) => {
          return fromNodeStream(
            db.getStream({ subject: curie2uri(context, subject) })
          )
            .groupBy(R.prop('predicate'))
            .count()
            .map(count => ({ subject, length: count }));
        });
    }
  };
};
