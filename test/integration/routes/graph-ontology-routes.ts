import test from 'tape';
import { setupTestRouter, testN3, assertFailure, context } from '../../utils/setup';


test('[Graph Ontology Routes] Should return graph list', async (assert) => {
  assert.plan(1);
  const router = await setupTestRouter(testN3);

  const expectedResponse = {
    graphs: { $type: 'atom', value: [{ key: 'test', label: 'Test' }] }
  };

  router.get([['graphs']])
    .subscribe((res) => {
      assert.deepEqual(res.jsonGraph, expectedResponse);
    }, assertFailure(assert));
});


test('[Graph Ontology Routes] Should return graph resource types', async (assert) => {
  assert.plan(1);
  const router = await setupTestRouter(testN3);

  const expectedResponse = {
    graph: {
      test: {
        types: {
          $type: 'atom',
          value: [{
            uri: "http://schema.org/Person",
            label: "Person",
            language: "en"
          }, {
            uri:"http://schema.org/Place",
            label: "Place",
          }]
        }
      }
    }
  };

  router.get([['graph', 'test', 'types']])
    .subscribe((res) => {
      assert.deepEqual(res.jsonGraph, expectedResponse);
    }, assertFailure(assert));
});


test('[Graph Ontology Routes] Should return graph type predicates', async (assert) => {
  assert.plan(1);
  const router = await setupTestRouter(testN3);

  const expectedResponse = {
    graph: {
      test: {
        type: {
          [`${context.schema}Person`]: {
            $type: 'atom',
            value: [{
              uri: "http://schema.org/alternateName",
              label: "alternateName",
              range: "http://www.w3.org/2001/XMLSchema#string"
            }, {
              uri: "http://schema.org/birthDate",
              label: "birthDate",
              range: "http://www.w3.org/2001/XMLSchema#date"
            }, {
              uri: "http://schema.org/birthPlace",
              label: "birthPlace",
              range: "http://schema.org/Place"
            }, {
              uri: "http://schema.org/gender",
              label: "gender",
              range: "http://www.w3.org/2001/XMLSchema#string"
            }, {
              uri: "http://schema.org/sibling",
              label: "sibling",
              range: "http://schema.org/Person"
            }],
          },
          [`${context.schema}Place`]: {
            $type: 'atom',
            value: [{
              uri: "http://schema.org/alternateName",
              label: "alternateName",
              range: "http://www.w3.org/2001/XMLSchema#string"
            }],
          },
        }
      }
    }
  };

  router.get([['graph', 'test', 'type', [`${context.schema}Person`, `${context.schema}Place`]]])
    .subscribe((res) => {
      assert.deepEquals(res.jsonGraph.graph.test, expectedResponse.graph.test);
    }, assertFailure(assert));
});
