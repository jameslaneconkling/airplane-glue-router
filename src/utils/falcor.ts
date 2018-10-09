import {
  range,
} from 'ramda';
import { StandardRange, Atom } from '../types';


/**
 * Convert falcor range to an array of equivalent indices
 */
export const range2List = ({ from, to }: StandardRange) => range(from, to + 1);

/**
 * Convert falcor range to SQL OFFSET and LIMIT values
 * NOTE: levelGraph limit is fundamentally broken: https://github.com/levelgraph/levelgraph/issues/79
 * https://github.com/levelgraph/levelgraph/commit/86847a41cc2659e25529147ed6eeb688b36a4257#commitcomment-6691590
 * limit will match expected semantics from SQL, and should be used in non levelGraph cases, e.g. takeExactly(db$, limit)
 * levelGraphLimit should be used with levelGraph
 */
export const range2LimitOffset = ({ from, to }: StandardRange) => ({ offset: from, limit: to + 1 - from, levelGraphLimit: to + 1 });

export const $atom = (value: any, dataType?: string, lang?: string) => {
  const atom: Atom = { $type: 'atom', value };

  if (dataType && dataType !== 'xsd:string') {
    atom.$dataType = dataType;
  }

  if (lang) {
    atom.$lang = lang;
  }

  return atom;
};
export const $ref = (value: string[]) => ({ $type: 'ref', value });
export const $error = (value: any) => ({ $type: 'error', value });
