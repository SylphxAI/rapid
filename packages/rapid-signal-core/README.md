<div align="center">

# ⚡ @rapid/signal-core

> Pure reactive core - ultra-fast signals with auto-tracking (framework-agnostic)

[![npm](https://img.shields.io/npm/v/@rapid/signal-core)](https://www.npmjs.com/package/@rapid/signal-core)
[![downloads](https://img.shields.io/npm/dm/@rapid/signal-core)](https://www.npmjs.com/package/@rapid/signal-core)
[![stars](https://img.shields.io/github/stars/SylphxAI/rapid)](https://github.com/SylphxAI/rapid)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

</div>

---

## Installation

```bash
npm install @rapid/signal-core
```

## Usage

```typescript
import { signal, computed, effect } from '@rapid/signal-core';

// Create reactive state
const count = signal(0);

// Auto-tracked computed
const double = computed(() => count.value * 2);

// Side effects
effect(() => {
  console.log('Count:', count.value);
});

// Update
count.value++;
```

## Features

- **Ultra-fast** - Optimized for performance
- **Auto-tracking** - Dependencies tracked automatically
- **Framework-agnostic** - Works with any framework
- **Tiny** - Minimal bundle size

## API

- `signal(value)` - Create reactive value
- `computed(fn)` - Create derived value
- `effect(fn)` - Run side effects
- `batch(fn)` - Batch multiple updates

---

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=SylphxAI/rapid&type=Date)](https://star-history.com/#SylphxAI/rapid&Date)

## Powered by Sylphx


---

<div align="center">
<sub>Built with ❤️ by <a href="https://github.com/SylphxAI">Sylphx</a></sub>
</div>
