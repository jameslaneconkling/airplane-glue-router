import { GraphAdapter } from "../types";
import { any } from "ramda";

export const matchName = (adapters: GraphAdapter[], name: string) => (
  adapters.find(({ name: adapterName }) => adapterName === name)
);

export const matchDomain = (adapters: GraphAdapter[], domainName: string) => (
  adapters.find(({ domains }) => any((domain) => domain.test(domainName), domains))
);
