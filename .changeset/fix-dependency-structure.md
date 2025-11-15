---
"@sylphx/zen-react": patch
"@sylphx/zen-vue": patch
"@sylphx/zen-preact": patch
"@sylphx/zen-solid": patch
"@sylphx/zen-svelte": patch
"@sylphx/zen-patterns": patch
"@sylphx/zen-craft": patch
"@sylphx/zen-router": patch
"@sylphx/zen-persistent": patch
"@sylphx/zen-router-react": patch
"@sylphx/zen-router-preact": patch
---

Fix dependency structure to prevent version inflation

Moved internal monorepo packages from peerDependencies to dependencies using workspace:* protocol. This prevents unnecessary major version bumps when the core zen package receives minor updates. Follows industry best practices from TanStack Query, Zustand, and Jotai.

Changes:
- Internal packages (@sylphx/zen, @sylphx/zen-patterns, @sylphx/zen-router) now in dependencies with workspace:*
- External frameworks (React, Vue, Preact, Solid, Svelte) remain in peerDependencies
- Fixes cascading major version bumps caused by peerDependency range updates
