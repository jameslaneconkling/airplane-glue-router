import test from 'tape';
import { setupTestRouter, testN3, assertFailure, context, schemaN3 } from '../../utils/setup';
import { createRouter, MemoryGraphAdapter, createGraph, createHandlerAdapter } from '../../../src';


test('[Resource Routes] Should return object literals', async (assert) => {
  assert.plan(3);
  const router = await setupTestRouter(testN3);

  const expectedResponse1 = {
    resource: {
      [`${context.test}james`]: {
        [`${context.schema}alternateName`]: {
          3: { $type: 'atom', value: 'Santiago', $lang: 'es' },
        }
      }
    }
  };

  router.get([['resource', `${context.test}james`, `${context.schema}alternateName`, 3]])
    .subscribe((res) => {
      assert.deepEqual(res.jsonGraph, expectedResponse1, 'returns literals');
    }, assertFailure(assert));

  const expectedResponse2 = {
    resource: {
      [`${context.test}james`]: {
        [`${context.schema}alternateName`]: {
          1: { $type: 'atom', value: 'Jamie', $lang: 'en' },
          2: { $type: 'atom', value: 'Jimmie', $lang: 'en' },
          3: { $type: 'atom', value: 'Santiago', $lang: 'es' },
        }
      },
      [`${context.test}micah`]: {
        [`${context.schema}alternateName`]: {
          1: null,
          2: null,
          3: null
        }
      }
    }
  };

  router.get([['resource', [`${context.test}james`, `${context.test}micah`], `${context.schema}alternateName`, { from: 1, to: 3 }]])
    .subscribe((res) => {
      assert.deepEqual(res.jsonGraph, expectedResponse2, 'returns literal ranges');
    }, assertFailure(assert));

  const expectedResponse3 = {
    resource: {
      [`${context.test}james`]: {
        [`${context.schema}birthDate`]: {
          0: { $type: 'atom', value: '1988-05-02', $dataType: `${context.xsd}date` },
        }
      }
    }
  };

  router.get([['resource', `${context.test}james`, `${context.schema}birthDate`, 0]])
    .subscribe((res) => {
      assert.deepEqual(res.jsonGraph, expectedResponse3, 'returns data type for non-string types');
    }, assertFailure(assert));
});


test('[Resource Routes] Should return object relationships', async (assert) => {
  assert.plan(1);
  const router = await setupTestRouter(testN3);

  const expectedResponse = {
    resource: {
      [`${context.test}james`]: {
        [`${context.schema}sibling`]: {
          0: { $type: 'ref', value: ['resource', `${context.test}micah`] },
          1: { $type: 'ref', value: ['resource', `${context.test}parker`] },
        },
        [`${context.schema}alternateName`]: {
          0: { $type: 'atom', value: 'JLC', $lang: 'en' },
          1: { $type: 'atom', value: 'Jamie', $lang: 'en' },
        }
      },
      [`${context.test}micah`]: {
        [`${context.rdfs}label`]: {
          0: { $type: 'atom', value: 'Micah Conkling', $lang: 'en' }
        }
      },
      [`${context.test}parker`]: {
        [`${context.rdfs}label`]: {
          0: { $type: 'atom', value: 'Parker Taylor', $lang: 'en' }
        }
      }
    }
  };

  router.get([['resource', `${context.test}james`, [`${context.schema}sibling`, `${context.schema}alternateName`], { to: 1 }, `${context.rdfs}label`, 0]])
    .subscribe((res) => {
      assert.deepEqual(res.jsonGraph, expectedResponse);
    }, assertFailure(assert));
});


test('[Resource Routes] Should return object uris', async (assert) => {
  assert.plan(1);
  const router = await setupTestRouter(testN3);

  const expectedResponse = {
    resource: {
      [`${context.test}james`]: {
        [`${context.schema}sibling`]: {
          0: { $type: 'ref', value: ['resource', `${context.test}micah`] },
          1: { $type: 'ref', value: ['resource', `${context.test}parker`] },
        }
      },
      [`${context.test}micah`]: {
        uri: `${context.test}micah`,
        [`${context.rdfs}label`]: {
          0: { $type: 'atom', value: 'Micah Conkling', $lang: 'en' }
        }
      },
      [`${context.test}parker`]: {
        uri: `${context.test}parker`,
        [`${context.rdfs}label`]: {
          0: { $type: 'atom', value: 'Parker Taylor', $lang: 'en' }
        }
      }
    }
  };

  router.get([
    ['resource', `${context.test}james`, `${context.schema}sibling`, { to: 1 }, 'uri'],
    ['resource', `${context.test}james`, `${context.schema}sibling`, { to: 1 }, `${context.rdfs}label`, 0],
  ])
    .subscribe((res) => {
      assert.deepEqual(res.jsonGraph, expectedResponse);
    }, assertFailure(assert));
});


test('[Resource Routes] Should return resources from multiple graph adapters', async (assert) => {
  assert.plan(1);

  const JunoGraphRouter = createRouter();

  const router = new JunoGraphRouter([
    createGraph(
      createHandlerAdapter(new MemoryGraphAdapter(await MemoryGraphAdapter.createAdapter(testN3), { user: 'test-user' })),
      {
        key: 'test',
        domains: [/^http:\/\/junonetwork\.com\/test/],
      }
    ),
    createGraph(
      createHandlerAdapter(new MemoryGraphAdapter(await MemoryGraphAdapter.createAdapter(schemaN3), { user: 'test-user' })),
      {
        key: 'schema',
        domains: [/^http:\/\/schema\.org/],
      }
    ),
  ]);

  const expectedResponse = {
    resource: {
      [`${context.test}james`]: {
        [`${context.rdfs}label`]: {
          0: { $type: 'atom', value: 'James Conkling', $lang: 'en' },
        }
      },
      [`${context.schema}birthDate`]: {
        [`${context.rdfs}label`]: {
          0: { $type: 'atom', value: 'birthDate' }
        },
        [`${context.rdfs}comment`]: {
          0: { $type: 'atom', value: 'Date of birth.' }
        },
      }
    }
  };

  router.get([
    ['resource', `${context.test}james`, `${context.rdfs}label`, 0],
    ['resource', `${context.schema}birthDate`, [`${context.rdfs}label`, `${context.rdfs}comment`], 0],
  ])
    .subscribe((res) => {
      assert.deepEqual(res.jsonGraph, expectedResponse);
    }, assertFailure(assert));
});


test('[Resource Routes] Should return deep, cyclic traversals', async (assert) => {
  assert.plan(1);
  const router = await setupTestRouter(testN3);

  const expectedResponse = {
    resource: {
      [`${context.test}micah`]: {
        [`${context.schema}sibling`]: {
          0: { $type: 'ref', value: ['resource', `${context.test}james`] },
          2: { $type: 'ref', value: ['resource', `${context.test}sam`] },
        },
        [`${context.schema}birthPlace`]: {
          0: { $type: 'ref', value: ['resource', `http://www.wikidata.org/wiki/Q60`] }
        },
      },
      [`${context.test}james`]: {
        [`${context.schema}sibling`]: {
          0: { $type: 'ref', value: ['resource', `${context.test}micah`] },
        },
        [`${context.schema}birthPlace`]: {
          0: { $type: 'ref', value: ['resource', `http://www.wikidata.org/wiki/Q60`] }
        },
      },
      [`${context.test}sam`]: {
        [`${context.schema}sibling`]: {
          0: { $type: 'ref', value: ['resource', `${context.test}james`] },
        }
      },
      [`http://www.wikidata.org/wiki/Q60`]: {
        [`${context.rdfs}label`]: {
          0: { $type: 'atom', value: 'Portland, ME', $lang: 'en' }
        },
      }
    }
  };

  router.get([[
    'resource', `${context.test}micah`,
    `${context.schema}sibling`, [0,2],
    `${context.schema}sibling`, 0,
    `${context.schema}birthPlace`, 0,
    `${context.rdfs}label`, 0
  ]])
    .subscribe((res) => {
      assert.deepEqual(res.jsonGraph, expectedResponse);
    }, assertFailure(assert));
});


test.skip('[Resource Routes] Should return deep traversals across graphs', async (assert) => {});


test('[Resource Routes] Should short circuit paths that terminate early', async (assert) => {
  assert.plan(1);
  const router = await setupTestRouter(testN3);

  const expectedResponse = {
    resource: {
      [`${context.test}james`]: {
        [`${context.schema}alternateName`]: {
          0: { $type: 'atom', value: 'JLC', $lang: 'en' },
        }
      },
    }
  };

  router.get([['resource', `${context.test}james`, `${context.schema}alternateName`, 0, `${context.rdfs}label`, 0]])
    .subscribe((res) => {
      assert.deepEqual(res.jsonGraph, expectedResponse);
    }, assertFailure(assert));
});


test('[Resource Routes] Should return triple count', async (assert) => {
  assert.plan(1);
  const router = await setupTestRouter(testN3);

  const expectedResponse = {
    resource: {
      [`${context.test}james`]: {
        [`${context.schema}sibling`]: {
          0: { $type: 'ref', value: ['resource', `${context.test}micah`] },
          length: { $type: 'atom', value: 4 }
        },
        [`${context.schema}alternateName`]: {
          0: { $type: 'atom', value: 'JLC', $lang: 'en' },
          length: { $type: 'atom', value: 4 }
        }
      },
      [`${context.test}micah`]: {
        [`${context.rdfs}label`]: {
          0: { $type: 'atom', value: 'Micah Conkling', $lang: 'en' }
        }
      }
    }
  };

  router.get([
    ['resource', `${context.test}james`, `${context.schema}sibling`, [0, 'length'], `${context.rdfs}label`, 0],
    ['resource', `${context.test}james`, `${context.schema}alternateName`, [0, 'length']]
  ])
    .subscribe((res) => {
      assert.deepEqual(res.jsonGraph, expectedResponse);
    }, assertFailure(assert));
});


test('[Resource Routes] Should return nulls for non-existant object values', async (assert) => {
  assert.plan(1);
  const router = await setupTestRouter(testN3);

  const expectedResponse = {
    resource: {
      [`${context.test}james`]: {
        [`${context.schema}sibling`]: {
          3: { $type: 'ref', value: ['resource', `${context.test}tim`] },
          4: null,
        },
        [`${context.schema}alternateName`]: {
          3: { $type: 'atom', value: 'Santiago', $lang: 'es' },
          4: null,
        }
      },
      [`${context.test}tim`]: {
        [`${context.rdfs}label`]: {
          0: { $type: 'atom', value: 'Tim Conkling', $lang: 'en' }
        }
      },
    }
  };

  router.get([
    ['resource', `${context.test}james`, `${context.schema}alternateName`, { from: 3, to: 4 }],
    ['resource', `${context.test}james`, `${context.schema}sibling`, { from: 3, to: 4 }, `${context.rdfs}label`, 0]
  ])
    .subscribe((res) => {
      assert.deepEqual(res.jsonGraph, expectedResponse);
    }, assertFailure(assert));
});


// TODO - currently it's only possible to indicate a triple doesn't exist, not a resource
test.skip('[Resource Routes] Should return null for resources that don\'t exist', async (assert) => {
  assert.plan(1);
  const router = await setupTestRouter(testN3);
  const uri = `${context.test}abc`;

  const expectedResponse = {
    resource: {
      [uri]: null
    }
  };

  router.get([['resource', uri, `${context.rdfs}label`, 0]])
    .subscribe((res) => {
      assert.deepEqual(res.jsonGraph, expectedResponse);
    }, assertFailure(assert));
});


test.skip('[Resource Routes] Should return 404 for resources that don\'t match a graph', async (assert) => {
  assert.plan(1);
  const router = await setupTestRouter(testN3);
  const uri = 'http://bad-domain.com/resource/123';

  const expectedResponse = {
    resource: {
      [uri]: {
        $type: 'error',
        value: { code: '404', message: '' }
      }
    }
  };

  router.get([['resource', uri, `${context.rdfs}label`, 0]])
    .subscribe((res) => {
      assert.deepEqual(res.jsonGraph, expectedResponse);
    }, assertFailure(assert));
});


test.skip('Should return null for predicates that don\'t exist', async (assert) => {
  assert.plan(1);
  const router = await setupTestRouter(testN3);

  const expectedResponse = {
    resource: {
      [`${context.test}james`]: {
        'nonexistant': null
      }
    }
  };

  router.get([['resource', `${context.test}james`, 'nonexistant', { to: 1 }]])
    .subscribe((res) => {
      assert.deepEqual(res.jsonGraph, expectedResponse);
    }, assertFailure(assert));
});
