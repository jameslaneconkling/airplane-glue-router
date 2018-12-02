"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ramda_1 = require("ramda");
var rxjs_1 = require("rxjs");
var query_string_1 = require("query-string");
var operators_1 = require("rxjs/operators");
var misc_1 = require("../utils/misc");
var falcor_1 = require("../utils/falcor");
var AbstractGraphAdapterQueryHandlers = /** @class */ (function () {
    function AbstractGraphAdapterQueryHandlers() {
    }
    AbstractGraphAdapterQueryHandlers.prototype.search = function (_searchKey, _serach, _ranges, _count) {
        return rxjs_1.empty();
    };
    AbstractGraphAdapterQueryHandlers.prototype.triples = function (_subjects, _predicates, _ranges, _count) {
        return rxjs_1.empty();
    };
    AbstractGraphAdapterQueryHandlers.prototype.getTypes = function () {
        return rxjs_1.empty();
    };
    AbstractGraphAdapterQueryHandlers.prototype.getPredicates = function (_types) {
        return rxjs_1.empty();
    };
    return AbstractGraphAdapterQueryHandlers;
}());
exports.AbstractGraphAdapterQueryHandlers = AbstractGraphAdapterQueryHandlers;
exports.requestReducer = function (query, request) {
    var _a, _b, _c;
    if (request.type === 'search') {
        if (!query.searches[request.key]) {
            query.searches[request.key] = {
                key: request.key,
                search: request.search,
                ranges: request.ranges,
                count: false
            };
        }
        else {
            (_a = query.searches[request.key].ranges).push.apply(_a, request.ranges);
        }
    }
    else if (request.type === 'search-count') {
        if (!query.searches[request.key]) {
            query.searches[request.key] = {
                key: request.key,
                search: request.search,
                ranges: [],
                count: true,
            };
        }
        else {
            query.searches[request.key].count = true;
        }
    }
    else if (request.type === 'triple') {
        // TODO - make smarter subject/predicate equality matching, possibly by sorting: ['test:1', 'test:2'] === ['test:2', 'test:1']
        var resourceKey = query_string_1.stringify([request.subjects, request.predicates]);
        if (!query.resources[resourceKey]) {
            query.resources[resourceKey] = {
                subjects: request.subjects,
                predicates: request.predicates,
                ranges: request.ranges,
                count: false,
            };
        }
        else {
            // TODO - dedup ranges after combining
            (_b = query.resources[resourceKey].ranges).push.apply(_b, request.ranges);
        }
    }
    else if (request.type === 'triple-count') {
        var resourceKey = query_string_1.stringify([request.subjects, request.predicates]);
        if (!query.resources[resourceKey]) {
            query.resources[resourceKey] = {
                subjects: request.subjects,
                predicates: request.predicates,
                ranges: [],
                count: true,
            };
        }
        else {
            // TODO - dedup ranges after combining
            query.resources[resourceKey].count = true;
        }
    }
    else if (request.type === 'type-list') {
        query.resourceTypes.list = true;
    }
    else if (request.type === 'predicate-list') {
        (_c = query.resourceTypes.types).push.apply(_c, request.resourceTypes);
    }
    else {
        return misc_1.neverever(request);
    }
    return query;
};
exports.createGraphHandler = function (graphAdapter) {
    // batching occurs per router request, per graph, per time interval
    var batch;
    return function (request) {
        if (batch === undefined) {
            batch = {
                query: exports.requestReducer({ searches: {}, resources: {}, resourceTypes: { list: false, types: [] } }, request),
                source$: new rxjs_1.Subject(),
            };
            setTimeout(function () {
                graphAdapter(batch.query).subscribe(batch.source$);
                batch = undefined;
            }, 0);
        }
        else {
            batch.query = exports.requestReducer(batch.query, request);
        }
        var _a = exports.expectedResponses(request), isExpectedResponse = _a.isExpectedResponse, getMissingResponses = _a.getMissingResponses;
        return batch.source$.pipe(operators_1.filter(isExpectedResponse), operators_1.concat(new rxjs_1.Observable(function (observer) {
            getMissingResponses().forEach(observer.next.bind(observer));
            observer.complete();
        })));
    };
};
// export const createGraphHandler = (
//   graphAdapter: (query: Query) => Observable<AdapterResponse>,
//   { key, domains, label}: {
//     key: string,
//     domains: RegExp[],
//     label?: string,
//   }
// ) => {
//   const subject = new Subject<AdapterRequest>();
//   const response$ = subject.pipe(
//     bufferTime(0),
//     map(reduce<AdapterRequest, Query>(requestReducer, { search: {}, resources: [] })),
//     map(graphAdapter),
//     map((requests) => graphAdapter(reduce(reducer, query, { search: {}, resources: [] })).pipe(multicast(), refCount()))
//   );
//   return {
//     key,
//     domains,
//     label,
//     handler: (request: AdapterRequest) => {
//       subject.next(request);
//       // each multicasted response$ stream needs to unsubscribe when its batch is done
//       // meaning, every batch needs to create a new subject$
//       // if this can't work, use the hybrid approach adopted by createBatchedQuery()
//       return response$.pipe(
//         first(),
//         mergeAll()
//       );
//     }
//   }
// };
exports.createGraph = function (graphAdapter, _a) {
    var key = _a.key, domains = _a.domains, label = _a.label;
    return ({
        key: key,
        domains: domains,
        label: label,
        handler: exports.createGraphHandler(graphAdapter)
    });
};
exports.createHandlerAdapter = function (adapter) {
    return function (query) {
        return rxjs_1.merge.apply(void 0, ramda_1.values(query.searches).map(function (_a) {
            var key = _a.key, search = _a.search, ranges = _a.ranges, count = _a.count;
            return adapter.search(key, search, ranges, count);
        }).concat(ramda_1.values(query.resources).map(function (_a) {
            var subjects = _a.subjects, predicates = _a.predicates, ranges = _a.ranges, count = _a.count;
            return adapter.triples(subjects, predicates, ranges, count);
        }), [query.resourceTypes.list ? adapter.getTypes() : rxjs_1.empty(),
            adapter.getPredicates(query.resourceTypes.types)]));
    };
};
exports.matchKey = function (graphs, adapterKey) { return (graphs.find(function (adapter) { return adapterKey === adapter.key; })); };
exports.matchDomain = function (graphs, domainName) { return (graphs.find(function (_a) {
    var domains = _a.domains;
    return ramda_1.any(function (domain) { return domain.test(domainName); }, domains);
})); };
exports.missingGraph = Symbol('missing_graph');
exports.groupUrisByGraph = function (graphs, subjects) {
    return ramda_1.values(subjects.reduce(function (grouped, uri) {
        var graphDescription = exports.matchDomain(graphs, uri);
        if (graphDescription === undefined) {
            // TODO - handle unmatched resources?
            return grouped;
        }
        if (grouped[graphDescription.key]) {
            grouped[graphDescription.key].subjects.push(uri);
        }
        else {
            grouped[graphDescription.key] = {
                handler: graphDescription.handler,
                key: graphDescription.key,
                subjects: [uri]
            };
        }
        return grouped;
    }, {}));
};
exports.expectedResponses = function (request) {
    if (request.type === 'search') {
        var expected_1 = falcor_1.ranges2List(request.ranges)
            .reduce(function (acc, index) {
            var response = ({ type: 'search', key: request.key, index: index, uri: null });
            acc.set(query_string_1.stringify(response), response);
            return acc;
        }, new Map());
        return {
            isExpectedResponse: function (response) { return (response.type === 'search' &&
                expected_1.delete(query_string_1.stringify({ type: 'search', key: response.key, index: response.index, uri: null }))); },
            getMissingResponses: function () { return expected_1; },
        };
    }
    else if (request.type === 'search-count') {
        return {
            isExpectedResponse: function (response) { return (response.type === 'search-count' && response.key === request.key); },
            getMissingResponses: function () { return new Map(); },
        };
    }
    else if (request.type === 'triple') {
        var expected_2 = misc_1.cartesianProd(request.subjects, request.predicates, falcor_1.ranges2List(request.ranges))
            .reduce(function (acc, _a) {
            var subject = _a[0], predicate = _a[1], index = _a[2];
            var response = ({ type: 'triple', subject: subject, predicate: predicate, index: index, object: null });
            acc.set(query_string_1.stringify(response), response);
            return acc;
        }, new Map());
        return {
            isExpectedResponse: function (response) { return (response.type === 'triple' &&
                expected_2.delete(query_string_1.stringify({ type: 'triple', subject: response.subject, predicate: response.predicate, index: response.index, object: null }))); },
            getMissingResponses: function () { return expected_2; },
        };
    }
    else if (request.type === 'triple-count') {
        var expectedSubjects_1 = new Set(request.subjects);
        var expectedPredicates_1 = new Set(request.predicates);
        return {
            isExpectedResponse: function (response) { return (response.type === 'triple-count' && expectedSubjects_1.has(response.subject) && expectedPredicates_1.has(response.predicate)); },
            getMissingResponses: function () { return new Map(); },
        };
    }
    else if (request.type === 'type-list') {
        return {
            isExpectedResponse: function (response) { return (response.type === 'type-list'); },
            getMissingResponses: function () { return new Map(); },
        };
    }
    else if (request.type === 'predicate-list') {
        var expected_3 = new Set(request.resourceTypes);
        return {
            isExpectedResponse: function (response) { return (response.type === 'predicate-list' && expected_3.has(response.resourceType)); },
            getMissingResponses: function () { return new Map(); },
        };
    }
    return misc_1.neverever(request);
};
//# sourceMappingURL=adapter.js.map