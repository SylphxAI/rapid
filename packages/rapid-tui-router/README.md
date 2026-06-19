<div align="center">

# 🖥️ @rapid/tui-router

> Router components for @rapid/tui - client-side routing for terminal UIs

[![npm](https://img.shields.io/npm/v/@rapid/tui-router)](https://www.npmjs.com/package/@rapid/tui-router)
[![downloads](https://img.shields.io/npm/dm/@rapid/tui-router)](https://www.npmjs.com/package/@rapid/tui-router)
[![stars](https://img.shields.io/github/stars/SylphxAI/rapid)](https://github.com/SylphxAI/rapid)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

</div>

---

## Installation

```bash
npm install @rapid/tui-router
```

## Usage

```tsx
/** @jsxImportSource @rapid/tui */
import { Router, Route, Link } from '@rapid/tui-router';

function App() {
  return (
    <Router>
      <Link href="/">Home</Link>
      <Link href="/settings">Settings</Link>
      <Route path="/" component={Home} />
      <Route path="/settings" component={Settings} />
    </Router>
  );
}
```

---

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=SylphxAI/rapid&type=Date)](https://star-history.com/#SylphxAI/rapid&Date)

## Powered by Sylphx


---

<div align="center">
<sub>Built with ❤️ by <a href="https://github.com/SylphxAI">Sylphx</a></sub>
</div>
