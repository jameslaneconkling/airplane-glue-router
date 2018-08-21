const {
  readFileSync,
} = require('fs');
const createApp = require('./app');
const makeMemoryRepository = require('./repositories/memory');
const makeRemoteRepository = require('./repositories/remote');
const {
  context
} = require('./utils/rdf');

const PORT = process.env.PORT || 3000;
const DEV_SEED = process.env.DEV_SEED || `${__dirname}/../seed.n3`;
const WIKIPEDIA_URL = process.env.WIKIPEDIA_URL || 'localhost:3001';


const repos = [
  {
    name: 'memory',
    // domains: [/^data:/, /^schema:/, /^wd:/, /^skos:/],
    domains: [/^http:\/\/juno\.network\/trumpworld/, /^schema:/, /^skos:/, /^data:/, /^wd:/, /^skos:/],
    repository: makeMemoryRepository({ n3: readFileSync(DEV_SEED, 'utf8'), context })
  },
  {
    name: 'wikipedia',
    domains: [/^dbr:/, /^dbo:/, /^dbp:/],
    repository: makeRemoteRepository({ baseurl: `http://${WIKIPEDIA_URL}/dbpedia`, }),
  }
];

const app = createApp(repos, context);

app.listen(PORT, () => {
  console.log(`listening on port ${PORT}`);
  console.log(`talking to wikipedia at ${WIKIPEDIA_URL}`);
});
