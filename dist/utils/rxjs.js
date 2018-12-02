"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var rxjs_1 = require("rxjs");
var operators_1 = require("rxjs/operators");
// given a list of values, returns an operator that emits a set of all values not included in the observable it operates on
exports.difference = function (from, id) { return operators_1.reduce(function (acc, item) {
    acc.delete(id(item));
    return acc;
}, new Set(from)); };
// from Reactive-Extensions (rx v4) rx-node.fromStream()
// https://github.com/Reactive-Extensions/rx-node/blob/master/index.js
exports.fromStream = function (stream) {
    stream.pause();
    return new rxjs_1.Observable(function (observer) {
        // console.log('db');
        var dataHandler = function (data) { return observer.next(data); };
        var errorHandler = function (err) { return observer.error(err); };
        var endHandler = function () { return observer.complete(); };
        stream.addListener('data', dataHandler);
        stream.addListener('error', errorHandler);
        stream.addListener('end', endHandler);
        stream.resume();
        return function () {
            stream.removeListener('data', dataHandler);
            stream.removeListener('error', errorHandler);
            stream.removeListener('end', endHandler);
        };
    });
};
//# sourceMappingURL=rxjs.js.map