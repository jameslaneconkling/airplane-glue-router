import { GraphDescription, Adapter } from "../types";
import { any, values } from "ramda";

export const matchKey = (graphs: GraphDescription[], adapterKey: string) => (
  graphs.find((adapter) => adapterKey === adapter.key)
);

export const matchDomain = (graphs: GraphDescription[], domainName: string) => (
  graphs.find(({ domains }) => any((domain) => domain.test(domainName), domains))
);

export const groupUrisByGraph = (graphs: GraphDescription[], uris: string[]) => {
  return values(uris.reduce<{ [key: string]: { adapter: Adapter, uris: string[] } }>((grouped, uri) => {
    const graphDescription = matchDomain(graphs, uri);
    if (graphDescription === undefined) {
      // TODO - handle unmatched resources?
      return grouped;
    }

    if (grouped[graphDescription.key]) {
      grouped[graphDescription.key].uris.push(uri);
    } else {
      grouped[graphDescription.key] = { adapter: graphDescription.adapter, uris: [uri] };
    }

    return grouped;
  }, {}));
};
