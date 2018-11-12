import { parse } from "query-string";
import { Search } from "../types";


// TODO - use more robust validation library, like io-ts
export const parseSearch = (searchString: string): Search | null => {
  const parsed: Partial<Search> = parse(searchString);

  return !searchIsValid(parsed) ? null : parsed;
};

export const searchIsValid = (search: Partial<Search>): search is Search => typeof search.type === 'string';
