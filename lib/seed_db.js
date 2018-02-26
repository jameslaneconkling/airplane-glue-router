const fs = require('fs');
const db = require('../app/db').dbFactory(`${__dirname}/../level`);


fs.createReadStream(`${__dirname}/../seed.n3`)
  .on('error', err => err.code === 'ENOENT' ?
    console.warn('no seed.n3 file detected') :
    console.error('error reading seed file', err)
  )
  .pipe(db.n3.putStream())
  .on('error', err => console.error('error seeding db', err))
  .on('finish', () => console.log('seeding db complete'));
