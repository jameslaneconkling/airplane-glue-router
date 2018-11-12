import test from 'tape';


test.skip('Should safely handle errors in adapter', async (assert) => {
  assert.plan(1);
  assert.fail();
});