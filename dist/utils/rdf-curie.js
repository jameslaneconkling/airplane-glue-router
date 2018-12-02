"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var tape_1 = __importDefault(require("tape"));
var ramda_1 = require("ramda");
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
var STRING_DATA_TYPES = new Set([
    'xsd:string', '<http://www.w3.org/2001/XMLSchema#string>', 'rdf:langString', '<http://www.w3.org/1999/02/22-rdf-syntax-ns#langString>', ''
]);
var isUri = function (uri) { return /^<.*>$/.test(uri); };
exports.uri2Curie = function (context, uri) {
    if (!isUri(uri)) {
        return uri;
    }
    var contextList = ramda_1.toPairs(context);
    for (var _i = 0, contextList_1 = contextList; _i < contextList_1.length; _i++) {
        var _a = contextList_1[_i], prefix = _a[0], uriNameSpace = _a[1];
        if (new RegExp("^<" + uriNameSpace).test(uri)) {
            return prefix + ":" + uri.replace("<" + uriNameSpace, '').replace('>', '');
        }
    }
    return uri;
};
exports.curie2URI = function (context, curie) {
    var idx = curie.indexOf(':');
    if (idx === -1) {
        return curie;
    }
    var _a = [curie.slice(0, idx), curie.slice(idx + 1)], prefix = _a[0], reference = _a[1];
    if (context[prefix]) {
        return "<" + (context[prefix] + reference) + ">";
    }
    return curie;
};
exports.URI = {
    falcor2Adapter: function (context, uri) { return exports.curie2URI(context, uri).replace(/^</, '').replace(/>$/, ''); },
    adapter2Falcor: function (context, uri) { return exports.uri2Curie(context, "<" + uri + ">"); },
};
exports.OBJECT = {
    falcor2Adapter: function (context, sentinel) {
        if (sentinel.$type === 'atom') {
            if (sentinel.language) {
                return "\"" + sentinel.value + "\"@" + sentinel.language;
            }
            else if (sentinel.dataType) {
                return "\"" + sentinel.value + "\"^^" + exports.curie2URI(context, sentinel.dataType).replace(/^</, '').replace(/>$/, '');
            }
            return "\"" + sentinel.value + "\"";
        }
        else if (sentinel.$type === 'ref') {
            return sentinel.value;
        }
        // how to represent error case?
        return null;
    },
    adapter2Falcor: function (context, object) {
        // NULL LITERAL
        if (object === null || object === undefined) {
            return { $type: 'atom', value: null };
        }
        // NON_NULL LITERAL
        var literalValueMatch = object.match(/".*"/g);
        if (literalValueMatch) {
            var atom = {
                $type: 'atom',
                value: literalValueMatch[0].replace(/^"/, '').replace(/"$/, ''),
            };
            if (/^".*".*\^\^/.test(object)) {
                var dataType = object.replace(/^".*".*\^\^/g, '').replace(/@.*$/, '');
                if (!STRING_DATA_TYPES.has(dataType)) {
                    atom.dataType = exports.uri2Curie(context, dataType);
                }
            }
            if (/^".*".*@/.test(object)) {
                atom.language = object.replace(/^".*".*@/g, '').replace(/\^\^.*$/, '');
            }
            return atom;
        }
        // CURIE REFERENCE
        for (var _i = 0, _a = ramda_1.toPairs(context); _i < _a.length; _i++) {
            var _b = _a[_i], prefix = _b[0], namespace = _b[1];
            if (new RegExp("^" + namespace).test(object)) {
                return { $type: 'ref', value: prefix + ":" + object.replace(namespace, '') };
            }
        }
        // URI REFERENCE
        return { $type: 'ref', value: "<" + object + ">" };
    }
};
tape_1.default.skip('OBJECT.falcor2Adapter', function (assert) {
    assert.plan(9);
    assert.fail();
});
tape_1.default('OBJECT.adapter2Falcor', function (assert) {
    assert.plan(9);
    var context = {
        xsd: 'http://www.w3.org/2001/XMLSchema#',
    };
    assert.deepEqual(exports.OBJECT.adapter2Falcor(context, '"Literal"'), { $type: 'atom', value: 'Literal' });
    assert.deepEqual(exports.OBJECT.adapter2Falcor(context, '"Literal"@en'), { $type: 'atom', value: 'Literal', language: 'en' });
    assert.deepEqual(exports.OBJECT.adapter2Falcor(context, '"Literal"@fr-be'), { $type: 'atom', value: 'Literal', language: 'fr-be' });
    assert.deepEqual(exports.OBJECT.adapter2Falcor(context, '"Literal"@fr-be^^rdf:langString'), { $type: 'atom', value: 'Literal', language: 'fr-be' });
    assert.deepEqual(exports.OBJECT.adapter2Falcor(context, '"Literal"^^rdf:langString@fr-be'), { $type: 'atom', value: 'Literal', language: 'fr-be' });
    assert.deepEqual(exports.OBJECT.adapter2Falcor(context, '"1"^^xsd:integer'), { $type: 'atom', value: '1', dataType: 'xsd:integer' });
    assert.deepEqual(exports.OBJECT.adapter2Falcor(context, '"1"^^<http://www.w3.org/2001/XMLSchema#integer>'), { $type: 'atom', value: '1', dataType: 'xsd:integer' });
    assert.deepEqual(exports.OBJECT.adapter2Falcor({}, '"1"^^<http://www.w3.org/2001/XMLSchema#integer>'), { $type: 'atom', value: '1', dataType: '<http://www.w3.org/2001/XMLSchema#integer>' });
    assert.deepEqual(exports.OBJECT.adapter2Falcor(context, '"Literal "with \'quotes\'" and @ and ^^"@fr-be^^rdf:langString'), { $type: 'atom', value: 'Literal "with \'quotes\'" and @ and ^^', language: 'fr-be' });
    // TODO - ensure that literal URIS are handled as literals and not objects
    // TODO - null/undefined/curie/uri/error
});
tape_1.default('URI.falcor2Adapter', function (assert) {
    assert.plan(2);
    var context = {
        rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
    };
    assert.equal(exports.URI.falcor2Adapter(context, 'rdfs:label'), 'http://www.w3.org/2000/01/rdf-schema#label', 'should expand curie to uri');
    assert.equal(exports.URI.falcor2Adapter(context, '<http://www.w3.org/2000/01/rdf-schema#label>'), 'http://www.w3.org/2000/01/rdf-schema#label', 'should remove angle brackets from uri');
});
tape_1.default('URI.adapter2Falcor', function (assert) {
    assert.plan(2);
    var context = {
        rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
    };
    assert.equal(exports.URI.adapter2Falcor(context, 'http://www.w3.org/2000/01/rdf-schema#label'), 'rdfs:label', 'should collapse uri to curie');
    assert.equal(exports.URI.adapter2Falcor(context, 'http://junonetwork.com/test/abc'), '<http://junonetwork.com/test/abc>', 'should add angle brackets to uri that can\'t be collapsed to curie');
});
tape_1.default('uri2Curie', function (assert) {
    assert.plan(7);
    var context = {
        rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
    };
    assert.equal(exports.uri2Curie(context, '<http://www.w3.org/2000/01/rdf-schema#label>'), 'rdfs:label', 'should collapse uri to curie if uri namespace exists in context');
    assert.equal(exports.uri2Curie(context, '<http://junonetwork.com/test/abc>'), '<http://junonetwork.com/test/abc>', 'should not collapse uri to curie if uri namespace does not exist in context');
    assert.equal(exports.uri2Curie(context, 'rdfs:label'), 'rdfs:label', 'should not change a non uri');
    assert.equal(exports.uri2Curie(context, 'abc123XYZ'), 'abc123XYZ', 'should not change a non uri');
    assert.equal(exports.uri2Curie(context, 'http://www.w3.org/2000/01/rdf-schema#label'), 'http://www.w3.org/2000/01/rdf-schema#label', 'should not change a non uri');
    assert.equal(exports.uri2Curie(context, exports.uri2Curie(context, '<http://www.w3.org/2000/01/rdf-schema#label>')), exports.uri2Curie(context, '<http://www.w3.org/2000/01/rdf-schema#label>'), 'should be idempotent');
    assert.equal(exports.curie2URI(context, exports.uri2Curie(context, '<http://www.w3.org/2000/01/rdf-schema#label>')), '<http://www.w3.org/2000/01/rdf-schema#label>', 'should be reversable via curie2Uri');
});
tape_1.default('curie2URI', function (assert) {
    assert.plan(7);
    var context = {
        rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
    };
    assert.equal(exports.curie2URI(context, 'rdfs:label'), '<http://www.w3.org/2000/01/rdf-schema#label>', 'should expand curie to uri if curie prefix exists in context');
    assert.equal(exports.curie2URI(context, 'juno:abc'), 'juno:abc', 'should not expand curie to uri if curie prefix does not exist in context');
    assert.equal(exports.curie2URI(context, '<http://www.w3.org/2000/01/rdf-schema#label>'), '<http://www.w3.org/2000/01/rdf-schema#label>', 'should not expand non-curie');
    assert.equal(exports.curie2URI(context, 'abc123XYZ'), 'abc123XYZ', 'should not expand non-curie');
    assert.equal(exports.curie2URI(context, 'junoabc'), 'junoabc', 'should not expand non-curie');
    assert.equal(exports.curie2URI(context, exports.curie2URI(context, 'rdfs:label')), '<http://www.w3.org/2000/01/rdf-schema#label>', 'should be idempotent');
    assert.equal(exports.uri2Curie(context, exports.curie2URI(context, 'rdfs:label')), 'rdfs:label', 'should be reversable via uri2Curie');
});
//# sourceMappingURL=rdf-curie.js.map