const test = require('tape');
const { testDbFactory } = require('../../app/db');
const {
  setupFalcorTestModel,
  deserializeGraphJSON
} = require('../helpers');

const {
  context: { rdfs, xsd, schema, skos }
} = require('../../app/utils/rdf');

const seedN3 = `
  @prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
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
      schema:alternateName "Timothy"@en ;
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

  <data:sanfrancisco> a schema:Place ;
      rdfs:label "San Francisco"@en .

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

  schema:birthPlace
      a rdf:Property ;
      rdfs:label "birthPlace" .

  schema:gender
      a rdf:Property ;
      rdfs:label "gender" .

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


test('Type Collection: should return predicate literal', assert => {
  assert.plan(1);
  const model = setupFalcorTestModel(testDbFactory(seedN3));

  const expectedResponse = {
    collection: {
      'schema:Person': {
        0: {
          'rdfs:label': {
            0: 'James Conkling'
          }
        },
        1: {
          'rdfs:label': {
            0: 'Micah Conkling'
          }
        }
      }
    }
  };

  model.get(['collection', 'schema:Person', { to: 1 }, 'rdfs:label', 0])
    .subscribe(res => {
      assert.deepEqual(deserializeGraphJSON(res.json), expectedResponse);
    }, assertFailure(assert));
});


test('Type Collection: should return nulls for range that overshoots collection length', assert => {
  assert.plan(1);
  const model = setupFalcorTestModel(testDbFactory(seedN3));

  const expectedResponse = {
    collection: {
      'schema:Person': {
        4: {
          'rdfs:label': {
            0: 'Tim Conkling'
          }
        },
        5: null,
        6: null
      }
    }
  };

  model.get(['collection', 'schema:Person', { from: 4, to: 6 }, 'rdfs:label', 0])
    .subscribe(res => {
      assert.deepEqual(deserializeGraphJSON(res.json), expectedResponse);
    }, assertFailure(assert));
});


test('Type Collection: should return discontiguous ranges', assert => {
  assert.plan(1);
  const model = setupFalcorTestModel(testDbFactory(seedN3));

  const expectedResponse = {
    collection: {
      'schema:Person': {
        0: {
          'schema:alternateName': {
            0: 'JLC'
          }
        },
        1: {
          'schema:alternateName': {
            0: 'Mitzan'
          }
        },
        4: {
          'schema:alternateName': {
            0: 'Timothy'
          }
        },
        5: null
      }
    }
  };

  model.get(['collection', 'schema:Person', [{ to: 1 }, { from: 4, to: 5 }], 'schema:alternateName', 0])
    .subscribe(res => {
      assert.deepEqual(deserializeGraphJSON(res.json), expectedResponse);
    }, assertFailure(assert));
});


test('Type Collection: should return multiple predicate literals', assert => {
  assert.plan(1);
  const model = setupFalcorTestModel(testDbFactory(seedN3));

  const expectedResponse = {
    collection: {
      'schema:Person': {
        0: {
          'schema:alternateName': {
            0: 'JLC',
            1: 'Jamie'
          }
        },
        1: {
          'schema:alternateName': {
            0: 'Mitzan',
            1: null
          }
        },
        2: {
          'schema:alternateName': {
            0: null,
            1: null
          }
        }
      }
    }
  };

  model.get(['collection', 'schema:Person', { to: 2 }, 'schema:alternateName', { to: 1 }])
    .subscribe(res => {
      assert.deepEqual(deserializeGraphJSON(res.json), expectedResponse);
    }, assertFailure(assert));
});


test('Type Collection: should return nulls for collections that don\'t exist', assert => {
  assert.plan(1);
  const model = setupFalcorTestModel(testDbFactory(seedN3));

  const expectedResponse = {
    collection: {
      'schema:Person': {
        0: {
          'rdfs:label': {
            0: 'James Conkling'
          }
        }
      },
      'not:AType': null
    }
  };

  model.get(['collection', ['schema:Person', 'not:AType'], 0, 'rdfs:label', 0])
    .subscribe(res => {
      assert.deepEqual(deserializeGraphJSON(res.json), expectedResponse);
    }, assertFailure(assert));
});


test('Type Collection: should return the collection length', assert => {
  assert.plan(1);
  const model = setupFalcorTestModel(testDbFactory(seedN3));

  const expectedResponse = {
    collection: {
      'schema:Person': {
        0: {
          'rdfs:label': {
            0: 'James Conkling'
          }
        },
        length: 5
      }
    }
  };

  model.get(
    ['collection', 'schema:Person', 0, 'rdfs:label', 0],
    ['collection', 'schema:Person', 'length']
  )
    .subscribe(res => {
      assert.deepEqual(deserializeGraphJSON(res.json), expectedResponse);
    }, assertFailure(assert));
});


test('Type Collection Ontology: should return ontology for type collection', assert => {
  assert.plan(1);
  const seedN3 = `
    @prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
    @prefix rdfs: <${rdfs}> .
    @prefix schema: <${schema}> .

    <data:james> a schema:Person ;
        schema:alternateName "Jamie"@en .

    <data:micah> a schema:Person ;
        schema:gender "Male"@en .

    rdf:type a rdf:Property ;
        rdfs:label 'Type' .

    schema:alternateName a rdf:Property ;
        rdfs:label "alternateName" .

    schema:gender a rdf:Property ;
        rdfs:label "gender" .
  `;
  const model = setupFalcorTestModel(testDbFactory(seedN3));

  const expectedResponse = {
    collection: {
      'schema:Person': {
        ontology: {
          0: {
            count: 1,
            predicate: {
              'rdfs:label': {
                0: 'alternateName'
              }
            }
          },
          1: {
            count: 2,
            predicate: {
              'rdfs:label': {
                0: 'Type'
              }
            }
          },
          2: {
            count: 1,
            predicate: {
              'rdfs:label': {
                0: 'gender'
              }
            }
          },
          // 3: null // TODO - non-existent ontology predicates should return null
          length: 3
        }
      }
    }
  };

  model.get(
    ['collection', 'schema:Person', 'ontology', { to: 3 }, 'count'],
    ['collection', 'schema:Person', 'ontology', { to: 3 }, 'predicate', 'rdfs:label', 0],
    ['collection', 'schema:Person', 'ontology', 'length']
  )
    .subscribe(res => {
      assert.deepEqual(deserializeGraphJSON(res.json), expectedResponse);
    }, assertFailure(assert));
});
