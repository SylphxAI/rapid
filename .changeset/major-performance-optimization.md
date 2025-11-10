---
"@sylphx/zen": minor
---

Major performance optimization with getter/setter API

## 🚀 Performance Improvements

- **Hot Path**: +28% (38.7M → 49.6M ops/s)
- **Stress Test**: +95% (138K → 270K ops/s)
- **Update 100**: +52% (845K → 1.28M ops/s)
- **Batch**: +33% (1.26M → 1.67M ops/s)

## ✨ New Features

### Getter/Setter API

Introducing a more intuitive property-based API:

```typescript
const count = zen(0);

// New API (recommended)
count.value;     // read
count.value = 1; // write
count.value++;   // increment

// Old API (still supported)
get(count);      // read
set(count, 1);   // write
```

## 🔧 Technical Improvements

1. **Prototype Chain**: Zero closure overhead - all instances share methods via prototype
2. **Loop Unrolling**: Optimized 1-3 listener scenarios for common use cases
3. **Native Getter/Setter**: Better V8 optimization with native property descriptors
4. **Subscribe Fast Path**: Skip unnecessary updates for simple signals

## 📦 Bundle Size

- Package size: **+0.5%** (+30 bytes gzip) - essentially unchanged
- Code: **-19%** (-102 lines) - cleaner implementation

## ✅ Backward Compatibility

- **100% backward compatible** - all existing APIs still work
- No breaking changes
- All features preserved (computed, effect, map, deepMap, etc.)

## 🎯 Migration Guide

### Recommended (New API)

```typescript
import { zen } from '@sylphx/zen';

const count = zen(0);
count.value++;           // Cleaner!
console.log(count.value);
```

### Still Supported (Old API)

```typescript
import { zen, get, set } from '@sylphx/zen';

const count = zen(0);
set(count, get(count) + 1);  // Still works
console.log(get(count));
```

Both APIs can be used interchangeably in the same codebase.
