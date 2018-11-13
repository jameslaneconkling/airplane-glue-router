import { Observable } from 'rxjs';
import { StandardRange, Primitive } from 'falcor-router';


export type ContextMap = {
  [prefix: string]: string
}

export type Search = {
  type: string
}

export type SearchResponse = { uri: string, index: number };
export type SearchCountResponse = { count: number };
export type TripleResponse = { subject: string, predicate: string, index: number, object: AdapterSentinel | string | null | undefined };
export type TripleCountResponse = { subject: string, predicate: string, count: number };

export type RouterMeta = { [key: string]: any };
export type IJunoRouter = {
  meta: RouterMeta
  graphs: InitializedGraphDescription[]
};


export type InitializedAdapter = {
  search(search: Search, ranges: StandardRange[]): Observable<SearchResponse>
  // search(search: Search, ranges: StandardRange[]): Observable<SearchResponse | TripleResponse> // TODO - allow for optimistic response: needs test coverage
  searchCount(search: Search): Observable<SearchCountResponse>
  searchWithCount?(search: Search, ranges: StandardRange[]): Observable<SearchResponse | TripleResponse | SearchCountResponse>
  triples(subjects: string[], predicates: string[], ranges: StandardRange[]): Observable<TripleResponse>
  triplesCount(subjects: string[], predicates: string[]): Observable<TripleCountResponse>
  triplesWithCount?(subjects: string[], predicates: string[]): Observable<TripleResponse | SearchCountResponse>
}

export type Adapter = () => InitializedAdapter;


export type AdapterAtom = { $type: 'atom', value: Primitive, dataType?: string, language?: string }
export type AdapterError = { $type: 'error', value: any }
export type AdapterRef = { $type: 'ref', value: string }
export type AdapterSentinel = AdapterAtom | AdapterError | AdapterRef


export type GraphDescription = {
  key: string,
  domains: RegExp[],
  label?: string,
}

export type UninitializedGraphDescription = GraphDescription & {
  adapter: Adapter,
}

export type InitializedGraphDescription = GraphDescription & {
  adapter: InitializedAdapter,
}
