const Observable = require('rxjs/Observable').Observable;
require('rxjs/add/observable/from');
require('rxjs/add/observable/of');
require('rxjs/add/operator/map');
require('rxjs/add/operator/mergeMap');
const {
  $atom,
  $ref,
  atomMetadata
} = require('../utils/falcor');
const {
  groupUrisByRepo
} = require('../utils/repository');


module.exports = (repos) => ([
  {
    route: 'resource[{keys:uris}][{keys:predicates}][{ranges:ranges}]',
    get({ uris, predicates, ranges }) {
      return Observable.from(
        groupUrisByRepo(repos)(uris)
      )
        .mergeMap(({ repository, uris }) => repository.getTriples(uris, predicates, ranges))
        .map(({ nonExistant, subject, predicate, objectIdx, object, type, lang }) => {
          if (nonExistant) {
            return {
              path: ['resource', subject],
              value: null
            };
          } else if (typeof object === 'undefined') {
            return {
              path: ['resource', subject, predicate, objectIdx],
              value: null
            };
          } else if (type === 'relationship') {
            return {
              path: ['resource', subject, predicate, objectIdx],
              value: $ref(['resource', object])
            };
          }

          return {
            path: ['resource', subject, predicate, objectIdx],
            value: $atom(object, atomMetadata(type, lang))
          };
        });
    }
  },
  {
    // request singleton predicate
    // WARNING: This could throw off the cache, e.g. user requests ['resource', <uri>, <predicate>, <range>],
    // then requests ['resource', <uri>, <predicate>].  They will overwrite the range w/ a single value good/bad?
    // TODO - perhaps the correct approach is to whitelist singleton predicates
    route: 'resource[{keys:uris}][{keys:predicates}]',
    get({ uris, predicates }) {
      // return Resources.getTriples(uris, predicates, [{ from: 0, to: 0 }])
      return Observable.from(
        groupUrisByRepo(repos)(uris)
      )
        .mergeMap(({ repository, uris }) => repository.getTriples(uris, predicates, [{ from: 0, to: 0 }]))
        .map(({ nonExistant, subject, predicate, object, type, lang }) => {
          if (nonExistant) {
            return {
              path: ['resource', subject],
              value: null
            };
          } else if (typeof object === 'undefined') {
            return {
              path: ['resource', subject, predicate],
              value: null
            };
          } else if (type === 'relationship') {
            return {
              path: ['resource', subject, predicate],
              value: $ref(['resource', object])
            };
          }

          return {
            path: ['resource', subject, predicate],
            value: $atom(object, atomMetadata(type, lang))
          };
        });
    }
  },
  {
    route: 'resource[{keys:uris}]uri',
    get({ uris }) {
      return Observable.of(...uris)
        .map(uri => ({
          path: ['resource', uri, 'uri'],
          value: uri
        }));
    }
  },
  {
    route: 'resource[{keys:uris}][{keys:predicates}].length',
    get({ uris, predicates }) {
      // return Resources.getPredicateLengths(uris, predicates)
      return Observable.from(
        groupUrisByRepo(repos)(uris)
      )
        .mergeMap(({ repository, uris }) => repository.getPredicateLengths(uris, predicates))
        .map(({ subject, predicate, length }) => {
          return {
            path: ['resource', subject, predicate, 'length'],
            value: typeof length === 'undefined' ? null : length
          };
        });
    }
  },
  // {
  //   route: 'resource[{keys:uris}].ontology[{ranges:ranges}]["predicate", "count"]',
  //   get({ uris, ranges }) {
  //     return Resources.getOntologies(uris, ranges)
  //       .mergeMap(({ subject, ontologyIdx, predicate, count }) => {
  //         return Observable.of({
  //           path: ['resource', subject, 'ontology', ontologyIdx, 'predicate'],
  //           value: $ref(['resource', predicate])
  //         }, {
  //           path: ['resource', subject, 'ontology', ontologyIdx, 'count'],
  //           value: count
  //         });
  //       });
  //   }
  // },
  // {
  //   route: 'resource[{keys:uris}].ontology.length',
  //   get({ uris }) {
  //     return Resources.getOntologiesLength(uris)
  //       .map(({ subject, length }) => {
  //         return {
  //           path: ['resource', subject, 'ontology', 'length'],
  //           value: length
  //         };
  //       });
  //   }
  // }
]);
