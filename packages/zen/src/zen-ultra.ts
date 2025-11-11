/**
 * Zen Ultra-Optimized Build
 *
 * Maximum performance and minimum bundle size through aggressive inlining.
 * All code is inlined in a single file to eliminate module boundaries.
 *
 * Included: zen, computed, computedAsync, batch, subscribe
 * Excluded: select, map, get/set, lifecycle, color tracking, advanced features
 *
 * Optimizations:
 * - Fully inlined implementation (no imports)
 * - Minimal type checks
 * - Direct property access
 * - Simplified algorithms
 * - No color tracking (simpler but equally fast)
 * - No object pooling (smaller code)
 */

// ============================================================================
// TYPES
// ============================================================================

export type Listener<T> = (value: T, oldValue?: T | null) => void;
export type Unsubscribe = () => void;

type ZenCore<T> = {
	_kind: 'zen' | 'computed' | 'computedAsync';
	_value: T;
	_listeners?: Listener<T>[];
};

type ComputedCore<T> = ZenCore<T | null> & {
	_kind: 'computed';
	_dirty: boolean;
	_sources: AnyZen[];
	_calc: () => T;
	_unsubs?: Unsubscribe[];
};

type AsyncState<T> = {
	loading: boolean;
	data?: T;
	error?: Error;
};

type ComputedAsyncCore<T> = ZenCore<AsyncState<T>> & {
	_kind: 'computedAsync';
	_dirty: boolean;
	_sources: AnyZen[];
	_calc: () => Promise<T>;
	_unsubs?: Unsubscribe[];
	_promise?: Promise<T>;
	_promiseId?: number;
};

export type AnyZen = ZenCore<any> | ComputedCore<any> | ComputedAsyncCore<any>;

export type ZenValue<A extends AnyZen> = A extends ZenCore<infer V> ? V : never;

// ============================================================================
// AUTO-TRACKING
// ============================================================================

let currentListener: ComputedCore<any> | ComputedAsyncCore<any> | null = null;

// ============================================================================
// BATCHING
// ============================================================================

let batchDepth = 0;
const pendingNotifications = new Map<AnyZen, any>();

function notifyListeners<T>(zen: ZenCore<T>, newValue: T, oldValue: T) {
	const listeners = zen._listeners;
	if (!listeners) return;

	for (let i = 0; i < listeners.length; i++) {
		listeners[i](newValue, oldValue);
	}
}

function queueNotification(zen: AnyZen, oldValue: any) {
	if (!pendingNotifications.has(zen)) {
		pendingNotifications.set(zen, oldValue);
	}
}

// ============================================================================
// ZEN (Core Signal)
// ============================================================================

const zenProto = {
	get value() {
		// Auto-tracking: register as dependency if inside computed
		if (currentListener) {
			const sources = currentListener._sources as AnyZen[];
			if (!sources.includes(this)) {
				sources.push(this);
			}
		}
		return this._value;
	},
	set value(newValue: any) {
		const oldValue = this._value;
		if (Object.is(newValue, oldValue)) return;

		this._value = newValue;

		// Mark computed dependents as dirty
		const listeners = this._listeners;
		if (listeners) {
			for (let i = 0; i < listeners.length; i++) {
				const listener = listeners[i];
				if ((listener as any)._computedZen) {
					(listener as any)._computedZen._dirty = true;
				}
			}
		}

		if (batchDepth > 0) {
			queueNotification(this, oldValue);
		} else {
			notifyListeners(this, newValue, oldValue);
		}
	},
};

export function zen<T>(initialValue: T) {
	const signal = Object.create(zenProto) as ZenCore<T> & { value: T; _zenData: ZenCore<T> };
	signal._kind = 'zen';
	signal._value = initialValue;
	signal._zenData = signal;
	return signal;
}

export type Zen<T> = ReturnType<typeof zen<T>>;

// ============================================================================
// SUBSCRIBE
// ============================================================================

export function subscribe<A extends AnyZen>(
	zen: A,
	listener: Listener<ZenValue<A>>,
): Unsubscribe {
	const zenData = zen._kind === 'zen' ? zen : zen;

	// Add listener
	if (!zenData._listeners) zenData._listeners = [];
	zenData._listeners.push(listener as any);

	// Subscribe computed to sources
	if ((zen._kind === 'computed' || zen._kind === 'computedAsync') && zen._unsubs === undefined) {
		subscribeToSources(zen as any);
	}

	// Initial notification
	listener(zenData._value as any, undefined);

	// Return unsubscribe
	return () => {
		const listeners = zenData._listeners;
		if (!listeners) return;

		const idx = listeners.indexOf(listener as any);
		if (idx === -1) return;

		listeners.splice(idx, 1);

		// Unsubscribe computed from sources if no more listeners
		if (listeners.length === 0) {
			zenData._listeners = undefined;
			if ((zen._kind === 'computed' || zen._kind === 'computedAsync') && zen._unsubs) {
				unsubscribeFromSources(zen as any);
			}
		}
	};
}

// ============================================================================
// BATCH
// ============================================================================

export function batch<T>(fn: () => T): T {
	batchDepth++;
	try {
		return fn();
	} finally {
		batchDepth--;
		if (batchDepth === 0 && pendingNotifications.size > 0) {
			for (const [zen, oldValue] of pendingNotifications) {
				notifyListeners(zen, zen._value, oldValue);
			}
			pendingNotifications.clear();
		}
	}
}

// ============================================================================
// COMPUTED
// ============================================================================

function updateComputed<T>(c: ComputedCore<T>): void {
	// For auto-tracked computed, unsubscribe and reset sources for re-tracking
	const needsResubscribe = c._unsubs !== undefined;
	if (needsResubscribe) {
		unsubscribeFromSources(c);
		c._sources = []; // Reset for re-tracking
	}

	// Set as current listener for auto-tracking
	const prevListener = currentListener;
	currentListener = c;

	try {
		const newValue = c._calc();
		c._dirty = false;

		// Re-subscribe to newly tracked sources
		if (needsResubscribe && c._sources.length > 0) {
			subscribeToSources(c);
		}

		// Use Object.is for equality check
		if (c._value !== null && Object.is(newValue, c._value)) return;

		const oldValue = c._value;
		c._value = newValue;

		if (batchDepth > 0) {
			queueNotification(c, oldValue);
		} else {
			notifyListeners(c, newValue, oldValue);
		}
	} finally {
		currentListener = prevListener;
	}
}

function subscribeToSources(c: ComputedCore<any> | ComputedAsyncCore<any>): void {
	const unsubs: Unsubscribe[] = [];

	const onSourceChange = () => {
		c._dirty = true;
		if (c._kind === 'computed') {
			updateComputed(c as ComputedCore<any>);
		} else if (c._kind === 'computedAsync' && c._listeners && c._listeners.length > 0) {
			executeAsync(c as ComputedAsyncCore<any>);
		}
	};
	(onSourceChange as any)._computedZen = c;

	for (let i = 0; i < c._sources.length; i++) {
		const source = c._sources[i] as ZenCore<any>;
		if (!source._listeners) source._listeners = [];
		source._listeners.push(onSourceChange as any);

		unsubs.push(() => {
			const listeners = source._listeners;
			if (!listeners) return;
			const idx = listeners.indexOf(onSourceChange as any);
			if (idx !== -1) listeners.splice(idx, 1);
		});
	}

	c._unsubs = unsubs;
}

function unsubscribeFromSources(c: ComputedCore<any> | ComputedAsyncCore<any>): void {
	if (!c._unsubs) return;
	for (let i = 0; i < c._unsubs.length; i++) {
		c._unsubs[i]();
	}
	c._unsubs = undefined;
	c._dirty = true;
}

const computedProto = {
	get value() {
		if (this._dirty) {
			updateComputed(this);
			// Subscribe on first access
			if (this._unsubs === undefined && this._sources.length > 0) {
				subscribeToSources(this);
			}
		}
		return this._value;
	},
};

export function computed<T>(
	calculation: () => T,
	explicitDeps?: AnyZen[],
): ComputedCore<T> & { value: T } {
	const c = Object.create(computedProto) as ComputedCore<T> & { value: T };
	c._kind = 'computed';
	c._value = null;
	c._dirty = true;
	c._sources = explicitDeps || []; // Empty array for auto-tracking
	c._calc = calculation;

	return c;
}

export type ReadonlyZen<T> = ComputedCore<T>;
export type ComputedZen<T> = ComputedCore<T>;

// ============================================================================
// COMPUTED ASYNC
// ============================================================================

async function executeAsync<T>(c: ComputedAsyncCore<T>): Promise<void> {
	const promiseId = (c._promiseId ?? 0) + 1;
	c._promiseId = promiseId;

	const oldValue = c._value;
	const wasLoading = oldValue.loading;

	if (!wasLoading) {
		c._value = { loading: true, data: oldValue.data, error: undefined };
		notifyListeners(c, c._value, oldValue);
	}

	// Set as current listener for auto-tracking (only before first await)
	const prevListener = currentListener;
	currentListener = c;

	try {
		const promise = c._calc();
		// Clear listener after sync portion (before await)
		currentListener = prevListener;

		c._promise = promise;
		const result = await promise;

		if (c._promiseId !== promiseId) return;

		const hasChanged = oldValue.data === undefined || !Object.is(result, oldValue.data);
		const newValue: AsyncState<T> = { loading: false, data: result, error: undefined };

		c._value = newValue;
		c._dirty = false;
		c._promise = undefined;

		if (hasChanged || wasLoading) {
			notifyListeners(c, newValue, oldValue);
		}
	} catch (err) {
		currentListener = prevListener;

		if (c._promiseId !== promiseId) return;

		const newValue: AsyncState<T> = {
			loading: false,
			data: undefined,
			error: err instanceof Error ? err : new Error(String(err ?? 'Unknown error')),
		};

		c._value = newValue;
		c._dirty = false;
		c._promise = undefined;

		notifyListeners(c, newValue, oldValue);
	}
}

const computedAsyncProto = {
	get value() {
		// Execute on first access or when dirty
		if (this._unsubs === undefined && this._dirty) {
			executeAsync(this);
			// Subscribe to tracked sources after execution starts
			// Note: sources are tracked synchronously before first await
			setTimeout(() => {
				if (this._unsubs === undefined && this._sources.length > 0) {
					subscribeToSources(this);
				}
			}, 0);
		}
		return this._value;
	},
};

export function computedAsync<T>(
	asyncCalculation: () => Promise<T>,
	explicitDeps?: AnyZen[],
): ComputedAsyncCore<T> & { value: AsyncState<T> } {
	const c = Object.create(computedAsyncProto) as ComputedAsyncCore<T> & { value: AsyncState<T> };
	c._kind = 'computedAsync';
	c._value = { loading: false, data: undefined, error: undefined };
	c._dirty = true;
	c._sources = explicitDeps || []; // Empty array for auto-tracking
	c._calc = asyncCalculation;

	return c;
}

export type ComputedAsyncZen<T> = ComputedAsyncCore<T>;
