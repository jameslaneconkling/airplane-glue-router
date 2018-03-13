const FalcorServer = require('falcor-express');
const Router = require('falcor-router');
const collectionRoutes = require('./collection');
const resourceRoutes = require('./resource');
const inverseRoutes = require('./inverse');
const ontologyRoutes = require('./ontology');


module.exports = (repos) => {
  // TODO - log errors from routes to improve error visibility
  const BaseRouter = Router.createClass([
    ...collectionRoutes(repos),
    ...resourceRoutes(repos),
    ...inverseRoutes(repos),
    ...ontologyRoutes(repos)
  ]);

  return FalcorServer.dataSourceRoute((req, res) => {
    // res.type('json');
    return new BaseRouter();
  });
};
