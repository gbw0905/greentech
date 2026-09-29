# Application architecture

## Repository structure

This repository contains two independently installed JavaScript applications
and one Supabase project:

```text
global-bioenergy-watch/
|-- src/                 Main TanStack Start application
|-- public/              Static files served by the main application
|-- supabase/            Database migrations and Supabase configuration
|-- remotion/            Separate Remotion video-rendering application
|-- docs/                Project documentation
|-- package.json         Main application dependencies and scripts
`-- remotion/package.json
```

The root application and `remotion/` each have their own `package.json` and
lockfile. There is currently no npm workspace configuration connecting them.
The `supabase/` directory is backend infrastructure, not frontend source code.

## Main application

The root application uses TanStack Start, TanStack Router, React, Vite and
Supabase. Its source code is arranged by responsibility:

```text
src/
|-- routes/              Filesystem routes and HTTP endpoint adapters
|-- features/            Business capabilities grouped by domain
|-- components/          Shared UI and application-shell components
|   |-- ui/              Generated Shadcn UI primitives
|   `-- ai-elements/     Shared AI/chat presentation primitives
|-- shared/              Feature-independent data, types and utilities
|-- infrastructure/      Email, AI quota and telemetry implementations
|-- integrations/        Supabase and Lovable integration adapters
|-- assets/              Images bundled by Vite
|-- lib/utils.ts         Shadcn `cn()` utility
|-- router.tsx           TanStack Router construction
|-- routeTree.gen.ts     Generated route tree
|-- server.ts            Server entrypoint and server error handling
|-- start.ts             TanStack Start application bootstrap
`-- styles.css           Global styles and design tokens
```

The files directly under `src/` are framework entrypoints. They intentionally
do not live inside a feature folder. `routeTree.gen.ts` is generated and must
not be edited or moved manually.

## Feature ownership

Business code lives under `src/features/<feature>`. A feature contains only the
subdirectories it needs, such as `components/`, `hooks/`, `server/`, and shared
client/server contracts.

| Feature         | Responsibility                                                    |
| --------------- | ----------------------------------------------------------------- |
| `alerts`        | Alert subscriptions, policy briefs and digest delivery            |
| `assistant`     | Chat UI, threads, assistant tools and transcript persistence      |
| `auth`          | Authentication UI, session state and request authentication       |
| `calculators`   | Carbon-intensity models, dairy RNG calculations and saved runs    |
| `chart-summary` | AI chart summaries and summary email requests                     |
| `countries`     | Country profiles, mandates, flags and country market indices      |
| `documents`     | Document analysis UI and server-side AI processing                |
| `jobs`          | Curated jobs, job search and jobs UI                              |
| `linkedin`      | LinkedIn settings, OAuth, drafts, publishing and flyer generation |
| `markets`       | Oil prices, entity quotes, market metadata and market panels      |
| `mcp`           | MCP server definition and MCP tools                               |
| `policy`        | Policy feed, taxonomy, ingestion, sources and update cards        |
| `premium`       | Premium-entitlement checks                                        |
| `supply`        | Producer datasets, infrastructure panels and supply metadata      |
| `traffic`       | Visit tracking, traffic reporting and daily traffic email         |
| `videos`        | Curated videos, live media and video search                       |

Feature files may be browser-safe or server-only:

- `components/`, hooks and contracts are browser-safe unless stated otherwise.
- `server/` and files ending in `.server.ts` can access secrets and privileged
  services.
- `server-functions.ts` files expose validated TanStack server functions to UI
  code without exposing their server implementation to the browser.

## Routes

`src/routes/` is controlled by TanStack Router's filesystem routing. Route files
own URL concerns such as parameters, metadata, loaders and HTTP method handlers.
They import business operations and screens from features.

Examples:

- Page route: `routes/assistant.tsx`
- Parameterized route: `routes/countries.$slug.updates.tsx`
- HTTP endpoint: `routes/api/chat.ts`
- Public scheduled endpoint: `routes/api/public/policy-alert-digest.ts`

Routes are adapters. Business rules, provider calls and reusable screens belong
to their owning feature or infrastructure module.

## Shared UI

`src/components/` is the shared UI surface used by multiple routes or features.
It contains the application shell, chart framework, filters, export buttons and
date controls.

Two subdirectories follow external component-library conventions:

- `components/ui/` contains Shadcn primitives and imports `lib/utils.ts`.
- `components/ai-elements/` contains reusable conversation, message, prompt and
  tool-rendering components.

These components do not own database operations or feature business rules.

## Shared code

`src/shared/` contains browser-safe or environment-neutral code without feature
ownership:

```text
shared/
|-- data/                Dataset provenance and source metadata
|-- errors/              HTML error-page rendering
|-- export/              CSV and Excel generation
|-- hooks/               Cross-feature React hooks
|-- errors.ts            Shared error formatting
`-- ghg-savings.ts       Shared published GHG-savings data
```

Shared modules do not import from features.

## Infrastructure and integrations

`src/infrastructure/` contains technical implementations used by multiple
features:

- `ai/quota.server.ts` provides in-memory AI request throttling.
- `email/` contains the email registry, renderer/sender and email templates.
- `telemetry/` captures server errors and reports Lovable client errors.

`src/integrations/` contains vendor-specific application adapters:

- `integrations/supabase/` provides browser/server clients, authentication
  middleware, generated database types and preview authentication storage.
- `integrations/lovable/` contains the Lovable integration entrypoint.

## Backend location

This is a full-stack TanStack Start application. Backend code is split across
several explicit locations rather than a separate `server/` repository:

| Location                             | Backend responsibility                                  |
| ------------------------------------ | ------------------------------------------------------- |
| `src/features/*/server/`             | Feature-specific privileged operations                  |
| `src/features/*/server-functions.ts` | Validated client-to-server functions                    |
| `src/routes/api/`                    | HTTP endpoint adapters                                  |
| `src/infrastructure/`                | Shared server infrastructure                            |
| `src/integrations/supabase/`         | Supabase clients and authentication middleware          |
| `supabase/migrations/`               | Database schema, RLS policies, functions and cron setup |

The frontend and backend share one deployable application, but server-only code
is isolated by `.server.ts` files, `server/` directories and TanStack server
functions. Supabase hosts the PostgreSQL database and authentication service.
See [backend-tables.md](backend-tables.md) for the database schema inventory.

## Dependency direction

The active dependency direction is:

```text
routes --> features --> shared
   |          |
   |          +------> infrastructure
   |          +------> integrations
   +-----------------> shared UI
```

Rules enforced by the current layout:

1. Browser components and hooks do not import `.server.ts` modules.
2. Secrets, service-role access and private provider credentials remain in
   server-only modules.
3. Routes delegate business operations to features.
4. Shared modules do not depend on a feature.
5. Infrastructure does not import route modules or feature UI.
6. Cross-feature imports reference the feature that owns the data or service.
7. `routeTree.gen.ts` is generated and is never manually edited.

## Current external dependencies

The application still contains provider-specific runtime dependencies:

- Supabase provides PostgreSQL, authentication and service-role operations.
- The assistant uses Lovable's AI gateway and `LOVABLE_API_KEY`.
- LinkedIn draft publishing uses Lovable's LinkedIn connector gateway.
- MCP uses `@lovable.dev/mcp-js`.
- Some client telemetry and OAuth flows remain Lovable-specific.

These dependencies affect deployment portability even though their code is now
isolated. Moving from Lovable/Vercel to another server requires configuring or
replacing these providers; it does not require reorganizing the feature code.

## Verification status

- TypeScript validation passes with `npx tsc --noEmit`.
- The production build passes with `npm run build`.
- Feature-focused ESLint checks pass except for documented legacy warnings and
  explicit-`any` errors in existing email templates/shared chart code.
- The repository currently has no automated test suite.
