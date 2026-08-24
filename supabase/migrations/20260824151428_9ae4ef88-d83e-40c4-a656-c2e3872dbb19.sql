create table public.linkedin_drafts (
  id uuid primary key default gen_random_uuid(),
  day_key date not null unique,
  post_text text not null,
  items jsonb not null default '[]'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'published')),
  publish_token_hash text not null,
  linkedin_post_urn text,
  emailed_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now()
);

revoke all on public.linkedin_drafts from anon, authenticated;
grant all on public.linkedin_drafts to service_role;

alter table public.linkedin_drafts enable row level security;
-- No RLS policies: only the service role (server-side backend) can access drafts.
