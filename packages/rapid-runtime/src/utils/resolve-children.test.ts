/**
 * Tests for resolveChildren utility
 *
 * Verifies that all forms of children are correctly resolved:
 * - Functions (lazy children)
 * - Descriptors (deferred components)
 * - Arrays (multiple children)
 * - Nested combinations
 */

import { describe, expect, it } from 'bun:test';
import { createRoot } from '@rapid/signal';
import { needsResolution, resolveChildren } from './resolve-children.js';

// =============================================================================
// Test Helpers
// =============================================================================

/** Simple component that returns a node */
function SimpleComponent() {
  return { type: 'node', value: 'simple' };
}

/** Component that returns another descriptor */
function WrapperComponent() {
  return {
    _jsx: true,
    type: SimpleComponent,
    props: {},
  };
}

/** Create a descriptor for a component */
function createDescriptor(type: () => unknown, props: Record<string, unknown> = {}) {
  return { _jsx: true, type, props };
}

// =============================================================================
// resolveChildren Tests
// =============================================================================

describe('resolveChildren', () => {
  describe('null/undefined handling', () => {
    it('should pass through null', () => {
      createRoot(() => {
        expect(resolveChildren(null)).toBe(null);
      });
    });

    it('should pass through undefined', () => {
      createRoot(() => {
        expect(resolveChildren(undefined)).toBe(undefined);
      });
    });
  });

  describe('primitive handling', () => {
    it('should pass through strings', () => {
      createRoot(() => {
        expect(resolveChildren('hello')).toBe('hello');
      });
    });

    it('should pass through numbers', () => {
      createRoot(() => {
        expect(resolveChildren(42)).toBe(42);
      });
    });

    it('should pass through booleans', () => {
      createRoot(() => {
        expect(resolveChildren(true)).toBe(true);
      });
    });
  });

  describe('node handling', () => {
    it('should pass through plain objects (nodes)', () => {
      createRoot(() => {
        const node = { type: 'box', children: [] };
        expect(resolveChildren(node)).toBe(node);
      });
    });
  });

  describe('function handling', () => {
    it('should execute function children', () => {
      createRoot(() => {
        const result = resolveChildren(() => 'executed');
        expect(result).toBe('executed');
      });
    });

    it('should execute function that returns a node', () => {
      createRoot(() => {
        const node = { type: 'box', children: [] };
        const result = resolveChildren(() => node);
        expect(result).toBe(node);
      });
    });

    it('should resolve function that returns a descriptor', () => {
      let componentCalled = false;

      createRoot(() => {
        const result = resolveChildren(() => ({
          _jsx: true,
          type: () => {
            componentCalled = true;
            return { type: 'node' };
          },
          props: {},
        }));

        expect(componentCalled).toBe(true);
        expect(result).toEqual({ type: 'node' });
      });
    });

    it('should resolve nested functions', () => {
      createRoot(() => {
        const result = resolveChildren(() => () => 'nested');
        expect(result).toBe('nested');
      });
    });
  });

  describe('descriptor handling', () => {
    it('should execute component descriptors', () => {
      let componentCalled = false;

      createRoot(() => {
        const descriptor = {
          _jsx: true,
          type: () => {
            componentCalled = true;
            return { type: 'node' };
          },
          props: {},
        };

        resolveChildren(descriptor);
        expect(componentCalled).toBe(true);
      });
    });

    it('should handle nested descriptors (component returns component)', () => {
      let innerCalled = false;

      createRoot(() => {
        const innerComponent = () => {
          innerCalled = true;
          return { type: 'inner-node' };
        };

        const outerComponent = () => ({
          _jsx: true,
          type: innerComponent,
          props: {},
        });

        const descriptor = {
          _jsx: true,
          type: outerComponent,
          props: {},
        };

        const result = resolveChildren(descriptor);
        expect(innerCalled).toBe(true);
        expect(result).toEqual({ type: 'inner-node' });
      });
    });
  });

  describe('array handling', () => {
    it('should resolve arrays of primitives', () => {
      createRoot(() => {
        const result = resolveChildren(['a', 'b', 'c']);
        expect(result).toEqual(['a', 'b', 'c']);
      });
    });

    it('should resolve arrays with descriptors', () => {
      let called1 = false;
      let called2 = false;

      createRoot(() => {
        const result = resolveChildren([
          {
            _jsx: true,
            type: () => {
              called1 = true;
              return { type: 'node1' };
            },
            props: {},
          },
          {
            _jsx: true,
            type: () => {
              called2 = true;
              return { type: 'node2' };
            },
            props: {},
          },
        ]);

        expect(called1).toBe(true);
        expect(called2).toBe(true);
        expect(result).toEqual([{ type: 'node1' }, { type: 'node2' }]);
      });
    });

    it('should resolve arrays with functions', () => {
      createRoot(() => {
        const result = resolveChildren([() => 'a', () => 'b']);
        expect(result).toEqual(['a', 'b']);
      });
    });

    it('should resolve mixed arrays', () => {
      let descriptorCalled = false;

      createRoot(() => {
        const result = resolveChildren([
          'string',
          42,
          () => 'from-function',
          {
            _jsx: true,
            type: () => {
              descriptorCalled = true;
              return { type: 'from-descriptor' };
            },
            props: {},
          },
        ]);

        expect(descriptorCalled).toBe(true);
        expect(result).toEqual([
          'string',
          42,
          'from-function',
          { type: 'from-descriptor' },
        ]);
      });
    });

    it('should resolve nested arrays', () => {
      createRoot(() => {
        const result = resolveChildren([['a', 'b'], ['c', 'd']]);
        expect(result).toEqual([['a', 'b'], ['c', 'd']]);
      });
    });
  });

  describe('complex nested scenarios', () => {
    it('should resolve function returning array of descriptors', () => {
      let called1 = false;
      let called2 = false;

      createRoot(() => {
        const result = resolveChildren(() => [
          {
            _jsx: true,
            type: () => {
              called1 = true;
              return { type: 'node1' };
            },
            props: {},
          },
          {
            _jsx: true,
            type: () => {
              called2 = true;
              return { type: 'node2' };
            },
            props: {},
          },
        ]);

        expect(called1).toBe(true);
        expect(called2).toBe(true);
        expect(result).toEqual([{ type: 'node1' }, { type: 'node2' }]);
      });
    });

    it('should handle deeply nested combinations', () => {
      let deepestCalled = false;

      createRoot(() => {
        // Function -> Descriptor -> Function -> Descriptor -> Node
        const result = resolveChildren(() => ({
          _jsx: true,
          type: () =>
            (() => ({
              _jsx: true,
              type: () => {
                deepestCalled = true;
                return { type: 'deepest' };
              },
              props: {},
            }))(),
          props: {},
        }));

        expect(deepestCalled).toBe(true);
        expect(result).toEqual({ type: 'deepest' });
      });
    });
  });
});

// =============================================================================
// needsResolution Tests
// =============================================================================

describe('needsResolution', () => {
  it('should return false for null', () => {
    expect(needsResolution(null)).toBe(false);
  });

  it('should return false for undefined', () => {
    expect(needsResolution(undefined)).toBe(false);
  });

  it('should return false for primitives', () => {
    expect(needsResolution('string')).toBe(false);
    expect(needsResolution(42)).toBe(false);
    expect(needsResolution(true)).toBe(false);
  });

  it('should return false for plain objects', () => {
    expect(needsResolution({ type: 'node' })).toBe(false);
  });

  it('should return true for functions', () => {
    expect(needsResolution(() => 'value')).toBe(true);
  });

  it('should return true for descriptors', () => {
    expect(
      needsResolution({
        _jsx: true,
        type: () => {},
        props: {},
      }),
    ).toBe(true);
  });

  it('should return false for arrays without functions/descriptors', () => {
    expect(needsResolution(['a', 'b', 'c'])).toBe(false);
    expect(needsResolution([1, 2, 3])).toBe(false);
  });

  it('should return true for arrays with functions', () => {
    expect(needsResolution(['a', () => 'b'])).toBe(true);
  });

  it('should return true for arrays with descriptors', () => {
    expect(
      needsResolution([
        'a',
        { _jsx: true, type: () => {}, props: {} },
      ]),
    ).toBe(true);
  });
});
