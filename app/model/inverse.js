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
  isUri,
  isLiteral,
  curie2uri,
  uri2curie
} = require('../utils/rdf');


exports.InverseFactory = (db, context) => {
  return {
    getTriples(objects, predicates, ranges) {
      return Observable.of(...R.xprod(objects, predicates))
        .mergeMap(([object, predicate]) => Observable.of(...ranges).map(range => ({ object, predicate, range })))
        .mergeMap(({ object, predicate, range }) => {
          const { offset, limit, levelGraphLimit } = range2LimitOffset(range);

          let formattedObject = object;
          if (isUri(object)) {
            formattedObject = uri2curie(context, object);
          } else if (isLiteral(object)) {
            formattedObject = `${object}@en`;
          }

          const db$ = fromNodeStream(db.getStream({
            object: formattedObject,
            predicate: curie2uri(context, predicate),
            limit: levelGraphLimit,
            offset
          }));

          return takeExactly(db$, limit)
            .map(({ subject }, idx) => {
              return {
                object,
                predicate,
                subjectIdx: offset + idx,
                subject: uri2curie(context, subject)
              };
            });
        });
    }
  };
};
