import { Search, GraphAdapterQueryHandlers, AdapterSearchResponse, AdapterSearchCountResponse, AdapterTripleResponse, AdapterTripleCountResponse, AdapterPredicateListResponse, AdapterTypeListResponse } from '../types';
import { StandardRange } from 'falcor-router';
declare type LevelGraph = {
    [method: string]: any;
};
declare type RequestMetadata = {
    user: string;
};
export declare class MemoryGraphAdapter implements GraphAdapterQueryHandlers {
    private db;
    private request;
    constructor(db: LevelGraph, request: RequestMetadata);
    static createAdapter(n3: string): Promise<LevelGraph>;
    search(key: string, search: Search, ranges: StandardRange[], count: boolean): import("rxjs/internal/Observable").Observable<AdapterSearchResponse | AdapterSearchCountResponse>;
    triples(subjects: string[], predicates: string[], ranges: StandardRange[], count: boolean): import("rxjs/internal/Observable").Observable<AdapterTripleResponse | AdapterTripleCountResponse>;
    getTypes(): import("rxjs/internal/Observable").Observable<AdapterTypeListResponse>;
    getPredicates(types: string[]): import("rxjs/internal/Observable").Observable<AdapterPredicateListResponse>;
}
export {};
