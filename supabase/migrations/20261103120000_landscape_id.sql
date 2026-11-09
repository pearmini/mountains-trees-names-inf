-- Split community trees from the UIST forest.
-- Existing rows stay on main via the column default.

alter table public.landscape_trees
  add column if not exists landscape_id text not null default 'main';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'landscape_trees_landscape_id_check'
  ) then
    alter table public.landscape_trees
      add constraint landscape_trees_landscape_id_check
      check (landscape_id in ('main', 'uist'));
  end if;
end $$;

create index if not exists landscape_trees_landscape_created_idx
  on public.landscape_trees (landscape_id, created_at desc);
