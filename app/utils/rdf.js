const R = require('ramda');


const context = {
  rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
  rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
  xsd: 'http://www.w3.org/2001/XMLSchema#',
  schema: 'http://schema.org/',
  skos: 'http://www.w3.org/2004/02/skos/core#',
  dbo: 'http://dbpedia.org/ontology/',
  dbp: 'http://dbpedia.org/property/',
  dbr: 'http://dbpedia.org/resource/',
  wd: 'http://www.wikidata.org/',
};

const getValue = object => object && object
  .replace(/"\^\^.*$/, '')
  .replace(/"(@[a-z]+)?$/, '')
  .replace(/^"/, '');


const getType = object => {
  if (!object) {
    return null;
  } else if (/^".*"\^\^/.test(object)) {
    // non-string-literal type
    return object.replace(/^".*"\^\^/, '');
  } else if (/^".*"/.test(object)) {
    // string literal type
    return `${context.xsd}string`;
  }

  // relationship type
  return 'relationship';
};


const getLanguage = object => {
  if (typeof object === 'undefined') {
    return undefined;
  } else if (/".*"@/.test(object)) {
    return object.replace(/^".*"@/, '');
  }

  return undefined;
};

const isLiteral = literal => /^".*"$/.test(literal);

const isUri = url => /^https?:\/\//.test(url);

const isCurie = uri => !isUri(uri) && !isLiteral(uri);

const splitCurie = curie => curie.split(':');

const uri2curie = (context, uri) => {
  const contextList = R.toPairs(context);

  for (let idx = 0; idx < contextList.length; idx++) {
    let [prefix, uriNameSpace] = contextList[idx];

    if (new RegExp(`^${uriNameSpace}`).test(uri)) {
      return `${prefix}:${uri.replace(uriNameSpace, '')}`;
    }
  }

  return uri;
};

const curie2uri = (context, uri) => {
  if (isCurie(uri)) {
    const [prefix, reference] = splitCurie(uri);
    if (context[prefix]) {
      return context[prefix] + reference;
    }
  }

  return uri;
};


exports.getValue = getValue;
exports.getType = getType;
exports.getLanguage = getLanguage;
exports.context = context;
exports.isLiteral = isLiteral;
exports.isUri = isUri;
exports.isCurie = isCurie;
exports.splitCurie = splitCurie;
exports.uri2curie = uri2curie;
exports.curie2uri = curie2uri;
