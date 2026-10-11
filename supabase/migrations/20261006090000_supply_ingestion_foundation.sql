-- Dynamic supply-data ingestion foundation.
-- The public /data-sources registry remains the approved source list; these
-- tables store scrape-ready source metadata, normalized entities, observations,
-- and ingest run history.

create table if not exists public.supply_datasets (
  id text primary key,
  panel_title text not null,
  description text not null default '',
  reporting_year integer,
  last_reviewed date,
  metrics jsonb not null default '[]'::jsonb,
  coverage text not null default '',
  limitations jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.supply_sources (
  id uuid primary key default gen_random_uuid(),
  dataset_id text not null references public.supply_datasets(id) on delete cascade,
  org text not null,
  title text not null,
  url text not null,
  source_year integer,
  source_type text not null default 'manual',
  parser_id text,
  refresh_cadence text not null default 'manual',
  priority integer not null default 100,
  active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint supply_sources_type_check check (
    source_type in ('api', 'rss', 'csv', 'xlsx', 'pdf', 'html', 'manual')
  ),
  constraint supply_sources_cadence_check check (
    refresh_cadence in ('daily', 'weekly', 'monthly', 'quarterly', 'annual', 'manual')
  ),
  constraint supply_sources_unique_source unique (dataset_id, url, title)
);

create table if not exists public.supply_entities (
  id uuid primary key default gen_random_uuid(),
  dataset_id text not null references public.supply_datasets(id) on delete cascade,
  canonical_name text not null,
  country text,
  entity_type text not null default 'company',
  source_entity_key text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint supply_entities_unique_name unique (dataset_id, canonical_name)
);

create table if not exists public.supply_observations (
  id uuid primary key default gen_random_uuid(),
  dataset_id text not null references public.supply_datasets(id) on delete cascade,
  entity_id uuid not null references public.supply_entities(id) on delete cascade,
  source_id uuid references public.supply_sources(id) on delete set null,
  metric_key text not null,
  metric_label text not null,
  value numeric,
  unit text not null default '',
  reporting_year integer,
  basis text not null default '',
  estimated boolean not null default false,
  confidence text not null default 'reported',
  observed_at timestamptz not null default now(),
  source_url text,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint supply_observations_confidence_check check (
    confidence in ('reported', 'derived', 'estimated', 'unknown')
  ),
  constraint supply_observations_unique_metric unique (
    dataset_id,
    entity_id,
    metric_key,
    reporting_year,
    source_id
  )
);

create table if not exists public.supply_ingest_runs (
  id uuid primary key default gen_random_uuid(),
  dataset_id text references public.supply_datasets(id) on delete set null,
  source_id uuid references public.supply_sources(id) on delete set null,
  parser_id text,
  status text not null default 'pending',
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  rows_seen integer not null default 0,
  rows_upserted integer not null default 0,
  error text,
  metadata jsonb not null default '{}'::jsonb,
  constraint supply_ingest_runs_status_check check (
    status in ('pending', 'running', 'success', 'failed', 'skipped')
  )
);

create index if not exists supply_sources_dataset_idx on public.supply_sources(dataset_id);
create index if not exists supply_sources_active_idx on public.supply_sources(active) where active;
create index if not exists supply_entities_dataset_idx on public.supply_entities(dataset_id);
create index if not exists supply_observations_dataset_metric_idx
  on public.supply_observations(dataset_id, metric_key, reporting_year desc);
create index if not exists supply_observations_entity_idx on public.supply_observations(entity_id);
create index if not exists supply_ingest_runs_started_idx
  on public.supply_ingest_runs(started_at desc);

drop trigger if exists update_supply_datasets_updated_at on public.supply_datasets;
create trigger update_supply_datasets_updated_at
before update on public.supply_datasets
for each row execute function public.update_updated_at_column();

drop trigger if exists update_supply_sources_updated_at on public.supply_sources;
create trigger update_supply_sources_updated_at
before update on public.supply_sources
for each row execute function public.update_updated_at_column();

drop trigger if exists update_supply_entities_updated_at on public.supply_entities;
create trigger update_supply_entities_updated_at
before update on public.supply_entities
for each row execute function public.update_updated_at_column();

alter table public.supply_datasets enable row level security;
alter table public.supply_sources enable row level security;
alter table public.supply_entities enable row level security;
alter table public.supply_observations enable row level security;
alter table public.supply_ingest_runs enable row level security;

drop policy if exists "Supply datasets are publicly readable" on public.supply_datasets;
create policy "Supply datasets are publicly readable"
on public.supply_datasets for select
to anon, authenticated
using (true);

drop policy if exists "Supply sources are publicly readable" on public.supply_sources;
create policy "Supply sources are publicly readable"
on public.supply_sources for select
to anon, authenticated
using (active = true);

drop policy if exists "Supply entities are publicly readable" on public.supply_entities;
create policy "Supply entities are publicly readable"
on public.supply_entities for select
to anon, authenticated
using (true);

drop policy if exists "Supply observations are publicly readable" on public.supply_observations;
create policy "Supply observations are publicly readable"
on public.supply_observations for select
to anon, authenticated
using (true);

drop policy if exists "Supply ingest runs are service-role only" on public.supply_ingest_runs;
create policy "Supply ingest runs are service-role only"
on public.supply_ingest_runs
as restrictive
for all
to anon, authenticated
using (false)
with check (false);

grant select on public.supply_datasets to anon, authenticated;
grant select on public.supply_sources to anon, authenticated;
grant select on public.supply_entities to anon, authenticated;
grant select on public.supply_observations to anon, authenticated;
revoke all on public.supply_ingest_runs from anon, authenticated;

grant all on public.supply_datasets to service_role;
grant all on public.supply_sources to service_role;
grant all on public.supply_entities to service_role;
grant all on public.supply_observations to service_role;
grant all on public.supply_ingest_runs to service_role;
