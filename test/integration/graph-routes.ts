import test from 'tape';
import { stringify } from 'query-string';
import { setupTestRouter, testN3, assertFailure, schemaN3, context } from '../utils/setup';
import createRouter, { createGraph, createHandlerAdapter } from '../../src/falcor/index';
import MemoryGraphAdapter from '../../src/adapters/memory';


test('[Graph Routes] Should return search result resources', async (assert) => {
  assert.plan(1);
  const router = await setupTestRouter(testN3);
  const collection = stringify({ type: `${context.schema}Person` });

  const expectedResponse = {
    graph: {
      test: {
        [collection]: {
          0: { $type: 'ref', value: ['resource', `${context.test}james`] },
          1: { $type: 'ref', value: ['resource', `${context.test}micah`] }
        }    
      }
    },
    resource: {
      [`${context.test}james`]: {
        [`${context.rdfs}label`]: {
          0: { $type: 'atom', value: 'James Conkling', $lang: 'en' }
        }
      },
      [`${context.test}micah`]: {
        [`${context.rdfs}label`]: {
          0: { $type: 'atom', value: 'Micah Conkling', $lang: 'en' }
        }
      },
    }
  };

  router.get([['graph', 'test', collection, { to: 1 }, `${context.rdfs}label`, 0]])
    .subscribe((res) => {
      assert.deepEqual(res.jsonGraph, expectedResponse);
    }, assertFailure(assert));
});


test('[Graph Routes] Should return results for multiple search ranges', async (assert) => {
  assert.plan(1);
  const router = await setupTestRouter(testN3);
  const collection = stringify({ type: `${context.schema}Person` });

  const expectedResponse = {
    graph: {
      test: {
        [collection]: {
          1: { $type: 'ref', value: ['resource', `${context.test}micah`] },
          3: { $type: 'ref', value: ['resource', `${context.test}sam`] },
          4: { $type: 'ref', value: ['resource', `${context.test}tim`] },
        }    
      }
    },
    resource: {
      [`${context.test}micah`]: {
        [`${context.rdfs}label`]: {
          0: { $type: 'atom', value: 'Micah Conkling', $lang: 'en' }
        }
      },
      [`${context.test}tim`]: {
        [`${context.rdfs}label`]: {
          0: { $type: 'atom', value: 'Tim Conkling', $lang: 'en' }
        }
      },
      [`${context.test}sam`]: {
        [`${context.rdfs}label`]: {
          0: { $type: 'atom', value: 'Sam Conkling', $lang: 'en' }
        }
      },
    }
  };

  router.get([['graph', 'test', collection, [{ from: 1, to: 1 }, { from: 3, to: 4 }], `${context.rdfs}label`, 0]])
    .subscribe((res) => {
      assert.deepEqual(res.jsonGraph, expectedResponse);
    }, assertFailure(assert));
});


test('[Graph Routes] Should return results for multiple searches', async (assert) => {
  assert.plan(1);
  const router = await setupTestRouter(testN3);
  const collection1 = stringify({ type: `${context.schema}Person` });
  const collection2 = stringify({ type: `${context.schema}Place` });

  const expectedResponse = {
    graph: {
      test: {
        [collection1]: {
          1: { $type: 'ref', value: ['resource', `${context.test}micah`] },
          2: { $type: 'ref', value: ['resource', `${context.test}parker`] },
        },
        [collection2]: {
          0: { $type: 'ref', value: ['resource', `${context.test}sanfrancisco`] },
          1: { $type: 'ref', value: ['resource', `http://www.wikidata.org/wiki/Q60`] },
          2: null,
        }
      }
    },
    resource: {
      [`${context.test}micah`]: {
        [`${context.rdfs}label`]: {
          0: { $type: 'atom', value: 'Micah Conkling', $lang: 'en' }
        }
      },
      [`${context.test}parker`]: {
        [`${context.rdfs}label`]: {
          0: { $type: 'atom', value: 'Parker Taylor', $lang: 'en' }
        }
      },
      [`${context.test}sanfrancisco`]: {
        [`${context.rdfs}label`]: {
          0: { $type: 'atom', value: 'San Francisco', $lang: 'en' }
        }
      },
      [`http://www.wikidata.org/wiki/Q60`]: {
        [`${context.rdfs}label`]: {
          0: { $type: 'atom', value: 'Portland, ME', $lang: 'en' }
        }
      },
    }
  };

  router.get([
    ['graph', 'test', collection1, [{ from: 1, to: 2 }], `${context.rdfs}label`, 0],
    ['graph', 'test', collection2, [{ from: 0, to: 2 }], `${context.rdfs}label`, 0],
  ])
    .subscribe((res) => {
      assert.deepEqual(res.jsonGraph, expectedResponse);
    }, assertFailure(assert));
});


test('[Graph Routes] Should return results for multiple graph adapters', async (assert) => {
  assert.plan(1);

  const JunoGraphRouter = createRouter();

  const router = new JunoGraphRouter([
    createGraph(
      createHandlerAdapter(new MemoryGraphAdapter(await MemoryGraphAdapter.createStore(testN3), { user: 'test-user' })),
      {
        key: 'test',
        domains: [/^http:\/\/junonetwork\.com\/test/],
      }
    ),
    createGraph(
      createHandlerAdapter(new MemoryGraphAdapter(await MemoryGraphAdapter.createStore(schemaN3), { user: 'test-user' })),
      {
        key: 'schema',
        domains: [/^http:\/\/schema\.org/],
      }
    )
  ]);

  const collection1 = stringify({ type: `${context.schema}Person` });
  const collection2 = stringify({ type: `${context.rdf}Property` });


  const expectedResponse = {
    graph: {
      test: {
        [collection1]: {
          1: { $type: 'ref', value: ['resource', `${context.test}micah`] },
          2: { $type: 'ref', value: ['resource', `${context.test}parker`] },
        },
      },
      schema: {
        [collection2]: {
          0: { $type: 'ref', value: ['resource', `${context.schema}alternateName`] },
          1: { $type: 'ref', value: ['resource', `${context.schema}birthDate`] },
        }
      }
    },
    resource: {
      [`${context.test}micah`]: {
        [`${context.rdfs}label`]: {
          0: { $type: 'atom', value: 'Micah Conkling', $lang: 'en' }
        }
      },
      [`${context.test}parker`]: {
        [`${context.rdfs}label`]: {
          0: { $type: 'atom', value: 'Parker Taylor', $lang: 'en' }
        }
      },
      [`${context.schema}alternateName`]: {
        [`${context.rdfs}label`]: {
          0: { $type: 'atom', value: 'alternateName' }
        }
      },
      [`${context.schema}birthDate`]: {
        [`${context.rdfs}label`]: {
          0: { $type: 'atom', value: 'birthDate' }
        }
      },
    }
  };


  router.get([
    ['graph', 'test', collection1, { from: 1, to: 2 }, `${context.rdfs}label`, 0],
    ['graph', 'schema', collection2, [{ from: 0, to: 1 }], `${context.rdfs}label`, 0],
  ])
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

  router.get([['graph', 'nope', stringify({ type: `${context.schema}Person` }), { to: 10 }, `${context.rdfs}label`, 0]])
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

  router.get([['graph', 'test', collection, { to: 10 }, `${context.rdfs}label`, 0]])
    .subscribe((res) => {
      assert.deepEqual(res.jsonGraph, expectedResponse);
    }, assertFailure(assert));
});


test('[Graph Routes] Should return nulls for non-existant resources', async (assert) => {
  assert.plan(2);
  const router = await setupTestRouter(testN3);

  const collection1 = stringify({ type: `${context.schema}Dog` });
  const expectedResponse1 = {
    graph: {
      test: {
        [collection1]: {
          0: null
        }
      }
    }
  };

  router.get([['graph', 'test', collection1, 0, `${context.rdfs}label`, 0]])
    .subscribe((res) => {
      assert.deepEqual(res.jsonGraph, expectedResponse1, 'returns nulls when search is empty');
    }, assertFailure(assert));

  const collection2 = stringify({ type: `${context.schema}Person` });
  const expectedResponse2 = {
    graph: {
      test: {
        [collection2]: {
          4: { $type: 'ref', value: ['resource', `${context.test}tim`] },
          5: null,
          6: null,
        }
      }
    },
    resource: {
      [`${context.test}tim`]: {
        [`${context.rdfs}label`]: {
          0: { $type: 'atom', value: 'Tim Conkling', $lang: 'en' }
        }
      },
    }
  };

  router.get([['graph', 'test', collection2, { from: 4, to: 6 }, `${context.rdfs}label`, 0]])
    .subscribe((res) => {
      assert.deepEqual(res.jsonGraph, expectedResponse2, 'returns nulls when requesting more results than contained by successful search');
    }, assertFailure(assert));
});


test('[Graph Routes] Should return search result count', async (assert) => {
  assert.plan(1);
  const router = await setupTestRouter(testN3);
  const personCollection = stringify({ type: `${context.schema}Person` });
  const placeCollection = stringify({ type: `${context.schema}Place` });

  const expectedResponse = {
    graph: {
      test: {
        [personCollection]: {
          4: { $type: 'ref', value: ['resource', `${context.test}tim`] },
          length: 5,
        },
        [placeCollection]: {
          length: 2,
        }
      }
    },
    resource: {
      [`${context.test}tim`]: {
        [`${context.rdfs}label`]: {
          0: { $type: 'atom', value: 'Tim Conkling', $lang: 'en' }
        }
      }
    }
  };

  router.get([
    ['graph', 'test', personCollection, 'length'],
    ['graph', 'test', placeCollection, 'length'],
    ['graph', 'test', personCollection, 4, `${context.rdfs}label`, 0]
  ])
    .subscribe((res) => {
      assert.deepEqual(res.jsonGraph, expectedResponse);
    }, assertFailure(assert));
});
