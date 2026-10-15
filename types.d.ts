import { Node, File } from '@babel/types';

/**
 * Transform function signature
 */
export type JSTransformSource = (
  source: string | undefined,
  api: JSCodeshift,
  options: TransformOptions
) => string | undefined | null;

/**
 * Options passed to the transform function
 */
export interface TransformOptions {
  [key: string]: any;
}

/**
 * Core jscodeshift API
 */
export interface JSCodeshift {
  (source: string | undefined, options?: object): Collection;
  withParser(parserName: string): JSCodeshift;
  withTemplates(templatePaths: string[], options?: object): JSCodeshift;
  defineTemplateCodeLocations(templateCode: string[], filePath: string): void;
}

/**
 * jscodeshift Collection interface
 */
export interface Collection {
  nodes<T = any>(): Collection;
  size(): number;
  length: number;
  forEach(
    callback: (node: Node | File, index: number, collection: Collection) => void
  ): Collection;
  map<T>(callback: (node: Node | File, index: number) => T): T[];
  filter(
    predicate: (node: Node | File, index: number) => boolean
  ): Collection;
  find<T = any>(predicate: T | ((node: Node) => boolean)): Collection;
  at(index: number | number[]): Collection;
  first(): Collection;
  last(): Collection;
  get(): Node | File | undefined;
  get(index: number): Node | File | undefined;
  toArray(): (Node | File)[];
  prune(): Collection;
  replaceWith(
    node: Node | File | ((node: Node | File) => Node | File)
  ): Collection;
  remove(): Collection;
  insertAfter(node: Node | File): Collection;
  insertBefore(node: Node | File): Collection;
  appendToMemberExpression(memberObject: Node): Collection;
  getSiblingCollection(): Collection;
  getMostImmediateParent(): Collection;
}

/**
 * Parser interface for AST parsing
 */
export interface Parser {
  parse(source: string, options?: object): File;
}

/**
 * Options for building/compiling code
 */
export interface BuildOptions {
  source?: string;
  path?: string;
  sourceFileName?: string;
  printOptions?: object;
}

/**
 * Options for printing/formatting code
 */
export interface PrintOptions {
  source: string;
  sourceFileName?: string;
  parser?: string;
  printOptions?: object;
}

/**
 * API object passed to transform functions
 */
export interface JSCodeshiftAPI {
  jscodeshift: JSCodeshift;
  jscodeshift: JSCodeshift;
  stats: (message?: string) => void;
  report: (msg: string) => void;
}

/**
 * Execute options
 */
export interface ExecuteOptions extends TransformOptions {
  extensions?: string[];
  jscodeshift?: object;
  babelOptions?: object;
  parser?: string;
  dry?: boolean;
  print?: boolean;
}

/**
 * Execute result type
 */
export type ExecuteResult = Promise<{ [key: string]: string }>;

/**
 * Wrapper function type for async transforms
 */
export interface JSCodeshiftWrapper {
  (
    transform:
      | ((source: string, api: JSCodeshiftAPI, options: TransformOptions) => any)
      | { default: (source: string, api: JSCodeshiftAPI, options: TransformOptions) => any },
    options?: TransformOptions
  ): ExecuteResult;
}

declare module 'jscodeshift' {
  export const transformer: (
    transformArg: string | JSTransformSource | object,
    options: object
  ) => any;
  export const parse: Parser;
  export const execute: (
    transformArg: string | Function | object,
    options?: object
  ) => ExecuteResult;

  export default {
    transformer: (
      transformArg: string | JSTransformSource | object,
      options: object
    ) => any,
    parse: Parser,
    execute: (
      transformArg: string | Function | object,
      options?: object
    ) => ExecuteResult,
  };
}
