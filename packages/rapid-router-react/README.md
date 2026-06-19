<div align="center">

# ⚛️ @rapid/router-react

> React hooks for Rapid Router with auto-intercepting navigation

[![npm](https://img.shields.io/npm/v/@rapid/router-react)](https://www.npmjs.com/package/@rapid/router-react)
[![downloads](https://img.shields.io/npm/dm/@rapid/router-react)](https://www.npmjs.com/package/@rapid/router-react)
[![stars](https://img.shields.io/github/stars/SylphxAI/rapid)](https://github.com/SylphxAI/rapid)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

</div>

---

## Installation

```bash
npm install @rapid/router-react
```

## Usage

```tsx
import { useRouter, useRoute } from '@rapid/router-react';

function App() {
  const { navigate } = useRouter();
  const route = useRoute();

  return (
    <div>
      <p>Current path: {route.path}</p>
      <button onClick={() => navigate('/about')}>Go to About</button>
    </div>
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
