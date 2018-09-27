import Falcor from 'falcor';


export type ContextMap = {
  [prefix: string]: string
}

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

export type NormalizedRange = {
  from: number,
  to: number
}
