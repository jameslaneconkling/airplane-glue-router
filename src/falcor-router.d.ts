// TODO - contribute pull request to https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/falcor-router/index.d.ts
// Type definitions for falcor-router 0.4.0
// Project: https://github.com/Netflix/falcor-router
// Definitions by: Quramy <https://github.com/Quramy>, cdhgee <https://github.com/cdhgee>
// Definitions: https://github.com/borisyankov/DefinitelyTyped
/// <reference types="falcor" />

declare module 'falcor-router' {
    import { DataSource } from 'falcor';
    import {
        PathSet,
        InvalidPath,
        JSONGraph,
        JSONEnvelope,
        JSONGraphEnvelope,
        Path
    } from 'falcor-json-graph';
    import { Observable } from 'rxjs';

    class FalcorRouter extends DataSource {

        constructor(routes: Array<FalcorRouter.Route>, options?: FalcorRouter.RouterOptions);
    
        /**
         * When a route misses on a call, get, or set the unhandledDataSource will
         * have a chance to fulfill that request.
         **/
        routeUnhandledPathsTo(dataSource: DataSource): void;
    
        static createClass(routes?: Array<FalcorRouter.Route>): typeof FalcorRouter.CreatedRouter;
    }
    
    namespace FalcorRouter {
    
        class CreatedRouter extends FalcorRouter {
            constructor(options?: RouterOptions);
        }
    
        type AbstractRoute = {
            route: string;
        }
    
        type CallRouteResult = PathValue | InvalidPath | Array<PathValue | InvalidPath> | JSONGraphEnvelope;

        type CallRoute<P extends PathSet = PathSet> = AbstractRoute & {
            call(callPath: P, args: Array<any>): CallRouteResult | Promise<CallRouteResult> | Observable<CallRouteResult>;
        }
    
        type GetRoute<P extends PathSet = PathSet> = AbstractRoute & {
            get(pathset: P): PathValue | PathValue[] | Promise<PathValue | PathValue[]> | Observable<PathValue | PathValue[]>;
        }
    
        type SetRoute = AbstractRoute & {
            set(jsonGraph: JSONGraph): PathValue | PathValue[] | Promise<PathValue | PathValue[]> | Observable<PathValue | PathValue[]>;
        }
    
        type Route<P extends PathSet = PathSet> = GetRoute<P> | SetRoute | CallRoute<P>;
    
        interface RouterOptions {
            debug?: boolean;
            maxPaths?: number;
            maxRefFollow?: number;
        }

        type Primitive = string | boolean | number | null;

        type Atom = { $type: 'atom', value: Primitive, $lang?: string, $dataType?: string }
        
        type Ref = { $type: 'ref', value: Path }
        
        type ErrorSentinel = { $type: 'error', value: { code: string, message: string } }
        
        type Sentinel = Atom | Ref | ErrorSentinel
        
        type PathValue = {
          path: string | PathSet
          value: Sentinel | Primitive
        }

        type StandardRange = {
          from: number
          to: number
        }
    }
    
    export = FalcorRouter;
}
