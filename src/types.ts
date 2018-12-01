import { Observable } from 'rxjs';
import { StandardRange, Primitive } from 'falcor-router';


export type Search = {
  type: string
}


export type AdapterAtom = { $type: 'atom', value: Primitive, dataType?: string, language?: string }
export type AdapterError = { $type: 'error', value: any }
export type AdapterRef = { $type: 'ref', value: string }
export type AdapterSentinel = AdapterAtom | AdapterError | AdapterRef


export type AdapterSearchRequest = { type: 'search', key: string, search: Search, ranges: StandardRange[] }
export type AdapterSearchCountRequest = { type: 'search-count', key: string, search: Search }
export type AdapterTriplesRequest = { type: 'triple', subjects: string[], predicates: string[], ranges: StandardRange[] }
export type AdapterTriplesCountRequest = { type: 'triple-count', subjects: string[], predicates: string[] }
export type AdapterTypeListRequest = { type: 'type-list' }
export type AdapterPredicateListRequest = { type: 'predicate-list', resourceTypes: string[] }
export type AdapterRequest = AdapterSearchRequest | AdapterSearchCountRequest | AdapterTriplesRequest | AdapterTriplesCountRequest | AdapterTypeListRequest | AdapterPredicateListRequest;

export type AdapterSearchResponse = { type: 'search', key: string, index: number, uri: string | null }
export type AdapterSearchCountResponse = { type: 'search-count', key: string, count: number }
export type AdapterTripleResponse = { type: 'triple', subject: string, predicate: string, index: number, object: AdapterSentinel | string | null | undefined }
export type AdapterTripleCountResponse = { type: 'triple-count', subject: string, predicate: string, count: number }
export type AdapterTypeListResponse = { type: 'type-list', resourceTypes: Array<{ uri: string, label: string, language?: string }> }
export type AdapterPredicateListResponse = { type: 'predicate-list', resourceType: string, predicates: Array<{ uri: string, label: string, range: string, language?: string }> }
export type AdapterResponse = AdapterSearchResponse | AdapterSearchCountResponse | AdapterTripleResponse | AdapterTripleCountResponse | AdapterTypeListResponse | AdapterPredicateListResponse

export type Request2Response<Request extends AdapterRequest> = {
  'search': AdapterSearchResponse
  'search-count': AdapterSearchCountResponse
  'triple': AdapterTripleResponse
  'triple-count': AdapterTripleCountResponse
  'type-list': AdapterTypeListResponse
  'predicate-list': AdapterPredicateListResponse
}[Request['type']];


/*
# alternative AdapterQuery formats


```
[
  { search: Search, ranges?: StandardRange[], count?: true },
  { subjects: string[], predicates: string[], ranges: StandardRange[], count?: true }
]
```

- or a graphQL-esque path syntax
```
{
  search: {
    length: null,
    [ranges]: {
      field: {
        [ranges]: null
        length: null,
      }
    }
  }
}
```

- or a falcor path syntax
```
[
  [graph, key, search, range, predicates, range],
  [resource, uri, predicates, range]
]
```
 */
export type AdapterQuery = {
  searches: {
    [searchKey: string]: { key: string, search: Search, ranges: StandardRange[], count: boolean }
  },
  resources: {
    [resourcesKey: string]: { subjects: string[], predicates: string[], ranges: StandardRange[], count: boolean }
  },
  resourceTypes: {
    list: boolean,
    types: string[]
  }
};

export type GraphHandler = <Request extends AdapterRequest = AdapterRequest>(
  request: Request
) => Observable<Request2Response<Request>>;

export type GraphAdapter = (query: AdapterQuery) => Observable<AdapterResponse>;


export type GraphAdapterQueryHandlers = {
  search(
    key: string, search: Search, ranges: StandardRange[], count: boolean
  ): Observable<AdapterSearchResponse | AdapterSearchCountResponse>
  // TODO - how to handle optimistic responses from search?  Needs a new AdapterSearchTripleResponse?
  // could just use AdapterTripleResponse if the handler wouldn't filter them out
  // search(
  //   query: { key: string, search: Search, ranges: StandardRange[], count: boolean }
  // ): Observable<AdapterSearchResponse | AdapterSearchCountResponse | AdapterTripleResponse>
  triples(
    subjects: string[], predicates: string[], ranges: StandardRange[], count: boolean
  ): Observable<AdapterTripleResponse | AdapterTripleCountResponse>
  getTypes(): Observable<AdapterTypeListResponse>
  getPredicates(types: string[]): Observable<AdapterPredicateListResponse>
}


export type GraphDescription = {
  key: string,
  domains: RegExp[],
  label?: string,
  handler: GraphHandler,
}

export type IJunoRouter = {
  graphs: GraphDescription[]
};


export type ValueOf<T> = T[keyof T];

export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>

export type Override<T, R> = Pick<T, Exclude<keyof T, keyof R>> & R;
