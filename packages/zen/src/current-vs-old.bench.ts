/**
 * Benchmark: Current (optimized) vs v3.0.0
 * Fair comparison of equivalent features only
 */
import { bench, describe } from 'vitest';

// Current version (optimized)
import {
  batch as batchNew,
  computed as computedNew,
  subscribe as subscribeNew,
  zen as zenNew,
} from './index';

// v3.0.0 from downloaded package
// @ts-ignore
import {
  batch as batchOld,
  computed as computedOld,
  subscribe as subscribeOld,
  zen as zenOld,
} from '../../benchmark-old-vs-new/zen-v3.0.0/dist/index.js';

describe('Atom Creation', () => {
  bench('v3.0.0', () => {
    zenOld(0);
  });

  bench('current (optimized)', () => {
    zenNew(0);
  });
});

describe('Atom Read (no listeners)', () => {
  const atomOld = zenOld(42);
  const atomNew = zenNew(42);

  bench('v3.0.0', () => {
    atomOld.value;
  });

  bench('current (optimized)', () => {
    atomNew.value;
  });
});

describe('Atom Write (no listeners)', () => {
  const atomOld = zenOld(0);
  const atomNew = zenNew(0);

  bench('v3.0.0', () => {
    atomOld.value++;
  });

  bench('current (optimized)', () => {
    atomNew.value++;
  });
});

describe('Atom Write (1 listener)', () => {
  const atomOld = zenOld(0);
  const atomNew = zenNew(0);

  subscribeOld(atomOld, () => {});
  subscribeNew(atomNew, () => {});

  bench('v3.0.0', () => {
    atomOld.value++;
  });

  bench('current (optimized)', () => {
    atomNew.value++;
  });
});

describe('Computed Creation', () => {
  const sourceOld = zenOld(1);
  const sourceNew = zenNew(1);

  bench('v3.0.0', () => {
    computedOld(() => sourceOld.value * 2);
  });

  bench('current (optimized)', () => {
    computedNew([sourceNew], (n) => n * 2);
  });
});

describe('Computed Read', () => {
  const sourceOld = zenOld(5);
  const sourceNew = zenNew(5);
  const computedAtomOld = computedOld(() => sourceOld.value * 2);
  const computedAtomNew = computedNew([sourceNew], (n) => n * 2);

  bench('v3.0.0', () => {
    computedAtomOld.value;
  });

  bench('current (optimized)', () => {
    computedAtomNew.value;
  });
});

describe('Computed Update Propagation', () => {
  const sourceOld = zenOld(0);
  const sourceNew = zenNew(0);
  const computedAtomOld = computedOld(() => sourceOld.value * 2);
  const computedAtomNew = computedNew([sourceNew], (n) => n * 2);

  subscribeOld(computedAtomOld, () => {});
  subscribeNew(computedAtomNew, () => {});

  bench('v3.0.0', () => {
    sourceOld.value++;
  });

  bench('current (optimized)', () => {
    sourceNew.value++;
  });
});

describe('Batch Operations', () => {
  const a1Old = zenOld(0);
  const a2Old = zenOld(0);
  const a1New = zenNew(0);
  const a2New = zenNew(0);

  subscribeOld(a1Old, () => {});
  subscribeOld(a2Old, () => {});
  subscribeNew(a1New, () => {});
  subscribeNew(a2New, () => {});

  bench('v3.0.0', () => {
    batchOld(() => {
      a1Old.value++;
      a2Old.value++;
    });
  });

  bench('current (optimized)', () => {
    batchNew(() => {
      a1New.value++;
      a2New.value++;
    });
  });
});

describe('Subscribe/Unsubscribe', () => {
  const atomOld = zenOld(0);
  const atomNew = zenNew(0);

  bench('v3.0.0', () => {
    const unsub = subscribeOld(atomOld, () => {});
    unsub();
  });

  bench('current (optimized)', () => {
    const unsub = subscribeNew(atomNew, () => {});
    unsub();
  });
});

describe('Computed Chain (depth 5)', () => {
  const sourceOld = zenOld(1);
  const c1Old = computedOld(() => sourceOld.value * 2);
  const c2Old = computedOld(() => c1Old.value * 2);
  const c3Old = computedOld(() => c2Old.value * 2);
  const c4Old = computedOld(() => c3Old.value * 2);
  const c5Old = computedOld(() => c4Old.value * 2);

  const sourceNew = zenNew(1);
  const c1New = computedNew([sourceNew], (n) => n * 2);
  const c2New = computedNew([c1New], (n) => n * 2);
  const c3New = computedNew([c2New], (n) => n * 2);
  const c4New = computedNew([c3New], (n) => n * 2);
  const c5New = computedNew([c4New], (n) => n * 2);

  subscribeOld(c5Old, () => {});
  subscribeNew(c5New, () => {});

  bench('v3.0.0', () => {
    sourceOld.value++;
  });

  bench('current (optimized)', () => {
    sourceNew.value++;
  });
});
