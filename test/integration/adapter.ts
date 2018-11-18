import test from 'tape';


test.skip('[Adapter] Should safely handle errors in adapter', (assert) => {
  assert.plan(1);
  assert.fail();
});
