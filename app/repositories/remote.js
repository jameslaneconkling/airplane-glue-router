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
        .mergeMap((result) => Observable.from(result))
        .map(({ subject, predicate, object, label, index, }) => ({
          subject: uri2curie(context, subject),
          predicate: uri2curie(context, predicate),
          object: uri2curie(context, getValue(object)),
          objectIdx: index,
          label,
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
          return Observable.of(...response)
            .map(({ subject, label, index, }) => ({
              type,
              collectionIdx: index,
              subject: uri2curie(context, subject),
              label
            }));
        });
    },
    searchCount: (types) => {},
    getTypes: () => {
      return Observable.from(
        request({
          url: `${baseurl}/types`,
          method: 'GET',
          json: true
        })
      )
        .map((types) => (
          types.map(({ class: classUri, label }) => ({
            uri: classUri,
            label
          }))
        ));
    },
    getPredicates: (type) => {
      return Observable.from(
        request({
          url: `${baseurl}/properties/${type}`
        })
      )
        .map((predicates) => (
          predicates.map(({ property, label }) => ({
            uri: property,
            label
          }))
        ));
    },
  };
};
