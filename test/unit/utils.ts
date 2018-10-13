import test from 'tape';
import { cartesianProd } from '../../src/utils/misc';
import { uri2Curie, curie2URI, OBJECT, URI } from '../../src/utils/rdf';


test('cartesian product', (assert) => {
  assert.plan(3);
  assert.deepEqual(cartesianProd(['a', 'b'], [1, 2], ['Z']), [['a', 1, 'Z'], ['a', 2, 'Z'], ['b', 1, 'Z'], ['b', 2, 'Z']]);
  assert.deepEqual(cartesianProd(['a', 'b'], [], ['Z']), []);
  assert.deepEqual(cartesianProd(['a', 'b', 'c'], [1, 2], []), []);
});


test.skip('OBJECT.falcor2Adapter', (assert) => {
  assert.plan(9);

  assert.fail();
});


test('OBJECT.adapter2Falcor', (assert) => {
  assert.plan(9);
  const context = {
    xsd: 'http://www.w3.org/2001/XMLSchema#',
  };

  assert.deepEqual(OBJECT.adapter2Falcor(context, '"Literal"'), { $type: 'atom', value: 'Literal' });
  assert.deepEqual(OBJECT.adapter2Falcor(context, '"Literal"@en'), { $type: 'atom', value: 'Literal', language: 'en' });
  assert.deepEqual(OBJECT.adapter2Falcor(context, '"Literal"@fr-be'), { $type: 'atom', value: 'Literal', language: 'fr-be' });
  assert.deepEqual(OBJECT.adapter2Falcor(context, '"Literal"@fr-be^^rdf:langString'), { $type: 'atom', value: 'Literal', language: 'fr-be' });
  assert.deepEqual(OBJECT.adapter2Falcor(context, '"Literal"^^rdf:langString@fr-be'), { $type: 'atom', value: 'Literal', language: 'fr-be' });
  assert.deepEqual(OBJECT.adapter2Falcor(context, '"1"^^xsd:integer'), { $type: 'atom', value: '1', dataType: 'xsd:integer' });
  assert.deepEqual(OBJECT.adapter2Falcor(context, '"1"^^<http://www.w3.org/2001/XMLSchema#integer>'), { $type: 'atom', value: '1', dataType: 'xsd:integer' });
  assert.deepEqual(OBJECT.adapter2Falcor({}, '"1"^^<http://www.w3.org/2001/XMLSchema#integer>'), { $type: 'atom', value: '1', dataType: '<http://www.w3.org/2001/XMLSchema#integer>' });
  assert.deepEqual(OBJECT.adapter2Falcor(context, '"Literal "with \'quotes\'" and @ and ^^"@fr-be^^rdf:langString'), { $type: 'atom', value: 'Literal "with \'quotes\'" and @ and ^^', language: 'fr-be' });
  // TODO - ensure that literal URIS are handled as literals and not objects
  // TODO - null/undefined/curie/uri/error
});


test('URI.falcor2Adapter', (assert) => {
  assert.plan(2);
  const context = {
    rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
  };

  assert.equal(URI.falcor2Adapter(context, 'rdfs:label'), 'http://www.w3.org/2000/01/rdf-schema#label', 'should expand curie to uri');
  assert.equal(URI.falcor2Adapter(context, '<http://www.w3.org/2000/01/rdf-schema#label>'), 'http://www.w3.org/2000/01/rdf-schema#label', 'should remove angle brackets from uri');
});


test('URI.adapter2Falcor', (assert) => {
  assert.plan(2);
  const context = {
    rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
  };

  assert.equal(URI.adapter2Falcor(context, 'http://www.w3.org/2000/01/rdf-schema#label'), 'rdfs:label', 'should collapse uri to curie');
  assert.equal(URI.adapter2Falcor(context, 'http://junonetwork.com/test/abc'), '<http://junonetwork.com/test/abc>', 'should add angle brackets to uri that can\'t be collapsed to curie');
});


test('uri2Curie', (assert) => {
  assert.plan(7);
  const context = {
    rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
  };

  assert.equal(uri2Curie(context, '<http://www.w3.org/2000/01/rdf-schema#label>'), 'rdfs:label', 'should collapse uri to curie if uri namespace exists in context');
  assert.equal(uri2Curie(context, '<http://junonetwork.com/test/abc>'), '<http://junonetwork.com/test/abc>', 'should not collapse uri to curie if uri namespace does not exist in context');
  assert.equal(uri2Curie(context, 'rdfs:label'), 'rdfs:label', 'should not change a non uri');
  assert.equal(uri2Curie(context, 'abc123XYZ'), 'abc123XYZ', 'should not change a non uri');
  assert.equal(uri2Curie(context, 'http://www.w3.org/2000/01/rdf-schema#label'), 'http://www.w3.org/2000/01/rdf-schema#label', 'should not change a non uri');
  assert.equal(uri2Curie(context, uri2Curie(context, '<http://www.w3.org/2000/01/rdf-schema#label>')), uri2Curie(context, '<http://www.w3.org/2000/01/rdf-schema#label>'), 'should be idempotent');
  assert.equal(curie2URI(context, uri2Curie(context, '<http://www.w3.org/2000/01/rdf-schema#label>')), '<http://www.w3.org/2000/01/rdf-schema#label>', 'should be reversable via curie2Uri');
});

test('curie2URI', (assert) => {
  assert.plan(7);

  const context = {
    rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
  };
  
  assert.equal(curie2URI(context, 'rdfs:label'), '<http://www.w3.org/2000/01/rdf-schema#label>', 'should expand curie to uri if curie prefix exists in context');
  assert.equal(curie2URI(context, 'juno:abc'), 'juno:abc', 'should not expand curie to uri if curie prefix does not exist in context');
  assert.equal(curie2URI(context, '<http://www.w3.org/2000/01/rdf-schema#label>'), '<http://www.w3.org/2000/01/rdf-schema#label>', 'should not expand non-curie');
  assert.equal(curie2URI(context, 'abc123XYZ'), 'abc123XYZ', 'should not expand non-curie');
  assert.equal(curie2URI(context, 'junoabc'), 'junoabc', 'should not expand non-curie');
  assert.equal(curie2URI(context, curie2URI(context, 'rdfs:label')), '<http://www.w3.org/2000/01/rdf-schema#label>', 'should be idempotent');
  assert.equal(uri2Curie(context, curie2URI(context, 'rdfs:label')), 'rdfs:label', 'should be reversable via uri2Curie');
});
