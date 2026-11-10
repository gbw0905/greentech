# Biofuel Watch

build a website for me that collects all the updates on biofuel policy globally

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://global-bioenergy-watch.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/401a2000-6cee-45a4-88fd-aaa10b540f19).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Use Node.js 24 and npm to match the pull request test environment.

```sh
git clone <this-repository-url>
cd <repository-name>
npm ci
npm run dev
```

Run the root regression suite with `npm test`. It covers calculator and
optimizer results, workbook exports, request authentication, and the UK RTFO
parser without production credentials. GitHub runs the same suite on pull
requests targeting `main`. The separate `remotion/` package is not part of
this check.

## Architecture and database

This is an unmanaged multi-package repository: the root contains the TanStack
Start application and `remotion/` is a separate video package, without a root
workspace configuration. See [Backend database reference](docs/backend-tables.md)
for the Supabase tables, relationships, access policies, functions, and
scheduled jobs.

The incremental feature-organization rules and target source layout are in the
[application architecture guide](docs/architecture.md).

## Deployment

Production deployments are built from `main` with Vercel.
