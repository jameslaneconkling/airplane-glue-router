import { Observable } from "rxjs";
import { reduce } from "rxjs/operators";


// given a list of values, returns an operator that emits a set of all values not included in the observable it operates on
export const difference = <T, R>(from: R[], id: (item: T) => R) => reduce<T, Set<R>>((acc, item) => {
  acc.delete(id(item));
  return acc;
}, new Set(from));


// from Reactive-Extensions (rx v4) rx-node.fromStream()
// https://github.com/Reactive-Extensions/rx-node/blob/master/index.js
export const fromStream = <T>(stream: NodeJS.ReadableStream): Observable<T> => {
  stream.pause();

  return new Observable((observer) => {
    // console.log('db');
    const dataHandler = (data) => observer.next(data);
    const errorHandler = (err) => observer.error(err);
    const endHandler = () => observer.complete();

    stream.addListener('data', dataHandler);
    stream.addListener('error', errorHandler);
    stream.addListener('end', endHandler);

    stream.resume();

    return () => {
      stream.removeListener('data', dataHandler);
      stream.removeListener('error', errorHandler);
      stream.removeListener('end', endHandler);
    };
  });
};
