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
} = require('../utils/falcor');
const {
  curie2uri,
  uri2curie,
} = require('../utils/rdf');


module.exports = (repos, context) => ([
  {
    route: 'collection[{keys:collections}][{ranges:ranges}]',
    get({ collections, ranges }) {
      return Observable.of(...collections)
        .mergeMap((collection) => {
          const { repository, type, } = deserializeCollection(collection);
          // TODO - can be made more efficient by grouping types
          return getRepositoryByName(repository, repos)
            .search([curie2uri(context, type)], ranges)
            .map(merge({ repository }));
        })
        .map(({ repository, type, collectionIdx, subject }) => {
          return {
            path: ['collection', serializeCollection(repository, uri2curie(context, type)), collectionIdx],
            value: typeof subject === 'undefined' ? null : $ref(['resource', uri2curie(context, subject)])
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
          return getRepositoryByName(repository, repos)
            .searchCount([curie2uri(context, type)])
            .map(({ type, length }) => ({ repository, type, length }));
        })
        .map(({ repository, type, length }) => {
          return {
            path: ['collection', serializeCollection(repository, uri2curie(context, type)), 'length'],
            value: typeof length === 'undefined' ? null : length
          };
        });
    }
  },
]);
