const {
  compose,
  prop,
  find,
  propEq,
  pipe,
  reduce,
  values
} = require('ramda');


const matchRepo = exports.matchRepo = (uri) => find(
  ({ domains }) => find((domain) => domain.test(uri), domains)
);

// [uris] -> [{ name, repository, uris }]
exports.groupUrisByRepo = (repos) => pipe(
  reduce((repoWithUris, uri) => {
    const repo = matchRepo(uri)(repos);

    if (!repo) {
      console.warn(`No repository found for URI ${uri}`);
      repoWithUris.missing = repoWithUris.missing || {
        name: 'missing',
        repository: null,
        uris: []
      };

      repoWithUris.missing.uris.push(uri);
      return repoWithUris;
    }

    if (!repoWithUris[repo.name]) {
      repoWithUris[repo.name] = {
        name: repo.name,
        repository: repo.repository,
        uris: []
      };
    }

    repoWithUris[repo.name].uris.push(uri);
    return repoWithUris;
  }, {}),
  values
);

// TODO - define better serialization logic: JSON.stringify won't guarantee order of keys
exports.serializeCollection = (repository, type) => JSON.stringify({ repository, type, });

exports.deserializeCollection = (collection) => JSON.parse(collection);

exports.getRepositoryByName = (repoName, repos) => compose(
  prop('repository'),
  find(propEq('name', repoName))
)(repos);
