<div align="center">

# 🛤️ @rapid/router

> Rapid framework router with Router and Link components

[![npm](https://img.shields.io/npm/v/@rapid/router)](https://www.npmjs.com/package/@rapid/router)
[![downloads](https://img.shields.io/npm/dm/@rapid/router)](https://www.npmjs.com/package/@rapid/router)
[![stars](https://img.shields.io/github/stars/SylphxAI/rapid)](https://github.com/SylphxAI/rapid)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

</div>

---

## Installation

```bash
npm install @rapid/router
```

## Usage

```tsx
import { Router, Route, Link } from '@rapid/router';

function App() {
  return (
    <Router>
      <nav>
        <Link href="/">Home</Link>
        <Link href="/about">About</Link>
      </nav>
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
    </Router>
  );
}
```

## Features

- **Router** - Main router component
- **Route** - Route definition
- **Link** - Navigation link
- **Nested routes** - Hierarchical routing

---

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=SylphxAI/rapid&type=Date)](https://star-history.com/#SylphxAI/rapid&Date)

## Powered by Sylphx


---

<div align="center">
<sub>Built with ❤️ by <a href="https://github.com/SylphxAI">Sylphx</a></sub>
</div>
