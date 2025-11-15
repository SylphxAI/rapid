# Monorepo Dependencies Guide

## Quick Decision Tree

```
Is this package published to npm?
├─ NO → use `workspace:*` in dependencies
└─ YES → Continue ↓

Does user need to install this separately? (React, Vue, our @sylphx/zen)
├─ YES → peerDependencies
└─ NO → Continue ↓

Only needed during development/testing?
├─ YES → devDependencies
└─ NO → dependencies
```

---

## Rules by Package Type

### 1. Framework Integration Packages
**Examples:** zen-react, zen-vue, zen-preact, zen-solid, zen-svelte

```json
{
  "peerDependencies": {
    "@sylphx/zen": "^3.0.0",
    "react": "^16.8.0 || ^17.0.0 || ^18.0.0 || ^19.0.0"
  },
  "devDependencies": {
    "@sylphx/zen": "workspace:*",
    "react": "^19.1.0",
    "@types/react": "^18.3.3",
    "typescript": "^5.4.5",
    "bunup": "^0.15.13"
  }
}
```

**WHY:**
- React/Vue/etc MUST be peerDependencies (prevents multiple instances → Hooks errors)
- zen MUST be peerDependencies (prevents duplicate state managers)
- Use `workspace:*` in devDependencies for local development
- Use specific version in devDependencies for testing

**TRADE-OFF:**
- ✅ No duplicate React/zen instances
- ✅ Smaller bundle sizes
- ✅ No version conflicts
- ❌ Users must install both packages

---

### 2. Pattern/Helper Libraries
**Examples:** zen-patterns, zen-router

```json
{
  "peerDependencies": {
    "@sylphx/zen": "^3.0.0"
  },
  "devDependencies": {
    "@sylphx/zen": "workspace:*",
    "typescript": "^5.8.3",
    "bunup": "^0.15.13"
  }
}
```

**WHY:**
- zen is peerDependency (avoid bundling, let user control version)
- `workspace:*` for local development

**TRADE-OFF:**
- ✅ No duplicate zen instances
- ✅ Predictable semver behavior
- ❌ Users install zen separately

---

### 3. Packages Depending on Other Internal Packages
**Examples:** zen-persistent (depends on zen + zen-patterns), zen-router (depends on zen + zen-patterns)

```json
{
  "peerDependencies": {
    "@sylphx/zen": "^3.0.0",
    "@sylphx/zen-patterns": "^10.0.0"
  },
  "devDependencies": {
    "@sylphx/zen": "workspace:*",
    "@sylphx/zen-patterns": "workspace:*",
    "typescript": "^5.5.3",
    "bunup": "^0.15.13"
  }
}
```

**WHY:**
- Both zen and zen-patterns are peers (transitivity: if zen-patterns is peer, this package should also treat it as peer)
- Ensures single instance across entire dependency tree

**TRADE-OFF:**
- ✅ Single source of truth
- ✅ No version conflicts
- ❌ More explicit installation required

---

### 4. Standalone Utility Packages
**Example:** zen-craft (immutable updates via Immer)

```json
{
  "dependencies": {
    "immer": "^10.0.0"
  },
  "peerDependencies": {
    "@sylphx/zen": "^3.0.0"
  },
  "devDependencies": {
    "@sylphx/zen": "workspace:*",
    "typescript": "^5.4.5",
    "bunup": "^0.15.13"
  }
}
```

**WHY:**
- immer is bundled (implementation detail, not user concern)
- zen is peer (avoid duplicate state manager)

**TRADE-OFF:**
- ✅ User doesn't need to know about immer
- ✅ Internal implementation can change
- ❌ Slightly larger bundle (includes immer)

---

### 5. Core Package
**Example:** @sylphx/zen (no dependencies)

```json
{
  "devDependencies": {
    "typescript": "^5.4.5",
    "bunup": "^0.15.13"
  }
}
```

**WHY:**
- Zero dependencies (performance, security)
- Build tools only in devDependencies

---

## Version Range Guidelines

### peerDependencies - Use WIDE ranges

```json
{
  "peerDependencies": {
    "@sylphx/zen": "^3.0.0",           // ✅ Accept any 3.x
    "react": "^16.8.0 || ^17.0.0 || ^18.0.0 || ^19.0.0"  // ✅ Support multiple majors
  }
}
```

**WHY:**
- Prevents cascading major version bumps
- Gives users flexibility
- Reduces ecosystem fragmentation

**❌ AVOID:**
```json
{
  "peerDependencies": {
    "@sylphx/zen": "^3.10.0"  // ❌ Too strict - causes version inflation
  }
}
```

### devDependencies - Use SPECIFIC or LATEST

```json
{
  "devDependencies": {
    "@sylphx/zen": "workspace:*",     // ✅ Use local version
    "react": "^19.1.0",               // ✅ Specific version for testing
    "typescript": "^5.4.5"            // ✅ Specific version for consistency
  }
}
```

### dependencies - Use CONSERVATIVE ranges

```json
{
  "dependencies": {
    "immer": "^10.0.0"  // ✅ Accept minor/patch updates
  }
}
```

---

## Common Patterns

### Pattern 1: Framework Hook Library
```json
{
  "peerDependencies": {
    "@sylphx/zen": "^3.0.0",
    "react": "^16.8.0 || ^17.0.0 || ^18.0.0 || ^19.0.0"
  },
  "devDependencies": {
    "@sylphx/zen": "workspace:*",
    "react": "^19.1.0"
  }
}
```
**Used by:** zen-react, zen-vue, zen-preact, zen-solid, zen-svelte

### Pattern 2: Utility Extension
```json
{
  "peerDependencies": {
    "@sylphx/zen": "^3.0.0"
  },
  "devDependencies": {
    "@sylphx/zen": "workspace:*"
  }
}
```
**Used by:** zen-patterns, zen-router

### Pattern 3: Composite Extension
```json
{
  "peerDependencies": {
    "@sylphx/zen": "^3.0.0",
    "@sylphx/zen-patterns": "^10.0.0"
  },
  "devDependencies": {
    "@sylphx/zen": "workspace:*",
    "@sylphx/zen-patterns": "workspace:*"
  }
}
```
**Used by:** zen-persistent, zen-router, zen-router-react, zen-router-preact

---

## Red Flags

### ❌ Never Do This

```json
{
  "dependencies": {
    "@sylphx/zen": "workspace:*"  // ❌ Will bundle zen into package
  }
}
```
**Result:** Duplicate zen instances, version conflicts

```json
{
  "peerDependencies": {
    "react": "workspace:*"  // ❌ npm doesn't understand workspace:*
  }
}
```
**Result:** Install failure for end users

```json
{
  "peerDependencies": {
    "@sylphx/zen": "^3.10.0"  // ❌ Too strict
  }
}
```
**Result:** Every zen minor bump → dependent major bump

```json
{
  "dependencies": {
    "@sylphx/zen": "^3.0.0"  // ❌ For integration packages
  },
  "peerDependencies": {
    "@sylphx/zen": "^3.0.0"
  }
}
```
**Result:** Duplicate zen in node_modules

---

## Monorepo-Specific Rules

### workspace:* Protocol

**✅ Use in devDependencies:**
```json
{
  "devDependencies": {
    "@sylphx/zen": "workspace:*"  // ✅ Development uses local
  }
}
```

**❌ Never in peerDependencies:**
```json
{
  "peerDependencies": {
    "@sylphx/zen": "workspace:*"  // ❌ End users can't install
  }
}
```

**❌ Avoid in dependencies (for published packages):**
```json
{
  "dependencies": {
    "@sylphx/zen": "workspace:*"  // ❌ Bundles local version
  }
}
```

### Testing in Monorepo

All packages should have devDependencies for testing:

```json
{
  "devDependencies": {
    "@sylphx/zen": "workspace:*",      // Local zen for testing
    "typescript": "^5.4.5",            // Type checking
    "vitest": "^3.2.4"                 // Test runner (if not in root)
  }
}
```

---

## Decision Checklist

Before adding a dependency, ask:

1. **Is this package published to npm?**
   - No → Skip to workspace section below

2. **Will users ALWAYS need this installed?**
   - Yes (React, zen) → `peerDependencies`
   - No → Continue

3. **Is this only for build/test/development?**
   - Yes → `devDependencies`
   - No → Continue

4. **Should this be bundled with the package?**
   - Yes (immer, utility libs) → `dependencies`
   - No (framework, state manager) → `peerDependencies`

5. **For monorepo packages, which dependency type?**
   - Local development → `devDependencies: { "pkg": "workspace:*" }`
   - User must install → `peerDependencies: { "pkg": "^x.0.0" }`
   - Bundle into package → `dependencies: { "pkg": "^x.0.0" }` (rare)

---

## Version Bump Impact

### Scenario: zen 3.9.0 → 3.10.0 (minor)

**❌ With strict peerDependencies (`^3.9.0`):**
```
zen: 3.9.0 → 3.10.0 (minor)
  ↓
zen-patterns: 9.0.0 → 10.0.0 (MAJOR!) ← peerDep range changed
  ↓
zen-persistent: 12.0.0 → 13.0.0 (MAJOR!) ← peer changed again
```

**✅ With relaxed peerDependencies (`^3.0.0`):**
```
zen: 3.9.0 → 3.10.0 (minor)
  ↓
zen-patterns: 10.0.0 → 10.0.1 (patch) ← No breaking change
  ↓
zen-persistent: 13.0.0 → 13.0.1 (patch) ← No breaking change
```

---

## Summary Table

| Dependency Type | When to Use | Version Format | Published? |
|----------------|-------------|----------------|------------|
| **peerDependencies** | User must install (React, zen) | `^X.0.0` (wide) | ✅ Yes |
| **dependencies** | Bundle with package (immer, utilities) | `^X.Y.0` (conservative) | ✅ Yes |
| **devDependencies** | Build/test/development only | `^X.Y.Z` or `workspace:*` | ❌ No |
| **workspace:*** | Monorepo local development | N/A | ❌ No |

---

## Real Examples from Zen

### zen-react (Framework Integration)
```json
{
  "peerDependencies": {
    "@sylphx/zen": "^3.0.0",
    "react": "^16.8.0 || ^17.0.0 || ^18.0.0 || ^19.0.0"
  },
  "devDependencies": {
    "@sylphx/zen": "workspace:*",
    "react": "^19.1.0"
  }
}
```

### zen-patterns (Utility Library)
```json
{
  "peerDependencies": {
    "@sylphx/zen": "^3.0.0"
  },
  "devDependencies": {
    "@sylphx/zen": "workspace:*"
  }
}
```

### zen-craft (Utility with External Dep)
```json
{
  "dependencies": {
    "immer": "^10.0.0"
  },
  "peerDependencies": {
    "@sylphx/zen": "^3.0.0"
  },
  "devDependencies": {
    "@sylphx/zen": "workspace:*"
  }
}
```

### zen-persistent (Composite)
```json
{
  "peerDependencies": {
    "@sylphx/zen": "^3.0.0",
    "@sylphx/zen-patterns": "^10.0.0"
  },
  "devDependencies": {
    "@sylphx/zen": "workspace:*",
    "@sylphx/zen-patterns": "workspace:*"
  }
}
```
