<div align="center">

# 🌐 @rapid/web

> Web renderer for Rapid framework - DOM operations, JSX runtime, SSR

[![npm](https://img.shields.io/npm/v/@rapid/web)](https://www.npmjs.com/package/@rapid/web)
[![downloads](https://img.shields.io/npm/dm/@rapid/web)](https://www.npmjs.com/package/@rapid/web)
[![stars](https://img.shields.io/github/stars/SylphxAI/rapid)](https://github.com/SylphxAI/rapid)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

</div>

---

## Installation

```bash
npm install @rapid/web
```

## Usage

```tsx
/** @jsxImportSource @rapid/web */
import { signal } from '@rapid/signal';
import { render } from '@rapid/web';

const count = signal(0);

function App() {
  return (
    <div>
      <h1>Count: {count}</h1>
      <button onClick={() => count.value++}>+</button>
    </div>
  );
}

render(<App />, document.getElementById('root'));
```

## Features

- **Fine-grained reactivity** - No virtual DOM
- **JSX runtime** - Automatic signal unwrapping
- **SSR support** - Server-side rendering
- **Hydration** - Seamless client-side hydration

---

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=SylphxAI/rapid&type=Date)](https://star-history.com/#SylphxAI/rapid&Date)

## Powered by Sylphx


---

<div align="center">
<sub>Built with ❤️ by <a href="https://github.com/SylphxAI">Sylphx</a></sub>
</div>
