const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');

module.exports = (db) => {
  const app = express();

  // Middleware
  if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('combined'));
  }

  app.use(bodyParser.urlencoded({ extended: false }));

  // Falcor endpoint
  app.use('/api/model.json', require('./falcor')(db));

  // Error handling
  // app.use((err, req, res, next) => {
  //   console.error('Error on:', err);
  //   req.status(500).send({
  //     name: err.name,
  //     message: err.message,
  //     stack: err.stack
  //   });
  // });

  return app;
};
