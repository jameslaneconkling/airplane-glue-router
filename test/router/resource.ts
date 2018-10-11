import test from 'tape';
import { setupTestRouter, testN3, assertFailure } from '../utils/setup';


test('Should return object literals', async (assert) => {
  assert.plan(1);
  const router = await setupTestRouter(testN3);

  const expectedResponse = {
    resource: {
      'test:james': {
        'schema:alternateName': {
          0: { $type: 'atom', value: 'JLC', $lang: 'en' },
          1: { $type: 'atom', value: 'Jamie', $lang: 'en' }
        }
      },
      'test:micah': {
        'schema:alternateName': {
          0: { $type: 'atom', value: 'Mitzan', $lang: 'en' },
          1: { $type: 'atom' } // TODO
        }
      }
    }
  };

  router.get([['resource', ['test:james', 'test:micah'], 'schema:alternateName', { to: 1 }]])
    .subscribe((res) => {
      assert.deepEqual(res.jsonGraph, expectedResponse);
    }, assertFailure(assert));
});


test('Should return object relationships', async (assert) => {
  assert.plan(1);
  const router = await setupTestRouter(testN3);

  const expectedResponse = {
    resource: {
      'test:james': {
        'schema:sibling': {
          0: { $type: 'ref', value: ['resource', 'test:micah'] },
          1: { $type: 'ref', value: ['resource', 'test:parker'] },
        },
        'schema:alternateName': {
          0: { $type: 'atom', value: 'JLC', $lang: 'en' },
          1: { $type: 'atom', value: 'Jamie', $lang: 'en' },
        }
      },
      'test:micah': {
        'rdfs:label': {
          0: { $type: 'atom', value: 'Micah Conkling', $lang: 'en' }
        }
      },
      'test:parker': {
        'rdfs:label': {
          0: { $type: 'atom', value: 'Parker Taylor', $lang: 'en' }
        }
      }
    }
  };

  router.get([['resource', 'test:james', ['schema:sibling', 'schema:alternateName'], { to: 1 }, 'rdfs:label', 0]])
    .subscribe((res) => {
      assert.deepEqual(res.jsonGraph, expectedResponse);
    }, assertFailure(assert));
});


test('Should handle both uris that can and can\'t be collapsed to curies', async (assert) => {
  assert.plan(1);
  const router = await setupTestRouter(testN3);

  const expectedResponse = {
    resource: {
      'test:james': {
        'schema:sibling': {
          0: { $type: 'ref', value: ['resource', 'test:micah'] },
        },
        'schema:birthPlace': {
          0: { $type: 'ref', value: ['resource', 'http://www.wikidata.org/wiki/Q60'] },
        }
      },
      'test:micah': {
        'rdfs:label': {
          0: { $type: 'atom', value: 'Micah Conkling', $lang: 'en' }
        }
      },
      'http://www.wikidata.org/wiki/Q60': {
        'rdfs:label': {
          0: { $type: 'atom', value: 'Portland, ME', $lang: 'en' }
        }
      }
    }
  };

  router.get([['resource', 'test:james', ['schema:birthPlace', 'schema:sibling'], 0, 'rdfs:label', 0]])
    .subscribe((res) => {
      assert.deepEqual(res.jsonGraph, expectedResponse);
    }, assertFailure(assert));
});


test.skip('Should return objects length', async (assert) => {
  assert.plan(1);
  const router = await setupTestRouter(testN3);

  const expectedResponse = {
    resource: {
      'test:james': {
        'schema:sibling': {
          0: {
            'rdfs:label': { 0: 'Micah Conkling' }
          },
          length: 4
        },
        'schema:alternateName': {
          0: 'JLC',
          length: 4
        }
      }
    }
  };

  router.get([
    ['resource', 'test:james', 'schema:sibling', [{ to: 1 }, 'length'], 'rdfs:label', 0],
    ['resource', 'test:james', 'schema:alternateName', [{ to: 1 }, 'length']]
  ])
    .subscribe((res) => {
      assert.deepEqual(res.jsonGraph, expectedResponse);
    }, assertFailure(assert));
});


test.skip('Should return 404 for resources that don\'t match a graph', async (assert) => {
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

  router.get([['resource', uri, 'rdfs:label', 0]])
    .subscribe((res) => {
      assert.deepEqual(res.jsonGraph, expectedResponse);
    }, assertFailure(assert));
});


test.skip('Should return null for resources that don\'t exist', async (assert) => {
  assert.plan(1);
  const router = await setupTestRouter(testN3);

  const expectedResponse = {
    resource: {
      'test:abc': null
    }
  };

  router.get([['resource', 'test:abc', 'rdfs:label', 0]])
    .subscribe((res) => {
      assert.deepEqual(res.jsonGraph, expectedResponse);
    }, assertFailure(assert));
});


test.skip('Should return null for values that don\'t exist', async (assert) => {
  assert.plan(1);
  const router = await setupTestRouter(testN3);

  const expectedResponse = {
    resource: {
      'test:james': {
        'rdfs:label': {
          10: null,
          11: null,
        }
      }
    }
  };

  router.get([['resource', 'test:james', 'rdfs:label', [10, 11]]])
    .subscribe((res) => {
      assert.deepEqual(res.jsonGraph, expectedResponse);
    }, assertFailure(assert));
});

test.skip('Should return null for predicates that don\'t exist', async (assert) => {
  assert.plan(1);
  const router = await setupTestRouter(testN3);

  const expectedResponse = {
    resource: {
      'test:james': {
        'nonexistant': null
      }
    }
  };

  router.get([['resource', 'test:james', 'nonexistant', { to: 1 }]])
    .subscribe((res) => {
      assert.deepEqual(res.jsonGraph, expectedResponse);
    }, assertFailure(assert));
});
