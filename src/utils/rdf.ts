import { toPairs } from 'ramda';
import { ContextMap, AdapterAtom, AdapterSentinel } from '../types';


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

const isUri = (object: string) => /^<.*>$/.test(object);

const STRING_DATA_TYPES = new Set([
  'xsd:string', '<http://www.w3.org/2001/XMLSchema#string>', 'rdf:langString', '<http://www.w3.org/1999/02/22-rdf-syntax-ns#langString>', ''
]);


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


export const URI = {
  falcor2Adapter: (context: ContextMap, uri: string): string => curie2URI(context, uri).replace(/^</, '').replace(/>$/, ''),
  adapter2Falcor: (context: ContextMap, uri: string): string => uri2Curie(context, `<${uri}>`),
};


export const OBJECT = {
  falcor2Adapter: (context: ContextMap, sentinel: AdapterSentinel): string | null => {
    if (sentinel.$type === 'atom') {
      if (sentinel.language) {
        return `"${sentinel.value}"@${sentinel.language}`;
      } else if (sentinel.dataType) {
        return `"${sentinel.value}"^^${curie2URI(context, sentinel.dataType).replace(/^</, '').replace(/>$/, '')}`;
      }

      return `"${sentinel.value}"`;
    } else if (sentinel.$type === 'ref') {
      return sentinel.value;
    }

    // how to represent error case?
    return null;
  },
  adapter2Falcor: (context: ContextMap, object: string | null | undefined): AdapterSentinel => {
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
          atom.dataType = uri2Curie(context, dataType);
        }
      }

      if (/^".*".*@/.test(object)) {
        atom.language = object.replace(/^".*".*@/g, '').replace(/\^\^.*$/, '');
      }

      return atom;
    }

    // CURIE REFERENCE
    for (const [prefix, namespace] of toPairs(context)) {
      if (new RegExp(`^${namespace}`).test(object)) {
        return { $type: 'ref', value: `${prefix}:${object.replace(namespace, '')}` };
      }
    }

    // URI REFERENCE
    return { $type: 'ref', value: `<${object}>` };
  }
};
