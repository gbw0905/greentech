-- Stores document analysis results so users can revisit past analyses.
-- The original file is NOT stored — only the analysis output and metadata.

create table if not exists public.document_analyses (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null,
  file_name  text not null,
  file_type  text not null,
  keywords   text[] not null default '{}',
  analysis   jsonb not null,
  created_at timestamptz not null default now()
);

create index idx_document_analyses_user on public.document_analyses (user_id, created_at desc);

-- RLS: users see only their own rows
alter table public.document_analyses enable row level security;

create policy "Users read own analyses"
  on public.document_analyses for select
  using (auth.uid() = user_id);

create policy "Users insert own analyses"
  on public.document_analyses for insert
  with check (auth.uid() = user_id);

create policy "Users delete own analyses"
  on public.document_analyses for delete
  using (auth.uid() = user_id);
