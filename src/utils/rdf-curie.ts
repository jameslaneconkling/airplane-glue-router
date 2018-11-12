import test from 'tape';
import { ContextMap, AdapterSentinel, AdapterAtom } from "../types";
import { toPairs } from "ramda";

// const context: ContextMap = {
//   rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
//   rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
//   xsd: 'http://www.w3.org/2001/XMLSchema#',
//   owl: 'http://www.w3.org/2002/07/owl#',
//   skos: 'http://www.w3.org/2004/02/skos/core#',
// };

// schema: 'http://schema.org/',
// dbo: 'http://dbpedia.org/ontology/',
// dbp: 'http://dbpedia.org/property/',
// dbr: 'http://dbpedia.org/resource/',
// wd: 'http://www.wikidata.org/',

const STRING_DATA_TYPES = new Set([
  'xsd:string', '<http://www.w3.org/2001/XMLSchema#string>', 'rdf:langString', '<http://www.w3.org/1999/02/22-rdf-syntax-ns#langString>', ''
]);

const isUri = (uri: string) => /^<.*>$/.test(uri);

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

test.skip('OBJECT.falcor2Adapter', (assert) => {
  assert.plan(9);

  assert.fail();
});


test('OBJECT.adapter2Falcor', (assert) => {
  assert.plan(9);
  const context = {
    xsd: 'http://www.w3.org/2001/XMLSchema#',
  };

  assert.deepEqual(OBJECT.adapter2Falcor(context, '"Literal"'), { $type: 'atom', value: 'Literal' });
  assert.deepEqual(OBJECT.adapter2Falcor(context, '"Literal"@en'), { $type: 'atom', value: 'Literal', language: 'en' });
  assert.deepEqual(OBJECT.adapter2Falcor(context, '"Literal"@fr-be'), { $type: 'atom', value: 'Literal', language: 'fr-be' });
  assert.deepEqual(OBJECT.adapter2Falcor(context, '"Literal"@fr-be^^rdf:langString'), { $type: 'atom', value: 'Literal', language: 'fr-be' });
  assert.deepEqual(OBJECT.adapter2Falcor(context, '"Literal"^^rdf:langString@fr-be'), { $type: 'atom', value: 'Literal', language: 'fr-be' });
  assert.deepEqual(OBJECT.adapter2Falcor(context, '"1"^^xsd:integer'), { $type: 'atom', value: '1', dataType: 'xsd:integer' });
  assert.deepEqual(OBJECT.adapter2Falcor(context, '"1"^^<http://www.w3.org/2001/XMLSchema#integer>'), { $type: 'atom', value: '1', dataType: 'xsd:integer' });
  assert.deepEqual(OBJECT.adapter2Falcor({}, '"1"^^<http://www.w3.org/2001/XMLSchema#integer>'), { $type: 'atom', value: '1', dataType: '<http://www.w3.org/2001/XMLSchema#integer>' });
  assert.deepEqual(OBJECT.adapter2Falcor(context, '"Literal "with \'quotes\'" and @ and ^^"@fr-be^^rdf:langString'), { $type: 'atom', value: 'Literal "with \'quotes\'" and @ and ^^', language: 'fr-be' });
  // TODO - ensure that literal URIS are handled as literals and not objects
  // TODO - null/undefined/curie/uri/error
});


test('URI.falcor2Adapter', (assert) => {
  assert.plan(2);
  const context = {
    rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
  };

  assert.equal(URI.falcor2Adapter(context, 'rdfs:label'), 'http://www.w3.org/2000/01/rdf-schema#label', 'should expand curie to uri');
  assert.equal(URI.falcor2Adapter(context, '<http://www.w3.org/2000/01/rdf-schema#label>'), 'http://www.w3.org/2000/01/rdf-schema#label', 'should remove angle brackets from uri');
});


test('URI.adapter2Falcor', (assert) => {
  assert.plan(2);
  const context = {
    rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
  };

  assert.equal(URI.adapter2Falcor(context, 'http://www.w3.org/2000/01/rdf-schema#label'), 'rdfs:label', 'should collapse uri to curie');
  assert.equal(URI.adapter2Falcor(context, 'http://junonetwork.com/test/abc'), '<http://junonetwork.com/test/abc>', 'should add angle brackets to uri that can\'t be collapsed to curie');
});


test('uri2Curie', (assert) => {
  assert.plan(7);
  const context = {
    rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
  };

  assert.equal(uri2Curie(context, '<http://www.w3.org/2000/01/rdf-schema#label>'), 'rdfs:label', 'should collapse uri to curie if uri namespace exists in context');
  assert.equal(uri2Curie(context, '<http://junonetwork.com/test/abc>'), '<http://junonetwork.com/test/abc>', 'should not collapse uri to curie if uri namespace does not exist in context');
  assert.equal(uri2Curie(context, 'rdfs:label'), 'rdfs:label', 'should not change a non uri');
  assert.equal(uri2Curie(context, 'abc123XYZ'), 'abc123XYZ', 'should not change a non uri');
  assert.equal(uri2Curie(context, 'http://www.w3.org/2000/01/rdf-schema#label'), 'http://www.w3.org/2000/01/rdf-schema#label', 'should not change a non uri');
  assert.equal(uri2Curie(context, uri2Curie(context, '<http://www.w3.org/2000/01/rdf-schema#label>')), uri2Curie(context, '<http://www.w3.org/2000/01/rdf-schema#label>'), 'should be idempotent');
  assert.equal(curie2URI(context, uri2Curie(context, '<http://www.w3.org/2000/01/rdf-schema#label>')), '<http://www.w3.org/2000/01/rdf-schema#label>', 'should be reversable via curie2Uri');
});

test('curie2URI', (assert) => {
  assert.plan(7);

  const context = {
    rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
  };
  
  assert.equal(curie2URI(context, 'rdfs:label'), '<http://www.w3.org/2000/01/rdf-schema#label>', 'should expand curie to uri if curie prefix exists in context');
  assert.equal(curie2URI(context, 'juno:abc'), 'juno:abc', 'should not expand curie to uri if curie prefix does not exist in context');
  assert.equal(curie2URI(context, '<http://www.w3.org/2000/01/rdf-schema#label>'), '<http://www.w3.org/2000/01/rdf-schema#label>', 'should not expand non-curie');
  assert.equal(curie2URI(context, 'abc123XYZ'), 'abc123XYZ', 'should not expand non-curie');
  assert.equal(curie2URI(context, 'junoabc'), 'junoabc', 'should not expand non-curie');
  assert.equal(curie2URI(context, curie2URI(context, 'rdfs:label')), '<http://www.w3.org/2000/01/rdf-schema#label>', 'should be idempotent');
  assert.equal(uri2Curie(context, curie2URI(context, 'rdfs:label')), 'rdfs:label', 'should be reversable via uri2Curie');
});
