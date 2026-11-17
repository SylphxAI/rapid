// Define the Patch structure, including standard ops, plus custom ops for Sets
export interface Patch {
  op: 'replace' | 'add' | 'remove' | 'move' | 'copy' | 'test' | 'set_add' | 'set_delete'; // Add standard ops + custom Set ops
  path: (string | number)[]; // Target path
  value?: unknown; // Value used for add, replace, test, set_add, set_delete
  from?: (string | number)[]; // Source path used for move, copy
}

// Options for the craft function
export interface CraftOptions {
  patches?: boolean;
  inversePatches?: boolean;
  autoFreeze?: boolean; // Add autoFreeze option
}

// The part of a Zen atom craftZen reads and writes. @sylphx/zen 3.49.2 declares
// `Zen<T>` in terms of itself, so its exported type is unusable here.
export interface ZenAtom<T> {
  value: T;
}

// Result tuple type
export type CraftResult<State> = [State, Patch[], Patch[]];
