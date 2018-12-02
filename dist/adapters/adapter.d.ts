import { GraphDescription, AdapterResponse, AdapterQuery, AdapterRequest, GraphAdapterQueryHandlers, GraphAdapter, GraphHandler, AdapterSearchResponse, AdapterSearchCountResponse, AdapterTripleResponse, AdapterTripleCountResponse, Search, AdapterTypeListResponse, AdapterPredicateListResponse } from '../types';
import { Observable } from 'rxjs';
import { StandardRange } from "falcor-router";
export declare class AbstractGraphAdapterQueryHandlers implements GraphAdapterQueryHandlers {
    search(_searchKey: string, _serach: Search, _ranges: StandardRange[], _count: boolean): Observable<AdapterSearchResponse | AdapterSearchCountResponse>;
    triples(_subjects: string[], _predicates: string[], _ranges: StandardRange[], _count: boolean): Observable<AdapterTripleResponse | AdapterTripleCountResponse>;
    getTypes(): Observable<AdapterTypeListResponse>;
    getPredicates(_types: string[]): Observable<AdapterPredicateListResponse>;
}
export declare const requestReducer: (query: AdapterQuery, request: AdapterRequest) => AdapterQuery;
export declare const createGraphHandler: (graphAdapter: GraphAdapter) => GraphHandler;
export declare const createGraph: (graphAdapter: GraphAdapter, { key, domains, label }: {
    key: string;
    domains: RegExp[];
    label?: string | undefined;
}) => GraphDescription;
export declare const createHandlerAdapter: (adapter: GraphAdapterQueryHandlers) => GraphAdapter;
export declare const matchKey: (graphs: GraphDescription[], adapterKey: string) => GraphDescription | undefined;
export declare const matchDomain: (graphs: GraphDescription[], domainName: string) => GraphDescription | undefined;
export declare const missingGraph: unique symbol;
export declare const groupUrisByGraph: (graphs: GraphDescription[], subjects: string[]) => {
    handler: GraphHandler;
    subjects: string[];
    key: string;
}[];
export declare const expectedResponses: <Request extends AdapterRequest>(request: AdapterRequest) => {
    isExpectedResponse: (response: AdapterResponse) => response is {
        'search': AdapterSearchResponse;
        'search-count': AdapterSearchCountResponse;
        'triple': AdapterTripleResponse;
        'triple-count': AdapterTripleCountResponse;
        'type-list': AdapterTypeListResponse;
        'predicate-list': AdapterPredicateListResponse;
    }[Request["type"]];
    getMissingResponses: () => Map<string, {
        'search': AdapterSearchResponse;
        'search-count': AdapterSearchCountResponse;
        'triple': AdapterTripleResponse;
        'triple-count': AdapterTripleCountResponse;
        'type-list': AdapterTypeListResponse;
        'predicate-list': AdapterPredicateListResponse;
    }[Request["type"]]>;
};
