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

  export type RouterOptions = {
    debug?: boolean;
    maxPaths?: number;
    maxRefFollow?: number;
  }

  export default class AbstractRouter extends DataSource {

    constructor(routes: Array<Route>, options?: RouterOptions);
    
    /**
     * When a route misses on a call, get, or set the unhandledDataSource will
     * have a chance to fulfill that request.
     **/
    public routeUnhandledPathsTo(dataSource: DataSource): void;
    
    // static createClass(routes?: Array<Route>): typeof Router;
    static createClass(routes: Route[]): typeof Router
  }

  export class Router extends AbstractRouter {
    constructor(options?: RouterOptions);
  }

  export type AbstractRoute = {
    route: string;
  }

  export type CallRouteResult = PathValue | InvalidPath | Array<PathValue | InvalidPath> | JSONGraphEnvelope;

  export type CallRoute<P extends PathSet = PathSet> = AbstractRoute & {
    call(callPath: P, args: Array<any>): CallRouteResult | Promise<CallRouteResult> | Observable<CallRouteResult>;
  }

  export type GetRoute<P extends PathSet = PathSet> = AbstractRoute & {
    get(pathset: P): PathValue | PathValue[] | Promise<PathValue | PathValue[]> | Observable<PathValue | PathValue[]>;
  }

  export type SetRoute = AbstractRoute & {
    set(jsonGraph: JSONGraph): PathValue | PathValue[] | Promise<PathValue | PathValue[]> | Observable<PathValue | PathValue[]>;
  }

  export type Route<P extends PathSet = PathSet> = GetRoute<P> | SetRoute | CallRoute<P>;

  export type Primitive = string | boolean | number | null;

  export type Atom = { $type: 'atom', value: Primitive, $lang?: string, $dataType?: string }

  export type Ref = { $type: 'ref', value: Path }

  export type ErrorSentinel = { $type: 'error', value: { code: string, message: string } }

  export type Sentinel = Atom | Ref | ErrorSentinel

  export type PathValue = {
    path: string | PathSet
    value: Sentinel | Primitive
  }

  export type StandardRange = {
    from: number
    to: number
  }
}
