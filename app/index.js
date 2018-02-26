const fs = require('fs');
const {
  dbFactory, testDbFactory
} = require('./db');
const appFactory = require('./app');
const PORT = process.env.PORT || 3000;
const DEV_SEED = process.env.DEV_SEED || `${__dirname}/../seed.n3`;


const db = process.env.NODE_ENV === 'development' ?
  testDbFactory(fs.readFileSync(DEV_SEED)):
  dbFactory(`${__dirname}/../level`);

const app = appFactory(db);

app.listen(PORT, () => {
  console.log(`listening on port ${PORT}`);
});
