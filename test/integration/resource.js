const test = require('tape');
const request = require('supertest');
const appFactory = require('../../app/app');
const {
  setupFalcorTestModel,
  setupTestRepos,
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


test('Resource: should return object literals', assert => {
  assert.plan(1);
  const model = setupFalcorTestModel(seedN3);

  const expectedResponse = {
    resource: {
      'data:james': {
        'schema:alternateName': {
          0: 'JLC',
          1: 'Jamie'
        }
      },
      'data:micah': {
        'schema:alternateName': {
          0: 'Mitzan',
          1: null
        }
      }
    }
  };

  model.get(['resource', ['data:james', 'data:micah'], 'schema:alternateName', { to: 1 }])
    .subscribe(res => {
      assert.deepEqual(deserializeGraphJSON(res.json), expectedResponse);
    }, assertFailure(assert));
});


test('Resource: should return objects relationships', assert => {
  assert.plan(1);
  const model = setupFalcorTestModel(seedN3);

  const expectedResponse = {
    resource: {
      'data:james': {
        'schema:sibling': {
          0: {
            'rdfs:label': { 0: 'Micah Conkling' }
          },
          1: {
            'rdfs:label': { 0: 'Parker Taylor' }
          },
          length: 4
        },
        'schema:alternateName': {
          0: 'JLC',
          1: 'Jamie',
          length: 4
        }
      }
    }
  };

  model.get(
    ['resource', 'data:james', 'schema:sibling', [{ to: 1 }, 'length'], 'rdfs:label', 0],
    ['resource', 'data:james', 'schema:alternateName', [{ to: 1 }, 'length']]
  )
    .subscribe(res => {
      assert.deepEqual(deserializeGraphJSON(res.json), expectedResponse);
    }, assertFailure(assert));
});


test('Resource: should return uri', assert => {
  assert.plan(1);
  const model = setupFalcorTestModel(seedN3);

  const expectedResponse = {
    resource: {
      'data:james': {
        'schema:sibling': {
          0: {
            'uri': 'data:micah'
          },
          1: {
            'uri': 'data:parker'
          },
        },
      }
    }
  };

  model.get(['resource', 'data:james', 'schema:sibling', { to: 1 }, 'uri'])
    .subscribe(res => {
      assert.deepEqual(deserializeGraphJSON(res.json), expectedResponse);
    }, assertFailure(assert));
});


test.skip('Resource: should allow requests to use uris in addition to curies', assert => {
  assert.plan(1);
  const seedN3 = `
    @prefix rdf: <${rdf}> .
    @prefix rdfs: <${rdfs}> .
    @prefix schema: <${schema}> .
    @prefix dbo: <${dbo}> .

    <http://www.mydomain.com/james> a schema:Person ;
        schema:birthPlace dbo:portland .

    dbo:portland rdfs:label "Portland" .
  `;
  const app = appFactory(setupTestRepos(seedN3));
  const paths = [['resource', 'http://www.mydomain.com/james', `${schema}birthPlace`, 0, `${rdfs}label`, 0]];

  const expectedResponse = {
    resource: {
      'http://www.mydomain.com/james': {
        [`${schema}birthPlace`]: {
          0: { $type: 'ref', value: ['resource', 'dbo:portland'] }
        }
      },
      'dbo:portland': {
        [`${rdfs}label`]: {
          0: { $type: 'atom', value: 'Portland' }
        }
      }
    }
  };

  request(app)
    .get(`/api/model.json?method=get&paths=${encodeURIComponent(JSON.stringify(paths))}`)
    .end((err, res) => {
      if (err) {
        assert.fail(err);
      }

      assert.deepEqual(res.body.jsonGraph, expectedResponse);
    });
});


test('Resource: should return boxed values for literals', assert => {
  assert.plan(1);
  const model = setupFalcorTestModel(seedN3).boxValues();

  const expectedResponse = {
    resource: {
      'data:james': {
        'schema:alternateName': {
          0: $atom('JLC'),
          1: $atom('Jamie'),
        },
        'schema:birthDate': {
          0: $atom('1988-05-02', { $dataType: 'xsd:date' } ),
          1: $atom(null),
        }
      }
    }
  };

  model.get(['resource', 'data:james', ['schema:alternateName', 'schema:birthDate'], { to: 1 }])
    .subscribe(res => {
      assert.deepEqual(deserializeGraphJSON(res.json), expectedResponse);
    }, assertFailure(assert));
});


test('Resource: should return discontiguous ranges for predicate literals', assert => {
  assert.plan(1);
  const model = setupFalcorTestModel(seedN3);

  const expectedResponse = {
    resource: {
      'data:james': {
        'schema:alternateName': {
          0: 'JLC',
          1: 'Jamie',
          3: 'Santiago',
          4: null
        }
      },
    }
  };

  model.get(['resource', 'data:james', 'schema:alternateName', [{ to: 1 }, { from: 3, to: 4 }]])
    .subscribe(res => {
      assert.deepEqual(deserializeGraphJSON(res.json), expectedResponse);
    }, assertFailure(assert));
});


test('Resource: should return the predicate value count', assert => {
  assert.plan(1);
  const model = setupFalcorTestModel(seedN3);

  const expectedResponse = {
    resource: {
      'data:james': {
        'schema:alternateName': {
          0: 'JLC',
          1: 'Jamie',
          length: 4
        }
      }
    }
  };

  model.get(['resource', 'data:james', 'schema:alternateName', [{ to: 1 }, 'length']])
    .subscribe(res => {
      assert.deepEqual(deserializeGraphJSON(res.json), expectedResponse);
    }, assertFailure(assert));
});


test('Resource: should treat predicates as resources', assert => {
  assert.plan(1);
  const model = setupFalcorTestModel(seedN3);

  const expectedResponse = {
    resource: {
      'schema:alternateName': {
        'skos:prefLabel': {
          0: 'Alternative Name',
          1: null
        },
        'rdfs:comment': {
          0: 'An alias for the item.',
          1: null
        }
      }
    }
  };

  model.get(['resource', 'schema:alternateName', ['skos:prefLabel', 'rdfs:comment'], { to: 1 }])
    .subscribe(res => {
      assert.deepEqual(deserializeGraphJSON(res.json), expectedResponse);
    }, assertFailure(assert));
});


// Is this the correct behavior
test.skip('Resource: should return nulls for resources that don\'t exist', assert => {
  assert.plan(1);
  const model = setupFalcorTestModel(seedN3);

  const expectedResponse = {
    resource: {
      'data:tim': {
        'rdfs:label': {
          0: 'Tim Conkling'
        }
      },
      'data:xyz': null,
      'data:abc': null
    }
  };

  model.get(['resource', ['data:tim', 'data:xyz', 'data:abc'], 'rdfs:label', 0])
    .subscribe(res => {
      assert.deepEqual(deserializeGraphJSON(res.json), expectedResponse);
    }, assertFailure(assert));
});


// Is this the correct behavior
test.skip('Resource: should return nulls for predicates that don\'t exist', assert => {
  assert.plan(1);
  const model = setupFalcorTestModel(seedN3);

  const expectedResponse = {
    resource: {
      'data:tim': {
        'rdfs:label': {
          0: 'Tim Conkling'
        },
        'not:aPredicate': null
      }
    }
  };

  model.get(['resource', 'data:tim', ['rdfs:label', 'not:aPredicate'], 0])
    .subscribe(res => {
      assert.deepEqual(deserializeGraphJSON(res.json), expectedResponse);
    }, assertFailure(assert));
});


test.skip('Resource Ontology: should return ontology for resources', assert => {
  assert.plan(1);
  const seedN3 = `
    @prefix rdf: <${rdf}> .
    @prefix rdfs: <${rdfs}> .
    @prefix schema: <${schema}> .

    <data:tim> a schema:Person ;
        schema:sibling <data:sam> ;
        schema:sibling <data:james> ;
        schema:sibling <data:parker> .

    schema:sibling
        rdfs:label "sibling" .

    rdf:type a rdf:Property ;
        rdfs:label "type"  .
  `;
  const model = setupFalcorTestModel(seedN3);

  const expectedResponse = {
    resource: {
      'data:tim': {
        ontology: {
          0: {
            predicate: {
              'rdfs:label': {
                0: 'sibling'
              }
            },
            count: 3
          },
          1: {
            predicate: {
              'rdfs:label': {
                0: 'type'
              }
            },
            count: 1
          },
          // 3: null // TODO - non-existent ontology predicates should return null
          length: 2
        }
      }
    }
  };

  model.get(
    ['resource', 'data:tim', 'ontology', { to: 3 }, 'count'],
    ['resource', 'data:tim', 'ontology', { to: 3 }, 'predicate', 'rdfs:label', 0],
    ['resource', 'data:tim', 'ontology', 'length']
  )
    .subscribe(res => {
      assert.deepEqual(deserializeGraphJSON(res.json), expectedResponse);
    }, assertFailure(assert));
});
