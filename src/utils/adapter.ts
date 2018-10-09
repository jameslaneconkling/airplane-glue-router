import { GraphAdapter, NamedGraphAdapter } from "../types";
import { any } from "ramda";

export const matchName = (adapters: GraphAdapter[], adapterKey: string) => (
  adapters.find((adapter) => adapterKey === (adapter as NamedGraphAdapter).key)
);

export const matchDomain = (adapters: GraphAdapter[], domainName: string) => (
  adapters.find(({ domains }) => any((domain) => domain.test(domainName), domains))
);
