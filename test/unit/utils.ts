import test from 'tape';
import { cartesianProd } from '../../src/utils/misc';
import { isLiteral, createObject } from '../../src/utils/rdf';


test('cartesian product', (assert) => {
  assert.plan(3);
  assert.deepEqual(cartesianProd(['a', 'b'], [1, 2], ['Z']), [['a', 1, 'Z'], ['a', 2, 'Z'], ['b', 1, 'Z'], ['b', 2, 'Z']]);
  assert.deepEqual(cartesianProd(['a', 'b'], [], ['Z']), []);
  assert.deepEqual(cartesianProd(['a', 'b', 'c'], [1, 2], []), []);
});

test('isLiteral', (assert) => {
  assert.plan(9);
  assert.deepEqual(isLiteral('"Literal String"'), true);
  assert.deepEqual(isLiteral('"Literal String With DataType"^^xsd:string'), true);
  assert.deepEqual(isLiteral('"Literal String With DataType"^^<http://www.w3.org/2001/XMLSchema#string>'), true);
  assert.deepEqual(isLiteral('"Literal Langauge String"@en'), true);
  assert.deepEqual(isLiteral('"Literal Langauge String"@fr-be'), true);
  // unclear if the spec specifies order when both datatype and language tag are present
  // https://www.w3.org/TR/rdf11-concepts/#h3_section-Graph-Literal
  assert.deepEqual(isLiteral('"Literal Language String"@fr-be^^rdf:langString'), true);
  assert.deepEqual(isLiteral('"Literal Language String"@fr-be^^<http://www.w3.org/1999/02/22-rdf-syntax-ns#langString>'), true);
  assert.deepEqual(isLiteral('"Literal Language String"^^rdf:langString@fr-be'), true);
  assert.deepEqual(isLiteral('"Literal Language String"^^<http://www.w3.org/1999/02/22-rdf-syntax-ns#langString>@fr-be'), true);
  // TODO - handle multi-line literals
});

test('createObject', (assert) => {
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
  assert.deepEqual(createObject(context, '"Literal"'), { type: 'literal', object: '"Literal"', value: 'Literal' });
  assert.deepEqual(createObject(context, '"Literal"@en'), { type: 'literal', object: '"Literal"@en', value: 'Literal', language: 'en' });
  assert.deepEqual(createObject(context, '"Literal"@fr-be'), { type: 'literal', object: '"Literal"@fr-be', value: 'Literal', language: 'fr-be' });
  assert.deepEqual(createObject(context, '"Literal"@fr-be^^rdf:langString'), { type: 'literal', object: '"Literal"@fr-be^^rdf:langString', value: 'Literal', language: 'fr-be' });
  assert.deepEqual(createObject(context, '"Literal"^^rdf:langString@fr-be'), { type: 'literal', object: '"Literal"^^rdf:langString@fr-be', value: 'Literal', language: 'fr-be' });
  assert.deepEqual(createObject(context, '"1"^^xsd:integer'), { type: 'literal', object: '"1"^^xsd:integer', value: '1', dataType: 'xsd:integer' });
  assert.deepEqual(createObject(context, '"1"^^<http://www.w3.org/2001/XMLSchema#integer>'), { type: 'literal', object: '"1"^^<http://www.w3.org/2001/XMLSchema#integer>', value: '1', dataType: 'xsd:integer' });
  assert.deepEqual(createObject({}, '"1"^^<http://www.w3.org/2001/XMLSchema#integer>'), { type: 'literal', object: '"1"^^<http://www.w3.org/2001/XMLSchema#integer>', value: '1', dataType: 'http://www.w3.org/2001/XMLSchema#integer' });
  assert.deepEqual(createObject(context, '"Literal "with \'quotes\'" and @ and ^^"@fr-be^^rdf:langString'), { type: 'literal', object: '"Literal "with \'quotes\'" and @ and ^^"@fr-be^^rdf:langString', value: 'Literal "with \'quotes\'" and @ and ^^', language: 'fr-be' });
  // TODO - ensure that literal URIS are handled as literals and not objects
});
