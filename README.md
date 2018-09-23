## Falcor Graph Router


### Setup
```bash
npm install
```

### Develop
To run against an in-memory DB, run
```bash
npm run dev
```

Database is initialized and seeded automatically.

To reinitialize the db, bounce the server.

### Test
```bash
npm run test
```

### Serve
To run against a persistent DB, run
```bash
npm run seedDB
npm run start
```

### Dockerize
```bash
# build
npm run validate && npm run build && \
  docker build -t juno-falcor-router:latest .

# run
docker run -dit \
  -e NODE_ENV='production' \
  -p 3000:3000 \
  -v $(pwd)/seed.n3:/usr/src/seed.n3 \
  --name juno-falcor-router \
  juno-falcor-router
```
