<div align="center">

# ⚡ @rapid/signal

> Rapid framework signals with lifecycle integration

[![npm](https://img.shields.io/npm/v/@rapid/signal)](https://www.npmjs.com/package/@rapid/signal)
[![downloads](https://img.shields.io/npm/dm/@rapid/signal)](https://www.npmjs.com/package/@rapid/signal)
[![stars](https://img.shields.io/github/stars/SylphxAI/rapid)](https://github.com/SylphxAI/rapid)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

</div>

---

## Installation

```bash
npm install @rapid/signal
```

## Usage

```typescript
import { signal, computed, effect } from '@rapid/signal';

const count = signal(0);
const double = computed(() => count.value * 2);

effect(() => {
  console.log('Count:', count.value);
});

count.value++;
```

## Features

- Re-exports `@rapid/signal-core` with framework lifecycle integration
- Works seamlessly with `@rapid/web` and `@rapid/tui`

---

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=SylphxAI/rapid&type=Date)](https://star-history.com/#SylphxAI/rapid&Date)

## Powered by Sylphx


---

<div align="center">
<sub>Built with ❤️ by <a href="https://github.com/SylphxAI">Sylphx</a></sub>
</div>
