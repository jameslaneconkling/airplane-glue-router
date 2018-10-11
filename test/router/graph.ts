import test from 'tape';
import { stringify } from 'query-string';
import { setupTestRouter, testN3, assertFailure } from '../utils/setup';


test('Should return search result resources', async (assert) => {
  assert.plan(1);
  const router = await setupTestRouter(testN3);
  const collection = stringify({ type: 'schema:Person' });

  const expectedResponse = {
    graph: {
      test: {
        [collection]: {
          0: { $type: 'ref', value: ['resource', 'test:james'] },
          1: { $type: 'ref', value: ['resource', 'test:micah'] }
        }    
      }
    },
    resource: {
      'test:james': {
        'rdfs:label': {
          0: { $type: 'atom', value: 'James Conkling', $lang: 'en' }
        }
      },
      'test:micah': {
        'rdfs:label': {
          0: { $type: 'atom', value: 'Micah Conkling', $lang: 'en' }
        }
      },
    }
  };

  router.get([['graph', 'test', collection, { to: 1 }, 'rdfs:label', 0]])
    .subscribe((res) => {
      assert.deepEqual(res.jsonGraph, expectedResponse);
    }, assertFailure(assert));
});


test('Should return 404 for non-existant graph', async (assert) => {
  assert.plan(1);
  const router = await setupTestRouter(testN3);

  const expectedResponse = {
    graph: {
      nope: {
        $type: 'error',
        value: { code: '404', message: '' }
      }
    }
  };

  router.get([['graph', 'nope', stringify({ type: 'schema:Person' }), { to: 10 }, 'rdfs:label', 0]])
    .subscribe((res) => {
      assert.deepEqual(res.jsonGraph, expectedResponse);
    }, assertFailure(assert));
});


test('Should return 422 for bad search', async (assert) => {
  assert.plan(1);
  const router = await setupTestRouter(testN3);
  const collection = `QWERTY`;

  const expectedResponse = {
    graph: {
      test: {
        [collection]: {
          $type: 'error',
          value: { code: '422', message: '' }
        }
      }
    }
  };

  router.get([['graph', 'test', collection, { to: 10 }, 'rdfs:label', 0]])
    .subscribe((res) => {
      assert.deepEqual(res.jsonGraph, expectedResponse);
    }, assertFailure(assert));
});


test.skip('Should return nulls for non-existant resources', async (assert) => {
  assert.plan(1);
  const router = await setupTestRouter(testN3);
  const collection = stringify({ type: 'schema:Person' });

  const expectedResponse = {
    graph: {
      [collection]: {
        4: {
          'rdfs:label': {
            0: 'James Conkling'
          }
        },
        5: null,
        6: null,
      }
    }
  };

  router.get([['graph', 'test', collection, { from: 4, to: 6 }, 'rdfs:label', 0]])
    .subscribe((res) => {
      assert.deepEqual(res.jsonGraph, expectedResponse);
    }, assertFailure(assert));
});


test('Should return search result count', async (assert) => {
  assert.plan(1);
  const router = await setupTestRouter(testN3);
  const collection = stringify({ type: 'schema:Person' });

  const expectedResponse = {
    graph: {
      test: {
        [collection]: {
          4: { $type: 'ref', value: ['resource', 'test:tim'] },
          length: 5,
        }
      }
    },
    resource: {
      'test:tim': {
        'rdfs:label': {
          0: { $type: 'atom', value: 'Tim Conkling', $lang: 'en' }
        }
      }
    }
  };

  router.get([
    ['graph', 'test', collection, 'length'],
    ['graph', 'test', collection, 4, 'rdfs:label', 0]
  ])
    .subscribe((res) => {
      assert.deepEqual(res.jsonGraph, expectedResponse);
    }, assertFailure(assert));
});
