/**
 * Simple performance comparison: Explicit deps vs Auto-tracking
 */
import { zen, computed } from '../src/zen-ultra';

function benchmark(name: string, fn: () => void, iterations = 1_000_000) {
	const start = performance.now();
	for (let i = 0; i < iterations; i++) {
		fn();
	}
	const end = performance.now();
	const time = end - start;
	const opsPerSec = (iterations / time) * 1000;
	console.log(`${name}: ${time.toFixed(2)}ms (${(opsPerSec / 1_000_000).toFixed(2)}M ops/s)`);
	return { time, opsPerSec };
}

console.log('🧪 Performance Comparison: Explicit vs Auto-tracking\n');
console.log('Running 1M iterations each...\n');

// Test 1: Simple computed (1 dependency)
console.log('Test 1: Simple Computed (1 dep)');
const explicit1 = benchmark('Explicit', () => {
	const count = zen(0);
	const doubled = computed(() => count.value * 2, [count]);
	count.value = 5;
	const _ = doubled.value;
});

const autoTrack1 = benchmark('Auto-tracking', () => {
	const count = zen(0);
	const doubled = computed(() => count.value * 2);
	count.value = 5;
	const _ = doubled.value;
});

const overhead1 = ((autoTrack1.time - explicit1.time) / explicit1.time * 100).toFixed(1);
console.log(`→ Auto-tracking overhead: ${overhead1}%\n`);

// Test 2: Multiple dependencies
console.log('Test 2: Multiple Dependencies (3 deps)');
const explicit2 = benchmark('Explicit', () => {
	const a = zen(1);
	const b = zen(2);
	const c = zen(3);
	const sum = computed(() => a.value + b.value + c.value, [a, b, c]);
	a.value = 10;
	const _ = sum.value;
});

const autoTrack2 = benchmark('Auto-tracking', () => {
	const a = zen(1);
	const b = zen(2);
	const c = zen(3);
	const sum = computed(() => a.value + b.value + c.value);
	a.value = 10;
	const _ = sum.value;
});

const overhead2 = ((autoTrack2.time - explicit2.time) / explicit2.time * 100).toFixed(1);
console.log(`→ Auto-tracking overhead: ${overhead2}%\n`);

// Test 3: Deep chain
console.log('Test 3: Deep Chain (5 levels)');
const explicit3 = benchmark('Explicit', () => {
	const a = zen(1);
	const b = computed(() => a.value * 2, [a]);
	const c = computed(() => b.value * 2, [b]);
	const d = computed(() => c.value * 2, [c]);
	const e = computed(() => d.value * 2, [d]);
	a.value = 2;
	const _ = e.value;
});

const autoTrack3 = benchmark('Auto-tracking', () => {
	const a = zen(1);
	const b = computed(() => a.value * 2);
	const c = computed(() => b.value * 2);
	const d = computed(() => c.value * 2);
	const e = computed(() => d.value * 2);
	a.value = 2;
	const _ = e.value;
});

const overhead3 = ((autoTrack3.time - explicit3.time) / explicit3.time * 100).toFixed(1);
console.log(`→ Auto-tracking overhead: ${overhead3}%\n`);

// Test 4: Read-only (no updates)
console.log('Test 4: Read-only (no updates)');
const explicit4 = benchmark('Explicit', () => {
	const count = zen(5);
	const doubled = computed(() => count.value * 2, [count]);
	const _ = doubled.value;
	const __ = doubled.value;
	const ___ = doubled.value;
});

const autoTrack4 = benchmark('Auto-tracking', () => {
	const count = zen(5);
	const doubled = computed(() => count.value * 2);
	const _ = doubled.value;
	const __ = doubled.value;
	const ___ = doubled.value;
});

const overhead4 = ((autoTrack4.time - explicit4.time) / explicit4.time * 100).toFixed(1);
console.log(`→ Auto-tracking overhead: ${overhead4}%\n`);

// Test 5: Conditional dependencies (auto-tracking advantage)
console.log('Test 5: Conditional Dependencies');
console.log('(This should favor auto-tracking)');

const explicit5 = benchmark('Explicit (over-subscribes)', () => {
	const useA = zen(true);
	const a = zen(1);
	const b = zen(2);
	const result = computed(() => useA.value ? a.value : b.value, [useA, a, b]);
	a.value = 10;
	const _ = result.value;
	b.value = 20; // Wasteful: triggers even though not used
	const __ = result.value;
}, 100_000); // Fewer iterations for complex test

const autoTrack5 = benchmark('Auto-tracking (optimal)', () => {
	const useA = zen(true);
	const a = zen(1);
	const b = zen(2);
	const result = computed(() => useA.value ? a.value : b.value);
	a.value = 10;
	const _ = result.value;
	b.value = 20; // Optimal: doesn't trigger
	const __ = result.value;
}, 100_000);

const improvement5 = ((explicit5.time - autoTrack5.time) / explicit5.time * 100).toFixed(1);
console.log(`→ Auto-tracking improvement: ${improvement5}%\n`);

// Summary
console.log('═══════════════════════════════════════');
console.log('Summary:');
console.log('───────────────────────────────────────');
console.log('Simple computed (1 dep):    ' + (overhead1.startsWith('-') ? '✅ ' : '⚠️  ') + `${overhead1}% overhead`);
console.log('Multiple deps (3):          ' + (overhead2.startsWith('-') ? '✅ ' : '⚠️  ') + `${overhead2}% overhead`);
console.log('Deep chain (5 levels):      ' + (overhead3.startsWith('-') ? '✅ ' : '⚠️  ') + `${overhead3}% overhead`);
console.log('Read-only:                  ' + (overhead4.startsWith('-') ? '✅ ' : '⚠️  ') + `${overhead4}% overhead`);
console.log('Conditional deps:           ✅ ' + `${improvement5}% improvement`);
console.log('═══════════════════════════════════════');
