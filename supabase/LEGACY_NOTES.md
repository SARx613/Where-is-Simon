# Legacy SQL Notes

The project previously had multiple hotfix SQL scripts in root and in
`supabase/migrations`. They were removed to avoid drift and conflicting
definitions.

Canonical SQL execution order is now:

1. `supabase/migrations/20260101000000_initial_schema.sql`
2. `supabase/migrations/20260102000000_add_vector_index.sql` (optional, run when enough face vectors exist)

`supabase/schema.sql` is now only a pointer file to avoid accidental
execution of outdated snippets.
