# Rapid Agent Instructions

## Scope

This file is the repo-local operating policy for agents working in
`SylphxAI/rapid`. Organization-wide engineering doctrine is owned by
`SylphxAI/doctrine`; `PROJECT.md` and `.doctrine/project.json` own this
repository's local identity, lifecycle, boundary, and delivery facts.

Rapid is a TypeScript package monorepo for reactive primitives, renderers,
routers, framework integrations, compiler plugins, examples, and documentation.

## Read First

1. `PROJECT.md` and `.doctrine/project.json` for project goals, boundaries,
   delivery proof, package-release facts, and adoption gaps.
2. `README.md` for the public product overview and package map.
3. `package.json`, package-level `package.json` files, and package READMEs
   before changing public package exports or examples.
4. `.github/workflows/ci.yml` and `.github/workflows/release.yml` before
   changing validation or release behavior.

## Non-Negotiables

- Keep Rapid generic. Product-specific state, routing, UI, or business logic
  belongs in downstream applications, not Rapid packages.
- Do not publish package changes without CI and release workflow evidence plus
  npm registry readback for changed packages.
- Preserve TypeScript package boundaries and avoid introducing hidden runtime
  coupling between core primitives, renderers, routers, and framework adapters.
- Do not commit credentials, npm tokens, generated build artifacts, or benchmark
  outputs unless they are explicit release artifacts.

## Validation

Use the narrowest meaningful validation first, then broaden as needed:

- `bun run lint`
- `bun run typecheck`
- `bun test`
- `bun run build`
- package-specific tests or benchmarks for changed packages

Docs-only boundary changes may be validated by diff review, referenced-file
checks, and the central project manifest audit.
