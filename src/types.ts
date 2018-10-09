import Falcor from 'falcor';
import { Observable } from 'rxjs';


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
  search(collection: Search, ranges: StandardRange[]): Observable<{ index: number, uri: string }>
  // one approach to allow add-hoc pathValues: return grouped stream
  // search(collection: Search, ranges: StandardRange[]): Observable<[
  //   Observable<{ index: number, uri: string }>,
  //   Observable<PathValue>
  // ]>
  // getTriples(subjects: string[], predicates: string[], ranges: StandardRange[]): Observable<{}>
}

export type NamedGraphAdapter = AnonymousGraphAdapter & {
  key: string,
  label: string,
}

export type AnonymousGraphAdapter = {
  domains: RegExp[],
  adapter: Adapter
}

export type GraphAdapter = NamedGraphAdapter | AnonymousGraphAdapter

export type URI = {
  value: string
  prefix?: string
  suffix?: string
  curie?: string
}

export type Literal = {
  literal: string
  value: string
  language?: string
  dataType: string
}

export type Atom = Falcor.Atom & { $lang?: string, $dataType?: string }

export type StandardRange = {
  from: number,
  to: number
}
