import express from 'express';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import falcor from './falcor';


const PORT = process.env.PORT || 3000;

const app = express();

// Middleware
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

app.use(bodyParser.urlencoded({ extended: false }));

// Falcor endpoint
app.use('/api/model.json', falcor);

// Error handling
// app.use((err, req, res, next) => {
//   console.error('Error on:', err);
//   req.status(500).send({
//     name: err.name,
//     message: err.message,
//     stack: err.stack
//   });
// });

app.listen(PORT, () => {
  console.log(`listening on port ${PORT}`);
});
