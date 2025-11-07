# Karma Reactive Cache - Performance Benchmark Results

Benchmark performed on reactive karma implementation after full rewrite.

## Test Environment
- Runtime: Bun 1.3.1
- Test Framework: Vitest
- Total tests: 21 benchmarks
- Runs performed: 5

## Key Performance Metrics

### Cache Performance (5 runs average)

| Metric | Run 1 | Run 2 | Run 3 | Run 4 | Run 5 | Average |
|--------|-------|-------|-------|-------|-------|---------|
| **Cache miss** | 1.17ms | 1.17ms | 1.20ms | 1.20ms | 1.19ms | **1.19ms** |
| **Cache hit** | 0.02ms | 0.02ms | 0.05ms | 0.05ms | 0.05ms | **0.04ms** |
| **Speedup** | 58x | 52x | 24x | 25x | 23x | **36x faster** |
| **Cache hit (1000 entries)** | 0.02ms | 0.06ms | 0.03ms | 0.03ms | 0.05ms | **0.04ms** |

**Key Findings:**
- Cache hits return in ~0.04ms (nearly instant)
- Cache performance is **constant O(1)** - no degradation with 1000 entries
- Cache is **36x faster** than fetching (on average)

### Concurrent Request Deduplication (5 runs average)

| Metric | Run 1 | Run 2 | Run 3 | Run 4 | Run 5 | Average |
|--------|-------|-------|-------|-------|-------|---------|
| **100 concurrent (same args)** | 1.54ms | 1.29ms | 1.06ms | 1.14ms | 1.36ms | **1.28ms** |
| **Execution count** | 1 | 1 | 1 | 1 | 1 | **1** |

**Key Findings:**
- 100 concurrent requests with same args → Only 1 execution (99% reduction!)
- Deduplication is **100% effective**
- Total time ~1.3ms (same as single request)

### Listener Notification Performance (5 runs average)

| Metric | Run 1 | Run 2 | Run 3 | Run 4 | Run 5 | Average |
|--------|-------|-------|-------|-------|-------|---------|
| **1000 listeners** | 3.41ms | 3.75ms | 4.53ms | 3.94ms | 4.19ms | **3.96ms** |

**Key Findings:**
- Notifying 1000 listeners takes only ~4ms
- **~0.004ms per listener** (4 microseconds)
- Linear O(n) performance - scales well

### Overall Test Suite Performance

| Metric | Run 1 | Run 2 | Run 3 | Run 4 | Run 5 | Average |
|--------|-------|-------|-------|-------|-------|---------|
| **Total time** | 1409ms | 1400ms | 1401ms | 1404ms | 1398ms | **1402ms** |

## Performance Summary

### Excellent Performance ✅
1. **Cache hits**: O(1) constant time (~0.04ms), no degradation at scale
2. **Concurrent deduplication**: 100% effective, prevents redundant fetches
3. **Listener notifications**: Linear O(n), ~4μs per listener

### Scalability ✅
- **1000 cache entries**: No performance impact
- **100 concurrent requests**: Perfect deduplication
- **1000 listeners**: 4ms total notification time

## Conclusion

The reactive karma implementation demonstrates:
- **Excellent cache performance** with constant-time lookups
- **Perfect concurrent request deduplication** (100% effective)
- **Efficient listener notification** that scales linearly
- **No performance degradation** with large cache sizes

All benchmarks pass with consistent performance across 5 runs.
