import { Search } from "../types";
export declare const parseSearch: (searchString: string) => Search | null;
export declare const searchIsValid: (search: Partial<Search>) => search is Search;
