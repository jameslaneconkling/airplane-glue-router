import Router, { Route } from 'falcor-router';
import { graphRoutes } from './graph';
import { resourceRoutes } from './resource';
import { IJunoRouter, GraphDescription } from '../types';
import { PathSet } from 'falcor-json-graph';


export const createRouter = () => {
  const TopLevelRouter = Router.createClass<Route<PathSet, IJunoRouter>>([
    ...graphRoutes,
    ...resourceRoutes,
  ]);

  return class JunoGraphRouter extends TopLevelRouter implements IJunoRouter {
    public graphs: GraphDescription[]

    constructor(graphs: GraphDescription[]) {
      super();
      this.graphs = graphs;
    }
  }
};
