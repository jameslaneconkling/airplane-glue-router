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
        PathValue,
        InvalidPath,
        JSONGraph,
        JSONEnvelope,
        JSONGraphEnvelope
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
    
        interface AbstractRoute {
            route: string;
        }
    
        interface CallRoute<P extends PathSet = PathSet> extends AbstractRoute {
            call(callPath: P, args: Array<any>): CallRouteResult | Promise<CallRouteResult> | Observable<CallRouteResult>;
        }
    
        interface GetRoute<P extends PathSet = PathSet> extends AbstractRoute {
            // get(pathset: PathSet): RouteResult | Promise<RouteResult> | Observable<RouteResult>;
            get(pathset: P): RouteResult | Promise<RouteResult> | Observable<RouteResult>;
        }
    
        interface SetRoute extends AbstractRoute {
            set(jsonGraph: JSONGraph): RouteResult | Promise<RouteResult> | Observable<RouteResult>;
        }
    
        type Route<P extends PathSet = PathSet> = GetRoute<P> | SetRoute | CallRoute<P>;
        type RouteResult = PathValue | Array<PathValue> | JSONEnvelope<any>;
        type CallRouteResult = PathValue | InvalidPath | Array<PathValue | InvalidPath> | JSONGraphEnvelope;
    
        interface RouterOptions {
            debug?: boolean;
            maxPaths?: number;
            maxRefFollow?: number;
        }
    }
    
    export = FalcorRouter;
}
