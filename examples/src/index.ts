import { readFileSync } from 'fs';
import express from 'express';
import morgan from 'morgan';
import { dataSourceRoute } from 'falcor-express';
import { createRouter, createGraph, createHandlerAdapter, MemoryGraphAdapter } from '../../src';
import { notEqual } from 'assert';


const PORT = process.env.PORT || 3000;

const N3 = process.env.N3;

notEqual(N3, undefined, 'expected N3 environment variable to provide a the path to a .n3 file');


const rdf = `
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix skos: <http://www.w3.org/2004/02/skos/core#> .
rdf:type a rdf:Property ;
    rdfs:isDefinedBy <http://www.w3.org/1999/02/22-rdf-syntax-ns#> ;
    rdfs:comment "The subject is an instance of a class." ;
    rdfs:range rdfs:Class ;
    rdfs:domain rdfs:Resource ;
    skos:prefLabel "Type" .
`;
const skos = `
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix skos: <http://www.w3.org/2004/02/skos/core#> .
skos:prefLabel a rdf:Property ;
    skos:prefLabel "Label"@en .
`;


const app = express();

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

const JunoGraphRouter = createRouter();


Promise.all([
  MemoryGraphAdapter.createAdapter(readFileSync(N3 as string, 'utf8')),
  MemoryGraphAdapter.createAdapter(rdf),
  MemoryGraphAdapter.createAdapter(skos)
]).then(([trumpworldGraph, rdfGraph, skosGraph]) => {
  app.use('/api/model.json', dataSourceRoute(() => (
    new JunoGraphRouter([
      createGraph(
        createHandlerAdapter(new MemoryGraphAdapter(trumpworldGraph, { user: 'test-user' })),
        {
          key: 'trump-world',
          label: 'Trump World',
          domains: [/^http:\/\/juno\.network\/trumpworld/],
        }
      ),
      createGraph(
        createHandlerAdapter(new MemoryGraphAdapter(rdfGraph, { user: 'test-user' })),
        {
          key: 'rdf',
          domains: [/^rdf:/],
        }
      ),
      createGraph(
        createHandlerAdapter(new MemoryGraphAdapter(skosGraph, { user: 'test-user' })),
        {
          key: 'skos',
          domains: [/^skos:/],
        }
      )
    ])
  )));

  // Error handling
  // app.use((err, req, res, next) => {
  //   req.status(500).send({
  //     name: err.name,
  //     message: err.message,
  //     stack: err.stack
  //   });
  // });


  app.listen(PORT, () => {
    console.log(`listening on port ${PORT}`);
  });
});
