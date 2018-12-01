import {
  range, unnest, xprod,
} from 'ramda';
import { Path } from 'falcor';
import { StandardRange, Atom, Ref, ErrorSentinel, Primitive } from 'falcor-router';


/**
 * Convert falcor range to an array of equivalent indices
 */
export const range2List = ({ from, to }: StandardRange): number[] => range(from, to + 1);

export const ranges2List = (ranges: StandardRange[]): number[] => unnest(ranges.map(range2List));

export const expandTriples = (
  subjects: string[], predicates: string[], ranges: StandardRange[]
): Array<{ subject: string, predicate: string, index: number }> => {
  return xprod(subjects, predicates)
    .reduce<Array<{ subject: string, predicate: string, index: number }>>((acc, [subject, predicate]) => {
      ranges2List(ranges).forEach((index) => acc.push({ subject, predicate, index }));
      return acc;
    }, []);
};

/**
 * Convert falcor range to SQL OFFSET and LIMIT values
 * NOTE: levelGraph limit is fundamentally broken: https://github.com/levelgraph/levelgraph/issues/79
 * https://github.com/levelgraph/levelgraph/commit/86847a41cc2659e25529147ed6eeb688b36a4257#commitcomment-6691590
 * limit will match expected semantics from SQL, and should be used in non levelGraph cases, e.g. takeExactly(db$, limit)
 * levelGraphLimit should be used with levelGraph
 */
export const range2LimitOffset = ({ from, to }: StandardRange) => ({ offset: from, limit: to + 1 - from, levelGraphLimit: to + 1 });

export const $atom = (value: any, dataType?: string, language?: string): Atom => {
  const atom: Atom = { $type: 'atom', value };

  if (dataType && dataType !== 'xsd:string') {
    atom.$dataType = dataType;
  }

  if (language) {
    atom.$lang = language;
  }

  return atom;
};
export const $ref = (value: Path): Ref => ({ $type: 'ref', value });
export const $error = (code, message): ErrorSentinel => ({ $type: 'error', value: { code, message } });
