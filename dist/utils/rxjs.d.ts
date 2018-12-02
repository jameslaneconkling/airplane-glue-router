/// <reference types="node" />
import { Observable } from "rxjs";
export declare const difference: <T, R>(from: R[], id: (item: T) => R) => import("rxjs/internal/types").OperatorFunction<T, Set<R>>;
export declare const fromStream: <T>(stream: NodeJS.ReadableStream) => Observable<T>;
