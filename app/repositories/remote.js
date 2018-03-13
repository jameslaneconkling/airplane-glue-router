const request = require('request-promise-native');
const Observable = require('rxjs/Observable').Observable;
require('rxjs/add/observable/of');
require('rxjs/add/operator/map');
require('rxjs/add/operator/mergeMap');
const {
  curie2uri,
  uri2curie,
} = require('../utils/rdf');


module.exports = ({ baseurl, context }) => {
  return {
    getTriples: (subjects, predicates, ranges) => {

    },
    getPredicateLengths: (subjects, predicates) => {},
    // getLabels: (subjects) => {},
    search: (types, ranges) => {
      return Observable.of(...types)
        .map((type) => (
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
