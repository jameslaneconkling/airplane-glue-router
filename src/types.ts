import { Observable } from 'rxjs';
import { StandardRange, Primitive } from 'falcor-router';


export type ContextMap = {
  [prefix: string]: string
}

export type Search = {
  type: string
}

/*
TODO
- what should adapter handlers return?
  - pathValues would allow them to pre-emptively return more, e.g. type and label
  - but they presume a path, which an adapter might not need to know about
- how to define an adapter search handler to handle multiple graphs
 */
export type Adapter = {
  search(search: Search, ranges: StandardRange[]): Observable<{ uri: string, index: number }>
  searchCount(search: Search): Observable<{ count: number }>
  triples(subjects: string[], predicates: string[], ranges: StandardRange[]):
    Observable<{ subject: string, predicate: string, index: number, object: AdapterSentinel | string | null | undefined }>
  // one approach to allow add-hoc pathValues: return grouped stream
  // search(collection: Search, ranges: StandardRange[]): Observable<[
  //   Observable<{ index: number, uri: string }>,
  //   Observable<PathValue>
  // ]>
}


export type AdapterAtom = { $type: 'atom', value: Primitive, dataType?: string, language?: string }
export type AdapterError = { $type: 'error', value: any }
export type AdapterRef = { $type: 'ref', value: string }
export type AdapterSentinel = AdapterAtom | AdapterError | AdapterRef


export type GraphDescription = {
  key: string,
  domains: RegExp[],
  adapter: Adapter,
  label?: string,
}
