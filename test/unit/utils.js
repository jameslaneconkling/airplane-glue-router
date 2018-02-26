const test = require('tape') ;
const {
  uri2curie,
  curie2uri
} = require('../../app/utils/rdf');
const context = {
  xsd: 'http://www.w3.org/2001/XMLSchema#',
  schema: 'http://schema.org/'
};


test('RDF util: should convert URIs to CURIEs', assert => {
  assert.plan(3);

  assert.equal(uri2curie(context, 'http://www.w3.org/2001/XMLSchema#string'), 'xsd:string', 'converts URI w/ known prefix to CURIE');

  assert.equal(uri2curie(context, 'http://somedomain.com/resource/1'), 'http://somedomain.com/resource/1', 'preserves URI if prefix is unknown');

  assert.equal(uri2curie(context, 'xsd:string'), 'xsd:string', 'doesn\'t mangle output when passed CURIE');

  // see: https://www.w3.org/blog/2016/05/https-and-the-semantic-weblinked-data/
  // assert.equal(uri2curie(context, 'https://www.w3.org/2001/XMLSchema#string'), 'xsd:string', 'works w/ https scheme');
});

test('RDF util: should convert CURIEs to URIs', assert => {
  assert.plan(3);

  assert.equal(curie2uri(context, 'xsd:string'), 'http://www.w3.org/2001/XMLSchema#string', 'converts CURIE w/ known prefix to URI');

  assert.equal(curie2uri(context, 'abc:resource/1'), 'abc:resource/1', 'preserves CURIE if prefix is unknown');

  assert.equal(curie2uri(context, 'http://www.w3.org/2001/XMLSchema#string'), 'http://www.w3.org/2001/XMLSchema#string', 'doesn\'t mangle output when passed URI');

  // see: https://www.w3.org/blog/2016/05/https-and-the-semantic-weblinked-data/
  // assert.equal(curie2uri(context, 'https://www.w3.org/2001/XMLSchema#string'), 'xsd:string', 'works w/ https scheme');
});
