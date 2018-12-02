"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var rxjs_1 = require("rxjs");
var operators_1 = require("rxjs/operators");
var rdf_1 = require("../utils/rdf");
var falcor_1 = require("../utils/falcor");
var adapter_1 = require("../adapters/adapter");
exports.resourceRoutes = [
    {
        route: 'resource[{keys:subjects}][{keys:predicates}][{ranges:ranges}]',
        get: function (_a) {
            var _ = _a[0], subjects = _a[1], predicates = _a[2], ranges = _a[3];
            return rxjs_1.from(adapter_1.groupUrisByGraph(this.graphs, subjects)).pipe(operators_1.mergeMap(function (_a) {
                var handler = _a.handler, key = _a.key, subjects = _a.subjects;
                return handler({ type: 'triple', subjects: subjects, predicates: predicates, ranges: ranges }).pipe(operators_1.map(function (_a) {
                    var subject = _a.subject, predicate = _a.predicate, index = _a.index, object = _a.object;
                    if (object === null || object === undefined || typeof object === 'string') {
                        object = rdf_1.parseObject(object);
                    }
                    if (object.$type === 'ref') {
                        return {
                            path: ['resource', subject, predicate, index],
                            value: falcor_1.$ref(['resource', object.value])
                        };
                    }
                    else if (object.$type === 'atom') {
                        return {
                            path: ['resource', subject, predicate, index],
                            value: object.value === null ? null : falcor_1.$atom(object.value, object.dataType, object.language)
                        };
                    }
                    else if (object.$type === 'error') {
                        return {
                            path: ['resource', subject, predicate, index],
                            value: falcor_1.$error('500', object.value)
                        };
                    }
                    return {
                        path: ['resource', subject, predicate, index],
                        value: falcor_1.$error('500', "Adapter " + key + " triples handler returned invalid object type: " + JSON.stringify(object))
                    };
                }));
            }), operators_1.bufferTime(0));
        },
    },
    {
        route: 'resource[{keys:subjects}][{keys:predicates}].length',
        get: function (_a) {
            var _ = _a[0], subjects = _a[1], predicates = _a[2];
            return rxjs_1.from(adapter_1.groupUrisByGraph(this.graphs, subjects)).pipe(operators_1.mergeMap(function (_a) {
                var handler = _a.handler, subjects = _a.subjects;
                return handler({ type: 'triple-count', subjects: subjects, predicates: predicates });
            }), operators_1.map(function (_a) {
                var subject = _a.subject, predicate = _a.predicate, count = _a.count;
                return ({
                    path: ['resource', subject, predicate, 'length'],
                    value: falcor_1.$atom(count),
                });
            }), operators_1.bufferTime(0));
        }
    },
    {
        route: 'resource[{keys:subjects}]uri',
        get: function (_a) {
            var _ = _a[0], subjects = _a[1];
            return rxjs_1.from(subjects).pipe(operators_1.map(function (uri) { return ({
                path: ['resource', uri, 'uri'],
                value: uri
            }); }));
        }
    },
];
//# sourceMappingURL=resource.js.map