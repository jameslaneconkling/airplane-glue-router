import { AdapterAtom, AdapterSentinel } from '../types';


export type ContextMap = {
  [key: string]: string
}

export const context: ContextMap = {
  rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
  rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
  xsd: 'http://www.w3.org/2001/XMLSchema#',
  owl: 'http://www.w3.org/2002/07/owl#',
  skos: 'http://www.w3.org/2004/02/skos/core#',
};

// schema: 'http://schema.org/',
// dbo: 'http://dbpedia.org/ontology/',
// dbp: 'http://dbpedia.org/property/',
// dbr: 'http://dbpedia.org/resource/',
// wd: 'http://www.wikidata.org/',

const STRING_DATA_TYPES = new Set([
  'xsd:string', '<http://www.w3.org/2001/XMLSchema#string>', 'rdf:langString', '<http://www.w3.org/1999/02/22-rdf-syntax-ns#langString>', ''
]);

export const parseObject = (object: string | null | undefined): AdapterSentinel => {
    // NULL LITERAL
    if (object === null || object === undefined) {
      return { $type: 'atom', value: null };
    }

    // NON_NULL LITERAL
    const literalValueMatch = object.match(/".*"/g);
    if (literalValueMatch) {
      const atom: AdapterAtom = {
        $type: 'atom',
        value: literalValueMatch[0].replace(/^"/, '').replace(/"$/, ''),
      };


      if (/^".*".*\^\^/.test(object)) {
        const dataType = object.replace(/^".*".*\^\^/g, '').replace(/@.*$/, '');
    
        if (!STRING_DATA_TYPES.has(dataType)) {
          atom.dataType = dataType;
        }
      }

      if (/^".*".*@/.test(object)) {
        atom.language = object.replace(/^".*".*@/g, '').replace(/\^\^.*$/, '');
      }

      return atom;
    }

    // URI REFERENCE
    return { $type: 'ref', value: object };
}
