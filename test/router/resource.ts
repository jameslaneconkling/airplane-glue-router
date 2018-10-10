import test from 'tape';
import { setupTestRouter, testN3, assertFailure } from '../utils/setup';


test('Should return object literals', async (assert) => {
  assert.plan(1);
  const router = await setupTestRouter(testN3);

  const expectedResponse = {
    resource: {
      'data:james': {
        'schema:alternateName': {
          0: { $type: 'atom', value: 'JLC', $lang: 'en' },
          1: { $type: 'atom', value: 'Jamie', $lang: 'en' }
        }
      },
      'data:micah': {
        'schema:alternateName': {
          0: { $type: 'atom', value: 'Mitzan', $lang: 'en' },
          1: { $type: 'atom' } // TODO
        }
      }
    }
  };

  router.get([['resource', ['data:james', 'data:micah'], 'schema:alternateName', { to: 1 }]])
    .subscribe((res) => {
      assert.deepEqual(res.jsonGraph, expectedResponse);
    }, assertFailure(assert));
});


test('Should return objects relationships', async (assert) => {
  assert.plan(1);
  const router = await setupTestRouter(testN3);

  const expectedResponse = {
    resource: {
      'data:james': {
        'schema:sibling': {
          0: { $type: 'ref', value: ['resource', 'data:micah'] },
          1: { $type: 'ref', value: ['resource', 'data:parker'] },
        },
        'schema:alternateName': {
          0: { $type: 'atom', value: 'JLC', $lang: 'en' },
          1: { $type: 'atom', value: 'Jamie', $lang: 'en' },
        }
      },
      'data:micah': {
        'rdfs:label': {
          0: { $type: 'atom', value: 'Micah Conkling', $lang: 'en' }
        }
      },
      'data:parker': {
        'rdfs:label': {
          0: { $type: 'atom', value: 'Parker Taylor', $lang: 'en' }
        }
      }
    }
  };

  router.get([['resource', 'data:james', ['schema:sibling', 'schema:alternateName'], { to: 1 }, 'rdfs:label', 0]])
    .subscribe((res) => {
      assert.deepEqual(res.jsonGraph, expectedResponse);
    }, assertFailure(assert));
});


test.skip('Should return objects length', async (assert) => {
  assert.plan(1);
  const router = await setupTestRouter(testN3);

  const expectedResponse = {
    resource: {
      'data:james': {
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
    ['resource', 'data:james', 'schema:sibling', [{ to: 1 }, 'length'], 'rdfs:label', 0],
    ['resource', 'data:james', 'schema:alternateName', [{ to: 1 }, 'length']]
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
      'data:abc': null
    }
  };

  router.get([['resource', 'data:abc', 'rdfs:label', 0]])
    .subscribe((res) => {
      assert.deepEqual(res.jsonGraph, expectedResponse);
    }, assertFailure(assert));
});


test.skip('Should return null for predicates that don\'t exist', async (assert) => {
  assert.plan(1);
  const router = await setupTestRouter(testN3);

  const expectedResponse = {
    resource: {
      'data:james': {
        'nonexistant': null
      }
    }
  };

  router.get([['resource', 'data:james', 'nonexistant', { to: 1 }]])
    .subscribe((res) => {
      assert.deepEqual(res.jsonGraph, expectedResponse);
    }, assertFailure(assert));
});
