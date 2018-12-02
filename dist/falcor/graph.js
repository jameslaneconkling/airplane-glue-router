"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var rxjs_1 = require("rxjs");
var operators_1 = require("rxjs/operators");
var ramda_1 = require("ramda");
var falcor_1 = require("../utils/falcor");
var search_1 = require("../utils/search");
var adapter_1 = require("../adapters/adapter");
exports.graphRoutes = [
    {
        route: 'graph[{keys:graphKeys}].search[{keys:searches}][{ranges:ranges}]',
        get: function (_a) {
            var _this = this;
            var _ = _a[0], graphKeys = _a[1], __ = _a[2], searches = _a[3], ranges = _a[4];
            // TODO - capture [search][range][field][range]... queries
            return rxjs_1.from(ramda_1.xprod(graphKeys, searches)).pipe(operators_1.mergeMap(function (_a) {
                var graphKey = _a[0], searchKey = _a[1];
                // TODO - allow multiple graphKeys to be included in the same query
                var graphDescription = adapter_1.matchKey(_this.graphs, graphKey);
                if (!graphDescription) {
                    return rxjs_1.of({
                        path: ['graph', graphKey],
                        value: falcor_1.$error('404', 'NOT FOUND')
                    });
                }
                var search = search_1.parseSearch(searchKey);
                if (search === null) {
                    return rxjs_1.of({
                        path: ['graph', graphKey, 'search', searchKey],
                        value: falcor_1.$error('422', '')
                    });
                }
                return graphDescription.handler({ type: 'search', key: searchKey, search: search, ranges: ranges })
                    .pipe(operators_1.map(function (_a) {
                    var index = _a.index, uri = _a.uri;
                    return ({
                        path: ['graph', graphKey, 'search', searchKey, index],
                        value: uri === null ? null : falcor_1.$ref(['resource', uri])
                    });
                }));
            }), operators_1.bufferTime(0));
        },
    },
    {
        route: 'graph[{keys:graphKeys}].search[{keys:searches}].length',
        get: function (_a) {
            var _this = this;
            var _ = _a[0], graphKeys = _a[1], __ = _a[2], searches = _a[3];
            return rxjs_1.from(ramda_1.xprod(graphKeys, searches)).pipe(operators_1.mergeMap(function (_a) {
                var graphKey = _a[0], searchKey = _a[1];
                // TODO - allow multiple graphKeys to be included in the same query
                var graphDescription = adapter_1.matchKey(_this.graphs, graphKey);
                if (!graphDescription) {
                    return rxjs_1.of({
                        path: ['graph', graphKey],
                        value: falcor_1.$error('404', 'NOT FOUND')
                    });
                }
                var search = search_1.parseSearch(searchKey);
                if (search === null) {
                    return rxjs_1.of({
                        path: ['graph', graphKey, 'search', searchKey],
                        value: falcor_1.$error('422', '')
                    });
                }
                return graphDescription.handler({ type: 'search-count', key: searchKey, search: search })
                    .pipe(operators_1.map(function (_a) {
                    var count = _a.count;
                    return ({
                        path: ['graph', graphKey, 'search', searchKey, 'length'],
                        value: count
                    });
                }));
            }), operators_1.bufferTime(0));
        }
    },
    {
        route: 'graphs',
        get: function () {
            return {
                path: ['graphs'],
                value: falcor_1.$atom(this.graphs
                    .filter(function (graphDescription) { return (graphDescription.label !== undefined); })
                    .map(ramda_1.pick(['key', 'label'])))
            };
        },
    },
    {
        route: 'graph[{keys:graphKeys}].types',
        get: function (_a) {
            var _this = this;
            var _ = _a[0], graphKeys = _a[1], __ = _a[2];
            return rxjs_1.from(graphKeys).pipe(operators_1.mergeMap(function (graphKey) {
                var graphDescription = adapter_1.matchKey(_this.graphs, graphKey);
                if (!graphDescription) {
                    return rxjs_1.of({
                        path: ['graph', graphKey],
                        value: falcor_1.$error('404', 'NOT FOUND')
                    });
                }
                return graphDescription.handler({ type: 'type-list' }).pipe(operators_1.map(function (types) { return ({
                    path: ['graph', graphKey, 'types'],
                    value: falcor_1.$atom(types.resourceTypes),
                }); }));
            }), operators_1.bufferTime(0));
        }
    },
    {
        route: 'graph[{keys:graphKeys}].type[{keys:types}].',
        get: function (_a) {
            var _this = this;
            var _ = _a[0], graphKeys = _a[1], __ = _a[2], resourceTypes = _a[3];
            return rxjs_1.from(graphKeys).pipe(operators_1.mergeMap(function (graphKey) {
                var graphDescription = adapter_1.matchKey(_this.graphs, graphKey);
                if (!graphDescription) {
                    return rxjs_1.of({
                        path: ['graph', graphKey],
                        value: falcor_1.$error('404', 'NOT FOUND')
                    });
                }
                return graphDescription.handler({ type: 'predicate-list', resourceTypes: resourceTypes }).pipe(operators_1.map(function (_a) {
                    var resourceType = _a.resourceType, predicates = _a.predicates;
                    return ({
                        path: ['graph', graphKey, 'type', resourceType],
                        value: falcor_1.$atom(predicates)
                    });
                }));
            }), operators_1.bufferTime(0));
        }
    }
];
//# sourceMappingURL=graph.js.map