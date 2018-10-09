import createRouter from '../../src/falcor/index';
import memoryAdapter from '../../src/adapters/memoryAdapter';
import { defaultContext } from '../../src/utils/rdf';


export const testN3 = `
  @prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
  @prefix rdfs: <${defaultContext.rdfs}> .
  @prefix xsd: <${defaultContext.xsd}> .
  @prefix schema: <${defaultContext.schema}> .
  @prefix skos: <${defaultContext.skos}> .

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

export const setupTestRouter = (n3) => {
  const Router = createRouter({
    graphAdapters: [{
        key: 'test',
        label: 'Test',
        domains: [/^test/],
        adapter: memoryAdapter({ n3 }),
      }]
  });

  return new Router();
};

export const assertFailure = assert => err => {
  assert.fail(JSON.stringify(err));
  assert.end();
};
