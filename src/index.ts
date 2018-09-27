import express from 'express';
import morgan from 'morgan';
import { dataSourceRoute } from 'falcor-express';
import createFalcorRouter from './falcor';


const PORT = process.env.PORT || 3000;

const app = express();

// Middleware
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// Falcor endpoint
const context = {}; // TODO - import context.json based on ENV path variable
const Router = createFalcorRouter(context);
app.use('/api/model.json', dataSourceRoute(() => new Router()));

// const router = new Router()

// router.get([['tasksById', { length: 4 }]])
//   .subscribe((data) => console.log(JSON.stringify(data)));

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
