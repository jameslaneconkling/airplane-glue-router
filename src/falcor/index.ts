import Router from 'falcor-router';
import graphRoutes from './graph';
import resourceRoutes from './resource';
import { GraphDescription } from '../types';


type RouterMeta = { [key: string]: any };


// TODO - split project into router + implementation.  this function becomes the default export
export default (
  { graphs }: { graphs: GraphDescription[] }
) => {
  const TopLevelRouter = Router.createClass([
    ...graphRoutes(graphs),
    ...resourceRoutes(graphs)
  ]);

  return class JunoRouter extends TopLevelRouter {
    public meta: RouterMeta
    constructor(meta: RouterMeta = {}) {
      super();
      this.meta = meta;
    }
  }
};
