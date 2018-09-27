import Router, { Route } from 'falcor-router';
import collectionRoutes from './collection';
import { ContextMap } from '../types';
// import { of } from 'rxjs';


export default (context: ContextMap) => (
  Router.createClass([
    {
      route: 'tasksById[{ranges:indices}]',
      get: ([_, indices]) => {
        console.log(indices);
        return indices.map((index) => ({
          path: ['tasksById', index],
          value: `task #${index}`,
        }));
      }
    } as Route<[string, number[]]>,
    ...collectionRoutes(context)
  ])
);
