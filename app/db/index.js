const levelup = require('levelup');
const levelgraph = require('levelgraph');
const levelgraphN3 = require('levelgraph-n3');


exports.dbFactory = (file) => {
  return levelgraphN3(levelgraph(levelup(file)));
};

exports.testDbFactory = (n3) => {
  const memdown = require('memdown');

  // memdown has a global cache
  // to ensure that each db instance is clean, clear the cache
  memdown.clearGlobalStore();

  const db = levelgraphN3(levelgraph(levelup('memoryGraph', { db: memdown })));

  if (n3) {
    db.n3.put(n3, () => {});
  }

  return db;
};
