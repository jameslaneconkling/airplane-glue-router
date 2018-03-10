const falcor = require('falcor');
const {
  compose,
  map,
  over,
  lensIndex,
  when,
  fromPairs,
  toPairs,
  omit
} = require('ramda');
const SuperTestDataSource = require('falcor-supertest-datasource');
const makeMemoryRepository = require('../app/repositories/memory');
const {
  context
} = require('../app/utils/rdf');


const setupTestRepos = exports.setupTestRepos = (n3) => [{
  name: 'test',
  domains: [/.*/],
  repository: makeMemoryRepository({ n3, context })
}];


exports.setupFalcorTestModel = (n3) => {
  const app = require('../app/app')(setupTestRepos(n3));

  return new falcor.Model({
    source: new SuperTestDataSource('/api/model.json', app)
  });
};

const isObjectLiteral = (value) => typeof value === 'object' &&
      value !== null &&
      !Array.isArray(value);

const deserializeGraphJSON = exports.deserializeGraphJSON = compose(
  fromPairs,
  map(over(
    lensIndex(1),
    when(isObjectLiteral, (graphJSON) => deserializeGraphJSON(graphJSON)) // unfortunately have to defer evaluation, as reference to deserializeGraphJSON isn't defined until compose completes
  )),
  toPairs,
  omit(['$__path', '$size'])
);
