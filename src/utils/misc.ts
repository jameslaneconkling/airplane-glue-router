import { xprod } from "ramda";

export const noop = () => {}; /* tslint:disable-line no-empty */

export const cartesianProd = <A, B, C>(a: A[], b: B[], c: C[]) => (
  xprod(a, b).reduce<Array<[A, B, C]>>((acc, list) => {
    c.forEach((item) => acc.push([...list, item] as [A, B, C]))
    return acc;
  }, [])
);

