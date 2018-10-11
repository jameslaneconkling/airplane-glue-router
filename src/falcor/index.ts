import Router from 'falcor-router';
import graphRoutes from './graph';
import resourceRoutes from './resource';
import { ContextMap, GraphDescription } from '../types';
import { defaultContext } from '../utils/rdf';


type RouterMeta = { [key: string]: any };


// TODO - split project into router + implementation.  this function becomes the default export
export default (
  { context = defaultContext, graphs }: { context?: ContextMap, graphs: GraphDescription[] }
) => {
  const TopLevelRouter = Router.createClass([
    ...graphRoutes(context, graphs),
    ...resourceRoutes(context, graphs)
  ]);

  return class JunoRouter extends TopLevelRouter {
    public meta: RouterMeta
    constructor(meta: RouterMeta = {}) {
      super();
      this.meta = meta;
    }
    // public routeUnhandledPathsTo(dataSource) {
    //   return dataSource // TODO - why isn't dataSource typechecked
    // }
  }
};
