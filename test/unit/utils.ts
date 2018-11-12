import test from 'tape';
import { cartesianProd } from '../../src/utils/misc';


test('cartesian product', (assert) => {
  assert.plan(3);
  assert.deepEqual(cartesianProd(['a', 'b'], [1, 2], ['Z']), [['a', 1, 'Z'], ['a', 2, 'Z'], ['b', 1, 'Z'], ['b', 2, 'Z']]);
  assert.deepEqual(cartesianProd(['a', 'b'], [], ['Z']), []);
  assert.deepEqual(cartesianProd(['a', 'b', 'c'], [1, 2], []), []);
});
