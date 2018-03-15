const Observable = require('rxjs/Observable').Observable;
require('rxjs/add/observable/of');
require('rxjs/add/operator/mergeMap');
require('rxjs/add/operator/map');
const {
  find,
  prop,
  propEq,
} = require('ramda');
const {
  $atom
} = require('../utils/falcor');
const {
  curie2uri,
  uri2curie,
} = require('../utils/rdf');


module.exports = (repos, context) => ([
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
              value: $atom(types.map(({ uri, label, lang, }) => ({
                uri: uri2curie(context, uri), label, lang,
              })))
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

          if (!repo) {
            return Observable.of({
              path: ['ontology', repoName],
              value: null
            });
          }

          return repo.repository.getPredicates(
            types.map((type) => curie2uri(context, type))
          )
            .map(({ type, predicates }) => ({
              path: ['ontology', repoName, 'type', uri2curie(context, type)],
              value: $atom(predicates.map(({ uri, label, lang, }) => ({
                uri: uri2curie(context, uri), label, lang,
              })))
            }));
        });
    }
  }
]);
