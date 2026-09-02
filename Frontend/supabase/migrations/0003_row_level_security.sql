-- BuildTrack — Row-level security for the domain tables.
--
-- Access model:
--   SELECT  — any authenticated team member (operational data is shared).
--   WRITE   — management roles only, via public.can_manage().
--   Notifications are private to their recipient (and readable by admins).

do $$
declare
  tbl text;
  shared_tables text[] := array[
    'projects', 'milestones', 'progress_reports', 'activity_log',
    'resources', 'material_items', 'material_requests', 'workers',
    'attendance_records', 'vendors', 'purchase_orders', 'invoices',
    'generated_reports', 'budget_lines', 'expenses'
  ];
begin
  foreach tbl in array shared_tables loop
    execute format('alter table public.%I enable row level security;', tbl);

    -- Read: any signed-in user.
    execute format(
      'create policy %I on public.%I for select to authenticated using (true);',
      tbl || '_select', tbl
    );

    -- Write: management roles only (Administrator, Project Manager,
    -- Site Engineer, Contractor).
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (public.can_manage());',
      tbl || '_insert', tbl
    );
    execute format(
      'create policy %I on public.%I for update to authenticated using (public.can_manage()) with check (public.can_manage());',
      tbl || '_update', tbl
    );
    execute format(
      'create policy %I on public.%I for delete to authenticated using (public.can_manage());',
      tbl || '_delete', tbl
    );
  end loop;
end $$;

-- Notifications are personal: a user sees their own (recipient = them) plus
-- broadcast notifications (recipient is null). Admins see all.
alter table public.notifications enable row level security;

create policy notifications_select on public.notifications for select to authenticated
  using (recipient = (select auth.uid()) or recipient is null or public.is_admin());

-- A user may mark their own notifications read; admins/managers may create them.
create policy notifications_update_own on public.notifications for update to authenticated
  using (recipient = (select auth.uid()) or public.is_admin())
  with check (recipient = (select auth.uid()) or public.is_admin());

create policy notifications_insert on public.notifications for insert to authenticated
  with check (public.can_manage());

create policy notifications_delete on public.notifications for delete to authenticated
  using (public.is_admin());
