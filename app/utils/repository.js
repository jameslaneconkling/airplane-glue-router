const {
  compose,
  prop,
  find,
  propEq,
} = require('ramda');

// TODO - define better serialization logic: JSON.stringify won't guarantee order of keys
exports.serializeCollection = (repository, type) => JSON.stringify({ repository, type, });
exports.deserializeCollection = (collection) => JSON.parse(collection);
exports.getRepositoryByName = (repoName, repos) => compose(
  prop('repository'),
  find(propEq('name', repoName))
)(repos);
