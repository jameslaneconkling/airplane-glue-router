const Observable = require('rxjs/Observable').Observable;
require('rxjs/add/observable/of');
require('rxjs/add/operator/mergeMap');
require('rxjs/add/operator/map');
const {
  find,
  prop,
  propEq,
  xprod
} = require('ramda');
const {
  $atom
} = require('../utils/falcor');


module.exports = (repos) => ([
  {
    route: 'ontology.repositories',
    get: () => ({
      path: ['ontology', 'repositories'],
      value: $atom(repos.map(prop('name')))
    })
  },
  {
    route: 'ontology[{keys:repositories}].types',
    get({ repositories }) {
      return Observable.of(...repositories)
        .mergeMap((repoName) => {
          const repo = find(propEq('name', repoName), repos);

          if (!repo) {
            return Observable.of({
              path: ['ontology', repoName],
              value: null
            });
          }

          return repo.repository.getTypes()
            .map((types) => ({
              path: ['ontology', repoName, 'types'],
              value: $atom(types)
            }));
        });
    }
  },
  {
    route: 'ontology[{keys:repositories}].type[{keys:types}].',
    get({ repositories, types }) {
      return Observable.of(...repositories)
        .mergeMap((repoName) => {
          const repo = find(propEq('name', repoName), repos);

          console.log(repositories, types, repos, repo);
          if (!repo) {
            return Observable.of({
              path: ['ontology', repoName],
              value: null
            });
          }

          return repo.repository.getPredicates(types)
            .map(({ type, predicates }) => ({
              path: ['ontology', repoName, 'type', type],
              value: $atom(predicates)
            }));
        });
    }
  }
]);
