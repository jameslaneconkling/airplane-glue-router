import Router from 'falcor-router';
import collectionRoutes from './collection';
import { ContextMap, GraphAdapter } from '../types';
import { defaultContext } from '../utils/rdf';


type RouterMeta = { [key: string]: any };


// TODO - split project into router + implementation.  this function becomes the default export
export default (
  { context = defaultContext, graphAdapters }: { context?: ContextMap, graphAdapters: GraphAdapter[] }
) => (
  class JunoRouter extends Router.createClass([
    ...collectionRoutes(context, graphAdapters)
  ]) {
    public meta: RouterMeta
    constructor(meta: RouterMeta = {}) {
      super();
      this.meta = meta;
    }
  }
);
