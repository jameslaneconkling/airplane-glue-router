const db = require('../app/db').dbFactory(`${__dirname}/../level`);


db.searchStream([{
  subject: db.v('s'),
  predicate: db.v('p'),
  object: db.v('o')
}], {
  n3: {
    subject: db.v('s'),
    predicate: db.v('p'),
    object: db.v('o')
  }
}).pipe(process.stdout);
