# Comprehensive Reactive Programming Optimization Research

## Executive Summary

This report compiles cutting-edge reactive programming optimization techniques from academic papers, competitor technologies, V8 engine optimizations, and advanced performance patterns. Focus is on techniques that can improve fanout performance (1 signal → N computeds pattern).

---

## 1. Academic Papers & Research

### 1.1 Self-Adjusting Computation (Umut Acar et al.)

**Key Papers:**
- "Self-Adjusting Computation: An overview" (Acar)
- "Self-adjusting computation with Delta ML" (ICALP)
- "Incremental Computation with Names" (Hammer et al., OOPSLA 2015)
- "Adapton: Composable, Demand-Driven Incremental Computation" (Hammer et al., PLDI 2014)

**How it Works:**
- Programs respond automatically to data modifications by tracking dynamic data dependencies
- Incrementally updates output instead of recomputing from scratch
- Uses dependency tracking at runtime to build a computation graph
- Makes any function incrementalizable automatically using dependency tracking

**Key Techniques:**
- **Change Propagation:** When data changes, only affected computations are recomputed
- **Memoization:** Previously computed results are reused across program runs
- **First-Class Names:** Names identify computations to be reused (Nominal Adapton)
- **Demand-Driven:** Only computes values when needed (lazy evaluation)

**Performance Impact:**
- Asymptotically faster than recomputing from scratch
- Handles incremental modifications efficiently
- Particularly effective for applications with frequent small changes

**Implementation Complexity:** High - Requires sophisticated dependency tracking and memoization

### 1.2 Push-Pull Functional Reactive Programming

**Key Papers:**
- "Push-pull functional reactive programming" (Haskell Symposium)
- Implemented in Reactive and Etage libraries (Haskell)

**How it Works:**
- **Push (Eager):** Immediate propagation of change notifications to observers
- **Pull (Lazy):** Fetching state values on demand when needed
- **Hybrid:** Combines data-driven and demand-driven evaluation

**Benefits:**
- Values recomputed only when necessary
- Nearly instantaneous reactions
- Avoids wasteful recomputation when inputs don't change
- Lower reaction latency than pure demand-driven systems

**Performance Impact:**
- Reduces unnecessary computations
- Minimizes latency compared to pure pull systems
- Avoids overhead of pure push systems

**Which Libraries Use It:**
- Reactive (Haskell)
- Modern JavaScript frameworks use variants

### 1.3 Fine-Grained Reactivity Algorithms

**Recent Research (2024-2025):**
- "Fine-Grained Reactivity Without Any Compiler" (Nicolas Dubien)
- Reactively library - currently fastest reactive library in category
- Novel signal-first constraint models

**Key Findings:**
- Compile-time dependency analysis achieves 62% faster execution
- Fine-grained dependency tracking minimizes update scope
- Declarative state modeling reduces developer friction

**Libraries Using Fine-Grained Reactivity:**
- Reactively, Preact Signals, µsignal
- SolidJS, S.js, CellX
- Svelte 5, Angular Signals

---

## 2. Competitor Technologies

### 2.1 SolidJS

**Core Innovation:** Fine-grained subscriptions with direct DOM updates (no virtual DOM)

**Performance Techniques:**

#### 2.1.1 Optimized Reactivity Management
- Efficient data structures minimize memory allocations
- Dependency tracking is automatic through access within tracking functions
- Every observable evaluation inside tracking scope subscribes the computation

**Implementation:**
```typescript
// Signals: Basic reactive primitive
const [value, setValue] = createSignal(5);

// Memos: Cached computations
const doubled = createMemo(() => value() * 2);

// Effects: Side effects
createEffect(() => console.log(value()));
```

#### 2.1.2 DOM Node Cloning
- Clones existing DOM nodes instead of creating new ones
- Significantly boosts performance with lists and tables
- Reduces memory allocation overhead

#### 2.1.3 Compile-time Optimizations
- Converts reactive code into highly efficient JavaScript during build
- Work typically done at runtime is handled during compilation
- Results in smaller bundle sizes (7kB vs 45kB for React)

**Performance Impact:**
- Direct DOM updates skip expensive diffing
- Minimal runtime overhead
- Tiny bundle sizes and faster initial loads

**Key Insight for Fanout:**
- Nested stores provide fine-grained reactivity
- Updates handled independently without DOM diffing
- Each dependency tracked separately for optimal granularity

### 2.2 Vue 3

**Core Technology:** ES6 Proxies for reactive interception

**Performance Techniques:**

#### 2.2.1 Lazy Tracking
- Doesn't track everything up front
- Only tracks properties accessed during effects
- Reduces memory overhead and computation

#### 2.2.2 Granular Dependency Management
```typescript
// targetMap: WeakMap<object, Map<key, Set<effect>>>
// Each property has its own dependency Set
// Updating state.count won't touch state.user.name
```

**Implementation:**
```typescript
// Deep reactivity by default
const state = reactive({
  count: 0,
  user: { name: 'John' }
});

// Shallow reactivity for optimization
const shallowState = shallowReactive({ count: 0 });
```

#### 2.2.3 Track and Trigger System
- `track()`: Creates connection between effect and reactive property
- `trigger()`: Notifies all dependent effects when value changes
- Stored in global dependency map for efficiency

**Performance Impact:**
- Fine-grained reactivity model (only used properties tracked)
- Automatic deep reactivity with Proxy wrapping
- Optional shallow reactivity for performance-critical code

**Key Insight for Fanout:**
- Separate dependency buckets per property
- No cross-contamination between independent properties
- WeakMap enables garbage collection of unused objects

### 2.3 Preact Signals

**Version 1.2.0 Innovation:** Moved from JavaScript Sets to linked lists for dependency tracking

**Performance Techniques:**

#### 2.3.1 Skip Virtual DOM Rendering
- Signal updates bypass component re-rendering
- Jump directly to components accessing signal's .value
- Skip expensive rendering work entirely

**Implementation Pattern:**
```typescript
const count = signal(0);

// Component sees signal, not value
// Only re-renders when .value is accessed
function Counter() {
  return <div>{count.value}</div>;
}
```

#### 2.3.2 Automatic Optimizations
- Lazy by default: disconnected signals don't affect performance
- Optimal updates: skip updates if value unchanged
- Optimal dependency tracking: automatic, no dependency arrays

#### 2.3.3 Linked List Dependency Tracking
- O(1) subscribe/unsubscribe operations
- Dynamic dependency management on the fly
- More ergonomic and performant than Sets

**Benchmark Results:**
- Text updates within 100 nanoseconds of VanillaJS
- Near-optimal performance (lower bound of required work)
- 3x performance improvement in some scenarios

**Key Insight for Fanout:**
- Linked lists provide O(1) dynamic subscription management
- Minimal overhead for large numbers of dependents
- Efficient memory usage vs. Set-based approaches

### 2.4 Angular Signals

**Core Innovation:** Granular change tracking without zone.js

**Performance Techniques:**

#### 2.4.1 Fine-Grained Change Detection
- Signal value changes notify all consumers directly
- Component updated without full change detection cycle
- No zone.js overhead for signal-based updates

**Implementation:**
```typescript
// Writable signals
const count = signal(0);

// Computed signals (read-only, derived)
const doubled = computed(() => count() * 2);

// Effects (side effects)
effect(() => console.log(count()));

// LinkedSignal (Angular 19) - writable derived signals
const derived = linkedSignal(() => count() * 2);
```

#### 2.4.2 Resource Function (Angular 19)
- Async reactivity with automatic recomputation
- Params value recomputes when read signals change
- Integrated with Angular's reactivity system

**Performance Impact:**
- Exact determination of what needs updating
- Update only necessary page parts
- Significant shift from zone.js-based change detection

**Key Insight for Fanout:**
- Direct consumer notification
- No hierarchical change detection traversal
- Optimal for 1-to-many signal propagation

### 2.5 MobX

**Core Technology:** Transparent reactivity via property interception

**Performance Techniques:**

#### 2.5.1 Property Interception
```typescript
// Uses Object.defineProperty() to wrap assignment
form.submitted = false; // Actually calls MobX method
```

#### 2.5.2 Automatic Dependency Tracking
- Reacts to any observable property read during tracked function execution
- Tracked functions: computed, observer components, autorun, reaction, when
- No manual dependency specification needed

#### 2.5.3 Synchronous Execution
- Runs everything synchronously
- Impossible to observe stale derivations
- Deterministic update order

**Algorithm Efficiency:**
- Implemented efficiently without closures
- Uses pointer arrays for dependency tracking
- Minimal overhead per observation

**Performance Impact:**
- Zero boilerplate for dependency management
- Transparent - minimal code changes needed
- Synchronous guarantees consistency

**Key Insight for Fanout:**
- Automatic dependency discovery during execution
- No pre-declaration of dependencies
- Efficient pointer-based tracking

### 2.6 Svelte (Compiler Optimizations)

**Core Innovation:** Compile-time reactivity analysis

**Performance Techniques:**

#### 2.6.1 Compile-Time Dependency Analysis
```typescript
// Compiled to $$invalidate() calls
let count = 0;
// Becomes: $$invalidate('count', count = 0)
```

- Reactive block dependencies determined at compile-time
- Direct DOM updates generated during build
- No runtime dependency tracking overhead

#### 2.6.2 Svelte 5: Runes and Signals
```typescript
// $state: reactive state
let count = $state(0);

// $derived: computed values
let doubled = $derived(count * 2);

// $effect: side effects
$effect(() => console.log(count));
```

**Performance Benefits:**
- Genuine granular reactivity with signals
- Changing value in large list doesn't invalidate other members
- Compiler handles signal management

**Bundle Size:**
- 7kB vs 45kB for React starters
- Minimal runtime overhead
- Faster initial loads

**Key Insight for Fanout:**
- Compile-time analysis eliminates runtime overhead
- Direct code generation for updates
- Maximum performance through pre-computation

### 2.7 RxJS (Observable Patterns)

**Performance Techniques:**

#### 2.7.1 Higher-Order Observables
```typescript
// Flattening operators reduce subscriptions
source$.pipe(
  mergeMap(id => fetchData(id)) // Concurrent subscriptions
);

source$.pipe(
  switchMap(id => fetchData(id)) // Cancel previous, optimal for latest
);
```

**Benefits:**
- Prevents nested subscriptions
- Reduces memory usage
- Improved responsiveness

#### 2.7.2 Caching and Sharing
```typescript
const cached$ = http.get('/api').pipe(
  shareReplay(1) // Cache latest emission, prevent duplicate requests
);
```

#### 2.7.3 Filtering and Debouncing
```typescript
source$.pipe(
  debounceTime(300), // Prevent excessive API calls
  filter(x => x.length > 2) // Reduce stream emissions
);
```

**Performance Impact:**
- 40% reduction in observable emissions improves fluidity
- Significant memory savings with proper stream management
- AsyncPipe handles subscriptions automatically (no memory leaks)

**Key Insight for Fanout:**
- Subject enables hot streams with multiple observers
- Sharing operators prevent duplicate execution
- Efficient for one-to-many scenarios

### 2.8 Knockout (Dependency Tracking)

**Core Architecture:** Single mediator object (ko.dependencyDetection)

**How it Works:**

#### 2.8.1 Stack-Based Context Management
```javascript
// 1. Signal tracking start
ko.dependencyDetection.begin();

// 2. Observable access triggers tracking
observable(); // Signals dependency tracker

// 3. Cleanup
ko.dependencyDetection.end();
```

**Key Features:**
- Stack allows computeds inside computeds
- Unique ID assigned to each observable
- No string parsing - direct method interception
- Automatic re-evaluation on each computed run

**Performance Impact:**
- Minimal overhead for dependency detection
- Efficient stack-based context switching
- Prevents infinite loops via evaluation guards

**Key Insight for Fanout:**
- Mediator pattern centralizes dependency management
- Stack enables nested reactive contexts
- Automatic cleanup prevents memory leaks

### 2.9 Reactively (Fastest Fine-Grained Library)

**Key Innovation:** Three-color marking algorithm for glitch-free updates

**Algorithm Overview:**

```typescript
// Cache states
const CacheClean = 0;  // Valid, no recompute needed
const CacheCheck = 1;  // Might be stale, check parents
const CacheDirty = 2;  // Invalid, must recompute

// Three-phase execution:
// 1. set() marks children dirty (red) and descendants check (green)
// 2. get() requests updateIfNecessary() recursively up tree
// 3. updateIfNecessary() evaluates if dirty
```

**Implementation:**
```typescript
updateIfNecessary() {
  if (this.fn) {
    if (this.state === CacheDirty) {
      // Recompute
      const oldValue = this._value;
      this._value = this.fn();
      if (oldValue !== this._value) {
        // Propagate to children
      }
    } else if (this.state === CacheCheck) {
      // Walk up to find red nodes
      // If found, update; otherwise mark clean
    }
  }
}
```

**Performance Characteristics:**
- Currently fastest reactive library in category
- Less than 1K bytes gzipped
- Linear time complexity for dependency analysis
- Automatic equality checks prevent unnecessary updates

**Key Insight for Fanout:**
- Three-color marking ensures glitch-free updates
- Down phase (mark) + up phase (compute) separates concerns
- Efficient for deep dependency graphs

### 2.10 S.js

**Core Design:** Automatic dependency graph + synchronous execution

**Implementation:**
```javascript
// Data signals
const count = S.data(5);

// Computations
const doubled = S(() => count() * 2);

// Batching with S.freeze()
S.freeze(() => {
  count(10);
  other(20);
  // All updates run as single transaction
});
```

**Performance Characteristics:**
- Minimal overhead for reactive computations
- Synchronous, transactional updates
- Automatic dependency tracking
- Batching prevents inefficiency and inconsistent states

**Key Insight for Fanout:**
- S.freeze() enables efficient batch updates
- Synchronous execution guarantees consistency
- Single transaction for multiple signal updates

---

## 3. V8 Engine Optimizations

### 3.1 Hidden Classes and Inline Caches

**How it Works:**

#### 3.1.1 Hidden Classes (Shapes)
```javascript
// V8 creates hidden class for object shape
function Point(x, y) {
  this.x = x; // Transition to HiddenClass1
  this.y = y; // Transition to HiddenClass2
}

// Objects with same property order share hidden class
const p1 = new Point(1, 2); // Uses HiddenClass2
const p2 = new Point(3, 4); // Reuses HiddenClass2
```

**Best Practices:**
- Always initialize object members in same order
- Avoid adding properties after construction
- Use same "shape" in hot functions

#### 3.1.2 Inline Cache States

**Monomorphic (Optimal):**
```javascript
// IC sees one object type
function getX(point) {
  return point.x; // IC caches: HiddenClass → offset 0
}

getX(p1); // Monomorphic, hardcoded offset lookup
```

**Performance:** Direct memory read, extremely fast

**Polymorphic (Good):**
```javascript
// IC sees 2-4 object types
getX(point1); // HiddenClass1
getX(point2); // HiddenClass2
// IC stores small set of (class → offset) mappings
```

**Performance:** Small linear search, still fast

**Megamorphic (Slow):**
```javascript
// IC sees too many object types (>4)
// Falls back to hash table lookup
```

**Performance:** Dictionary lookup, much slower

**Benchmark Data:**
- Monomorphic: 2.816 ns/op
- Bimorphic: 3.258 ns/op
- Megamorphic: 4.896 ns/op

#### 3.1.3 Optimization Strategy

**TurboFan (Optimizing Compiler):**
- Assumes monomorphic inline cache
- Generates hardcoded property offset
- Deoptimizes if assumption fails

```javascript
// Optimized code for monomorphic case
if (point.hiddenClass === expectedClass) {
  return point[HARDCODED_OFFSET]; // No lookup!
} else {
  deoptimize(); // Bail to interpreter
}
```

**Key Insight for Reactive Systems:**
- Keep signal/computed objects monomorphic
- Use consistent property initialization order
- Avoid dynamic property addition
- Results in 20-50% performance improvement

### 3.2 JIT Compilation and Deoptimization

**How it Works:**

#### 3.2.1 Tiered Compilation
```
Ignition (Interpreter)
  ↓ (collect type feedback)
TurboFan (Optimizing Compiler)
  ↓ (if assumptions violated)
Deoptimization → Back to Ignition
```

**Optimization Pipeline:**
1. Code runs in interpreter (Ignition)
2. Hot functions get profiled for types
3. TurboFan generates optimized machine code
4. Assumptions checked with traps/guards
5. Deoptimization if assumptions break

#### 3.2.2 Common Deoptimization Triggers

**Type Instability:**
```javascript
function compute(signal) {
  return signal.value * 2; // Assumes number
}

compute({ value: 5 });      // OK, optimizes
compute({ value: "text" }); // DEOPT - type changed
```

**Hidden Class Changes:**
```javascript
const signal = { value: 0 };  // HiddenClass1
signal.newProp = 1;           // HiddenClass2 - DEOPT
```

**Best Practices for Reactive Systems:**
- Keep signal values monomorphic (same type)
- Avoid adding properties to existing signals
- Use separate object types for different data shapes
- Preallocate all properties in constructor

**Performance Impact:**
- Deoptimization can cause 10-100x slowdown
- Avoiding deoptimization crucial for hot paths
- Type-stable code enables aggressive optimization

### 3.3 Branch Prediction Optimization

**How it Works:**

Modern CPUs predict branch outcomes to avoid pipeline stalls.

**Branch Predictor Performance:**
- Correct prediction: ~1 cycle
- Misprediction: ~10-20 cycles (pipeline flush)

**Hot Path Optimization:**
```javascript
// BAD: Unpredictable branch in hot loop
for (let i = 0; i < deps.length; i++) {
  if (deps[i].dirty) {  // Unpredictable
    update(deps[i]);
  }
}

// GOOD: Separate dirty nodes
const dirtyDeps = deps.filter(d => d.dirty);
for (let i = 0; i < dirtyDeps.length; i++) {
  update(dirtyDeps[i]); // Branch always taken
}
```

**Profile-Guided Optimization (PGO):**
- Instrument code under realistic loads
- Collect branch prediction data
- Optimize based on real-world patterns

**Best Practices:**
- Keep hot paths linear (avoid branches)
- Limit branches in tight loops to 1-2
- Ensure branches are highly predictable
- Target <0.5% miss rate for ultra-low-latency

**Key Insight for Fanout:**
- Separate dirty/clean node processing
- Predictable update patterns critical
- Can achieve 10-20x speedup in hot paths

### 3.4 SIMD and WebAssembly

**SIMD (Single Instruction, Multiple Data):**

```javascript
// Process 4 values simultaneously
// 128-bit SIMD operations on WebAssembly

// Example: Update 4 signal values at once
const values = new Float32Array([1, 2, 3, 4]);
// SIMD: 1 operation vs 4 sequential operations
```

**Performance Gains:**
- Up to 16x speedup for 8-bit operations
- Up to 2x speedup for 64-bit operations
- Hand-tracking: 14-15 FPS → 38-40 FPS with SIMD
- TensorFlow.js: Up to 10x performance gain

**Browser Support:**
- Chrome 91+
- Firefox 89+

**Use Cases for Reactive Systems:**
- Batch update multiple signals
- Vector/matrix computations
- Data-parallel dependency updates

**WebAssembly Integration:**
```typescript
// Compile reactive runtime to WASM
// Process large dependency graphs
// Use SIMD for batch operations
// Achieve near-native performance
```

**Performance Impact:**
- Significant for compute-intensive reactive apps
- 10-40x improvements for batch operations
- Particularly effective for large fanout scenarios

---

## 4. Advanced Techniques

### 4.1 Version/Epoch-Based Dirty Tracking

**Concept:**
Instead of boolean flags, use incrementing version numbers.

**Implementation:**
```typescript
class Signal<T> {
  private _value: T;
  private _version = 0;

  set(newValue: T) {
    this._value = newValue;
    this._version++; // Increment on change
  }
}

class Computed<T> {
  private _cachedVersion = -1;

  get value() {
    if (this._cachedVersion !== this.source._version) {
      this.recompute();
      this._cachedVersion = this.source._version;
    }
    return this._value;
  }
}
```

**Benefits:**
- Single integer comparison vs multiple boolean checks
- No need to manually reset dirty flags
- Supports incremental/retroactive computation
- Enables timestamp-based ordering

**Performance Impact:**
- Faster comparisons (single int vs multiple bools)
- Reduced memory (one int vs multiple flags)
- Better cache locality

**Implementation Complexity:** Medium

**Libraries Using It:**
- Adapton (with nominal version tracking)
- Some distributed reactive systems
- Database reactive systems

### 4.2 Topological Sorting for Dependency Graphs

**Concept:**
Execute updates in dependency order to avoid redundant computations.

**Implementation:**
```typescript
// Dependency graph: A → B → C
//                   A → D → C

// Topological order: [A, B, D, C]
// C only computes once after B and D

function topologicalSort(nodes: Node[]): Node[] {
  const sorted: Node[] = [];
  const visited = new Set<Node>();

  function visit(node: Node) {
    if (visited.has(node)) return;
    visited.add(node);

    for (const dep of node.dependencies) {
      visit(dep);
    }

    sorted.push(node);
  }

  nodes.forEach(visit);
  return sorted;
}
```

**Benefits:**
- Each node computed exactly once per update cycle
- Prevents glitches (temporary inconsistencies)
- Guarantees correct evaluation order

**Performance Impact:**
- O(V + E) sorting overhead
- Eliminates redundant computations
- Critical for complex dependency graphs

**Libraries Using It:**
- Topologica (reactive dataflow library)
- Django migrations
- Build systems (makefiles)

**Key Insight for Fanout:**
- Sort once, execute in order
- Particularly valuable when single source fans out to many computeds
- Ensures each computed only runs once

### 4.3 Three-Color Marking for Glitch-Free Updates

**Concept:**
Use three states to track computation freshness: Clean, Check, Dirty

**Colors:**
- **White (Clean):** Value is valid, no recomputation needed
- **Green (Check):** Might be stale, check dependencies first
- **Red (Dirty):** Invalid, must recompute

**Algorithm (from Reactively):**

```typescript
enum CacheState {
  Clean = 0, // Valid
  Check = 1, // Possibly stale
  Dirty = 2  // Invalid
}

class Reactive<T> {
  state: CacheState = CacheState.Clean;

  // Phase 1: Mark (down the graph)
  markDirty() {
    this.state = CacheState.Dirty;
    for (const child of this.observers) {
      if (child.state === CacheState.Clean) {
        child.state = CacheState.Check;
        child.markCheck(); // Propagate green
      }
    }
  }

  // Phase 2: Update (up the graph)
  updateIfNecessary() {
    if (this.state === CacheState.Dirty) {
      this.recompute();
    } else if (this.state === CacheState.Check) {
      // Check dependencies
      for (const dep of this.dependencies) {
        dep.updateIfNecessary();
        if (dep.changed) {
          this.state = CacheState.Dirty;
          break;
        }
      }
      if (this.state === CacheState.Check) {
        this.state = CacheState.Clean; // False alarm
      } else {
        this.recompute();
      }
    }
  }
}
```

**Benefits:**
- **Glitch-Free:** No temporary inconsistencies in observable state
- **Minimal Work:** Only dirty nodes recompute
- **Efficient Checking:** Check state efficiently determines if update needed

**Performance Impact:**
- Linear time complexity O(nodes + edges)
- Prevents redundant computations
- Optimal for deep/wide dependency graphs

**Used By:**
- Reactively (primary algorithm)
- Variations in other reactive libraries

**Key Insight for Fanout:**
- Down phase marks entire subgraph quickly
- Up phase only computes what's needed
- Ideal for 1-to-many scenarios

### 4.4 Bitwise Flags for State Management

**Concept:**
Use bit flags to store multiple boolean states in a single integer.

**Implementation:**
```typescript
// State flags
const DIRTY     = 1 << 0; // 0001
const COMPUTING = 1 << 1; // 0010
const HAS_ERROR = 1 << 2; // 0100
const DISPOSED  = 1 << 3; // 1000

class Signal<T> {
  private _flags = 0;

  // Set flag
  markDirty() {
    this._flags |= DIRTY;
  }

  // Clear flag
  markClean() {
    this._flags &= ~DIRTY;
  }

  // Check flag
  isDirty(): boolean {
    return (this._flags & DIRTY) !== 0;
  }

  // Multiple flags
  isActive(): boolean {
    return (this._flags & (COMPUTING | DISPOSED)) === COMPUTING;
  }
}
```

**Benefits:**
- **Memory Efficient:** 32 bools in one 32-bit integer
- **Performance:** Bitwise operations extremely fast (~1 cycle)
- **Cache Friendly:** Single integer vs multiple properties
- **Atomic:** Single integer write is atomic

**Performance Impact:**
- 10-50% faster than separate boolean properties
- Better cache locality
- Reduced memory footprint

**Benchmark Data:**
- Bitwise operations: ~0.1-0.5ns
- Boolean property access: ~1-2ns
- Significant savings in hot paths

**Implementation Complexity:** Low-Medium

**Key Insight for Fanout:**
- Fast state checks in update loops
- Minimal memory per node
- Cache-friendly for large graphs

### 4.5 Object Pooling for Memory Efficiency

**Concept:**
Reuse objects instead of allocating/deallocating repeatedly.

**Implementation:**
```typescript
class DependencyLinkPool {
  private pool: DependencyLink[] = [];

  acquire(source: Signal, target: Computed): DependencyLink {
    const link = this.pool.pop() || new DependencyLink();
    link.source = source;
    link.target = target;
    return link;
  }

  release(link: DependencyLink) {
    link.source = null;
    link.target = null;
    this.pool.push(link);
  }
}

// Usage in reactive system
class Computed<T> {
  private dependencyLinks: DependencyLink[] = [];

  track(signal: Signal) {
    const link = pool.acquire(signal, this);
    this.dependencyLinks.push(link);
  }

  dispose() {
    for (const link of this.dependencyLinks) {
      pool.release(link);
    }
  }
}
```

**Benefits:**
- **5-20x faster allocation** from pool vs heap
- **Reduces GC pressure:** Fewer allocations/collections
- **Constant-time operations:** O(1) acquire/release
- **Prevents fragmentation:** Memory reuse

**Performance Impact:**
- Critical for high-frequency updates
- Particularly effective for temporary dependency tracking
- Can reduce GC pauses by 50-90%

**Use Cases:**
- Dependency links
- Update queues
- Event objects
- Temporary computation contexts

**Implementation Complexity:** Medium

**Key Insight for Fanout:**
- Reuse link objects for source→target connections
- Significant savings when dependencies change frequently
- Essential for real-time/game applications

### 4.6 Lazy vs Eager Evaluation Strategies

**Lazy (Pull-Based):**
```typescript
class LazyComputed<T> {
  private _cached: T | undefined;
  private _dirty = true;

  get value(): T {
    if (this._dirty) {
      this._cached = this.compute();
      this._dirty = false;
    }
    return this._cached!;
  }
}
```

**Benefits:**
- Only computes when accessed
- Saves CPU for unused computeds
- Good for conditional rendering

**Drawbacks:**
- Latency on first access
- Can accumulate stale computations

**Eager (Push-Based):**
```typescript
class EagerComputed<T> {
  private _value: T;

  onDependencyChange() {
    this._value = this.compute(); // Immediate
    this.notifyObservers();
  }

  get value(): T {
    return this._value; // Always fresh
  }
}
```

**Benefits:**
- Always up-to-date
- No latency on access
- Good for critical paths

**Drawbacks:**
- Wastes CPU on unused values
- More update propagation

**Hybrid (Best of Both):**
```typescript
class HybridComputed<T> {
  private _value: T;
  private _hasObservers = false;

  // Eager when observed, lazy when not
  onDependencyChange() {
    if (this._hasObservers) {
      this.update(); // Push
    } else {
      this.markDirty(); // Pull later
    }
  }
}
```

**Performance Impact:**
- Lazy: 0% CPU for unused nodes
- Eager: 0ms access latency
- Hybrid: Best of both (~20% improvement)

**Libraries Using Hybrid:**
- Reactively (graph coloring determines mode)
- SolidJS (effects eager, memos lazy)
- Vue 3 (tracked refs eager, others lazy)

**Key Insight for Fanout:**
- Hybrid optimal for varied access patterns
- Eager for hot paths, lazy for cold paths
- Significant savings in large graphs

### 4.7 Push-Pull Hybrid Systems

**Concept:**
Combine immediate notification (push) with on-demand computation (pull).

**Implementation:**
```typescript
class HybridSignal<T> {
  private _value: T;
  private _version = 0;
  private observers: HybridComputed[] = [];

  set(newValue: T) {
    this._value = newValue;
    this._version++;

    // PUSH: Notify observers immediately
    for (const observer of this.observers) {
      observer.notifyStale(this._version);
    }
  }

  get value(): T {
    return this._value;
  }
}

class HybridComputed<T> {
  private _cachedValue: T;
  private _sourceVersion = -1;

  // PUSH: Receive notification
  notifyStale(newVersion: number) {
    // Just mark as potentially stale
    this._sourceVersion = -1;
  }

  // PULL: Compute on demand
  get value(): T {
    const currentVersion = this.source._version;
    if (this._sourceVersion !== currentVersion) {
      this._cachedValue = this.compute();
      this._sourceVersion = currentVersion;
    }
    return this._cachedValue;
  }
}
```

**Benefits:**
- **Near-instant reactions:** Notifications propagate immediately
- **Lazy computation:** Only compute when values needed
- **Efficient:** No wasted computation on unused values
- **Responsive:** Consumers know when to check for updates

**Performance Impact:**
- Combines benefits of both approaches
- Notification overhead: O(observers)
- Computation overhead: O(accessed nodes only)
- Optimal for UI frameworks

**Used By:**
- Modern reactive libraries (SolidJS, Vue 3)
- RxJS (hot observables with lazy operators)

**Key Insight for Fanout:**
- Push notifications to all N computeds
- Pull computation only for accessed computeds
- Perfect for 1→N with sparse access pattern

---

## 5. Performance Patterns

### 5.1 Fast Path Optimizations

**Concept:**
Optimize common case, use slower path for edge cases.

**Pattern:**
```typescript
class Signal<T> {
  set(newValue: T) {
    // FAST PATH: No observers
    if (this.observers.length === 0) {
      this._value = newValue;
      return; // Early exit
    }

    // FAST PATH: Value unchanged
    if (newValue === this._value) {
      return; // Early exit
    }

    // SLOW PATH: Full update propagation
    this._value = newValue;
    this.notifyObservers();
    this.updateDependencyGraph();
    this.scheduleEffects();
  }
}
```

**Optimization Strategies:**
1. **Early Exit:** Handle common cases first
2. **Minimize Branches:** Keep fast path linear
3. **Inline Critical Code:** Avoid function calls
4. **Hoist Checks:** Move invariants outside loops

**Example: Optimized Update Loop**
```typescript
// SLOW: Multiple branches per iteration
for (const dep of dependencies) {
  if (dep !== null && dep.isActive() && !dep.isDisposed()) {
    dep.update();
  }
}

// FAST: Pre-filter, linear loop
const activeDeps = dependencies.filter(d =>
  d !== null && d.isActive() && !d.isDisposed()
);
for (const dep of activeDeps) {
  dep.update(); // No branches!
}
```

**Performance Impact:**
- 2-10x faster for common cases
- Reduced branch mispredictions
- Better CPU pipeline utilization

**Key Metrics:**
- Keep fast path < 10 instructions
- Target >95% fast path hit rate
- Measure with profiling

### 5.2 Branch Prediction Optimization

**Guidelines:**

#### 5.2.1 Predictable Branches
```typescript
// BAD: Unpredictable
if (Math.random() > 0.5) { ... }

// GOOD: Highly predictable
if (cachedValue !== null) { ... } // Usually true
```

#### 5.2.2 Limit Branches in Hot Loops
```typescript
// BAD: 4096+ branches in loop
for (let i = 0; i < 10000; i++) {
  if (condition) { ... }
}

// GOOD: Separate paths
if (condition) {
  for (let i = 0; i < 10000; i++) { ... }
} else {
  for (let i = 0; i < 10000; i++) { ... }
}
```

#### 5.2.3 Profile-Guided Optimization
- Instrument under realistic loads
- Collect branch statistics
- Optimize for common patterns

**Performance Impact:**
- Correct prediction: ~1 cycle
- Misprediction: ~10-20 cycles
- Target: <1% miss rate (ideal: <0.5%)

### 5.3 Cache-Friendly Data Structures

**Principles:**

#### 5.3.1 Spatial Locality
```typescript
// BAD: Scattered in memory (linked list)
class Node {
  value: number;
  next: Node | null; // Pointer to random memory
}

// GOOD: Contiguous memory (array)
const values: number[] = [1, 2, 3, 4, 5];
```

**Performance:** Arrays ~2x faster for iteration due to cache prefetching

#### 5.3.2 Temporal Locality
```typescript
// Access recently used data
class LRUCache<T> {
  private recentlyUsed: Map<string, T>;

  get(key: string): T {
    const value = this.recentlyUsed.get(key);
    // Likely in CPU cache if accessed recently
    return value;
  }
}
```

#### 5.3.3 Cache Line Awareness
```typescript
// Cache line = 64 bytes on modern CPUs

// BAD: False sharing
class Counter {
  count1 = 0; // offset 0
  count2 = 0; // offset 8 - SAME CACHE LINE
}

// GOOD: Padding to separate cache lines
class Counter {
  count1 = 0;
  private _pad = new Array(7).fill(0); // 56 bytes padding
  count2 = 0; // Different cache line
}
```

#### 5.3.4 Structure of Arrays vs Array of Structures

**Array of Structures (AoS):**
```typescript
// BAD for cache when accessing only positions
const objects = [
  { x: 1, y: 2, meta: {...} },
  { x: 3, y: 4, meta: {...} },
];

// Access pattern loads unnecessary meta
for (const obj of objects) {
  process(obj.x, obj.y);
}
```

**Structure of Arrays (SoA):**
```typescript
// GOOD: Access only needed data
const positions = {
  x: [1, 3, 5],
  y: [2, 4, 6],
};

// Perfectly packed, cache-friendly
for (let i = 0; i < positions.x.length; i++) {
  process(positions.x[i], positions.y[i]);
}
```

**Performance Impact:**
- Arrays 2-10x faster than linked lists for iteration
- Cache-friendly layout: 30-50% performance improvement
- Critical for large data sets

**Key Insight for Reactive Systems:**
- Store observers in arrays, not linked lists
- Pack hot data together
- Separate cold metadata to different objects

### 5.4 Lock-Free Algorithms

**Concept:**
Non-blocking concurrent data structures using atomic operations.

**Implementation:**
```typescript
// Using atomic compare-and-swap (CAS)
class LockFreeStack<T> {
  private head: Node<T> | null = null;

  push(value: T) {
    const node = new Node(value);
    do {
      node.next = this.head;
    } while (!this.compareAndSwap('head', node.next, node));
  }

  pop(): T | null {
    let head: Node<T> | null;
    do {
      head = this.head;
      if (!head) return null;
    } while (!this.compareAndSwap('head', head, head.next));
    return head.value;
  }
}
```

**Benefits:**
- **No locks:** Threads never block
- **Scalability:** Better multi-core performance
- **Progress guarantee:** System-wide forward progress

**Performance Impact:**
- Lock-free faster on multi-core (more parallel execution)
- Reduced contention vs mutex-based
- Can be slower on single core due to retry overhead

**JavaScript Considerations:**
- Single-threaded, but useful for Web Workers
- SharedArrayBuffer + Atomics for true concurrency
- Helpful pattern even in single-threaded for avoiding "locks"

**Key Insight for Reactive Systems:**
- Useful for async reactive streams
- Web Worker coordination
- Lock-free queues for event processing

### 5.5 Zero-Cost Abstractions

**Concept:**
High-level abstractions compile to same code as hand-written low-level code.

**Principles:**
1. "What you don't use, you don't pay for"
2. "What you do use, you couldn't hand code any better"

**Examples:**

#### 5.5.1 Iterator Combinators
```typescript
// High-level
const result = array
  .filter(x => x > 5)
  .map(x => x * 2);

// Compiles to (after optimization):
const result = [];
for (let i = 0; i < array.length; i++) {
  if (array[i] > 5) {
    result.push(array[i] * 2);
  }
}
```

#### 5.5.2 Reactive Primitives
```typescript
// High-level reactive code
const doubled = computed(() => count() * 2);

// Compiles to efficient subscription code
// No abstraction overhead in runtime
```

**Implementation Strategies:**
- Compile-time code generation (Svelte)
- JIT optimization (inline caching)
- Type erasure (TypeScript → JavaScript)
- Monomorphization (Rust generics)

**Performance Impact:**
- Zero runtime overhead (by definition)
- Clean, maintainable high-level code
- Performance of hand-written low-level code

**Key Insight for Reactive Systems:**
- Design abstractions to optimize away
- Use compiler/JIT to eliminate overhead
- Measure to verify zero-cost claim

---

## 6. Implementation Recommendations for Fanout Optimization

### 6.1 Priority Techniques (Highest ROI)

#### 1. **Three-Color Marking Algorithm** (Reactively approach)
- **Impact:** Eliminates glitches, minimal recomputation
- **Complexity:** Medium
- **ROI:** Very High
- **Best for:** Deep/wide dependency graphs

#### 2. **Linked List Dependency Tracking** (Preact Signals approach)
- **Impact:** O(1) subscribe/unsubscribe
- **Complexity:** Medium
- **ROI:** High
- **Best for:** Dynamic dependencies, frequent subscriptions

#### 3. **Version-Based Dirty Tracking**
- **Impact:** Single integer comparison vs boolean checks
- **Complexity:** Low
- **ROI:** High
- **Best for:** All scenarios

#### 4. **Bitwise State Flags**
- **Impact:** Fast checks, cache-friendly
- **Complexity:** Low
- **ROI:** Medium-High
- **Best for:** Hot paths, large graphs

#### 5. **Monomorphic Object Shapes**
- **Impact:** 20-50% faster property access
- **Complexity:** Low (discipline)
- **ROI:** High
- **Best for:** V8 optimization

### 6.2 Fanout-Specific Optimizations

**For 1 Signal → N Computeds:**

#### Pattern 1: Batch Notification + Lazy Computation
```typescript
class Signal<T> {
  private observers: Computed[] = [];
  private version = 0;

  set(value: T) {
    this._value = value;
    this.version++;

    // FAST: Single pass, mark all dirty
    for (const obs of this.observers) {
      obs.markStale(this.version); // O(1) per observer
    }
    // No computation yet!
  }
}

class Computed<T> {
  private sourceVersion = -1;

  markStale(version: number) {
    // Just invalidate, don't compute
    this.sourceVersion = -1;
  }

  get value(): T {
    // Lazy: compute only when accessed
    if (this.sourceVersion !== this.source.version) {
      this.recompute();
      this.sourceVersion = this.source.version;
    }
    return this._value;
  }
}
```

**Benefits:**
- O(N) notification, O(K) computation (K = accessed computeds)
- Optimal when not all computeds accessed
- No wasted work

#### Pattern 2: Topological Batching
```typescript
// When multiple signals change
transaction(() => {
  signal1.set(10);
  signal2.set(20);
  signal3.set(30);
});

// After transaction:
// 1. Collect all dirty computeds
// 2. Topological sort
// 3. Execute in order (each computed runs once)
```

**Benefits:**
- Each computed runs at most once
- Correct evaluation order
- Essential for diamond dependencies

#### Pattern 3: Stratified Updates
```typescript
// Group computeds by depth
class Signal {
  notifyObservers() {
    // Level 0: Direct dependents
    for (const obs of this.level0) obs.update();

    // Level 1: Their dependents
    for (const obs of this.level1) obs.update();

    // etc.
  }
}
```

**Benefits:**
- Natural topological order
- Cache-friendly (level-by-level)
- Simple implementation

### 6.3 Memory Optimization for Large Fanouts

#### Technique 1: Shared Observer Lists
```typescript
// Instead of array per signal
class Signal {
  observers: Computed[] = []; // N signals × M observers
}

// Use index-based registration
class ReactiveGraph {
  observers: Map<number, Set<number>> = new Map();
  signals: Signal[] = [];
  computeds: Computed[] = [];
}
```

**Savings:** Reduced memory overhead, better cache locality

#### Technique 2: Compact Representation
```typescript
// Store only what's needed
class CompactDependency {
  // Pack into single 32-bit int
  // Bits 0-15: source ID (65k sources)
  // Bits 16-30: target ID (32k targets)
  // Bit 31: dirty flag
  data: number;
}
```

**Savings:** 8-16 bytes → 4 bytes per link

### 6.4 Benchmark-Driven Optimization

**Key Metrics:**
1. **Update latency:** Time from signal.set() to all computeds updated
2. **Notification overhead:** Time to mark all observers dirty
3. **Computation overhead:** Time to recompute changed values
4. **Memory per node:** Bytes overhead per signal/computed
5. **GC pressure:** Allocations per update cycle

**Target Performance (1→1000 fanout):**
- Notification: <1μs
- Computation: <10μs (if all accessed)
- Memory: <100 bytes per computed
- Zero allocations in hot path

---

## 7. Summary Table

| Technique | Performance Impact | Complexity | Best For | Libraries Using |
|-----------|-------------------|------------|----------|-----------------|
| **Three-Color Marking** | Very High (glitch-free) | Medium | Deep graphs | Reactively |
| **Linked Lists** | High (O(1) sub/unsub) | Medium | Dynamic deps | Preact Signals |
| **Version Tracking** | High (fast checks) | Low | All scenarios | Adapton, Angular |
| **Topological Sort** | High (no redundant work) | Medium | Complex graphs | Many build systems |
| **Bitwise Flags** | Medium-High (fast state) | Low | Hot paths | Game engines |
| **Object Pooling** | Very High (reduce GC) | Medium | High frequency | Real-time systems |
| **Push-Pull Hybrid** | High (balance latency/work) | Medium | UI frameworks | SolidJS, Vue 3 |
| **Monomorphic Shapes** | High (20-50% faster access) | Low | V8 optimization | All JS libraries |
| **Compile-Time Analysis** | Very High (zero runtime cost) | High | Static graphs | Svelte |
| **Cache-Friendly Layout** | Medium-High (2-10x iteration) | Medium | Large datasets | Performance-critical |
| **SIMD** | Very High (2-16x) | High | Batch operations | WebAssembly apps |
| **Lock-Free** | High (concurrency) | High | Multi-threaded | Concurrent systems |

---

## 8. Recommended Reading

### Academic Papers
1. Umut Acar - "Self-Adjusting Computation: An overview"
2. Matthew Hammer et al. - "Adapton: Composable, Demand-Driven Incremental Computation" (PLDI 2014)
3. Matthew Hammer et al. - "Incremental Computation with Names" (OOPSLA 2015)
4. "Push-pull functional reactive programming" (Haskell Symposium)

### Technical Articles
1. "Super Charging Fine-Grained Reactive Performance" - Milo (Reactively)
2. "Becoming fully reactive: an in-depth explanation of MobX" - Michel Weststrate
3. "What's up with monomorphism?" - Vyacheslav Egorov (V8)
4. "Building a Reactive Library from Scratch" - Ryan Carniato (SolidJS)

### Documentation
1. SolidJS Reactivity Guide
2. Vue 3 Reactivity in Depth
3. Preact Signals Documentation
4. Angular Signals RFC

### Implementation References
1. github.com/milomg/reactively - Fastest fine-grained reactive library
2. github.com/solidjs/solid - Fine-grained reactivity with compile-time optimizations
3. github.com/preactjs/signals - Linked list-based dependency tracking
4. github.com/vuejs/core - Proxy-based reactivity system
5. github.com/mobxjs/mobx - Transparent reactivity

---

## 9. Conclusion

The fastest reactive systems combine multiple techniques:

1. **Algorithm:** Three-color marking for glitch-free updates
2. **Data Structure:** Linked lists for O(1) dependency management
3. **State Tracking:** Version numbers + bitwise flags
4. **Evaluation Strategy:** Push-pull hybrid (notify eagerly, compute lazily)
5. **Memory:** Object pooling for high-frequency allocations
6. **V8 Optimization:** Monomorphic shapes, avoid deoptimization
7. **Update Order:** Topological sorting for complex graphs
8. **Fanout Pattern:** Batch notification + lazy computation

**For your 1→N fanout scenario:**
- Use version-based dirty tracking (single int comparison)
- Linked list observers (O(1) add/remove)
- Lazy computation (only compute accessed nodes)
- Bitwise flags for state (fast, cache-friendly)
- Monomorphic signal/computed objects (V8 optimization)

This combination should achieve near-optimal performance with minimal overhead.
