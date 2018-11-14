import test from 'tape';
import { stringify } from 'query-string';
import { setupTestRouter, testN3, assertFailure } from '../utils/setup';
const C = {
  rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
  schema: 'http://schema.org/',
  test: 'http://junonetwork.com/test/',
};


test('[Graph Routes] Should return search result resources', async (assert) => {
  assert.plan(1);
  const router = await setupTestRouter(testN3);
  const collection = stringify({ type: `${C.schema}Person` });

  const expectedResponse = {
    graph: {
      test: {
        [collection]: {
          0: { $type: 'ref', value: ['resource', `${C.test}james`] },
          1: { $type: 'ref', value: ['resource', `${C.test}micah`] }
        }    
      }
    },
    resource: {
      [`${C.test}james`]: {
        [`${C.rdfs}label`]: {
          0: { $type: 'atom', value: 'James Conkling', $lang: 'en' }
        }
      },
      [`${C.test}micah`]: {
        [`${C.rdfs}label`]: {
          0: { $type: 'atom', value: 'Micah Conkling', $lang: 'en' }
        }
      },
    }
  };

  router.get([['graph', 'test', collection, { to: 1 }, `${C.rdfs}label`, 0]])
    .subscribe((res) => {
      assert.deepEqual(res.jsonGraph, expectedResponse);
    }, assertFailure(assert));
});


test('[Graph Routes] Should return 404 for non-existant graph', async (assert) => {
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

  router.get([['graph', 'nope', stringify({ type: `${C.schema}Person` }), { to: 10 }, `${C.rdfs}label`, 0]])
    .subscribe((res) => {
      assert.deepEqual(res.jsonGraph, expectedResponse);
    }, assertFailure(assert));
});


test('[Graph Routes] Should return 422 for bad search', async (assert) => {
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

  router.get([['graph', 'test', collection, { to: 10 }, `${C.rdfs}label`, 0]])
    .subscribe((res) => {
      assert.deepEqual(res.jsonGraph, expectedResponse);
    }, assertFailure(assert));
});


test('[Graph Routes] Should return nulls for non-existant resources', async (assert) => {
  assert.plan(2);
  const router = await setupTestRouter(testN3);

  const collection1 = stringify({ type: `${C.schema}Dog` });
  const expectedResponse1 = {
    graph: {
      test: {
        [collection1]: {
          0: null
        }
      }
    }
  };

  router.get([['graph', 'test', collection1, 0, `${C.rdfs}label`, 0]])
    .subscribe((res) => {
      assert.deepEqual(res.jsonGraph, expectedResponse1, 'returns nulls when search is empty');
    }, assertFailure(assert));

  const collection2 = stringify({ type: `${C.schema}Person` });
  const expectedResponse2 = {
    graph: {
      test: {
        [collection2]: {
          4: { $type: 'ref', value: ['resource', `${C.test}tim`] },
          5: null,
          6: null,
        }
      }
    },
    resource: {
      [`${C.test}tim`]: {
        [`${C.rdfs}label`]: {
          0: { $type: 'atom', value: 'Tim Conkling', $lang: 'en' }
        }
      },
    }
  };

  router.get([['graph', 'test', collection2, { from: 4, to: 6 }, `${C.rdfs}label`, 0]])
    .subscribe((res) => {
      assert.deepEqual(res.jsonGraph, expectedResponse2, 'returns nulls when requesting more results than contained by successful search');
    }, assertFailure(assert));
});


test('[Graph Routes] Should return search result count', async (assert) => {
  assert.plan(1);
  const router = await setupTestRouter(testN3);
  const collection = stringify({ type: `${C.schema}Person` });

  const expectedResponse = {
    graph: {
      test: {
        [collection]: {
          4: { $type: 'ref', value: ['resource', `${C.test}tim`] },
          length: 5,
        }
      }
    },
    resource: {
      [`${C.test}tim`]: {
        [`${C.rdfs}label`]: {
          0: { $type: 'atom', value: 'Tim Conkling', $lang: 'en' }
        }
      }
    }
  };

  router.get([
    ['graph', 'test', collection, 'length'],
    ['graph', 'test', collection, 4, `${C.rdfs}label`, 0]
  ])
    .subscribe((res) => {
      assert.deepEqual(res.jsonGraph, expectedResponse);
    }, assertFailure(assert));
});
