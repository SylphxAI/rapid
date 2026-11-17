import { describe, expect, it } from "vitest";
import { applyPatches } from "./patch";

describe("reserved patch paths", () => {
  for (const key of ["__proto__", "prototype", "constructor"]) {
    for (const op of ["add", "replace", "remove", "test", "copy", "move", "set_add", "set_delete"] as const) {
      for (const path of [[key], [key, "polluted"], ["nested", key]]) {
        it(`rejects ${op} ${path.join("/")}`, () => {
          const base = { nested: {}, safe: 1 };
          const before = Object.getOwnPropertyDescriptors(Object.prototype);
          expect(() => applyPatches(base, [{ op, path, from: ["safe"], value: true }])).toThrow(/Invalid patch path/);
          expect(base).toEqual({ nested: {}, safe: 1 });
          expect(Object.getOwnPropertyDescriptors(Object.prototype)).toEqual(before);
        });
      }
    }
    for (const op of ["copy", "move"] as const) {
      it(`rejects unsafe ${op} source ${key}`, () => {
        expect(() => applyPatches({}, [{ op, path: ["safe"], from: [key, "polluted"] }])).toThrow(/Invalid patch path/);
      });
    }
    it(`rejects Map path keys ${key}`, () => {
      expect(() => applyPatches(new Map(), [{ op: "add", path: [key], value: true }])).toThrow(/Invalid patch path/);
    });
  }

  it("validates the full batch before touching state", () => {
    let reads = 0;
    const base = { get nested() { reads++; return {}; } };
    expect(() => applyPatches(base, [
      { op: "add", path: ["nested", "valid"], value: true },
      { op: "add", path: ["__proto__", "polluted"], value: true },
    ])).toThrow(/Invalid patch path/);
    expect(reads).toBe(0);
  });

  it("rejects malformed paths and coercible objects", () => {
    const segment = { toString() { throw new Error("must not coerce"); } };
    for (const path of [null, "__proto__", [segment], [Symbol("key")], [null], Array(1)]) {
      expect(() => applyPatches({}, [{ op: "add", path, value: true }] as any)).toThrow(/Invalid patch path/);
    }
  });

  it("keeps valid nested object and array updates immutable", () => {
    const base = { nested: { value: 1 }, list: [1, 2] };
    expect(applyPatches(base, [
      { op: "replace", path: ["nested", "value"], value: 2 },
      { op: "add", path: ["list", 1], value: 3 },
    ])).toEqual({ nested: { value: 2 }, list: [1, 3, 2] });
    expect(base).toEqual({ nested: { value: 1 }, list: [1, 2] });
  });
});
