import { Observable, concat, range, Observer } from "rxjs";
import { take } from "rxjs/operators";

export const takeExactly = (count: number) => <T>(source$: Observable<T>) => concat(
  source$,
  range(0, count)
).pipe(take(count));

// from Reactive-Extensions (rx v4) rx-node.fromStream()
// https://github.com/Reactive-Extensions/rx-node/blob/master/index.js
export const fromNodeStream = <T>(stream: NodeJS.ReadableStream) => {
  stream.pause();

  return Observable.create((observer: Observer<T>) => {
    const dataHandler = (data: T) => observer.next(data);
    const errorHandler = (err: any) => observer.error(err);
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
  }).share();
};
