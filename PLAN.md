# Rename Project: zen → rapid

## Scope Summary

| Category | Count | Pattern |
|----------|-------|---------|
| Package directories | 21 | `packages/zen-*` → `packages/rapid-*` |
| Package names | 20+ | `@zen/*` → `@rapid/*` |
| Import statements | 271+ | `@zen/signal`, `@zen/web`, etc. |
| JSX pragmas | 20+ | `@jsxImportSource @zen/web` |
| CSS classes | 1 | `zen-router-container` |
| Brand references | 67+ | "Zen" → "Rapid" in website/docs |
| Config files | 3 | biome.json, vitest.workspace.ts, root package.json |
| Plugin names | 2 | `babel-plugin-zen-jsx`, `unplugin-zen-signal` |

## Execution Plan

### Phase 1: Rename Package Directories
```bash
# 21 directories to rename
mv packages/zen-signal-core packages/rapid-signal-core
mv packages/zen-signal packages/rapid-signal
mv packages/zen-signal-react packages/rapid-signal-react
mv packages/zen-signal-preact packages/rapid-signal-preact
mv packages/zen-signal-vue packages/rapid-signal-vue
mv packages/zen-signal-extensions packages/rapid-signal-extensions
mv packages/zen-web packages/rapid-web
mv packages/zen-runtime packages/rapid-runtime
mv packages/zen-router-core packages/rapid-router-core
mv packages/zen-router packages/rapid-router
mv packages/zen-router-react packages/rapid-router-react
mv packages/zen-router-preact packages/rapid-router-preact
mv packages/zen-router-vue packages/rapid-router-vue
mv packages/zen-tui packages/rapid-tui
mv packages/zen-tui-advanced packages/rapid-tui-advanced
mv packages/zen-tui-router packages/rapid-tui-router
mv packages/zen-native packages/rapid-native
mv packages/zen-compiler packages/rapid-compiler
mv packages/zen-start packages/rapid-start
mv packages/babel-plugin-zen-jsx packages/babel-plugin-rapid-jsx
mv packages/unplugin-zen-signal packages/unplugin-rapid-signal
```

### Phase 2: Update package.json Files
Replace in all package.json files:
- `"name": "@zen/` → `"name": "@rapid/`
- `"@zen/` → `"@rapid/` (in dependencies)
- `zen-` → `rapid-` (in internal references)

### Phase 3: Update Source Code
Global replacements across all source files:
- `@zen/signal` → `@rapid/signal`
- `@zen/web` → `@rapid/web`
- `@zen/runtime` → `@rapid/runtime`
- `@zen/router` → `@rapid/router`
- `@zen/tui` → `@rapid/tui`
- `@jsxImportSource @zen/` → `@jsxImportSource @rapid/`
- `zen-router-container` → `rapid-router-container`

### Phase 4: Update Website/Branding
- Replace "Zen" with "Rapid" in website copy
- Update logo references if any
- Update meta tags and page titles

### Phase 5: Update Config Files
- `biome.json`: Update workspace patterns
- `vitest.workspace.ts`: Update test workspace names
- Root `package.json`: Update name, description, URLs

### Phase 6: Regenerate Dependencies
```bash
rm bun.lock
bun install
```

### Phase 7: Verify Build
```bash
bun run build
bun run test
```

## Decisions

- **GitHub repo**: Rename to `SylphxAI/rapid`
- Update all GitHub URLs in package.json files
