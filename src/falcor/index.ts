import Router, { Route } from 'falcor-router';
import graphRoutes from './graph';
import resourceRoutes from './resource';
import { UninitializedGraphDescription, InitializedGraphDescription, IJunoRouter, RouterMeta } from '../types';
import { PathSet } from 'falcor-json-graph';




// TODO - split project into router + implementation.  this function becomes the default export
export default () => {
  const TopLevelRouter = Router.createClass<Route<PathSet, IJunoRouter>>([
    ...graphRoutes,
    ...resourceRoutes,
  ]);

  return class JunoGraphRouter extends TopLevelRouter implements IJunoRouter {
    public meta: RouterMeta
    
    public graphs: InitializedGraphDescription[]

    constructor(graphs: UninitializedGraphDescription[], meta: RouterMeta = {}) {
      super();
      this.meta = meta;
      this.graphs = graphs.map(({ adapter, ...rest }) => ({
        adapter: adapter(),
        ...rest
      }));
    }
  }
};
