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


const isNull = (object: any): object is null | undefined => object === null || object === undefined;

const isLiteral = (object: string) => /^".*"/.test(object);

const isUri = (object: string) => /^<.*>$/.test(object);

const isCurie = (object: string) => object.indexOf(':') !== -1;

const createUriReference = (context: ContextMap, uri: string): AdapterRef => {
  for (const [prefix, namespace] of toPairs(context)) {
    if (new RegExp(`^${namespace}`).test(uri)) {
      return { type: 'ref', uri: `${prefix}:${uri.replace(namespace, '')}` };
    }
  }

  return { type: 'ref', uri };
};

const createCurieReference = (curie: string): AdapterRef => ({
  type: 'ref',
  uri: curie
});

const createError = (object: string): AdapterError => ({
  type: 'error',
  value: {
    code: '500',
    message: `Adapter triples handler returned unhandleable object type: ${JSON.stringify(object)}`
  }
});

const STRING_DATA_TYPES = new Set([
  'xsd:string', '<http://www.w3.org/2001/XMLSchema#string>', 'rdf:langString', '<http://www.w3.org/1999/02/22-rdf-syntax-ns#langString>', ''
]);

const createAtom = (context: ContextMap, literal: string): AdapterAtom | AdapterError => {
  const matched = literal.match(/".*"/g);

  if (!matched) {
    return createError(literal);
  }

  const atom: AdapterAtom = {
    type: 'atom',
    literal: matched[0].replace(/^"/, '').replace(/"$/, ''),
  };


  if (/^".*".*\^\^/.test(literal)) {
    const dataType = literal.replace(/^".*".*\^\^/g, '').replace(/@.*$/, '');

    if (!STRING_DATA_TYPES.has(dataType)) {
      atom.dataType = uri2Curie(context, dataType);
    }
  }

  if (/^".*".*@/.test(literal)) {
    atom.language = literal.replace(/^".*".*@/g, '').replace(/\^\^.*$/, '');
  }

  return atom;
};

/*
this only operates over the objects received from the adapter
a more flexible abstraction would cover: uris/curies from graph, uris from adapter, literals from graph/adapter
*/
export const createObjectSentinel = (context: ContextMap, object: string | null | undefined): AdapterSentinel => {
  if (isNull(object)) {
    return { type: 'atom', literal: null };
  } else if (isLiteral(object)) {
    return createAtom(context, object);
  } else if (isUri(object)) {
    return createUriReference(context, object);
  } else if (isCurie(object)) {
    return createCurieReference(object);
  }

  return createError(object);
};

export const uri2Curie = (context: ContextMap, uri: string) => {
  if (!isUri(uri)) {
    return uri;
  }
  
  const contextList = toPairs(context);

  for (const [prefix, uriNameSpace] of contextList) {
    if (new RegExp(`^<${uriNameSpace}`).test(uri)) {
      return `${prefix}:${uri.replace(`<${uriNameSpace}`, '').replace('>', '')}`;
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
    return `<${context[prefix] + reference}>`;
  }

  return curie;
};


export const internalizeUri = (context: ContextMap, uriOrLiteral: string) => isLiteral(uriOrLiteral) ? uriOrLiteral : uri2Curie(context, `<${uriOrLiteral}>`);

export const externalizeUri = (context: ContextMap, uriOrLiteral: string) => isLiteral(uriOrLiteral) ?
  uriOrLiteral :
  curie2URI(context, uriOrLiteral).replace(/^</, '').replace(/>$/, '');
