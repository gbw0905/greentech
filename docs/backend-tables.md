# Backend database reference

This application uses Supabase Postgres. The source of truth is the ordered SQL
migrations in [`supabase/migrations`](../supabase/migrations); generated client
types live in
[`src/integrations/supabase/types.ts`](../src/integrations/supabase/types.ts).
This document describes the schema after all migrations currently in the repo
have been applied.

## Repository layout

This is an **unmanaged multi-package repository**, not a configured workspace
monorepo. The main full-stack application is the root package, while
`remotion/` has its own `package.json`, lockfile, TypeScript configuration, and
source tree. The root package is organized as follows:

- `src/` — TanStack Start UI, server functions, and API routes
- `supabase/` — Postgres configuration and migrations
- `remotion/` — separately installed video-rendering package
- `public/` — static application assets

There is no root `workspaces` declaration or workspace-level task runner, so
the two packages are installed and operated independently. Supabase is the
main application's backend service, even though its files are kept in a
top-level directory.

## Schema at a glance

All application tables are in the `public` schema. Supabase also owns the
separate `auth` schema; this application references `auth.users` but does not
define or migrate that table itself.

| Table                      | Purpose                                         | Client access             |
| -------------------------- | ----------------------------------------------- | ------------------------- |
| `policy_updates`           | Ingested bioenergy policy and market updates    | Public read               |
| `alert_subscribers`        | Email-alert recipients and preferences          | Service role only         |
| `brief_sends`              | Alert delivery/deduplication log                | Service role only         |
| `site_visits`              | Page-view events used for traffic reporting     | Service role only         |
| `chat_threads`             | Authenticated users' assistant conversations    | Owner only                |
| `chat_messages`            | Messages belonging to assistant threads         | Owner only                |
| `ci_runs`                  | Saved carbon-intensity calculator scenarios     | Owner only                |
| `premium_members`          | Email-based premium membership allow-list       | User's own row, read only |
| `flyer_generations`        | Generated daily flyer data and image payloads   | Service role only         |
| `linkedin_drafts`          | Daily LinkedIn post drafts and publishing state | Service role only         |
| `linkedin_settings`        | Singleton LinkedIn publishing configuration     | Service role only         |
| `linkedin_org_connections` | Singleton LinkedIn OAuth credentials            | Service role only         |

## Relationships

```text
auth.users
  |--< chat_threads --< chat_messages
  |                         `-- user_id -> auth.users
  `--< ci_runs

alert_subscribers --< brief_sends >-- policy_updates
```

`chat_messages.user_id` and `chat_messages.thread_id` are both foreign keys,
but the database does not enforce that a message and its thread have the same
`user_id`. Current API code supplies both values.

## Table details

The following notation is used: **PK** = primary key, **FK** = foreign key,
**UQ** = unique, and nullable columns are marked explicitly. Unless stated
otherwise, columns are `NOT NULL`.

### `policy_updates`

Canonical feed of policy and market updates. Ingestion writes with the service
role; the site, assistant, and MCP tools read it.

| Column         | Type          | Default / constraint           |
| -------------- | ------------- | ------------------------------ |
| `id`           | `uuid`        | **PK**, `gen_random_uuid()`    |
| `url`          | `text`        | **UQ**                         |
| `title`        | `text`        |                                |
| `summary`      | `text`        | `''`                           |
| `source`       | `text`        | `''`                           |
| `published_at` | `timestamptz` | Nullable                       |
| `region`       | `text`        | `'Global'`                     |
| `country_slug` | `text`        | Nullable                       |
| `country_name` | `text`        | Nullable                       |
| `fuels`        | `text[]`      | Empty array                    |
| `category`     | `text`        | `'policy'`                     |
| `ai_brief`     | `text`        | Nullable                       |
| `ai_brief_at`  | `timestamptz` | Nullable                       |
| `created_at`   | `timestamptz` | `now()`                        |
| `updated_at`   | `timestamptz` | `now()`; maintained by trigger |

Indexes: unique URL; `published_at DESC NULLS LAST`; `country_slug`;
`created_at DESC`; `category`.

RLS permits `SELECT` to `anon` and `authenticated`. Mutations are intended for
`service_role` only.

### `alert_subscribers`

Alert subscriptions and delivery preferences. Email and confirmation data make
this a sensitive, server-only table.

| Column                | Type          | Default / constraint           |
| --------------------- | ------------- | ------------------------------ |
| `id`                  | `uuid`        | **PK**, `gen_random_uuid()`    |
| `email`               | `text`        | **UQ**                         |
| `fuels`               | `text[]`      | Empty array                    |
| `countries`           | `text[]`      | Empty array                    |
| `confirm_token`       | `text`        | Random 24-byte hex token       |
| `confirmed_at`        | `timestamptz` | Nullable                       |
| `last_sent_at`        | `timestamptz` | Nullable                       |
| `last_weekly_sent_at` | `timestamptz` | Nullable; legacy cadence field |
| `cadence`             | `text`        | `'daily'`                      |
| `plan`                | `text`        | `'free'`                       |
| `created_at`          | `timestamptz` | `now()`                        |
| `updated_at`          | `timestamptz` | `now()`; maintained by trigger |

Index: `confirmed_at` (plus the unique email index).

RLS is forced, privileges are revoked from `anon` and `authenticated`, and a
restrictive deny-all client policy is present. Only `service_role` is granted
table access.

The application currently operates a daily-only digest. However, the migration
that removed the old `instant/daily/weekly` check did not add a new constraint,
so the database does **not** enforce valid `cadence` or `plan` values.

### `brief_sends`

Records delivered briefs and prevents the same update being sent twice to an
email address.

| Column          | Type          | Default / constraint                                     |
| --------------- | ------------- | -------------------------------------------------------- |
| `id`            | `uuid`        | **PK**, `gen_random_uuid()`                              |
| `subscriber_id` | `uuid`        | Nullable **FK** → `alert_subscribers.id`, cascade delete |
| `email`         | `text`        |                                                          |
| `update_id`     | `uuid`        | Nullable **FK** → `policy_updates.id`, cascade delete    |
| `cadence`       | `text`        | `'ondemand'`                                             |
| `sent_at`       | `timestamptz` | `now()`                                                  |
| `created_at`    | `timestamptz` | `now()`                                                  |

Unique index: (`email`, `update_id`). PostgreSQL permits multiple rows with a
null `update_id`, because nulls are distinct by default.

RLS has a restrictive deny-all policy for client roles. `service_role` has full
access.

### `site_visits`

Raw page-view events used to build aggregate traffic statistics.

| Column       | Type          | Default / constraint                              |
| ------------ | ------------- | ------------------------------------------------- |
| `id`         | `uuid`        | **PK**, `gen_random_uuid()`                       |
| `path`       | `text`        | `'/'`                                             |
| `visitor_id` | `text`        | Client-generated visitor identifier               |
| `referrer`   | `text`        | Nullable                                          |
| `country`    | `text`        | Nullable; intended as a two-letter uppercase code |
| `created_at` | `timestamptz` | `now()`                                           |

Indexes: `created_at DESC`; `visitor_id`.

RLS is forced and direct client access is denied. Visits are written through
the server-side `record_visit` function; reports use `get_traffic_stats`.
Neither function is executable by client roles (see [Database
functions](#database-functions)).

### `chat_threads`

Assistant conversation metadata.

| Column       | Type          | Default / constraint                     |
| ------------ | ------------- | ---------------------------------------- |
| `id`         | `uuid`        | **PK**, `gen_random_uuid()`              |
| `user_id`    | `uuid`        | **FK** → `auth.users.id`, cascade delete |
| `title`      | `text`        | `'New conversation'`                     |
| `created_at` | `timestamptz` | `now()`                                  |
| `updated_at` | `timestamptz` | `now()`; maintained by trigger           |

Index: (`user_id`, `updated_at DESC`). Authenticated users may select, insert,
update, and delete only rows where `auth.uid() = user_id`.

### `chat_messages`

Structured AI SDK messages within an assistant thread.

| Column       | Type          | Default / constraint                       |
| ------------ | ------------- | ------------------------------------------ |
| `id`         | `uuid`        | **PK**, `gen_random_uuid()`                |
| `thread_id`  | `uuid`        | **FK** → `chat_threads.id`, cascade delete |
| `user_id`    | `uuid`        | **FK** → `auth.users.id`, cascade delete   |
| `role`       | `text`        | One of `user`, `assistant`, `system`       |
| `parts`      | `jsonb`       | `[]`                                       |
| `created_at` | `timestamptz` | `now()`                                    |

Index: (`thread_id`, `created_at`). Authenticated users may manage only rows
where `auth.uid() = user_id`.

### `ci_runs`

Saved output from the carbon-intensity calculator.

| Column               | Type          | Default / constraint                     |
| -------------------- | ------------- | ---------------------------------------- |
| `id`                 | `uuid`        | **PK**, `gen_random_uuid()`              |
| `user_id`            | `uuid`        | **FK** → `auth.users.id`, cascade delete |
| `name`               | `text`        | `'Untitled scenario'`                    |
| `pathway_id`         | `text`        |                                          |
| `pathway_label`      | `text`        |                                          |
| `feedstock_label`    | `text`        | `''`                                     |
| `region_label`       | `text`        | `''`                                     |
| `ci_total`           | `numeric`     |                                          |
| `gross_ci`           | `numeric`     | `0`                                      |
| `credits_ci`         | `numeric`     | `0`                                      |
| `annual_energy_mj`   | `numeric`     | `0`                                      |
| `annual_tonnes_co2e` | `numeric`     | `0`                                      |
| `inputs`             | `jsonb`       | `{}`                                     |
| `programs`           | `jsonb`       | `[]`                                     |
| `created_at`         | `timestamptz` | `now()`                                  |
| `updated_at`         | `timestamptz` | `now()`; maintained by trigger           |

Index: (`user_id`, `created_at DESC`). Authenticated users may manage only
their own rows. The numeric columns have no precision/scale or range checks.

### `premium_members`

Allow-list keyed by email for premium feature access.

| Column       | Type          | Default / constraint           |
| ------------ | ------------- | ------------------------------ |
| `id`         | `uuid`        | **PK**, `gen_random_uuid()`    |
| `email`      | `text`        | **UQ**                         |
| `note`       | `text`        | Nullable                       |
| `active`     | `boolean`     | `true`                         |
| `created_at` | `timestamptz` | `now()`                        |
| `updated_at` | `timestamptz` | `now()`; maintained by trigger |

Authenticated users can read only the row whose email case-insensitively
matches the `email` claim in their JWT. Restrictive policies block client
inserts, updates, and deletes; `service_role` retains full access.

### `flyer_generations`

One generated flyer per calendar day. The image is stored directly as base64
text rather than in object storage.

| Column         | Type          | Default / constraint        |
| -------------- | ------------- | --------------------------- |
| `id`           | `uuid`        | **PK**, `gen_random_uuid()` |
| `day_key`      | `date`        | **UQ**                      |
| `image_base64` | `text`        | Nullable                    |
| `prompt`       | `text`        |                             |
| `items_json`   | `jsonb`       | `[]`                        |
| `emailed_to`   | `text`        | Nullable                    |
| `emailed_at`   | `timestamptz` | Nullable                    |
| `created_at`   | `timestamptz` | `now()`                     |

RLS is enabled with a restrictive deny-all client policy. `service_role` has
full access.

### `linkedin_drafts`

One generated LinkedIn post draft per calendar day.

| Column               | Type          | Default / constraint                  |
| -------------------- | ------------- | ------------------------------------- |
| `id`                 | `uuid`        | **PK**, `gen_random_uuid()`           |
| `day_key`            | `date`        | **UQ**                                |
| `post_text`          | `text`        |                                       |
| `items`              | `jsonb`       | `[]`                                  |
| `status`             | `text`        | `'pending'`; `pending` or `published` |
| `publish_token_hash` | `text`        |                                       |
| `linkedin_post_urn`  | `text`        | Nullable                              |
| `emailed_at`         | `timestamptz` | Nullable                              |
| `published_at`       | `timestamptz` | Nullable                              |
| `created_at`         | `timestamptz` | `now()`                               |

RLS is enabled with a restrictive deny-all client policy. `service_role` has
full access.

### `linkedin_settings`

Singleton LinkedIn publishing configuration. The boolean primary key is forced
to `true`, so at most one row can exist.

| Column             | Type          | Default / constraint                                       |
| ------------------ | ------------- | ---------------------------------------------------------- |
| `id`               | `boolean`     | **PK**, `true`, check `id = true`                          |
| `company_page_url` | `text`        | Current company page URL                                   |
| `company_org_id`   | `text`        | Current company organization ID                            |
| `posting_mode`     | `text`        | `'personal_mention'`; `personal_mention` or `company_page` |
| `updated_at`       | `timestamptz` | `now()`; no update trigger                                 |

RLS is enabled with a restrictive deny-all client policy. `service_role` has
full access.

### `linkedin_org_connections`

Singleton LinkedIn OAuth connection. This table contains credentials and must
remain server-only.

| Column                     | Type          | Default / constraint                               |
| -------------------------- | ------------- | -------------------------------------------------- |
| `id`                       | `boolean`     | **PK**, `true`, check `id = true`                  |
| `access_token`             | `text`        |                                                    |
| `access_token_expires_at`  | `timestamptz` |                                                    |
| `refresh_token`            | `text`        | Nullable                                           |
| `refresh_token_expires_at` | `timestamptz` | Nullable                                           |
| `scope`                    | `text`        | Nullable                                           |
| `person_urn`               | `text`        | Nullable                                           |
| `person_name`              | `text`        | Nullable                                           |
| `org_id`                   | `text`        | Nullable                                           |
| `org_name`                 | `text`        | Nullable                                           |
| `connected_at`             | `timestamptz` | `now()`                                            |
| `updated_at`               | `timestamptz` | `now()`; maintained explicitly by application code |

RLS is enabled with no client policy, and only `service_role` is explicitly
granted access. Unlike the other LinkedIn tables, there is no explicit
`REVOKE ... FROM anon, authenticated` migration or deny policy; RLS still
prevents client rows from being exposed while it remains enabled.

## Database functions

### `record_visit`

```sql
record_visit(
  _visitor_id text,
  _path text,
  _referrer text default null,
  _country text default null
) returns void
```

Security-definer function that inserts into `site_visits`. It truncates visitor
IDs to 64 characters, paths/referrers to 200, and country values to two
uppercase characters. Execution is granted only to `service_role`.

### `get_traffic_stats`

Takes no arguments and returns JSON containing total and unique views, today's
and seven-day views, five-minute active visitors, a 14-day daily series, and
top paths, countries, and referrer domains. It is a stable security-definer
function executable only by `service_role`.

### `update_updated_at_column`

Shared trigger function that sets `NEW.updated_at = now()`. It is attached to
`policy_updates`, `alert_subscribers`, `chat_threads`, `premium_members`, and
`ci_runs`.

## Scheduled backend jobs

Migrations configure `pg_cron` and `pg_net` jobs that call public application
routes:

| Job                       | Schedule (UTC)    | Endpoint / action                 |
| ------------------------- | ----------------- | --------------------------------- |
| `ingest-bioenergy-policy` | Minute 17, hourly | `/api/public/ingest-policy`       |
| `daily-policy-alerts`     | 08:00 daily       | `/api/public/policy-alert-digest` |
| `daily-bioenergy-flyer`   | 06:30 daily       | `/api/public/daily-flyer-email`   |
| `daily-gemini-flyer`      | 13:10 daily       | `/api/public/daily-gemini-flyer`  |

The historical `instant-policy-briefs` and `weekly-policy-alerts` jobs are
unscheduled by later migrations.

## Maintenance notes

- Add schema changes as new migrations; do not edit already-applied migrations.
- Regenerate `src/integrations/supabase/types.ts` after schema changes.
- Update this document when a migration adds or changes a table, relationship,
  RLS policy, trigger, or scheduled job.
- Treat `service_role`, OAuth tokens, subscriber data, and visit data as
  server-only. Never expose the service-role key to browser code.
