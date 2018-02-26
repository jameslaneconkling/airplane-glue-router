const test = require('tape');
const request = require('supertest');
const { testDbFactory } = require('../../app/db');
const appFactory = require('../../app/app');
const {
  setupFalcorTestModel,
  deserializeGraphJSON
} = require('../helpers');
const {
  $atom,
  $ref
} = require('../../app/utils/falcor');
const {
  context: {
    rdf,
    rdfs,
    xsd,
    schema,
    skos,
    dbo
  }
} = require('../../app/utils/rdf');

const seedN3 = `
  @prefix rdf: <${rdf}> .
  @prefix rdfs: <${rdfs}> .
  @prefix xsd: <${xsd}> .
  @prefix schema: <${schema}> .
  @prefix skos: <${skos}> .

  <data:james> a schema:Person ;
      rdfs:label "James Conkling"@en ;
      schema:alternateName "JLC"@en ;
      schema:alternateName "Jamie"@en ;
      schema:alternateName "Jimmie"@en ;
      schema:alternateName "Santiago"@en ;
      schema:birthDate "1988-05-02"^^xsd:date ;
      schema:birthPlace <http://www.wikidata.org/wiki/Q60> ;
      schema:gender "Male"@en ;
      schema:sibling <data:micah> ;
      schema:sibling <data:sam> ;
      schema:sibling <data:tim> ;
      schema:sibling <data:parker> .

  <data:micah> a schema:Person ;
      rdfs:label "Micah Conkling"@en ;
      schema:alternateName "Mitzan"@en ;
      schema:birthDate "1988-05-02"^^xsd:date ;
      schema:birthPlace <http://www.wikidata.org/wiki/Q60> ;
      schema:gender "Male"@en ;
      schema:sibling <data:james> ;
      schema:sibling <data:sam> ;
      schema:sibling <data:tim> ;
      schema:sibling <data:parker> .

  <data:sam> a schema:Person ;
      rdfs:label "Sam Conkling"@en ;
      schema:birthDate "1984-01-22"^^xsd:date ;
      schema:birthPlace <http://www.wikidata.org/wiki/Q60> ;
      schema:gender "Male"@en ;
      schema:sibling <data:micah> ;
      schema:sibling <data:james> ;
      schema:sibling <data:tim> ;
      schema:sibling <data:parker> .

  <data:tim> a schema:Person ;
      rdfs:label "Tim Conkling"@en ;
      schema:birthDate "1982-05-07"^^xsd:date ;
      schema:birthPlace <http://www.wikidata.org/wiki/Q60> ;
      schema:gender "Male"@en ;
      schema:sibling <data:micah> ;
      schema:sibling <data:sam> ;
      schema:sibling <data:james> ;
      schema:sibling <data:parker> .

  <data:parker> a schema:Person ;
      rdfs:label "Parker Taylor"@en ;
      schema:birthDate "1987-10-07"^^xsd:date ;
      schema:birthPlace <http://www.wikidata.org/wiki/Q60> ;
      schema:gender "Male"@en ;
      schema:sibling <data:micah> ;
      schema:sibling <data:sam> ;
      schema:sibling <data:tim> ;
      schema:sibling <data:james> .

  rdf:type a rdf:Property ;
        rdfs:isDefinedBy <http://www.w3.org/1999/02/22-rdf-syntax-ns#> ;
        rdfs:label "type" ;
        rdfs:comment "The subject is an instance of a class." ;
        rdfs:range rdfs:Class ;
        rdfs:domain rdfs:Resource .

  schema:alternateName
      schema:domainIncludes schema:Thing ;
      schema:rangeIncludes schema:Text ;
      a rdf:Property ;
      rdfs:comment "An alias for the item." ;
      rdfs:label "alternateName" .

  schema:alternateName
      skos:prefLabel "Alternative Name"@en .

  schema:birthDate
      schema:domainIncludes schema:Person ;
      schema:rangeIncludes schema:Date ;
      a rdf:Property ;
      rdfs:comment "Date of birth." ;
      rdfs:label "birthDate" .

  schema:sibling
      schema:domainIncludes schema:Person ;
      schema:rangeIncludes schema:Person ;
      a rdf:Property ;
      rdfs:comment "A sibling of this person." ;
      rdfs:label "sibling" .
`;


const assertFailure = assert => err => {
  assert.fail(JSON.stringify(err));
  assert.end();
};


test('Inverse OP: should return subject in ?PO GET for resource object', assert => {
  assert.plan(1);
  const model = setupFalcorTestModel(testDbFactory(seedN3));

  const expectedResponse = {
    inverse: {
      'http://www.wikidata.org/wiki/Q60': {
        'schema:birthPlace': {
          3: {
            'rdfs:label': 'Sam Conkling'
          },
          4: {
            'rdfs:label': 'Tim Conkling'
          },
          5: null
        }
      }
    }
  };

  model.get(['inverse', 'http://www.wikidata.org/wiki/Q60', 'schema:birthPlace', { from: 3, to: 5 }, 'rdfs:label'])
    .subscribe(res => {
      assert.deepEqual(deserializeGraphJSON(res.json), expectedResponse);
    }, assertFailure(assert));
});

test('Inverse OP: should return subject in ?PO GET for literal object', assert => {
  assert.plan(1);
  const model = setupFalcorTestModel(testDbFactory(seedN3));

  const expectedResponse = {
    inverse: {
      '"Santiago"': {
        'schema:alternateName': {
          0: {
            'rdfs:label': 'James Conkling'
          },
          1: null
        }
      }
    }
  };

  model.get(['inverse', '"Santiago"', 'schema:alternateName', { from: 0, to: 1 }, 'rdfs:label'])
    .subscribe(res => {
      assert.deepEqual(deserializeGraphJSON(res.json), expectedResponse);
    }, assertFailure(assert));
});


test('Inverse OP: should return singleton subject in ?PO GET', assert => {
  assert.plan(1);
  const model = setupFalcorTestModel(testDbFactory(seedN3));

  const expectedResponse = {
    inverse: {
      '"Alternative Name"': {
        'skos:prefLabel': {
          'uri': 'schema:alternateName'
        }
      }
    }
  };

  model.get(['inverse', '"Alternative Name"', 'skos:prefLabel', 'uri'])
    .subscribe(res => {
      assert.deepEqual(deserializeGraphJSON(res.json), expectedResponse);
    }, assertFailure(assert));
});
