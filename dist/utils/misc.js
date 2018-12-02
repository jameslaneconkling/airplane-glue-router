"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ramda_1 = require("ramda");
exports.noop = function () { }; /* tslint:disable-line no-empty */
exports.cartesianProd = function (a, b, c) { return (ramda_1.xprod(a, b).reduce(function (acc, list) {
    c.forEach(function (item) { return acc.push(list.concat([item])); });
    return acc;
}, [])); };
exports.neverever = function (never) { return never; };
//# sourceMappingURL=misc.js.map