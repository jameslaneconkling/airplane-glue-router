const Observable = require('rxjs/Observable').Observable;
const {
  CollectionsFactory
} = require('../model/collection');
const {
  $ref,
  $atom
} = require('../utils/falcor');
require('rxjs/add/observable/of');
require('rxjs/add/operator/map');
require('rxjs/add/operator/mergeMap');


module.exports = (repos) => ([
  {
    route: 'collection[{keys:collections}][{ranges:ranges}]',
    get({ collections, ranges }) {
      return repos[0].repository.search(collections, ranges)
        .map(({ nonExistant, collection, collectionIdx, subject }) => {
          if (nonExistant) {
            return {
              path: ['collection', collection],
              value: null
            };
          }

          return {
            path: ['collection', collection, collectionIdx],
            value: typeof subject === 'undefined' ? null : $ref(['resource', subject])
          };
        });
    }
  },
  {
    route: 'collection[{keys:collections}].length',
    get({ collections }) {
      return repos[0].repository.searchCount(collections)
        .map(({ collection, length }) => {
          return {
            path: ['collection', collection, 'length'],
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
  {
    route: 'collection[{keys:collections}].ontology.list',
    get({ collections }) {
      return repos[0].repository.searchOntologyList(collections)
        .map(({ collection, list }) => {
          return {
            path: ['collection', collection, 'ontology', 'list'],
            value: $atom(list)
          };
        });
    }
  }
]);
