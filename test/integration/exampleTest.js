const fs = require('fs');
const test = require('tape');
const request = require('supertest');
const { testDbFactory } = require('../../app/db');
const appFactory = require('../../app/app');
const {
  setupFalcorTestModel
} = require('../helpers');

const seedN3 = fs.readFileSync(`${__dirname}/../../seed.n3`, 'utf8');
const assertFailure = assert => err => {
  assert.fail(JSON.stringify(err));
  assert.end();
};


/*******************************/
/** Test against Falcor Model **/
/*******************************/
test('Example Test against Falcor Model', assert => {
  assert.plan(1);
  const model = setupFalcorTestModel(testDbFactory(seedN3));

  const expectedResponse = {
    'http://schema.org/Person': {
      0: {
        'http://www.w3.org/2000/01/rdf-schema#label': '"Barack Obama"@en'
      },
      1: {
        'http://www.w3.org/2000/01/rdf-schema#label': '"Michelle Obama"@en'
      }
    }
  };

  model.get(['http://schema.org/Person', { to: 1 }, 'http://www.w3.org/2000/01/rdf-schema#label'])
    .subscribe(res => {
      assert.deepEqual(res.json.toJSON(), expectedResponse);
    }, assertFailure(assert));
});


/*********************************/
/** Test as direct ajax request **/
/*********************************/
test('Example Test as ajax request', assert => {
  assert.plan(1);
  const app = appFactory(testDbFactory(seedN3));

  const method = 'get';
  const paths = [
    ['http://schema.org/Person', { to: 1 }, 'http://www.w3.org/2000/01/rdf-schema#label']
  ];
  const expectedResponse = {
    jsonGraph: {
      'http://schema.org/Person': {
        0: { $type: 'ref', value: ['resource', 'data:barack'] },
        1: { $type: 'ref', value: ['resource', 'data:michelle'] }
      },
      resource: {
        'data:barack': {
          'http://www.w3.org/2000/01/rdf-schema#label': { $type: 'atom', value: '"Barack Obama"@en' }
        },
        'data:michelle': {
          'http://www.w3.org/2000/01/rdf-schema#label': { $type: 'atom', value: '"Michelle Obama"@en' }
        }
      }
    }
  };

  request(app)
    .get(`/api/model.json?method=${method}&paths=${encodeURIComponent(JSON.stringify(paths))}`)
    .end((err, res) => {
      if (err) {
        assert.fail(err);
      }

      assert.deepEqual(res.body, expectedResponse);
    });
});
