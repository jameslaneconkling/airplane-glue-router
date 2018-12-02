"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var query_string_1 = require("query-string");
// TODO - use more robust validation library, like io-ts
exports.parseSearch = function (searchString) {
    var parsed = query_string_1.parse(searchString);
    return !exports.searchIsValid(parsed) ? null : parsed;
};
exports.searchIsValid = function (search) { return typeof search.type === 'string'; };
//# sourceMappingURL=search.js.map