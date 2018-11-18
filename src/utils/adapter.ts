import { GraphDescription, AdapterResponse, AdapterRequest, AdapterTripleCountResponse, AdapterSearchResponse, AdapterSearchCountResponse, AdapterTripleResponse } from "../types";
import { any, values } from "ramda";
import { Observable } from "rxjs";
import { StandardRange } from "falcor-router";
import { ranges2List } from "./falcor";
import { stringify } from "query-string";
import { cartesianProd } from "./misc";


export const matchKey = (graphs: GraphDescription[], adapterKey: string) => (
  graphs.find((adapter) => adapterKey === adapter.key)
);

export const matchDomain = (graphs: GraphDescription[], domainName: string) => (
  graphs.find(({ domains }) => any((domain) => domain.test(domainName), domains))
);

export const missingGraph = Symbol('missing_graph');


export const groupUrisByGraph = (graphs: GraphDescription[], subjects: string[]) => {
  return values(subjects.reduce<{
    [key: string]: {
      handler: (request: AdapterRequest) => Observable<AdapterResponse>,
      subjects: string[],
      key: string
    }
  }>((grouped, uri) => {
    const graphDescription = matchDomain(graphs, uri);
    if (graphDescription === undefined) {
      // TODO - handle unmatched resources?
      return grouped;
    }

    if (grouped[graphDescription.key]) {
      grouped[graphDescription.key].subjects.push(uri);
    } else {
      grouped[graphDescription.key] = {
        handler: graphDescription.handler,
        key: graphDescription.key,
        subjects: [uri]
      };
    }

    return grouped;
  }, {}));
};


export const isExpectedSearchCountResponse = (searchKey: string) => (
  response: AdapterResponse
): response is AdapterSearchCountResponse => response.type === 'search-count' && response.key === searchKey;
export const isExpectedTripleCountResponse = (subjects: Set<string>, predicates: Set<string>) => (
  response: AdapterResponse
): response is AdapterTripleCountResponse => response.type === 'triple-count' && subjects.has(response.subject) && predicates.has(response.predicate);


export const expectedSearchResponses = (key: string, ranges: StandardRange[]) => {
  const expectedResponses = new Map<string, AdapterSearchResponse>();
  ranges2List(ranges).forEach((index) => {
    const response: AdapterSearchResponse = ({ type: 'search', key, index, uri: null });
    expectedResponses.set(stringify(response), response);
  });

  return {
    isExpectedSearchResponse: (response): response is AdapterSearchResponse => (
      response.type === 'search' &&
      expectedResponses.delete(stringify({ type: 'search', key: response.key, index: response.index, uri: null }))
    ),
    getMissingSearchResponses: () => expectedResponses,
  };
};

export const expectedTripleResponses = (subjects: string[], predicates: string[], ranges: StandardRange[]) => {
  const expectedResponses = new Map<string, AdapterTripleResponse>();
  cartesianProd(subjects, predicates, ranges2List(ranges)).forEach(([subject, predicate, index]) => {
    const response: AdapterTripleResponse = ({ type: 'triple', subject, predicate, index, object: null });
    expectedResponses.set(stringify(response), response);
  });

  return {
    isExpectedTripleResponse: (response): response is AdapterTripleResponse => (
      response.type === 'triple' &&
      expectedResponses.delete(stringify({ type: 'triple', subject: response.subject, predicate: response.predicate, index: response.index, object: null }))
    ),
    getMissingTripleResponses: () => expectedResponses,
  };
};
