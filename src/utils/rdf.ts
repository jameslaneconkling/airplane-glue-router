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


export const isLiteral = (object: string) => /^".*"(@.+)?(\^\^.+)?$/.test(object);

export const isURI = (url: string) => /^https?:\/\//.test(url);

export const isCurie = (uri: string) => !isURI(uri) && !isLiteral(uri);

// TODO - all of these should be their own data types, rather than string munging
// should the create functions throw errors if they are passed something that doesn't follow the uri/literal pattern?
export const createUri = (context: ContextMap, uri: string): URI => {
  if (isCurie(uri)) {
    const [prefix, suffix] = uri.split(':');

    if (context[prefix]) {
      return {
        type: 'uri',
        value: `${context[prefix]}${suffix}`,
        prefix,
        suffix,
        curie: uri
      };
    }

    return {
      type: 'uri',
      value: uri
    };
  }

  for (const [prefix, namespace] of toPairs(context)) {
    if (new RegExp(`^${namespace}`).test(uri)) {
      const suffix = uri.replace(namespace, '');
      return {
        type: 'uri',
        value: uri,
        prefix,
        suffix,
        curie: `${prefix}:${suffix}`
      };
    }
  }

  return {
    type: 'uri',
    value: uri
  };
};

const STRING_DATA_TYPES = new Set([
  'xsd:string', 'http://www.w3.org/2001/XMLSchema#string', 'rdf:langString', 'http://www.w3.org/1999/02/22-rdf-syntax-ns#langString', ''
]);
export const createLiteral = (literal: string): Literal => {
  const literalType: Literal = {
    type: 'literal',
    literal,
    value: literal.replace(/"\^\^.*$/, '') // should this attempt to parse ints/floats/booleans?
      .replace(/"(@[a-z]+)?$/, '')
      .replace(/^"/, ''),
  };

  if (/".*"@/.test(literal)) {
    literalType.language = literal.replace(/^".*"@/, '');
  }

  if (/^".*"\^\^/.test(literal)) {
    const dataType = literal.replace(/^".*"\^\^/, '');

    if (!STRING_DATA_TYPES.has(dataType)) {
      literalType.dataType = dataType;
    }
  }

  return literalType;
};

export const createObject = (context: ContextMap, object: string) => isLiteral(object) ?
  createLiteral(object) :
  createUri(context, object);

// export const getValue = (object: string) => object
//   .replace(/"\^\^.*$/, '')
//   .replace(/"(@[a-z]+)?$/, '')
//   .replace(/^"/, '');


// export const getType = (context: ContextMap, object: string) => {
//   if (/^".*"\^\^/.test(object)) {
//     // non-string-literal type
//     return object.replace(/^".*"\^\^/, '');
//   } else if (/^".*"/.test(object)) {
//     // string literal type
//     return `${context.xsd}string`;
//   }

//   // relationship type
//   return 'relationship';
// };


// export const getLanguage = (object: string) => {
//   return /".*"@/.test(object) ?
//     object.replace(/^".*"@/, '') :
//     undefined
// };

export const splitCurie = (curie: string) => curie.split(':');

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
  if (isCurie(curie)) {
    const [prefix, reference] = splitCurie(curie);
    if (context[prefix]) {
      return context[prefix] + reference;
    }
  }

  return curie;
};
