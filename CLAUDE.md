# Bundlify

Shopify app that creates margin-aware product bundles. Ranks bundles by actual
contribution margin (COGS + shipping + processing fees + discounts), not just AOV.

## Tech Stack

NX monorepo · NestJS backend · Prisma + MySQL 8 · React + Zustand + Shopify
Polaris + App Bridge v4 · BullMQ + Redis · Shopify CLI for extensions

## Key Directories

```
apps/api/           → NestJS backend (:3000)
apps/admin/         → React admin dashboard (:4200, embedded in Shopify)
apps/extensions/    → Shopify CLI extensions (NOT managed by NX)
libs/shared-types/  → @bundlify/shared-types — DTOs, enums, interfaces
libs/margin-engine/ → @bundlify/margin-engine — pure math, zero framework deps
libs/prisma-client/ → @bundlify/prisma-client — Prisma client + PrismaService
```

## Commands

```bash
npx nx serve api                    # Backend dev server
npx nx serve admin                  # Admin UI dev server
shopify app dev                     # Extension tunnel (run from root)
npx nx test margin-engine           # Unit tests — pure business logic
npx nx test api                     # API tests
npx nx test admin                   # Component tests
npx nx e2e admin-e2e                # E2E tests (auto-starts admin dev server)
npx nx run-many --target=lint --all # Lint everything
npx nx run prisma-client:generate   # Regenerate Prisma client
npx nx run prisma-client:migrate    # Run DB migrations
```

## Standards

- Files: kebab-case. Classes/models: PascalCase. Variables: camelCase. DB columns: snake_case.
- All money fields use `@db.Decimal(10,2)` — never floats.
- All indexed string columns use `@db.VarChar(N)`.
- No native array columns in MySQL — use join tables.
- Entity fields: camelCase mapped to snake_case columns.
- DTOs validated with `class-validator`.
- Tests: `test/unit/*.unit-spec.ts` and `test/integration/*.integration-spec.ts`, mirroring `src/`.
- E2E tests: `apps/admin-e2e/src/specs/*.spec.ts` using Playwright.
- E2E tests run against the real app — **no API mocking**. Start both `admin` and `api` servers.
- After making UI changes, always run `npx nx e2e admin-e2e` to verify they work end-to-end.
- CDN stubs (App Bridge, Polaris) are the only allowed intercepts — they enable standalone rendering outside Shopify.
- Margin engine tests: `libs/margin-engine/src/__tests__/`.
- Pre-commit hook runs lint-staged — do not skip.

## Critical Architecture Rules

- `apps/extensions/` is Shopify CLI territory — NX does not build or test it.
- `@bundlify/margin-engine` must stay framework-free — it runs both server-side (NestJS) and client-side (DiscountSlider component).
- Zustand stores receive `authenticatedFetch` as a parameter, not a global import.
- Storefront widgets are vanilla JS only — no React.
- Prefer Shopify GraphQL Admin API over REST (rate limits: 50 cost/sec vs 40 req/min).
- Use `bulkOperationRunQuery` for large catalog syncs.
- Storefront API routes through Shopify App Proxy (`/apps/bundlify/*`) — never expose direct backend URLs.

## Gotchas

- MySQL connection string must include `?charset=utf8mb4`.
- MySQL 8 uses `caching_sha2_password` — ensure driver supports it.
- `shopify.app.toml` lives at workspace root, not inside any app.
- In production, NestJS serves the built admin as static files. In dev, proxy from NestJS to Vite.
- Bundle engine uses binary search for optimal discount — see `libs/margin-engine/src/discount-optimizer.ts`.

## Workflows

### Adding a New API Endpoint
1. Define types/DTOs in `libs/shared-types/`
2. Implement controller + service in `apps/api/src/modules/<module>/`
3. Add tests mirroring the `src/` structure
4. Run `npx nx test api` before committing

### Modifying the Database Schema
1. Edit `libs/prisma-client/src/prisma/schema.prisma`
2. Run `npx nx run prisma-client:migrate`
3. Run `npx nx run prisma-client:generate`
4. Update relevant DTOs in `libs/shared-types/`

### Adding a Shopify Extension
1. Use `shopify app generate extension` from workspace root
2. Extension goes under `apps/extensions/`
3. Dev with `shopify app dev` — NX is not involved

## Deep Reference

For full schema, API surface, algorithm details, and UI specs see `bundlify-spec.md`.
