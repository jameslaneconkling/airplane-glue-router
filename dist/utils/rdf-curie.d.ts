import { AdapterSentinel } from "../types";
import { ContextMap } from './rdf';
export declare const uri2Curie: (context: ContextMap, uri: string) => string;
export declare const curie2URI: (context: ContextMap, curie: string) => string;
export declare const URI: {
    falcor2Adapter: (context: ContextMap, uri: string) => string;
    adapter2Falcor: (context: ContextMap, uri: string) => string;
};
export declare const OBJECT: {
    falcor2Adapter: (context: ContextMap, sentinel: AdapterSentinel) => string | null;
    adapter2Falcor: (context: ContextMap, object: string | null | undefined) => AdapterSentinel;
};
