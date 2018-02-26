const FalcorServer = require('falcor-express');
const Router = require('falcor-router');
const collectionRoutes = require('./typeCollection');
const resourceRoutes = require('./resource');
const inverseRoutes = require('./inverse');
const {
  context
} = require('../utils/rdf');


module.exports = (db) => {
  // TODO - context should be customizable by the client
  // meaning it will have to be passed in as a property to BaseRouter,
  // in the route factories
  const BaseRouter = Router.createClass([
    ...collectionRoutes(db, context),
    ...resourceRoutes(db, context),
    ...inverseRoutes(db, context)
  ]);

  return FalcorServer.dataSourceRoute((req, res) => {
    res.type('json');
    return new BaseRouter();
  });
};
