import test from 'tape';
import { setupTestRouter, testN3, assertFailure } from '../utils/setup';
const C = {
  rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
  schema: 'http://schema.org/',
  test: 'http://junonetwork.com/test/',
  xsd: 'http://www.w3.org/2001/XMLSchema#',
};


test('[Resource Routes] Should return object literals', async (assert) => {
  assert.plan(3);
  const router = await setupTestRouter(testN3);

  const expectedResponse1 = {
    resource: {
      [`${C.test}james`]: {
        [`${C.schema}alternateName`]: {
          3: { $type: 'atom', value: 'Santiago', $lang: 'es' },
        }
      }
    }
  };

  router.get([['resource', `${C.test}james`, `${C.schema}alternateName`, 3]])
    .subscribe((res) => {
      assert.deepEqual(res.jsonGraph, expectedResponse1, 'returns literals');
    }, assertFailure(assert));

  const expectedResponse2 = {
    resource: {
      [`${C.test}james`]: {
        [`${C.schema}alternateName`]: {
          1: { $type: 'atom', value: 'Jamie', $lang: 'en' },
          2: { $type: 'atom', value: 'Jimmie', $lang: 'en' },
          3: { $type: 'atom', value: 'Santiago', $lang: 'es' },
        }
      },
      [`${C.test}micah`]: {
        [`${C.schema}alternateName`]: {
          1: null,
          2: null,
          3: null
        }
      }
    }
  };

  router.get([['resource', [`${C.test}james`, `${C.test}micah`], `${C.schema}alternateName`, { from: 1, to: 3 }]])
    .subscribe((res) => {
      assert.deepEqual(res.jsonGraph, expectedResponse2, 'returns literal ranges');
    }, assertFailure(assert));

  const expectedResponse3 = {
    resource: {
      [`${C.test}james`]: {
        [`${C.schema}birthDate`]: {
          0: { $type: 'atom', value: '1988-05-02', $dataType: `${C.xsd}date` },
        }
      }
    }
  };

  router.get([['resource', `${C.test}james`, `${C.schema}birthDate`, 0]])
    .subscribe((res) => {
      assert.deepEqual(res.jsonGraph, expectedResponse3, 'returns data type for non-string types');
    }, assertFailure(assert));
});


test('[Resource Routes] Should return object relationships', async (assert) => {
  assert.plan(1);
  const router = await setupTestRouter(testN3);

  const expectedResponse = {
    resource: {
      [`${C.test}james`]: {
        [`${C.schema}sibling`]: {
          0: { $type: 'ref', value: ['resource', `${C.test}micah`] },
          1: { $type: 'ref', value: ['resource', `${C.test}parker`] },
        },
        [`${C.schema}alternateName`]: {
          0: { $type: 'atom', value: 'JLC', $lang: 'en' },
          1: { $type: 'atom', value: 'Jamie', $lang: 'en' },
        }
      },
      [`${C.test}micah`]: {
        [`${C.rdfs}label`]: {
          0: { $type: 'atom', value: 'Micah Conkling', $lang: 'en' }
        }
      },
      [`${C.test}parker`]: {
        [`${C.rdfs}label`]: {
          0: { $type: 'atom', value: 'Parker Taylor', $lang: 'en' }
        }
      }
    }
  };

  router.get([['resource', `${C.test}james`, [`${C.schema}sibling`, `${C.schema}alternateName`], { to: 1 }, `${C.rdfs}label`, 0]])
    .subscribe((res) => {
      assert.deepEqual(res.jsonGraph, expectedResponse);
    }, assertFailure(assert));
});


test('[Resource Routes] Should short circuit paths that terminate early', async (assert) => {
  assert.plan(1);
  const router = await setupTestRouter(testN3);

  const expectedResponse = {
    resource: {
      [`${C.test}james`]: {
        [`${C.schema}alternateName`]: {
          0: { $type: 'atom', value: 'JLC', $lang: 'en' },
        }
      },
    }
  };

  router.get([['resource', `${C.test}james`, `${C.schema}alternateName`, 0, `${C.rdfs}label`, 0]])
    .subscribe((res) => {
      assert.deepEqual(res.jsonGraph, expectedResponse);
    }, assertFailure(assert));
});


test('[Resource Routes] Should return triple count', async (assert) => {
  assert.plan(1);
  const router = await setupTestRouter(testN3);

  const expectedResponse = {
    resource: {
      [`${C.test}james`]: {
        [`${C.schema}sibling`]: {
          0: { $type: 'ref', value: ['resource', `${C.test}micah`] },
          length: { $type: 'atom', value: 4 }
        },
        [`${C.schema}alternateName`]: {
          0: { $type: 'atom', value: 'JLC', $lang: 'en' },
          length: { $type: 'atom', value: 4 }
        }
      },
      [`${C.test}micah`]: {
        [`${C.rdfs}label`]: {
          0: { $type: 'atom', value: 'Micah Conkling', $lang: 'en' }
        }
      }
    }
  };

  router.get([
    ['resource', `${C.test}james`, `${C.schema}sibling`, [0, 'length'], `${C.rdfs}label`, 0],
    ['resource', `${C.test}james`, `${C.schema}alternateName`, [0, 'length']]
  ])
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

  router.get([['resource', uri, `${C.rdfs}label`, 0]])
    .subscribe((res) => {
      assert.deepEqual(res.jsonGraph, expectedResponse);
    }, assertFailure(assert));
});


test('[Resource Routes] Should return nulls for non-existant object values', async (assert) => {
  assert.plan(1);
  const router = await setupTestRouter(testN3);

  const expectedResponse = {
    resource: {
      [`${C.test}james`]: {
        [`${C.schema}sibling`]: {
          3: { $type: 'ref', value: ['resource', `${C.test}tim`] },
          4: null,
        },
        [`${C.schema}alternateName`]: {
          3: { $type: 'atom', value: 'Santiago', $lang: 'es' },
          4: null,
        }
      },
      [`${C.test}tim`]: {
        [`${C.rdfs}label`]: {
          0: { $type: 'atom', value: 'Tim Conkling', $lang: 'en' }
        }
      },
    }
  };

  router.get([
    ['resource', `${C.test}james`, `${C.schema}alternateName`, { from: 3, to: 4 }],
    ['resource', `${C.test}james`, `${C.schema}sibling`, { from: 3, to: 4 }, `${C.rdfs}label`, 0]
  ])
    .subscribe((res) => {
      assert.deepEqual(res.jsonGraph, expectedResponse);
    }, assertFailure(assert));
});


// TODO - currently it's only possible to indicate a triple doesn't exist, not a resource
test.skip('[Resource Routes] Should return null for resources that don\'t exist', async (assert) => {
  assert.plan(1);
  const router = await setupTestRouter(testN3);
  const uri = `${C.test}abc`;

  const expectedResponse = {
    resource: {
      [uri]: null
    }
  };

  router.get([['resource', uri, `${C.rdfs}label`, 0]])
    .subscribe((res) => {
      assert.deepEqual(res.jsonGraph, expectedResponse);
    }, assertFailure(assert));
});


test.skip('Should return null for predicates that don\'t exist', async (assert) => {
  assert.plan(1);
  const router = await setupTestRouter(testN3);

  const expectedResponse = {
    resource: {
      [`${C.test}james`]: {
        'nonexistant': null
      }
    }
  };

  router.get([['resource', `${C.test}james`, 'nonexistant', { to: 1 }]])
    .subscribe((res) => {
      assert.deepEqual(res.jsonGraph, expectedResponse);
    }, assertFailure(assert));
});
