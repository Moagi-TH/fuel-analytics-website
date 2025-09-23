-- Storage bucket and policies for per-user uploads under uploads/{userId}/...

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('reports', 'reports', false, 52428800, array['application/pdf'])
on conflict (id) do nothing;

-- Simple per-bucket policies (tighten later if needed)
create policy if not exists "objects_insert_reports" on storage.objects
  for insert with check (bucket_id = 'reports');

create policy if not exists "objects_select_reports" on storage.objects
  for select using (bucket_id = 'reports');

create policy if not exists "objects_update_reports" on storage.objects
  for update using (bucket_id = 'reports');

create policy if not exists "objects_delete_reports" on storage.objects
  for delete using (bucket_id = 'reports');


