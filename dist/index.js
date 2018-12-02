"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var falcor_1 = require("./falcor");
exports.createRouter = falcor_1.createRouter;
var adapter_1 = require("./adapters/adapter");
exports.createGraph = adapter_1.createGraph;
exports.createHandlerAdapter = adapter_1.createHandlerAdapter;
exports.AbstractGraphAdapterQueryHandlers = adapter_1.AbstractGraphAdapterQueryHandlers;
var memory_1 = require("./adapters/memory");
exports.MemoryGraphAdapter = memory_1.MemoryGraphAdapter;
//# sourceMappingURL=index.js.map