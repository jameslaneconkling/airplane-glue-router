import { toPairs } from 'ramda';
import { ContextMap, AdapterAtom, AdapterError, AdapterRef, AdapterSentinel } from '../types';


export const defaultContext: ContextMap = {
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


export const isLiteral = (object: string) => /^".*"/.test(object);

// TODO - all of these should be their own data types, rather than string munging
// should the create functions throw errors if they are passed something that doesn't follow the uri/literal pattern?
export const createReference = (context: ContextMap, uri: string): AdapterRef => {
  for (const [prefix, namespace] of toPairs(context)) {
    if (new RegExp(`^${namespace}`).test(uri)) {
      const suffix = uri.replace(namespace, '');
      return {
        type: 'ref',
        uri: `${prefix}:${suffix}`
      };
    }
  }

  return { type: 'ref', uri };
};

const STRING_DATA_TYPES = new Set([
  'xsd:string', 'http://www.w3.org/2001/XMLSchema#string', 'rdf:langString', 'http://www.w3.org/1999/02/22-rdf-syntax-ns#langString', ''
]);

export const createAtom = (context: ContextMap, literal: string): AdapterAtom | AdapterError => {
  const matched = literal.match(/".*"/g);

  if (!matched) {
    // TODO - better error code + message
    return { type: 'error', value: { code: '500', message: `Adapter triples handler returned unhandleable object type: ${JSON.stringify(literal)}` } };
  }

  const atom: AdapterAtom = {
    type: 'atom',
    literal: matched[0].replace(/^"/, '').replace(/"$/, ''),
  };


  if (/^".*".*\^\^/.test(literal)) {
    const dataType = literal.replace(/^".*".*\^\^/g, '').replace(/@.*$/, '');

    if (!STRING_DATA_TYPES.has(dataType)) {
      atom.dataType = uri2Curie(context, dataType.replace(/^</, '').replace(/>$/, ''));
    }
  }

  if (/^".*".*@/.test(literal)) {
    atom.language = literal.replace(/^".*".*@/g, '').replace(/\^\^.*$/, '');
  }

  return atom;
};

export const createSentinel = (context: ContextMap, object: string): AdapterSentinel => isLiteral(object) ?
  createAtom(context, object) :
  createReference(context, object);

export const uri2Curie = (context: ContextMap, uri: string) => {
  const contextList = toPairs(context);

  for (const [prefix, uriNameSpace] of contextList) {
    if (new RegExp(`^${uriNameSpace}`).test(uri)) {
      return `${prefix}:${uri.replace(uriNameSpace, '')}`;
    }
  }

  return uri;
};

export const curie2URI = (context: ContextMap, curie: string) => {
  const idx = curie.indexOf(':');

  if (idx === -1) {
    return curie;
  }

  const [prefix, reference] = [curie.slice(0, idx), curie.slice(idx+1)];
  if (context[prefix]) {
    return context[prefix] + reference;
  }

  return curie;
};
