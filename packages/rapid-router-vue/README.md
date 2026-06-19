<div align="center">

# 💚 @rapid/router-vue

> Vue composables for Rapid Router with auto-intercepting navigation

[![npm](https://img.shields.io/npm/v/@rapid/router-vue)](https://www.npmjs.com/package/@rapid/router-vue)
[![downloads](https://img.shields.io/npm/dm/@rapid/router-vue)](https://www.npmjs.com/package/@rapid/router-vue)
[![stars](https://img.shields.io/github/stars/SylphxAI/rapid)](https://github.com/SylphxAI/rapid)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

</div>

---

## Installation

```bash
npm install @rapid/router-vue
```

## Usage

```vue
<script setup>
import { useRouter, useRoute } from '@rapid/router-vue';

const { navigate } = useRouter();
const route = useRoute();
</script>

<template>
  <div>
    <p>Current path: {{ route.path }}</p>
    <button @click="navigate('/about')">Go to About</button>
  </div>
</template>
```

---

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=SylphxAI/rapid&type=Date)](https://star-history.com/#SylphxAI/rapid&Date)

## Powered by Sylphx


---

<div align="center">
<sub>Built with ❤️ by <a href="https://github.com/SylphxAI">Sylphx</a></sub>
</div>
