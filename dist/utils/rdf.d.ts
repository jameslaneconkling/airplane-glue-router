import { AdapterSentinel } from '../types';
export declare type ContextMap = {
    [key: string]: string;
};
export declare const context: ContextMap;
export declare const parseObject: (object: string | null | undefined) => AdapterSentinel;
