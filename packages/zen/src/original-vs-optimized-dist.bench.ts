/**
 * 公平對比：原版 dist vs 優化版 dist
 * 使用相同的 dist 構建版本測試
 */

import { bench, describe } from 'vitest';

// 從 dist 導入原版
import * as ZenOriginal from '../dist/index.js';

// 從 dist/optimized 導入優化版
import * as ZenOptimized from '../dist/optimized/zen-optimized.js';

// ============================================================================
// 基礎操作測試
// ============================================================================

describe('Signal Creation', () => {
  bench('Original (dist)', () => {
    ZenOriginal.zen(0);
  });

  bench('Optimized (dist)', () => {
    ZenOptimized.zen(0);
  });
});

describe('Signal Read (no tracking)', () => {
  const originalSig = ZenOriginal.zen(42);
  const optimizedSig = ZenOptimized.zen(42);

  bench('Original (dist) - get()', () => {
    ZenOriginal.get(originalSig);
  });

  bench('Optimized (dist) - .get()', () => {
    optimizedSig.get();
  });
});

describe('Signal Write (no listeners)', () => {
  const originalSig = ZenOriginal.zen(0);
  const optimizedSig = ZenOptimized.zen(0);

  let i = 0;

  bench('Original (dist) - set()', () => {
    ZenOriginal.set(originalSig, ++i);
  });

  bench('Optimized (dist) - .set()', () => {
    optimizedSig.set(++i);
  });
});

describe('Read + Write Combined (Hot Path)', () => {
  const originalSig = ZenOriginal.zen(0);
  const optimizedSig = ZenOptimized.zen(0);

  bench('Original (dist)', () => {
    const val = ZenOriginal.get(originalSig);
    ZenOriginal.set(originalSig, val + 1);
  });

  bench('Optimized (dist)', () => {
    const val = optimizedSig.get();
    optimizedSig.set(val + 1);
  });
});

// ============================================================================
// 帶 Listeners 的測試
// ============================================================================

describe('Signal Write (with 1 listener)', () => {
  const originalSig = ZenOriginal.zen(0);
  ZenOriginal.subscribe(originalSig, () => {});

  const optimizedSig = ZenOptimized.zen(0);
  ZenOptimized.subscribe(optimizedSig._zenData, () => {});

  let i = 0;

  bench('Original (dist)', () => {
    ZenOriginal.set(originalSig, ++i);
  });

  bench('Optimized (dist)', () => {
    optimizedSig.set(++i);
  });
});

describe('Signal Write (with 5 listeners)', () => {
  const originalSig = ZenOriginal.zen(0);
  for (let i = 0; i < 5; i++) {
    ZenOriginal.subscribe(originalSig, () => {});
  }

  const optimizedSig = ZenOptimized.zen(0);
  const zenNode = optimizedSig._zenData;
  for (let i = 0; i < 5; i++) {
    ZenOptimized.subscribe(zenNode, () => {});
  }

  let i = 0;

  bench('Original (dist)', () => {
    ZenOriginal.set(originalSig, ++i);
  });

  bench('Optimized (dist)', () => {
    optimizedSig.set(++i);
  });
});

// ============================================================================
// Batch 操作
// ============================================================================

describe('Batch Update (10 signals)', () => {
  const originalSigs = Array.from({ length: 10 }, (_, i) => ZenOriginal.zen(i));
  originalSigs.forEach(sig => ZenOriginal.subscribe(sig, () => {}));

  const optimizedSigs = Array.from({ length: 10 }, (_, i) => ZenOptimized.zen(i));
  optimizedSigs.forEach(sig => ZenOptimized.subscribe(sig._zenData, () => {}));

  let counter = 0;

  bench('Original (dist)', () => {
    ZenOriginal.batch(() => {
      originalSigs.forEach(sig => ZenOriginal.set(sig, ++counter));
    });
  });

  bench('Optimized (dist)', () => {
    ZenOptimized.batch(() => {
      optimizedSigs.forEach(sig => sig.set(++counter));
    });
  });
});

// ============================================================================
// 規模測試
// ============================================================================

describe('Create 100 Signals', () => {
  bench('Original (dist)', () => {
    Array.from({ length: 100 }, (_, i) => ZenOriginal.zen(i));
  });

  bench('Optimized (dist)', () => {
    Array.from({ length: 100 }, (_, i) => ZenOptimized.zen(i));
  });
});

describe('Update 100 Signals (with listeners)', () => {
  const originalSigs = Array.from({ length: 100 }, (_, i) => ZenOriginal.zen(i));
  originalSigs.forEach(sig => ZenOriginal.subscribe(sig, () => {}));

  const optimizedSigs = Array.from({ length: 100 }, (_, i) => ZenOptimized.zen(i));
  optimizedSigs.forEach(sig => ZenOptimized.subscribe(sig._zenData, () => {}));

  let counter = 0;

  bench('Original (dist)', () => {
    originalSigs.forEach(sig => ZenOriginal.set(sig, ++counter));
  });

  bench('Optimized (dist)', () => {
    optimizedSigs.forEach(sig => sig.set(++counter));
  });
});

// ============================================================================
// 壓力測試
// ============================================================================

describe('Stress Test: 1000 updates', () => {
  const originalSig = ZenOriginal.zen(0);
  ZenOriginal.subscribe(originalSig, () => {});

  const optimizedSig = ZenOptimized.zen(0);
  ZenOptimized.subscribe(optimizedSig._zenData, () => {});

  bench('Original (dist)', () => {
    for (let i = 0; i < 1000; i++) {
      ZenOriginal.set(originalSig, i);
    }
  });

  bench('Optimized (dist)', () => {
    for (let i = 0; i < 1000; i++) {
      optimizedSig.set(i);
    }
  });
});
