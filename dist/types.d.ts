import { Observable } from 'rxjs';
import { StandardRange, Primitive } from 'falcor-router';
export declare type Search = {
    type: string;
};
export declare type AdapterAtom = {
    $type: 'atom';
    value: Primitive;
    dataType?: string;
    language?: string;
};
export declare type AdapterError = {
    $type: 'error';
    value: any;
};
export declare type AdapterRef = {
    $type: 'ref';
    value: string;
};
export declare type AdapterSentinel = AdapterAtom | AdapterError | AdapterRef;
export declare type AdapterSearchRequest = {
    type: 'search';
    key: string;
    search: Search;
    ranges: StandardRange[];
};
export declare type AdapterSearchCountRequest = {
    type: 'search-count';
    key: string;
    search: Search;
};
export declare type AdapterTriplesRequest = {
    type: 'triple';
    subjects: string[];
    predicates: string[];
    ranges: StandardRange[];
};
export declare type AdapterTriplesCountRequest = {
    type: 'triple-count';
    subjects: string[];
    predicates: string[];
};
export declare type AdapterTypeListRequest = {
    type: 'type-list';
};
export declare type AdapterPredicateListRequest = {
    type: 'predicate-list';
    resourceTypes: string[];
};
export declare type AdapterRequest = AdapterSearchRequest | AdapterSearchCountRequest | AdapterTriplesRequest | AdapterTriplesCountRequest | AdapterTypeListRequest | AdapterPredicateListRequest;
export declare type AdapterSearchResponse = {
    type: 'search';
    key: string;
    index: number;
    uri: string | null;
};
export declare type AdapterSearchCountResponse = {
    type: 'search-count';
    key: string;
    count: number;
};
export declare type AdapterTripleResponse = {
    type: 'triple';
    subject: string;
    predicate: string;
    index: number;
    object: AdapterSentinel | string | null | undefined;
};
export declare type AdapterTripleCountResponse = {
    type: 'triple-count';
    subject: string;
    predicate: string;
    count: number;
};
export declare type AdapterTypeListResponse = {
    type: 'type-list';
    resourceTypes: Array<{
        uri: string;
        label: string;
        language?: string;
    }>;
};
export declare type AdapterPredicateListResponse = {
    type: 'predicate-list';
    resourceType: string;
    predicates: Array<{
        uri: string;
        label: string;
        range: string;
        language?: string;
    }>;
};
export declare type AdapterResponse = AdapterSearchResponse | AdapterSearchCountResponse | AdapterTripleResponse | AdapterTripleCountResponse | AdapterTypeListResponse | AdapterPredicateListResponse;
export declare type Request2Response<Request extends AdapterRequest> = {
    'search': AdapterSearchResponse;
    'search-count': AdapterSearchCountResponse;
    'triple': AdapterTripleResponse;
    'triple-count': AdapterTripleCountResponse;
    'type-list': AdapterTypeListResponse;
    'predicate-list': AdapterPredicateListResponse;
}[Request['type']];
export declare type AdapterQuery = {
    searches: {
        [searchKey: string]: {
            key: string;
            search: Search;
            ranges: StandardRange[];
            count: boolean;
        };
    };
    resources: {
        [resourcesKey: string]: {
            subjects: string[];
            predicates: string[];
            ranges: StandardRange[];
            count: boolean;
        };
    };
    resourceTypes: {
        list: boolean;
        types: string[];
    };
};
export declare type GraphHandler = <Request extends AdapterRequest = AdapterRequest>(request: Request) => Observable<Request2Response<Request>>;
export declare type GraphAdapter = (query: AdapterQuery) => Observable<AdapterResponse>;
export declare type GraphAdapterQueryHandlers = {
    search(key: string, search: Search, ranges: StandardRange[], count: boolean): Observable<AdapterSearchResponse | AdapterSearchCountResponse>;
    triples(subjects: string[], predicates: string[], ranges: StandardRange[], count: boolean): Observable<AdapterTripleResponse | AdapterTripleCountResponse>;
    getTypes(): Observable<AdapterTypeListResponse>;
    getPredicates(types: string[]): Observable<AdapterPredicateListResponse>;
};
export declare type GraphDescription = {
    key: string;
    domains: RegExp[];
    label?: string;
    handler: GraphHandler;
};
export declare type IJunoRouter = {
    graphs: GraphDescription[];
};
export declare type ValueOf<T> = T[keyof T];
export declare type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
export declare type Override<T, R> = Pick<T, Exclude<keyof T, keyof R>> & R;
