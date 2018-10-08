import { toPairs } from 'ramda';
import { ContextMap, URI, Literal } from '../types';


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


// TODO - all of these should be their own data types, rather than string munging
// should the create functions throw errors if they are passed something that doesn't follow the uri/literal pattern?
export const createUri = (context: ContextMap, uri: string): URI => {
  if (isCurie(uri)) {
    const [prefix, suffix] = uri.split(':');
    return {
      value: `${context[prefix]}${suffix}`,
      prefix,
      suffix,
      curie: uri
    };
  }

  const contextList = toPairs(context);

  for (const [prefix, namespace] of contextList) {
    if (new RegExp(`^${namespace}`).test(uri)) {
      const suffix = uri.replace(namespace, '');
      return {
        value: uri,
        prefix,
        suffix,
        curie: `${prefix}:${suffix}`
      };
    }
  }

  return {
    value: uri
  };
};

export const createLiteral = (context: ContextMap, literal: string): Literal => {
  return {
    literal,
    value: literal.replace(/"\^\^.*$/, '') // should this attempt to parse ints/floats/booleans?
      .replace(/"(@[a-z]+)?$/, '')
      .replace(/^"/, ''),
    language: /".*"@/.test(literal) ?
      literal.replace(/^".*"@/, '') :
      undefined,
    dataType: /^".*"\^\^/.test(literal) ?
      literal.replace(/^".*"\^\^/, '') :
      `${context.xsd}string`
  };
};

export const isLiteral = (literal: string) => /^".*"$/.test(literal);


export const getValue = (object: string) => object
  .replace(/"\^\^.*$/, '')
  .replace(/"(@[a-z]+)?$/, '')
  .replace(/^"/, '');


export const getType = (context: ContextMap, object: string) => {
  if (/^".*"\^\^/.test(object)) {
    // non-string-literal type
    return object.replace(/^".*"\^\^/, '');
  } else if (/^".*"/.test(object)) {
    // string literal type
    return `${context.xsd}string`;
  }

  // relationship type
  return 'relationship';
};


export const getLanguage = (object: string) => {
  return /".*"@/.test(object) ?
    object.replace(/^".*"@/, '') :
    undefined
};

export const isUri = (url: string) => /^https?:\/\//.test(url);

export const isCurie = (uri: string) => !isUri(uri) && !isLiteral(uri);

export const splitCurie = (curie: string) => curie.split(':');

export const uri2curie = (context: ContextMap, uri: string) => {
  const contextList = toPairs(context);

  for (const [prefix, uriNameSpace] of contextList) {
    if (new RegExp(`^${uriNameSpace}`).test(uri)) {
      return `${prefix}:${uri.replace(uriNameSpace, '')}`;
    }
  }

  return uri;
};

export const curie2uri = (context: ContextMap, uri: string) => {
  if (isCurie(uri)) {
    const [prefix, reference] = splitCurie(uri);
    if (context[prefix]) {
      return context[prefix] + reference;
    }
  }

  return uri;
};
