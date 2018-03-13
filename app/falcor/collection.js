const Observable = require('rxjs/Observable').Observable;
require('rxjs/add/observable/of');
require('rxjs/add/operator/map');
require('rxjs/add/operator/mergeMap');
const {
  merge
} = require('ramda');
const {
  serializeCollection,
  deserializeCollection,
  getRepositoryByName,
} = require('../utils/repository');
const {
  $ref,
  $atom
} = require('../utils/falcor');


module.exports = (repos) => ([
  {
    route: 'collection[{keys:collections}][{ranges:ranges}]',
    get({ collections, ranges }) {
      return Observable.of(...collections)
        .mergeMap((collection) => {
          const { repository, type, } = deserializeCollection(collection);
          // TODO - can be made more efficient by grouping types
          return getRepositoryByName(repository, repos)
            .search([type], ranges)
            .map(merge({ repository }));
        })
        .map(({ repository, type, nonExistant, collectionIdx, subject }) => {
          if (nonExistant) {
            return {
              path: ['collection', serializeCollection(repository, type)],
              value: null
            };
          }

          return {
            path: ['collection', serializeCollection(repository, type), collectionIdx],
            value: typeof subject === 'undefined' ? null : $ref(['resource', subject])
          };
        });
    }
  },
  {
    route: 'collection[{keys:collections}].length',
    get({ collections }) {
      return Observable.of(...collections)
        .mergeMap((collection) => {
          const { repository, type, } = deserializeCollection(collection);
          return getRepositoryByName(repository, repos).searchCount([type])
            .map(({ type, length }) => ({ repository, type, length }));
        })
        .map(({ repository, type, length }) => {
          return {
            path: ['collection', serializeCollection(repository, type), 'length'],
            value: typeof length === 'undefined' ? null : length
          };
        });
    }
  },
  // {
  //   route: 'collection[{keys:collections}].ontology[{ranges:ranges}]["predicate", "count"]',
  //   get({ collections, ranges }) {
  //     return Collections.getOntologies(collections, ranges)
  //       .mergeMap(({ collection, ontologyIdx, predicate, count }) => {
  //         return Observable.of({
  //           path: ['collection', collection, 'ontology', ontologyIdx, 'predicate'],
  //           value: $ref(['resource', predicate])
  //         }, {
  //           path: ['collection', collection, 'ontology', ontologyIdx, 'count'],
  //           value: count
  //         });
  //       });
  //   }
  // },
  // {
  //   route: 'collection[{keys:collections}].ontology.length',
  //   get({ collections }) {
  //     return Collections.getOntologiesLength(collections)
  //       .map(({ collection, length }) => {
  //         return {
  //           path: ['collection', collection, 'ontology', 'length'],
  //           value: length
  //         };
  //       });
  //   }
  // },
  // {
  //   route: 'collection[{keys:collections}].ontology.list',
  //   get({ collections }) {
  //     return repos[0].repository.searchOntologyList(collections)
  //       .map(({ collection, list }) => {
  //         return {
  //           path: ['collection', collection, 'ontology', 'list'],
  //           value: $atom(list)
  //         };
  //       });
  //   }
  // }
]);
