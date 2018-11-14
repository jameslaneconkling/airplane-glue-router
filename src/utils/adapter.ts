import { InitializedGraphDescription, InitializedAdapter } from "../types";
import { any, values } from "ramda";
import { Subject, of } from "rxjs";
import { multicast, refCount } from "rxjs/operators";


export const matchKey = (graphs: InitializedGraphDescription[], adapterKey: string) => (
  graphs.find((adapter) => adapterKey === adapter.key)
);

export const matchDomain = (graphs: InitializedGraphDescription[], domainName: string) => (
  graphs.find(({ domains }) => any((domain) => domain.test(domainName), domains))
);

export const missingGraph = Symbol('missing_graph');


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

/**
 * use cases:
 * - for each search, merge search w/ searchCount
 * - for each subject/predicate triple pattern, merge w/ triplesCount
 * - merge multiple triple patterns
 * 
 * TODO -
 * - can this be used in the router, rather than the adapter?  i.e. if adapter implements search/searchCount/searchWithCount
 * - create separate graph-routes-batched.ts/resource-routes-batched.ts test suites
 */
export const createBatchedRequest = <T, R>(
  handler: (args: T[]) => R,
  { interval = 0 }: Partial<{ interval: number }> = {},
) => {
  let batch;
  let count = 0;

  const subject = new Subject<R>();
  const source$ = of().pipe(multicast(subject), refCount());

  return (arg: T) => {
    const idx = count++;
    if (batch === undefined) {
      batch.args = [arg];
      batch.handler = setTimeout(() => {
        subject.next(handler(batch.args)[idx]);
        batch = undefined;
        count = 0;
        subject.complete();
      }, interval);
    } else {
      batch.args.push(arg);
    }

    return source$;
  };
};
