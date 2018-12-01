import { createRouter, MemoryGraphAdapter } from '../../src';
import { createGraph, createHandlerAdapter } from '../../src/adapters/adapter';


export const context = {
  rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
  rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
  xsd: 'http://www.w3.org/2001/XMLSchema#',
  owl: 'http://www.w3.org/2002/07/owl#',
  skos: 'http://www.w3.org/2004/02/skos/core#',
  schema: 'http://schema.org/',
  test: 'http://junonetwork.com/test/',
};

export const testN3 = `
  @prefix rdf: <${context.rdf}> .
  @prefix rdfs: <${context.rdfs}> .
  @prefix xsd: <${context.xsd}> .
  @prefix skos: <${context.skos}> .
  @prefix schema: <${context.schema}> .
  @prefix test: <${context.test}> .

  test:james a schema:Person ;
    rdfs:label "James Conkling"@en ;
    schema:alternateName "JLC"@en ;
    schema:alternateName "Jamie"@en ;
    schema:alternateName "Jimmie"@en ;
    schema:alternateName "Santiago"@es ;
    schema:birthDate "1988-05-02"^^xsd:date ;
    schema:birthPlace <http://www.wikidata.org/wiki/Q60> ;
    schema:gender "Male"@en ;
    schema:sibling test:micah ;
    schema:sibling test:sam ;
    schema:sibling test:tim ;
    schema:sibling test:parker .

  test:micah a schema:Person ;
    rdfs:label "Micah Conkling"@en ;
    schema:alternateName "Mitzan"@en ;
    schema:birthDate "1988-05-02"^^xsd:date ;
    schema:birthPlace <http://www.wikidata.org/wiki/Q60> ;
    schema:gender "Male"@en ;
    schema:sibling test:james ;
    schema:sibling test:sam ;
    schema:sibling test:tim ;
    schema:sibling test:parker .

  test:sam a schema:Person ;
    rdfs:label "Sam Conkling"@en ;
    schema:birthDate "1984-01-22"^^xsd:date ;
    schema:birthPlace <http://www.wikidata.org/wiki/Q60> ;
    schema:gender "Male"@en ;
    schema:sibling test:micah ;
    schema:sibling test:james ;
    schema:sibling test:tim ;
    schema:sibling test:parker .

  test:tim a schema:Person ;
    rdfs:label "Tim Conkling"@en ;
    schema:alternateName "Timothy"@en ;
    schema:birthDate "1982-05-07"^^xsd:date ;
    schema:birthPlace <http://www.wikidata.org/wiki/Q60> ;
    schema:gender "Male"@en ;
    schema:sibling test:micah ;
    schema:sibling test:sam ;
    schema:sibling test:james ;
    schema:sibling test:parker .

  test:parker a schema:Person ;
    rdfs:label "Parker Taylor"@en ;
    schema:birthDate "1987-10-07"^^xsd:date ;
    schema:birthPlace <http://www.wikidata.org/wiki/Q60> ;
    schema:gender "Male"@en ;
    schema:sibling test:micah ;
    schema:sibling test:sam ;
    schema:sibling test:tim ;
    schema:sibling test:james .

  <http://www.wikidata.org/wiki/Q60> a schema:Place ;
    rdfs:label "Portland, ME"@en .

  test:sanfrancisco a schema:Place ;
    rdfs:label "San Francisco"@en .

  schema:alternateName
    schema:domainIncludes schema:Thing ;
    schema:rangeIncludes schema:Text ;
    a rdf:Property ;
    rdfs:comment "An alias for the item." ;
    rdfs:label "alternateName" .

  schema:alternateName
    skos:prefLabel "Alternative Name"@en ;
    rdfs:domain schema:Person, schema:Place ;
    rdfs:range xsd:string .

  schema:birthDate
    schema:domainIncludes schema:Person ;
    schema:rangeIncludes schema:Date ;
    a rdf:Property ;
    rdfs:comment "Date of birth." ;
    rdfs:label "birthDate" ;
    rdfs:domain schema:Person ;
    rdfs:range xsd:date .

  schema:birthPlace
    a rdf:Property ;
    rdfs:label "birthPlace" ;
    rdfs:domain schema:Person ;
    rdfs:range schema:Place .

  schema:gender
    a rdf:Property ;
    rdfs:label "gender" ;
    rdfs:domain schema:Person ;
    rdfs:range xsd:string .

  schema:sibling
    schema:domainIncludes schema:Person ;
    schema:rangeIncludes schema:Person ;
    a rdf:Property ;
    rdfs:comment "A sibling of this person." ;
    rdfs:label "sibling" ;
    rdfs:domain schema:Person ;
    rdfs:range schema:Person .

  schema:Person a rdfs:Class ;
    skos:prefLabel "Person"@en .

  schema:Place a rdfs:Class ;
    skos:prefLabel "Place" .
`;

export const schemaN3 = `
  @prefix rdf: <${context.rdf}> .
  @prefix rdfs: <${context.rdfs}> .
  @prefix skos: <${context.skos}> .
  @prefix schema: <${context.schema}> .

  schema:alternateName
    schema:domainIncludes schema:Thing ;
    schema:rangeIncludes schema:Text ;
    skos:prefLabel "Alternative Name"@en ;
    a rdf:Property ;
    rdfs:comment "An alias for the item." ;
    rdfs:label "alternateName" .
    

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

export const setupTestRouter = async (n3) => {
  const JunoGraphRouter = createRouter();

  return new JunoGraphRouter([
    createGraph(
      createHandlerAdapter(new MemoryGraphAdapter(await MemoryGraphAdapter.createAdapter(n3), { user: 'test-user' })),
      {
        key: 'test',
        label: 'Test',
        domains: [/^http:\/\/junonetwork\.com\/test/, /^http:\/\/schema\.org/, /^http:\/\/www\.wikidata\.org\/wiki/],
      }
    ),
  ]);
};

export const assertFailure = assert => err => {
  assert.fail(JSON.stringify(err));
};
