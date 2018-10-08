import Falcor, { Range } from 'falcor';
import { ObservableInput } from 'rxjs';


export type ContextMap = {
  [prefix: string]: string
}

// export type Collection = {
//   type: string
// }

/*
TODO
- what should adapter handlers return?
  - pathValues would allow them to pre-emptively return more, e.g. type and label
  - but they presume a path, which an adapter might not need to know about
- how to define an adapter search handler to handle multiple graphs
 */
export type Adapter = {
  search(collections: string[], ranges: DefaultRange[]): ObservableInput<{}>
  // getTriples(subjects: string[], predicates: string[], ranges: DefaultRange[]): ObservableInput<{}>
}

export type GraphAdapter = {
  name?: string,
  domains: RegExp[],
  adapter: Adapter
};

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

export type DefaultRange = Range & {
  from: number,
  to: number
}
