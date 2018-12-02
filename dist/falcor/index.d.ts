/// <reference path="../../src/falcor-router.d.ts" />
/// <reference types="falcor-json-graph" />
import { Route } from 'falcor-router';
import { GraphDescription } from '../types';
export declare const createRouter: () => {
    new (graphs: GraphDescription[]): {
        graphs: GraphDescription[];
        routeUnhandledPathsTo(dataSource: import("falcor").DataSource): void;
        get(pathSets: import("falcor-json-graph").KeySet[][]): import("falcor").Observable<import("falcor-json-graph").JSONGraphEnvelope>;
        set(jsonGraphEnvelope: import("falcor-json-graph").JSONGraphEnvelope): import("falcor").Observable<import("falcor-json-graph").JSONGraphEnvelope>;
        call(functionPath: import("falcor-json-graph").Key[], args?: any[] | undefined, refSuffixes?: import("falcor-json-graph").KeySet[][] | undefined, thisPaths?: import("falcor-json-graph").KeySet[][] | undefined): import("falcor").Observable<import("falcor-json-graph").JSONGraphEnvelope>;
    };
    createClass<T = Route<import("falcor-json-graph").KeySet[], import("falcor-router").Router>>(routes: T[]): typeof import("falcor-router").Router;
};
