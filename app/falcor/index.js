const FalcorServer = require('falcor-express');
const Router = require('falcor-router');
const collectionRoutes = require('./typeCollection');
const resourceRoutes = require('./resource');
const inverseRoutes = require('./inverse');
const sourceRoutes = require('./source');


module.exports = (repos) => {
  // TODO - context should be customizable by the client
  // meaning it will have to be passed in as a property to BaseRouter,
  // in the route factories

  // TODO - log errors from routes to improve error visibility
  const BaseRouter = Router.createClass([
    ...collectionRoutes(repos),
    ...resourceRoutes(repos),
    ...inverseRoutes(repos),
    ...sourceRoutes(repos)
  ]);

  return FalcorServer.dataSourceRoute((req, res) => {
    res.type('json');
    return new BaseRouter();
  });
};
