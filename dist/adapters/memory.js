"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var levelup_1 = __importDefault(require("levelup"));
var levelgraph_1 = __importDefault(require("levelgraph"));
var levelgraph_n3_1 = __importDefault(require("levelgraph-n3"));
var memdown_1 = __importDefault(require("memdown"));
var rxjs_1 = require("rxjs");
var operators_1 = require("rxjs/operators");
var rdf_1 = require("../utils/rdf");
var falcor_1 = require("../utils/falcor");
var rxjs_2 = require("../utils/rxjs");
var misc_1 = require("../utils/misc");
var ramda_1 = require("ramda");
var MemoryGraphAdapter = /** @class */ (function () {
    function MemoryGraphAdapter(db, request) {
        this.db = db;
        this.request = request;
    }
    MemoryGraphAdapter.createAdapter = function (n3) {
        return new Promise(function (resolve, reject) {
            memdown_1.default.clearGlobalStore();
            var db = levelgraph_n3_1.default(levelgraph_1.default(levelup_1.default('memoryGraph', { db: memdown_1.default })));
            db.n3.put(n3, function (err) {
                if (err) {
                    return reject(err);
                }
                resolve(db);
            });
        });
    };
    MemoryGraphAdapter.prototype.search = function (key, search, ranges, count) {
        var _this = this;
        if (!count) {
            return rxjs_1.from(ranges).pipe(operators_1.mergeMap(function (range) {
                var _a = falcor_1.range2LimitOffset(range), offset = _a.offset, levelGraphLimit = _a.levelGraphLimit;
                return rxjs_2.fromStream(_this.db.getStream({
                    predicate: rdf_1.context.rdf + "type",
                    object: search.type,
                    limit: levelGraphLimit,
                    offset: offset,
                })).pipe(operators_1.map(function (_a, idx) {
                    var subject = _a.subject;
                    return ({
                        type: 'search',
                        key: key,
                        index: offset + idx,
                        uri: subject,
                    });
                }));
            }));
        }
        else if (ranges.length === 0) {
            return rxjs_2.fromStream(this.db.getStream({
                predicate: rdf_1.context.rdf + "type",
                object: search.type
            })).pipe(operators_1.count(), operators_1.map(function (count) { return ({ type: 'search-count', key: key, count: count }); }));
        }
        var search$ = rxjs_2.fromStream(this.db.getStream({
            predicate: rdf_1.context.rdf + "type",
            object: search.type
        })).pipe(operators_1.multicast(new rxjs_1.Subject()), operators_1.refCount());
        return rxjs_1.merge(rxjs_1.from(ranges).pipe(operators_1.mergeMap(function (range) {
            var _a = falcor_1.range2LimitOffset(range), offset = _a.offset, limit = _a.limit;
            return search$.pipe(operators_1.skip(offset), operators_1.take(limit), operators_1.map(function (_a, idx) {
                var subject = _a.subject;
                return ({
                    type: 'search',
                    key: key,
                    index: offset + idx,
                    uri: subject,
                });
            }));
        })), search$.pipe(operators_1.count(), operators_1.map(function (count) { return ({ type: 'search-count', key: key, count: count }); })));
    };
    MemoryGraphAdapter.prototype.triples = function (subjects, predicates, ranges, count) {
        var _this = this;
        // TODO - compile entire s/p/r into a single query
        // TODO - catch deep s/p/r/p/r/p/r... patterns
        if (!count) {
            return rxjs_1.from(misc_1.cartesianProd(subjects, predicates, ranges)).pipe(operators_1.mergeMap(function (_a) {
                var subject = _a[0], predicate = _a[1], range = _a[2];
                var _b = falcor_1.range2LimitOffset(range), offset = _b.offset, levelGraphLimit = _b.levelGraphLimit;
                return rxjs_2.fromStream(_this.db.getStream({
                    subject: subject,
                    predicate: predicate,
                    limit: levelGraphLimit,
                    offset: offset
                })).pipe(operators_1.map(function (_a, index) {
                    var object = _a.object;
                    return ({
                        type: 'triple',
                        subject: subject,
                        predicate: predicate,
                        index: offset + index,
                        object: object,
                    });
                }));
            }));
        }
        else if (ranges.length === 0) {
            return rxjs_1.from(ramda_1.xprod(subjects, predicates)).pipe(operators_1.mergeMap(function (_a) {
                var subject = _a[0], predicate = _a[1];
                return rxjs_2.fromStream(_this.db.getStream({
                    subject: subject,
                    predicate: predicate,
                })).pipe(operators_1.count(), operators_1.map(function (count) { return ({
                    type: 'triple-count',
                    subject: subject,
                    predicate: predicate,
                    count: count
                }); }));
            }));
        }
        return rxjs_1.from(ramda_1.xprod(subjects, predicates)).pipe(operators_1.mergeMap(function (_a) {
            var subject = _a[0], predicate = _a[1];
            var triples$ = rxjs_2.fromStream(_this.db.getStream({
                subject: subject,
                predicate: predicate,
            })).pipe(operators_1.multicast(new rxjs_1.Subject()), operators_1.refCount());
            return rxjs_1.merge(rxjs_1.from(ranges).pipe(operators_1.mergeMap(function (range) {
                var _a = falcor_1.range2LimitOffset(range), offset = _a.offset, limit = _a.limit;
                return triples$.pipe(operators_1.skip(offset), operators_1.take(limit), operators_1.map(function (_a, idx) {
                    var subject = _a.subject, predicate = _a.predicate, object = _a.object;
                    return ({
                        type: 'triple',
                        subject: subject,
                        predicate: predicate,
                        index: offset + idx,
                        object: object
                    });
                }));
            })), triples$.pipe(operators_1.count(), operators_1.map(function (count) { return ({ type: 'triple-count', subject: subject, predicate: predicate, count: count }); })));
        }));
    };
    MemoryGraphAdapter.prototype.getTypes = function () {
        // TODO - should we use something more specific than rdfs:Class to find resource types?  juno:ResourceClass?
        return rxjs_2.fromStream(this.db.searchStream([
            {
                subject: this.db.v('type'),
                predicate: rdf_1.context.rdf + "type",
                object: rdf_1.context.rdfs + "Class"
            },
            {
                subject: this.db.v('type'),
                predicate: rdf_1.context.skos + "prefLabel",
                object: this.db.v('label')
            }
        ])).pipe(operators_1.toArray(), operators_1.map(function (resourceTypes) { return ({
            type: 'type-list',
            resourceTypes: resourceTypes.map(function (_a) {
                var type = _a.type, label = _a.label;
                var _b = rdf_1.parseObject(label), value = _b.value, language = _b.language;
                return language ? {
                    uri: type,
                    label: value,
                    language: language
                } : {
                    uri: type,
                    label: value,
                };
            })
        }); }));
    };
    MemoryGraphAdapter.prototype.getPredicates = function (types) {
        var _this = this;
        return rxjs_1.from(types).pipe(operators_1.mergeMap(function (type) {
            return rxjs_2.fromStream(_this.db.searchStream([{
                    subject: _this.db.v('predicate'),
                    predicate: rdf_1.context.rdfs + "domain",
                    object: type,
                }, {
                    subject: _this.db.v('predicate'),
                    predicate: rdf_1.context.rdfs + "label",
                    object: _this.db.v('label')
                }, {
                    subject: _this.db.v('predicate'),
                    predicate: rdf_1.context.rdfs + "range",
                    object: _this.db.v('range')
                }], {} /* { limit: 100 } */)).pipe(operators_1.distinct(ramda_1.prop('predicate')), operators_1.toArray(), operators_1.map(function (predicates) {
                return {
                    type: 'predicate-list',
                    resourceType: type,
                    predicates: predicates.map(function (_a) {
                        var predicate = _a.predicate, label = _a.label, range = _a.range;
                        // TODO - group ranges
                        var _b = rdf_1.parseObject(label), value = _b.value, language = _b.language;
                        return language ? {
                            uri: predicate,
                            label: value,
                            range: range,
                            language: language,
                        } : {
                            uri: predicate,
                            label: value,
                            range: range,
                        };
                    })
                };
            }));
        }));
    };
    return MemoryGraphAdapter;
}());
exports.MemoryGraphAdapter = MemoryGraphAdapter;
//# sourceMappingURL=memory.js.map