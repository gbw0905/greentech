-- Add file_path column to document_analyses so each analysis links to its stored file.
alter table public.document_analyses
  add column if not exists file_path text;

-- Storage RLS policies for the "doc" bucket (created manually in the dashboard).
-- Users can read their own files (path pattern: {user_id}/{analysis_id}.{ext}).
insert into storage.buckets (id, name, public)
values ('doc', 'doc', false)
on conflict (id) do nothing;

create policy "Users read own doc files"
  on storage.objects for select
  using (bucket_id = 'doc' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users delete own doc files"
  on storage.objects for delete
  using (bucket_id = 'doc' and (storage.foldername(name))[1] = auth.uid()::text);

-- Service role handles inserts (server-side upload), so no insert policy needed for users.
