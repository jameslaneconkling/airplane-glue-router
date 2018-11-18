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
export type AdapterTriplesRequest = { type: 'triples', subjects: string[], predicates: string[], ranges: StandardRange[] }
export type AdapterTriplesCountRequest = { type: 'triples-count', subjects: string[], predicates: string[] }
export type AdapterRequest = AdapterSearchRequest | AdapterSearchCountRequest | AdapterTriplesRequest | AdapterTriplesCountRequest;

export type AdapterQuery = {
  searches: {
    [searchKey: string]: { search: Search, ranges: StandardRange[], count: boolean }
  },
  resources: {
    [resourcesKey: string]: { subjects: string[], predicates: string[], ranges: StandardRange[], count: boolean }
  }
};

export type AdapterSearchResponse = { type: 'search', key: string, index: number, uri: string | null }
export type AdapterSearchCountResponse = { type: 'search-count', key: string, count: number }
export type AdapterTripleResponse = { type: 'triple', subject: string, predicate: string, index: number, object: AdapterSentinel | string | null | undefined }
export type AdapterTripleCountResponse = { type: 'triple-count', subject: string, predicate: string, count: number }
export type AdapterResponse = AdapterSearchResponse | AdapterSearchCountResponse | AdapterTripleResponse | AdapterTripleCountResponse

export type GraphHandler = (request: AdapterRequest) => Observable<AdapterResponse>;

export type GraphAdapter = (query: AdapterQuery) => Observable<AdapterResponse>;

export type GraphAdapterQueryHandlers = {
  search(key: string, search: Search, ranges: StandardRange[]): Observable<AdapterSearchResponse>
  // search(key: string, search: Search, ranges: StandardRange[]): Observable<AdapterSearchResponse | AdapterTripleResponse>
  searchCount(key: string, search: Search): Observable<AdapterSearchCountResponse>
  triples(subjects: string[], predicates: string[], ranges: StandardRange[]): Observable<AdapterTripleResponse>
  triplesCount(subjects: string[], predicates: string[]): Observable<AdapterTripleCountResponse>
  searchWithCount(key: string, search: Search, ranges: StandardRange[]): Observable<AdapterSearchResponse | AdapterSearchCountResponse>
  // searchWithCount(search: Search, ranges: StandardRange[]): Observable<AdapterSearchResponse | AdapterTripleResponse | AdapterSearchCountResponse>
  triplesWithCount(subjects: string[], predicates: string[], ranges: StandardRange[]): Observable<AdapterTripleResponse | AdapterTripleCountResponse>
}


export type GraphDescription = {
  key: string,
  domains: RegExp[],
  label?: string,
  handler: (request: AdapterRequest) => Observable<AdapterResponse>,
}

export type IJunoRouter = {
  graphs: GraphDescription[]
};


export type ValueOf<T> = T[keyof T];
