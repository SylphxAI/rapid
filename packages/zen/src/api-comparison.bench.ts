/**
 * Benchmark: 对比 Explicit Deps (参数传值) vs Auto-tracking (.value)
 */
import { describe, bench } from 'vitest';
import { zen, computed, subscribe } from './zen-ultra';

describe('API Comparison: Explicit vs Auto-tracking', () => {
	// ============================================================================
	// Test 1: Simple computed (1 dependency)
	// ============================================================================
	describe('Simple Computed (1 dep)', () => {
		bench('Explicit deps', () => {
			const count = zen(0);
			const doubled = computed(() => count.value * 2, [count]);

			count.value = 1;
			const _ = doubled.value;
			count.value = 2;
			const __ = doubled.value;
		});

		bench('Auto-tracking', () => {
			const count = zen(0);
			const doubled = computed(() => count.value * 2);

			count.value = 1;
			const _ = doubled.value;
			count.value = 2;
			const __ = doubled.value;
		});
	});

	// ============================================================================
	// Test 2: Multiple dependencies
	// ============================================================================
	describe('Multiple Dependencies (3 deps)', () => {
		bench('Explicit deps', () => {
			const a = zen(1);
			const b = zen(2);
			const c = zen(3);
			const sum = computed(() => a.value + b.value + c.value, [a, b, c]);

			a.value = 10;
			const _ = sum.value;
			b.value = 20;
			const __ = sum.value;
		});

		bench('Auto-tracking', () => {
			const a = zen(1);
			const b = zen(2);
			const c = zen(3);
			const sum = computed(() => a.value + b.value + c.value);

			a.value = 10;
			const _ = sum.value;
			b.value = 20;
			const __ = sum.value;
		});
	});

	// ============================================================================
	// Test 3: Deep chain (5 levels)
	// ============================================================================
	describe('Deep Chain (5 levels)', () => {
		bench('Explicit deps', () => {
			const a = zen(1);
			const b = computed(() => a.value * 2, [a]);
			const c = computed(() => b.value * 2, [b]);
			const d = computed(() => c.value * 2, [c]);
			const e = computed(() => d.value * 2, [d]);

			a.value = 2;
			const _ = e.value;
		});

		bench('Auto-tracking', () => {
			const a = zen(1);
			const b = computed(() => a.value * 2);
			const c = computed(() => b.value * 2);
			const d = computed(() => c.value * 2);
			const e = computed(() => d.value * 2);

			a.value = 2;
			const _ = e.value;
		});
	});

	// ============================================================================
	// Test 4: Diamond graph
	// ============================================================================
	describe('Diamond Graph', () => {
		bench('Explicit deps', () => {
			const a = zen(1);
			const b = computed(() => a.value * 2, [a]);
			const c = computed(() => a.value * 3, [a]);
			const d = computed(() => b.value + c.value, [b, c]);

			a.value = 5;
			const _ = d.value;
		});

		bench('Auto-tracking', () => {
			const a = zen(1);
			const b = computed(() => a.value * 2);
			const c = computed(() => a.value * 3);
			const d = computed(() => b.value + c.value);

			a.value = 5;
			const _ = d.value;
		});
	});

	// ============================================================================
	// Test 5: With subscriptions (realistic scenario)
	// ============================================================================
	describe('With Subscriptions', () => {
		bench('Explicit deps', () => {
			const count = zen(0);
			const doubled = computed(() => count.value * 2, [count]);

			let result = 0;
			subscribe(doubled, (v) => { result = v; });

			count.value = 1;
			count.value = 2;
			count.value = 3;
		});

		bench('Auto-tracking', () => {
			const count = zen(0);
			const doubled = computed(() => count.value * 2);

			let result = 0;
			subscribe(doubled, (v) => { result = v; });

			count.value = 1;
			count.value = 2;
			count.value = 3;
		});
	});

	// ============================================================================
	// Test 6: Real-world: Counter app
	// ============================================================================
	describe('Real-world: Counter App', () => {
		bench('Explicit deps', () => {
			const count = zen(0);
			const doubled = computed(() => count.value * 2, [count]);
			const tripled = computed(() => count.value * 3, [count]);
			const sum = computed(() => doubled.value + tripled.value, [doubled, tripled]);

			let result = 0;
			subscribe(sum, (v) => { result = v; });

			count.value = 1;
			count.value = 2;
			count.value = 3;
		});

		bench('Auto-tracking', () => {
			const count = zen(0);
			const doubled = computed(() => count.value * 2);
			const tripled = computed(() => count.value * 3);
			const sum = computed(() => doubled.value + tripled.value);

			let result = 0;
			subscribe(sum, (v) => { result = v; });

			count.value = 1;
			count.value = 2;
			count.value = 3;
		});
	});

	// ============================================================================
	// Test 7: Real-world: Form validation
	// ============================================================================
	describe('Real-world: Form Validation', () => {
		bench('Explicit deps', () => {
			const email = zen('');
			const password = zen('');
			const confirmPassword = zen('');

			const emailValid = computed(
				() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value),
				[email]
			);
			const passwordValid = computed(
				() => password.value.length >= 8,
				[password]
			);
			const passwordsMatch = computed(
				() => password.value === confirmPassword.value,
				[password, confirmPassword]
			);
			const formValid = computed(
				() => emailValid.value && passwordValid.value && passwordsMatch.value,
				[emailValid, passwordValid, passwordsMatch]
			);

			email.value = 'test@example.com';
			password.value = 'password123';
			confirmPassword.value = 'password123';
			const _ = formValid.value;
		});

		bench('Auto-tracking', () => {
			const email = zen('');
			const password = zen('');
			const confirmPassword = zen('');

			const emailValid = computed(
				() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)
			);
			const passwordValid = computed(
				() => password.value.length >= 8
			);
			const passwordsMatch = computed(
				() => password.value === confirmPassword.value
			);
			const formValid = computed(
				() => emailValid.value && passwordValid.value && passwordsMatch.value
			);

			email.value = 'test@example.com';
			password.value = 'password123';
			confirmPassword.value = 'password123';
			const _ = formValid.value;
		});
	});

	// ============================================================================
	// Test 8: Conditional dependencies (auto-tracking advantage)
	// ============================================================================
	describe('Conditional Dependencies', () => {
		bench('Explicit deps (over-subscribe)', () => {
			const useA = zen(true);
			const a = zen(1);
			const b = zen(2);

			// Must list all possible deps
			const result = computed(
				() => useA.value ? a.value : b.value,
				[useA, a, b]
			);

			useA.value = true;
			const _ = result.value;
			a.value = 10; // Triggers
			const __ = result.value;
			b.value = 20; // Also triggers (wasteful!)
			const ___ = result.value;
		});

		bench('Auto-tracking (optimal)', () => {
			const useA = zen(true);
			const a = zen(1);
			const b = zen(2);

			// Only subscribes to current branch
			const result = computed(
				() => useA.value ? a.value : b.value
			);

			useA.value = true;
			const _ = result.value;
			a.value = 10; // Triggers
			const __ = result.value;
			b.value = 20; // Doesn't trigger (optimal!)
			const ___ = result.value;
		});
	});

	// ============================================================================
	// Test 9: Many computed values (memory/performance)
	// ============================================================================
	describe('Create 100 Computed', () => {
		bench('Explicit deps', () => {
			const source = zen(0);
			const computeds = Array.from({ length: 100 }, (_, i) =>
				computed(() => source.value * i, [source])
			);

			source.value = 1;
			// Only access a few
			const _ = computeds[0].value;
			const __ = computeds[50].value;
		});

		bench('Auto-tracking', () => {
			const source = zen(0);
			const computeds = Array.from({ length: 100 }, (_, i) =>
				computed(() => source.value * i)
			);

			source.value = 1;
			// Only access a few
			const _ = computeds[0].value;
			const __ = computeds[50].value;
		});
	});
});
