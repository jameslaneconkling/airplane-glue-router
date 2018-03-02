const {
  find,
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
      return repoWithUris;
    }

    if (repoWithUris[repo.name]) {
      repoWithUris[repo.name].uris.push(uri);
      return repoWithUris;
    }

    repoWithUris[repo.name] = {
      name: repo.name,
      repository: repo.repository,
      uris: [uri]
    };
    return repoWithUris;
  }, {}),
  values
);
