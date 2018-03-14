const {
  xprod,
  toPairs,
  map,
  nth,
  compose,
  unnest
} = require('ramda');
const request = require('request-promise-native');
const Observable = require('rxjs/Observable').Observable;
require('rxjs/add/observable/of');
require('rxjs/add/operator/map');
require('rxjs/add/operator/mergeMap');
require('rxjs/add/operator/partition');
const {
  getValue,
  getType,
  curie2uri,
  uri2curie,
} = require('../utils/rdf');

const notNull = (x) => x !== null && x !== undefined;

module.exports = ({ baseurl, context }) => {
  return {
    getTriples: (subjects, predicates, ranges) => {
      const body = xprod(subjects, predicates)
        .map(([subject, predicate]) => ({
          subject: curie2uri(context, subject),
          predicate: curie2uri(context, predicate),
          ranges
        }));

      return Observable.from(
        request({
          url: `${baseurl}/facts`,
          method: 'POST',
          json: true,
          body
        })
      )
        .mergeMap((result) => Observable.from(compose(unnest, map(toPairs))(result)))
        .filter(compose(notNull, nth(1)))
        .map(([idx, { subject, predicate, object, }]) => ({
          subject: uri2curie(context, subject),
          predicate: uri2curie(context, predicate),
          object: uri2curie(context, getValue(object)),
          objectIdx: idx,
          type: uri2curie(context, getType(object))
        }));
    },
    getPredicateLengths: (subjects, predicates) => {},
    // getLabels: (subjects) => {},
    search: (types, ranges) => {
      return Observable.of(...types)
        .mergeMap((type) => (
          Observable.from(
            request({
              url: `${baseurl}/search`,
              method: 'POST',
              json: true,
              body: {
                type: curie2uri(context, type),
                ranges
              }
            })
          )
            .map((response) => [type, response])
        ))
        .mergeMap(([type, response]) => {
          // TODO - properly determine collectionIdx (requires upstream work on adapter layer)
          return Observable.of(...response)
            .map(({ subject, label }, idx) => ({
              type,
              collectionIdx: idx,
              subject: uri2curie(context, subject),
              label
            }));
        });
    },
    searchCount: (types) => {},
    getTypes: () => {},
    getPredicates: (type) => {},
  };
};
