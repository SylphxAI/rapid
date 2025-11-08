---
"@sylphx/zen-craft": major
"@sylphx/zen-router-react": minor
"@sylphx/zen-router-preact": minor
---

# zen-craft: Major API refactor to establish Zen identity

**BREAKING CHANGES:**
- Renamed primary API from `update()` to `craft()` (matches package name)
- Removed `applyPatches()` export (use `@sylphx/craft` directly)
- Removed `produce()` for plain objects (use `@sylphx/craft` directly)
- Removed `CraftResult` type export (internal implementation detail)

**New exports:**
- `craft()` - Primary API for updating Zen stores
- `CraftOptions` - Options type for type-safe wrappers
- `Patch` - JSON Patch type
- `nothing` - Symbol for property deletion

**Migration guide:**
```typescript
// Before
import { update } from '@sylphx/zen-craft';
update($store, draft => { draft.count++ });

// After
import { craft } from '@sylphx/zen-craft';
craft($store, draft => { draft.count++ });

// For plain objects, use @sylphx/craft
import { craft } from '@sylphx/craft';
const next = craft(state, draft => { draft.count++ });
```

**Deprecated (will be removed in v2.0):**
- `update` → use `craft`
- `craftZen` → use `craft`

**Rationale:**
- Focus on Zen integration only
- Remove immer-style naming (establish independent identity)
- Export CraftOptions based on industry research (Zustand, Nanostores)
- DRY principle: single source of truth for types

# zen-router-react/preact: Add browser-based useHash() utility

**New feature:**
- `useHash()` hook for tracking URL hash changes
- Independent of router state (philosophy: hash ≠ routing)
- Works with native browser `hashchange` event
