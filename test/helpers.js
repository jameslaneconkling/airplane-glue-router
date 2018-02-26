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

exports.setupFalcorTestModel = db => {
  const app = require('../app/app')(db);
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
