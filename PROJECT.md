# Rapid Project

Rapid is a TypeScript package ecosystem for reactive primitives, renderers,
routers, framework integrations, compiler plugins, examples, and documentation.
It owns the public `@rapid/*` package family and the package release workflow
for that ecosystem.

## Lifecycle

- Lifecycle: `production`
- Layer: `foundation`
- Doctrine source of truth: [SylphxAI/doctrine](https://github.com/SylphxAI/doctrine)
- Machine manifest: `.doctrine/project.json`

## Goals

- Provide small, fast reactive primitives and framework adapters for modern
  TypeScript applications.
- Own package boundaries, public exports, examples, benchmarks, docs, and release
  evidence for the Rapid package family.
- Keep core primitives independent from product-specific application behavior.

## Non-Goals

- Do not own downstream applications' business logic, persistence, auth,
  deployment, or pricing decisions.
- Do not turn framework adapters into product-specific integration layers.
- Do not publish packages without CI, release workflow proof, and registry
  readback.

## Boundaries

Rapid owns the reactive runtime, framework adapters, routers, compiler plugins,
examples, docs, benchmarks, and package release path. It does not own product
apps, enterprise doctrine, platform infrastructure, or customer-specific
state-management behavior.

## Delivery

Pull requests run `.github/workflows/ci.yml` on the self-hosted Sylphx runner.
Main pushes run `.github/workflows/release.yml`, which delegates release behavior
to the central `SylphxAI/.github` reusable release workflow. Package releases
are forward-fix only after publication and require npm registry readback for each
changed package.
