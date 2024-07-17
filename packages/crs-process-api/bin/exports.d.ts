/* tslint:disable */
/* eslint-disable */
/**
*
** @function export_to_excel - exports the data to an excel file
** @param data - the data to export
** @param fields - the columns in the data
** @returns Vec<u8> - the excel file binary data
* @param {any} data
* @param {any[]} fields
* @returns {any}
*/
export function export_to_excel(data: any, fields: any[]): any;
/**
*
** @function import_from_excel - imports the data from an excel file
** @param data - the excel file binary data
** @param fields - the columns in the data
** @returns Vec<JsValue> - the data to return to javascript
* @param {any[]} data
* @param {any[]} fields
* @returns {any}
*/
export function import_from_excel(data: any[], fields: any[]): any;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly export_to_excel: (a: number, b: number, c: number, d: number) => void;
  readonly import_from_excel: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly __wbindgen_add_to_stack_pointer: (a: number) => number;
  readonly __wbindgen_malloc: (a: number) => number;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {SyncInitInput} module
*
* @returns {InitOutput}
*/
export function initSync(module: SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {InitInput | Promise<InitInput>} module_or_path
*
* @returns {Promise<InitOutput>}
*/
export default function init (module_or_path?: InitInput | Promise<InitInput>): Promise<InitOutput>;
