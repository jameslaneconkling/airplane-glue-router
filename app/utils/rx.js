const Observable = require('rxjs/Observable').Observable;
require('rxjs/add/operator/share');
require('rxjs/add/operator/take');
require('rxjs/add/observable/range');
require('rxjs/add/observable/concat');


// from Reactive-Extensions (rx v4) rx-node.fromStream()
//https://github.com/Reactive-Extensions/rx-node/blob/master/index.js
exports.fromNodeStream = stream => {
  stream.pause();

  return Observable.create(observer => {
    const dataHandler = data => observer.next(data);
    const errorHandler = err => observer.error(err);
    const endHandler = () => observer.complete();

    stream.addListener('data', dataHandler);
    stream.addListener('error', errorHandler);
    stream.addListener('end', endHandler);

    stream.resume();

    return function () {
      stream.removeListener('data', dataHandler);
      stream.removeListener('error', errorHandler);
      stream.removeListener('end', endHandler);
    };
  }).share();
};

exports.takeExactly = (source$, count) =>
  Observable.concat(source$, Observable.range(0, count)).take(count);
