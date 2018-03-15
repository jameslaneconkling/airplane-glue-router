const {
  xprod,
} = require('ramda');
const request = require('request-promise-native');
const Observable = require('rxjs/Observable').Observable;
require('rxjs/add/observable/of');
require('rxjs/add/operator/map');
require('rxjs/add/operator/mergeMap');
require('rxjs/add/operator/partition');
const {
  getType,
} = require('../utils/rdf');


module.exports = ({ baseurl }) => {
  return {
    getTriples: (subjects, predicates, ranges) => {
      return Observable.from(
        request({
          url: `${baseurl}/facts`,
          method: 'POST',
          json: true,
          body: xprod(subjects, predicates)
            .map(([subject, predicate]) => ({
              subject,
              predicate,
              ranges
            }))
        })
      )
        .mergeMap((result) => Observable.from(result))
        .map(({ subject, predicate, object, label, index, }) => ({
          subject,
          predicate,
          object,
          index,
          label,
          type: getType(object)
        }));
    },
    getTriplesCount: (subjects, predicates) => {},
    // getLabels: (subjects) => {},
    search: (types, ranges) => {
      return Observable.from(types)
        .mergeMap((type) => (
          Observable.from(
            request({
              url: `${baseurl}/search`,
              method: 'POST',
              json: true,
              body: {
                type,
                ranges
              }
            })
          )
            .map((response) => [type, response])
        ))
        .mergeMap(([type, response]) => {
          return Observable.from(response)
            .map(({ subject, label, index, }) => ({
              type,
              collectionIdx: index,
              subject,
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
    getPredicates: (types) => {
      return Observable.from(types)
        .mergeMap((type) => (
          Observable.from(
            request({
              url: `${baseurl}/properties`,
              method: 'POST',
              json: true,
              body: { type, },
            })
          )
            .map((predicates) => [type, predicates])
        ))
        .map(([type, predicates]) => ({
          type,
          predicates: predicates.map(({ property, label, lang }) => ({
            uri: property,
            label,
            lang
          }))
        }));
    },
  };
};
