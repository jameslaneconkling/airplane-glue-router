import test from 'tape';
import { cartesianProd } from '../../src/utils/misc';
import { createObjectSentinel, uri2Curie, curie2URI } from '../../src/utils/rdf';


test('cartesian product', (assert) => {
  assert.plan(3);
  assert.deepEqual(cartesianProd(['a', 'b'], [1, 2], ['Z']), [['a', 1, 'Z'], ['a', 2, 'Z'], ['b', 1, 'Z'], ['b', 2, 'Z']]);
  assert.deepEqual(cartesianProd(['a', 'b'], [], ['Z']), []);
  assert.deepEqual(cartesianProd(['a', 'b', 'c'], [1, 2], []), []);
});

test('createObjectSentinel', (assert) => {
  assert.plan(9);
  const context = {
    xsd: 'http://www.w3.org/2001/XMLSchema#',
  };

  /* what should the router-adapter interface rules for objects be?
    - can the adapter specify a different context?
    - should it even be aware of the router context?  Or can everything the router passes be expanded
    - ensure this follows the RDF spec for literals and URIs
    - rather than create new types Literal, URI, Error, why not just use falcor atom/ref/error sentinels?
  */
  assert.deepEqual(createObjectSentinel(context, '"Literal"'), { type: 'atom', literal: 'Literal' });
  assert.deepEqual(createObjectSentinel(context, '"Literal"@en'), { type: 'atom', literal: 'Literal', language: 'en' });
  assert.deepEqual(createObjectSentinel(context, '"Literal"@fr-be'), { type: 'atom', literal: 'Literal', language: 'fr-be' });
  assert.deepEqual(createObjectSentinel(context, '"Literal"@fr-be^^rdf:langString'), { type: 'atom', literal: 'Literal', language: 'fr-be' });
  assert.deepEqual(createObjectSentinel(context, '"Literal"^^rdf:langString@fr-be'), { type: 'atom', literal: 'Literal', language: 'fr-be' });
  assert.deepEqual(createObjectSentinel(context, '"1"^^xsd:integer'), { type: 'atom', literal: '1', dataType: 'xsd:integer' });
  assert.deepEqual(createObjectSentinel(context, '"1"^^<http://www.w3.org/2001/XMLSchema#integer>'), { type: 'atom', literal: '1', dataType: 'xsd:integer' });
  assert.deepEqual(createObjectSentinel({}, '"1"^^<http://www.w3.org/2001/XMLSchema#integer>'), { type: 'atom', literal: '1', dataType: '<http://www.w3.org/2001/XMLSchema#integer>' });
  assert.deepEqual(createObjectSentinel(context, '"Literal "with \'quotes\'" and @ and ^^"@fr-be^^rdf:langString'), { type: 'atom', literal: 'Literal "with \'quotes\'" and @ and ^^', language: 'fr-be' });
  // TODO - ensure that literal URIS are handled as literals and not objects
  // TODO - createObjectSentinel w/ null/undefined/curie/uri/error
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
