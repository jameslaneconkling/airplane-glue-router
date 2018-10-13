import { parse } from "query-string";
import { Search, ContextMap } from "../types";
import { URI } from "./rdf";

// TODO - use more robust validation library, like io-ts
export const parseSearch = (context: ContextMap, searchString: string): Search | null => {
  const parsed: Partial<Search> = parse(searchString);

  if (!searchIsValid(parsed)) {
    return null;
  }

  return {
    type: URI.falcor2Adapter(context, parsed.type),
  };
};

export const searchIsValid = (search: Partial<Search>): search is Search => typeof search.type === 'string';
