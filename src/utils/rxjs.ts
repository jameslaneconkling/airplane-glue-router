import { Observable, range, Observer, concat, merge, from } from "rxjs";
import { count, map, mergeMap, reduce } from "rxjs/operators";

// export const takeExactly = (count: number) => <T>(source$: Observable<T>) => concat(
//   source$,
//   range(0, count)
// ).pipe(take(count));

export const pad = <T>(n: number, project: (index: number) => T) => <R>(source$: Observable<R>) => merge(
  source$,
  source$.pipe(
    count(),
    mergeMap((sourceLength) => range(sourceLength, n - sourceLength)),
    map(project),
  )
);

// TODO - would be a lot easier to handle this natively in Router
export const mapMissing = <T, R, A>(expected: R[], id: (item: T) => R, project: (item: R) => A) => (source$: Observable<T>) => merge(
  source$,
  source$.pipe(
    reduce<T, Set<R>>((acc, item) => {
      acc.delete(id(item));
      return acc;
    }, new Set(expected)),
    mergeMap((missing) => Array.from(missing.values()).map(project))
  )
);


// from Reactive-Extensions (rx v4) rx-node.fromStream()
// https://github.com/Reactive-Extensions/rx-node/blob/master/index.js
export const fromStream = <T>(stream: NodeJS.ReadableStream): Observable<T> => {
  stream.pause();

  return new Observable((observer) => {
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
