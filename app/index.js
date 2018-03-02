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
    name: 'user',
    domains: [/$data/],
    repository: makeMemoryRepository({ ns: readFileSync(DEV_SEED), context })
    // repository: makeRemoteRepository(process.env.DBPEDIA_BASEURL)
  }
];

const app = createApp(repos);

app.listen(PORT, () => {
  console.log(`listening on port ${PORT}`);
});
