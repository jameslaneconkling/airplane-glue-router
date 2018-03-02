const {
  readFileSync,
} = require('fs');
const createApp = require('./app');
const makeMemoryRepository = require('./repositories/memory');
const PORT = process.env.PORT || 3000;
const DEV_SEED = process.env.DEV_SEED || `${__dirname}/../seed.n3`;
const {
  context
} = require('./utils/rdf');


const repos = [
  {
    name: 'memory',
    domains: [/.*/],
    repository: makeMemoryRepository({ n3: readFileSync(DEV_SEED, 'utf8'), context })
    // repository: makeRemoteRepository(process.env.DBPEDIA_BASEURL)
  }
];

const app = createApp(repos);

app.listen(PORT, () => {
  console.log(`listening on port ${PORT}`);
});
