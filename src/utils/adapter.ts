import { InitializedGraphDescription, InitializedAdapter } from "../types";
import { any, values } from "ramda";


export const matchKey = (graphs: InitializedGraphDescription[], adapterKey: string) => (
  graphs.find((adapter) => adapterKey === adapter.key)
);

export const matchDomain = (graphs: InitializedGraphDescription[], domainName: string) => (
  graphs.find(({ domains }) => any((domain) => domain.test(domainName), domains))
);

export const groupUrisByGraph = (graphs: InitializedGraphDescription[], subjects: string[]) => {
  return values(subjects.reduce<{ [key: string]: { adapter: InitializedAdapter, subjects: string[], key: string } }>((grouped, uri) => {
    const graphDescription = matchDomain(graphs, uri);
    if (graphDescription === undefined) {
      // TODO - handle unmatched resources?
      return grouped;
    }

    if (grouped[graphDescription.key]) {
      grouped[graphDescription.key].subjects.push(uri);
    } else {
      grouped[graphDescription.key] = {
        adapter: graphDescription.adapter,
        key: graphDescription.key,
        subjects: [uri]
      };
    }

    return grouped;
  }, {}));
};
