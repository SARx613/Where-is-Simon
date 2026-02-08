-- Add status column to photos
alter table photos add column if not exists status text default 'processing';

-- Ensure it's part of the select policy if needed (but 'all' usually covers it for owner)
-- Actually, the RLS policies cover rows, not columns.

-- Reload Schema Cache
NOTIFY pgrst, 'reload schema';
