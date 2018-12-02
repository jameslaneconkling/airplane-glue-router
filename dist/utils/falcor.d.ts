/// <reference types="falcor-json-graph" />
import { StandardRange, Atom, Ref, ErrorSentinel } from 'falcor-router';
/**
 * Convert falcor range to an array of equivalent indices
 */
export declare const range2List: ({ from, to }: StandardRange) => number[];
export declare const ranges2List: (ranges: StandardRange[]) => number[];
export declare const expandTriples: (subjects: string[], predicates: string[], ranges: StandardRange[]) => {
    subject: string;
    predicate: string;
    index: number;
}[];
/**
 * Convert falcor range to SQL OFFSET and LIMIT values
 * NOTE: levelGraph limit is fundamentally broken: https://github.com/levelgraph/levelgraph/issues/79
 * https://github.com/levelgraph/levelgraph/commit/86847a41cc2659e25529147ed6eeb688b36a4257#commitcomment-6691590
 * limit will match expected semantics from SQL, and should be used in non levelGraph cases, e.g. takeExactly(db$, limit)
 * levelGraphLimit should be used with levelGraph
 */
export declare const range2LimitOffset: ({ from, to }: StandardRange) => {
    offset: number;
    limit: number;
    levelGraphLimit: number;
};
export declare const $atom: (value: any, dataType?: string | undefined, language?: string | undefined) => Atom;
export declare const $ref: (value: import("falcor-json-graph").Key[]) => Ref;
export declare const $error: (code: any, message: any) => ErrorSentinel;
