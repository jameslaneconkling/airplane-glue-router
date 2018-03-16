const {
  readFileSync,
} = require('fs');
const createApp = require('./app');
const makeMemoryRepository = require('./repositories/memory');
const makeRemoteRepository = require('./repositories/remote');
const PORT = process.env.PORT || 3000;
const DEV_SEED = process.env.DEV_SEED || `${__dirname}/../seed.n3`;
const {
  context
} = require('./utils/rdf');


const repos = [
  {
    name: 'memory',
    domains: [/^data:/, /^schema:/, /^wd:/, /^skos:/],
    repository: makeMemoryRepository({ n3: readFileSync(DEV_SEED, 'utf8'), context })
  },
  {
    name: 'wikipedia',
    domains: [/^dbr:/, /^dbo:/, /^dbp:/],
    repository: makeRemoteRepository({ baseurl: 'http://localhost:3001/dbpedia', }),
  }
];

const app = createApp(repos, context);

app.listen(PORT, () => {
  console.log(`listening on port ${PORT}`);
});
