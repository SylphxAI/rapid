# Credits & Acknowledgments

Zen stands on the shoulders of giants. This page acknowledges the technologies, libraries, and people that made Zen possible.

---

## Technologies & Tools

### Build & Development

- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe development
- **[Turborepo](https://turbo.build/)** - High-performance monorepo build system
- **[Vite](https://vitejs.dev/)** - Lightning-fast build tool
- **[Vitest](https://vitest.dev/)** - Blazing fast unit testing
- **[Biome](https://biomejs.dev/)** - Fast linter and formatter
- **[Changesets](https://github.com/changesets/changesets)** - Version management and publishing

### Documentation

- **[VitePress](https://vitepress.dev/)** - Beautiful documentation site
- **[Vercel](https://vercel.com/)** - Deployment and hosting

---

## Inspiration & Prior Art

Zen was inspired by the best ideas from the reactive state management ecosystem:

### State Management Libraries

**[Zustand](https://github.com/pmndrs/zustand)** by Poimandres
- Minimal API design philosophy
- Simple store creation pattern
- Influence on Zen's ergonomic API

**[Jotai](https://github.com/pmndrs/jotai)** by Poimandres
- Atomic state management approach
- Bottom-up composition model
- Inspiration for fine-grained reactivity

**[@preact/signals](https://github.com/preactjs/signals)** by Preact Team
- Signal-based reactivity
- Lightweight and performant
- Framework adapter patterns

**[Solid.js](https://www.solidjs.com/)** by Ryan Carniato
- Fine-grained reactivity system
- Signal primitives (`createSignal`, `createMemo`)
- Explicit dependency tracking

**[Vue 3](https://vuejs.org/)** by Evan You
- Reactive `ref` and `computed` API
- Elegant reactivity system
- Composition API patterns

**[MobX](https://mobx.js.org/)** by Michel Weststrate
- Observable state management
- Auto-tracking reactivity patterns
- Deep reactivity concepts

**[Nanostores](https://github.com/nanostores/nanostores)** by Andrey Sitnik
- Minimal store size
- Framework-agnostic design
- Lightweight package philosophy

---

## Technical Influences

### Immutability

**[Immer](https://immerjs.github.io/immer/)** by Michel Weststrate
- Inspiration for `@sylphx/zen-craft`
- Structural sharing concepts
- Immutable update patterns

### Reactivity Concepts

**[RxJS](https://rxjs.dev/)**
- Observable patterns
- Subscription management
- Reactive programming principles

**[Svelte Stores](https://svelte.dev/docs/svelte-store)**
- Simple store contract (`subscribe`)
- Minimal API surface
- Framework integration patterns

---

## Framework Integration

Zen provides first-class support for major frameworks:

- **[React](https://react.dev/)** - Most popular UI library
- **[Vue](https://vuejs.org/)** - Progressive framework
- **[Svelte](https://svelte.dev/)** - Compile-time framework
- **[Solid](https://www.solidjs.com/)** - Fine-grained reactivity
- **[Preact](https://preactjs.com/)** - Lightweight React alternative

---

## Special Thanks

### Community

- **Open Source Community** - For building amazing tools and sharing knowledge
- **State Management Pioneers** - For exploring and refining reactive patterns
- **Early Adopters** - For trying Zen and providing feedback

### Maintainers of Inspiration Libraries

Special recognition to the maintainers and contributors of:
- Poimandres team (Zustand, Jotai)
- Preact team (@preact/signals)
- Ryan Carniato (Solid.js)
- Evan You (Vue.js)
- Michel Weststrate (MobX, Immer)
- Andrey Sitnik (Nanostores)

Your work has shaped how we think about state management.

---

## Philosophy

Zen combines the best ideas from these libraries while maintaining its own principles:

1. **Explicit over Implicit** - Clear dependencies, no magic
2. **Performance First** - Minimal overhead, maximum speed
3. **Framework Agnostic** - Works everywhere
4. **Type Safe** - Full TypeScript support
5. **Small Bundle** - ~2KB core, pay-as-you-go
6. **Familiar API** - Easy to learn, hard to misuse

---

## Contributing

Zen is open source and welcomes contributions!

- **GitHub**: [SylphxAI/zen](https://github.com/SylphxAI/zen)
- **Issues**: [Report bugs or request features](https://github.com/SylphxAI/zen/issues)
- **Discussions**: [Ask questions and share ideas](https://github.com/SylphxAI/zen/discussions)

---

## License

Zen is [MIT licensed](https://github.com/SylphxAI/zen/blob/main/LICENSE).

---

**Thank you to everyone who has contributed to the reactive programming ecosystem. Zen wouldn't exist without your pioneering work!** 🙏
