import { toPairs } from 'ramda';
import { ContextMap, URI, Literal, Error } from '../types';


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
export const createUri = (context: ContextMap, uri: string): URI => {
  // Don't try to expand external curies
  // if (isCurie(uri)) {
  //   const [prefix, suffix] = uri.split(':');

  //   if (context[prefix]) {
  //     return {
  //       type: 'uri',
  //       object: uri,
  //       value: `${context[prefix]}${suffix}`,
  //       prefix,
  //       suffix,
  //       curie: uri
  //     };
  //   }

  //   return {
  //     type: 'uri',
  //     object: uri,
  //     value: uri
  //   };
  // }

  for (const [prefix, namespace] of toPairs(context)) {
    if (new RegExp(`^${namespace}`).test(uri)) {
      const suffix = uri.replace(namespace, '');
      return {
        type: 'uri',
        object: uri,
        prefix,
        suffix,
        curie: `${prefix}:${suffix}`
      };
    }
  }

  return {
    type: 'uri',
    object: uri,
  };
};

const STRING_DATA_TYPES = new Set([
  'xsd:string', 'http://www.w3.org/2001/XMLSchema#string', 'rdf:langString', 'http://www.w3.org/1999/02/22-rdf-syntax-ns#langString', ''
]);

export const createLiteral = (context: ContextMap, literal: string): Literal | Error => {
  const matched = literal.match(/".*"/g);

  if (!matched) {
    return {
      type: 'error',
      object: literal,
    }
  }

  const literalType: Literal = {
    type: 'literal',
    object: literal,
    value: matched[0].replace(/^"/, '').replace(/"$/, ''),
  };

  if (/^".*".*@/.test(literal)) {
    literalType.language = literal.replace(/^".*".*@/g, '').replace(/\^\^.*$/, '');
  }

  if (/^".*".*\^\^/.test(literal)) {
    const dataType = literal.replace(/^".*".*\^\^/g, '').replace(/@.*$/, '');

    if (!STRING_DATA_TYPES.has(dataType)) {
      literalType.dataType = uri2Curie(context, dataType.replace(/^</, '').replace(/>$/, ''));
    }
  }

  return literalType;
};

export const createObject = (context: ContextMap, object: string) => isLiteral(object) ?
  createLiteral(context, object) :
  createUri(context, object);

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
