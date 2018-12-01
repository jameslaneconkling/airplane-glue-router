import test from 'tape';
import { of } from 'rxjs';
import { StandardRange } from 'falcor-router';
import { assertFailure, context } from '../utils/setup';
import { AdapterSearchCountResponse, AdapterSearchResponse, AdapterTripleResponse, AdapterTripleCountResponse } from '../../src/types';
import { AbstractGraphAdapterQueryHandlers, createGraphHandler, createHandlerAdapter } from '../../src/adapters/adapter';
import { ranges2List } from '../../src/utils/falcor';
import { stringify } from 'query-string';
import { cartesianProd } from '../../src/utils/misc';
import { toArray } from 'rxjs/operators';


test('[Graph Handler] Should batch concurrant calls to search if search is the same', (assert) => {
  assert.plan(5);

  let i = 0;

  class Adapter extends AbstractGraphAdapterQueryHandlers {
    public search(key, _, ranges: StandardRange[]) {
      assert.equal(++i, 1, 'should request search exactly once');

      return of<AdapterSearchResponse | AdapterSearchCountResponse>(
        { type: 'search-count', key, count: 100 },
        ...ranges2List(ranges).map<AdapterSearchResponse>((index) => ({
          type: 'search', key, uri: `http://junonetwork.com/test/${index}`, index,
        }))
      );
    }
  }


  const graphHandler = createGraphHandler(createHandlerAdapter(new Adapter()));
  const search = { type: 'ABC' };

  graphHandler({ type: 'search', key: stringify(search), search, ranges: [{ from: 2, to: 4 }] })
    .pipe(toArray())
    .subscribe(
      (result) => assert.deepEqual(result, [
        { type: 'search', key: stringify(search), uri: 'http://junonetwork.com/test/2', index: 2 },
        { type: 'search', key: stringify(search), uri: 'http://junonetwork.com/test/3', index: 3 },
        { type: 'search', key: stringify(search), uri: 'http://junonetwork.com/test/4', index: 4 },
      ]),
      assertFailure(assert)
    );

  graphHandler({ type: 'search', key: stringify(search), search, ranges: [{ from: 10, to: 12 }] })
    .pipe(toArray())
    .subscribe(
      (result) => assert.deepEqual(result, [
        { type: 'search', key: stringify(search), uri: 'http://junonetwork.com/test/10', index: 10 },
        { type: 'search', key: stringify(search), uri: 'http://junonetwork.com/test/11', index: 11 },
        { type: 'search', key: stringify(search), uri: 'http://junonetwork.com/test/12', index: 12 },
      ]),
      assertFailure(assert)
    );

  graphHandler({ type: 'search-count', key: stringify(search), search })
    .subscribe(
      (result) => assert.deepEqual(result, { type: 'search-count', key: stringify(search), count: 100 }),
      assertFailure(assert)
    );

  graphHandler({ type: 'search-count', key: stringify(search), search })
    .subscribe(
      (result) => assert.deepEqual(result, { type: 'search-count', key: stringify(search), count: 100 }),
      assertFailure(assert)
    );
});


test('[Graph Handler] Should not batch concurrant calls to search or searchCount if search is different', (assert) => {
  assert.plan(4);

  let i = 0;
  let ii = 0;

  class Adapter extends AbstractGraphAdapterQueryHandlers {
    public search(key, { type }, ranges, count) {
      if (count) {
        assert.equal(++ii, 1, 'should request search count exactly once');
        return of<AdapterSearchCountResponse>(
          { type: 'search-count', key, count: 100 },
        );
      }

      assert.equal(++i, 1, 'should request search results exactly once');
      return of(...ranges2List(ranges).map<AdapterSearchResponse>((index) => ({
        type: 'search', key, uri: `http://junonetwork.com/test/${type}/${index}`, index,
      })));
    }
  }


  const graphHandler = createGraphHandler(createHandlerAdapter(new Adapter()));
  const search1 = { type: 'ABC' };
  const search2 = { type: 'XYZ' };

  graphHandler({ type: 'search', key: stringify(search1), search: search1, ranges: [{ from: 2, to: 3 }] })
    .pipe(toArray())
    .subscribe(
      (result) => assert.deepEqual(result, [
        { type: 'search', key: stringify(search1), uri: 'http://junonetwork.com/test/ABC/2', index: 2 },
        { type: 'search', key: stringify(search1), uri: 'http://junonetwork.com/test/ABC/3', index: 3 }
      ]),
      assertFailure(assert)
    );

  graphHandler({ type: 'search-count', key: stringify(search2), search: search2 })
    .subscribe(
      (result) => assert.deepEqual(result, { type: 'search-count', key: stringify(search2), count: 100 }),
      assertFailure(assert)
    );
});


// TODO - include resource routes in this test
test('[Graph Handler] Should not share search responses across separate batchedQueries', (assert) => {
  assert.plan(5);
  let i = 0;

  class Adapter extends AbstractGraphAdapterQueryHandlers {
    public search(key, { type }, ranges: StandardRange[]) {
      ++i

      return of<AdapterSearchResponse | AdapterSearchCountResponse>(
        type === 'ABC' ?
          { type: 'search-count', key, count: 100 } :
          { type: 'search-count', key, count: 200 },
        ...ranges2List(ranges).map<AdapterSearchResponse>((index) => ({
          type: 'search', key, uri: `http://junonetwork.com/test/${type}/${index}`, index,
        }))
      );
    }
  }


  const graphHandler = createGraphHandler(createHandlerAdapter(new Adapter()));
  const search1 = { type: 'ABC' };
  const search2 = { type: 'XYZ' };

  graphHandler({ type: 'search', key: stringify(search1), search: search1, ranges: [{ from: 3, to: 4 }] })
    .pipe(toArray())
    .subscribe(
      (result) => assert.deepEqual(result, [
        { type: 'search', key: stringify(search1), uri: 'http://junonetwork.com/test/ABC/3', index: 3 },
        { type: 'search', key: stringify(search1), uri: 'http://junonetwork.com/test/ABC/4', index: 4 }
      ]),
      assertFailure(assert)
    );

  graphHandler({ type: 'search-count', key: stringify(search1), search: search1 })
    .subscribe(
      (result) => assert.deepEqual(result, { type: 'search-count', key: stringify(search1), count: 100 }),
      assertFailure(assert)
    );

  // TODO - do this w/ observables
  // TODO - make this fail by deleting createBatchRequest.setTimeout(delete batch[key])
  setTimeout(() => {
    graphHandler({ type: 'search', key: stringify(search2), search: search2, ranges: [{ from: 8, to: 9 }] })
      .pipe(toArray())
      .subscribe(
        (result) => assert.deepEqual(result, [
          { type: 'search', key: stringify(search2), uri: 'http://junonetwork.com/test/XYZ/8', index: 8 },
          { type: 'search', key: stringify(search2), uri: 'http://junonetwork.com/test/XYZ/9', index: 9 }
        ]),
        assertFailure(assert)
      );

    graphHandler({ type: 'search-count', key: stringify(search2), search: search2 })
      .subscribe(
        (result) => {
          assert.deepEqual(result, { type: 'search-count', key: stringify(search2), count: 200 });
          assert.equal(i, 2, 'should request search exactly twice');
        },
        assertFailure(assert)
      );
  }, 500);
});


test('[Graph Handler] Should batch concurrant calls to triples and triplesCount', (assert) => {
  assert.plan(3);
  let i = 0;

  class Adapter extends AbstractGraphAdapterQueryHandlers {
    public triples(subjects: string[], predicates: string[], ranges: StandardRange[], count: boolean) {
      assert.equal(++i, 1, 'should request triples exactly once');

      return of<AdapterTripleResponse | AdapterTripleCountResponse>(
        ...cartesianProd(subjects, predicates, ranges2List(ranges)).map<AdapterTripleResponse>(([subject, predicate, index]) => ({
          type: 'triple', subject, predicate, index, object: `"${subject} ${predicate} ${index}"`,
        })),
        { type: 'triple-count', subject: `${context.test}james`, predicate: `${context.rdfs}label`, count: 2 },
        { type: 'triple-count', subject: `${context.test}micah`, predicate: `${context.rdfs}label`, count: 1 },
      );
    }
  }


  const graphHandler = createGraphHandler(createHandlerAdapter(new Adapter()));

  graphHandler({
    type: 'triple',
    subjects: [`${context.test}james`, `${context.test}micah`],
    predicates: [`${context.rdfs}label`],
    ranges: [{ from: 0, to: 1 }]
  })
    .pipe(toArray())
    .subscribe(
      (result) => assert.deepEqual(result, [
        { type: 'triple', subject: `${context.test}james`, predicate: `${context.rdfs}label`, index: 0, object: `"${context.test}james ${context.rdfs}label ${0}"` },
        { type: 'triple', subject: `${context.test}james`, predicate: `${context.rdfs}label`, index: 1, object: `"${context.test}james ${context.rdfs}label ${1}"` },
        { type: 'triple', subject: `${context.test}micah`, predicate: `${context.rdfs}label`, index: 0, object: `"${context.test}micah ${context.rdfs}label ${0}"` },
        { type: 'triple', subject: `${context.test}micah`, predicate: `${context.rdfs}label`, index: 1, object: `"${context.test}micah ${context.rdfs}label ${1}"` },
      ]),
      assertFailure(assert)
    );

  graphHandler({
    type: 'triple-count',
    subjects: [`${context.test}james`, `${context.test}micah`],
    predicates: [`${context.rdfs}label`],
  })
    .pipe(toArray())
    .subscribe(
      (result) => assert.deepEqual(result, [
        { type: 'triple-count', subject: `${context.test}james`, predicate: `${context.rdfs}label`, count: 2 },
        { type: 'triple-count', subject: `${context.test}micah`, predicate: `${context.rdfs}label`, count: 1 },
      ]),
      assertFailure(assert)
    );
});
