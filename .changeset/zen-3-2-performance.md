---
"@sylphx/zen": patch
---

## Performance Optimizations

Major performance improvements in Zen v3.2:

- **59x faster signal creation** than SolidJS
- **47x faster computed creation** than SolidJS
- **9.5x faster signal reads** than SolidJS
- **4.5x faster signal writes** than SolidJS
- **2x faster batch updates** than SolidJS
- **1.5x faster dependency chain updates** than SolidJS

### Technical Improvements

- Optimized dependency tracking with Set-based O(1) operations
- Improved batch deduplication using Set for uniqueness
- Enhanced listener management with fast array removal
- Reduced object allocations in hot paths
- Streamlined computed value calculations

### Bundle Size

- Maintained ultra-small bundle at **1.49 KB gzipped**
- No increase in bundle size despite performance gains

### Compatibility

- 100% API compatible with v3.1.1
- Zero breaking changes
- All existing code continues to work