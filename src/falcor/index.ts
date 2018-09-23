import FalcorServer from 'falcor-express';
import Router from 'falcor-router';
import { of } from 'rxjs';

const BaseRouter = Router.createClass([
  {
    route: 'test',
    get: () => {
      return of({
        path: ['test'],
        value: 'confirmed!'
      });
    }
  }
]);

export default FalcorServer.dataSourceRoute(() => new BaseRouter());
