"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ramda_1 = require("ramda");
/**
 * Convert falcor range to an array of equivalent indices
 */
exports.range2List = function (_a) {
    var from = _a.from, to = _a.to;
    return ramda_1.range(from, to + 1);
};
exports.ranges2List = function (ranges) { return ramda_1.unnest(ranges.map(exports.range2List)); };
exports.expandTriples = function (subjects, predicates, ranges) {
    return ramda_1.xprod(subjects, predicates)
        .reduce(function (acc, _a) {
        var subject = _a[0], predicate = _a[1];
        exports.ranges2List(ranges).forEach(function (index) { return acc.push({ subject: subject, predicate: predicate, index: index }); });
        return acc;
    }, []);
};
/**
 * Convert falcor range to SQL OFFSET and LIMIT values
 * NOTE: levelGraph limit is fundamentally broken: https://github.com/levelgraph/levelgraph/issues/79
 * https://github.com/levelgraph/levelgraph/commit/86847a41cc2659e25529147ed6eeb688b36a4257#commitcomment-6691590
 * limit will match expected semantics from SQL, and should be used in non levelGraph cases, e.g. takeExactly(db$, limit)
 * levelGraphLimit should be used with levelGraph
 */
exports.range2LimitOffset = function (_a) {
    var from = _a.from, to = _a.to;
    return ({ offset: from, limit: to + 1 - from, levelGraphLimit: to + 1 });
};
exports.$atom = function (value, dataType, language) {
    var atom = { $type: 'atom', value: value };
    if (dataType && dataType !== 'xsd:string') {
        atom.$dataType = dataType;
    }
    if (language) {
        atom.$lang = language;
    }
    return atom;
};
exports.$ref = function (value) { return ({ $type: 'ref', value: value }); };
exports.$error = function (code, message) { return ({ $type: 'error', value: { code: code, message: message } }); };
//# sourceMappingURL=falcor.js.map