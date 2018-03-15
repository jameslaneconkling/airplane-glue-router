require('rxjs/add/observable/from');
require('rxjs/add/operator/catch');
const FalcorServer = require('falcor-express');
const Router = require('falcor-router');
const collectionRoutes = require('./collection');
const resourceRoutes = require('./resource');
const ontologyRoutes = require('./ontology');


module.exports = (repos, context) => {
  // TODO - log errors from routes to improve error visibility
  const BaseRouter = Router.createClass([
    ...collectionRoutes(repos, context),
    ...resourceRoutes(repos, context),
    ...ontologyRoutes(repos, context)
  ]);

  return FalcorServer.dataSourceRoute((req, res) => {
    res.type('json');
    return new BaseRouter();
  });
};
