-- BuildTrack — Core domain tables (document modules 2–11)
--
-- Access model: operational site data is shared across the delivery team, so
-- every authenticated user may SELECT. Create/update/delete is restricted to
-- management roles via public.can_manage() (Administrator, Project Manager,
-- Site Engineer, Contractor). Administrators retain full control everywhere.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.project_category as enum
  ('Residential', 'Commercial', 'Industrial', 'Infrastructure', 'Government');
create type public.project_status as enum
  ('Planning', 'In Progress', 'On Hold', 'Delayed', 'Completed', 'Closed');
create type public.project_health as enum ('On Track', 'At Risk', 'Delayed');
create type public.milestone_status as enum
  ('Completed', 'In Progress', 'Scheduled', 'Delayed');
create type public.work_category as enum
  ('Foundation', 'Structural Work', 'Electrical Work', 'Plumbing Work',
   'Finishing Work', 'Inspection Work');
create type public.report_frequency as enum ('Daily', 'Weekly');
create type public.resource_category as enum
  ('Excavators', 'Concrete Mixers', 'Cranes', 'Dump Trucks', 'Generators',
   'Safety Equipment');
create type public.resource_status as enum
  ('Available', 'Allocated', 'Under Maintenance', 'Out of Service');
create type public.material_category as enum
  ('Cement', 'Steel', 'Bricks', 'Sand', 'Concrete', 'Electrical Materials',
   'Plumbing Materials');
create type public.stock_status as enum
  ('In Stock', 'Low Stock', 'Out of Stock', 'Reordered');
create type public.material_request_status as enum
  ('Pending', 'Approved', 'Rejected', 'Issued', 'Fulfilled');
create type public.workforce_category as enum
  ('Engineers', 'Supervisors', 'Contractors', 'Skilled Workers',
   'Unskilled Workers', 'Consultants');
create type public.shift_name as enum ('Morning', 'Afternoon', 'Night');
create type public.attendance_status as enum
  ('Present', 'Absent', 'On Leave', 'Half Day');
create type public.procurement_category as enum
  ('Raw Materials', 'Equipment', 'Machinery', 'Safety Equipment', 'Office Supplies');
create type public.purchase_order_status as enum
  ('Draft', 'Pending Approval', 'Approved', 'Ordered', 'Delivered', 'Cancelled');
create type public.invoice_status as enum ('Pending', 'Approved', 'Paid', 'Overdue');
create type public.notification_type as enum
  ('Project Update', 'Task Assignment', 'Procurement Alert', 'Attendance Alert',
   'Deadline Notification', 'System Notification');
create type public.report_type as enum
  ('Project Progress Report', 'Resource Utilization Report', 'Budget Report',
   'Workforce Report', 'Procurement Report');
create type public.export_format as enum ('PDF', 'Excel');
create type public.cost_category as enum
  ('Labor Cost', 'Material Cost', 'Equipment Cost', 'Transportation Cost',
   'Maintenance Cost', 'Administrative Cost');
create type public.budget_line_status as enum
  ('Within Budget', 'Near Limit', 'Over Budget');
create type public.expense_status as enum ('Pending', 'Approved', 'Rejected');

-- ---------------------------------------------------------------------------
-- Module 2: Projects & milestones
-- ---------------------------------------------------------------------------
create table public.projects (
  id                uuid primary key default gen_random_uuid(),
  code              text not null unique,
  name              text not null,
  category          public.project_category not null,
  status            public.project_status not null default 'Planning',
  health            public.project_health not null default 'On Track',
  client            text not null,
  location          text not null,
  project_manager   text not null,
  site_engineer     text,
  start_date        date not null,
  target_end_date   date not null,
  progress          integer not null default 0 check (progress between 0 and 100),
  budget_allocated  numeric(14, 2) not null default 0,
  budget_spent      numeric(14, 2) not null default 0,
  workforce_count   integer not null default 0,
  description       text not null default '',
  created_by        uuid references auth.users (id),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table public.milestones (
  id             uuid primary key default gen_random_uuid(),
  project_id     uuid not null references public.projects (id) on delete cascade,
  name           public.work_category not null,
  description    text not null default '',
  status         public.milestone_status not null default 'Scheduled',
  progress       integer not null default 0 check (progress between 0 and 100),
  planned_start  date,
  planned_end    date,
  owner          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Module 3: Site progress monitoring
-- ---------------------------------------------------------------------------
create table public.progress_reports (
  id                 uuid primary key default gen_random_uuid(),
  project_id         uuid references public.projects (id) on delete set null,
  project_name       text not null,
  frequency          public.report_frequency not null,
  report_date        date not null,
  work_category      public.work_category not null,
  completion_percent integer not null default 0 check (completion_percent between 0 and 100),
  work_completed     text not null default '',
  submitted_by       text,
  delay_days         integer not null default 0,
  delay_reason       text not null default '',
  status             text not null default 'Submitted',
  created_at         timestamptz not null default now()
);

create table public.activity_log (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid references public.projects (id) on delete cascade,
  title       text not null,
  detail      text not null default '',
  severity    text not null default 'info',
  logged_by   text,
  logged_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Module 4: Resources
-- ---------------------------------------------------------------------------
create table public.resources (
  id                   uuid primary key default gen_random_uuid(),
  asset_id             text not null unique,
  name                 text not null,
  category             public.resource_category not null,
  status               public.resource_status not null default 'Available',
  condition_percent    integer not null default 100 check (condition_percent between 0 and 100),
  allocated_project    text,
  operator             text,
  utilisation_percent  integer not null default 0 check (utilisation_percent between 0 and 100),
  last_maintenance     date,
  next_maintenance     date,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Module 5: Materials & inventory
-- ---------------------------------------------------------------------------
create table public.material_items (
  id                 uuid primary key default gen_random_uuid(),
  material_code      text not null unique,
  name               text not null,
  category           public.material_category not null,
  unit               text not null,
  quantity_in_stock  numeric(14, 2) not null default 0,
  reorder_level      numeric(14, 2) not null default 0,
  stock_status       public.stock_status not null default 'In Stock',
  unit_cost          numeric(14, 2) not null default 0,
  store_location     text,
  allocated_project  text,
  last_restocked     date,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create table public.material_requests (
  id            uuid primary key default gen_random_uuid(),
  request_code  text not null unique,
  material_name text not null,
  category      public.material_category not null,
  quantity      numeric(14, 2) not null,
  unit          text not null,
  project_name  text not null,
  requested_by  text,
  requested_on  date not null default now(),
  required_by   date,
  status        public.material_request_status not null default 'Pending',
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Module 6: Workforce
-- ---------------------------------------------------------------------------
create table public.workers (
  id                uuid primary key default gen_random_uuid(),
  worker_code       text not null unique,
  full_name         text not null,
  category          public.workforce_category not null,
  trade             text,
  assigned_project  text,
  shift             public.shift_name not null default 'Morning',
  contact           text,
  daily_wage        numeric(12, 2) not null default 0,
  attendance_today  public.attendance_status not null default 'Present',
  attendance_rate   integer not null default 0 check (attendance_rate between 0 and 100),
  joined_on         date,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table public.attendance_records (
  id            uuid primary key default gen_random_uuid(),
  worker_code   text not null,
  worker_name   text not null,
  category      public.workforce_category not null,
  attend_date   date not null default now(),
  shift         public.shift_name not null,
  check_in      text,
  check_out     text,
  hours_worked  numeric(5, 2) not null default 0,
  status        public.attendance_status not null default 'Present',
  project       text,
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Module 7: Procurement
-- ---------------------------------------------------------------------------
create table public.vendors (
  id             uuid primary key default gen_random_uuid(),
  vendor_code    text not null unique,
  name           text not null,
  category       public.procurement_category not null,
  contact_person text,
  email          text,
  phone          text,
  rating         numeric(2, 1) not null default 0,
  active_orders  integer not null default 0,
  status         text not null default 'Active',
  onboarded_on   date,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table public.purchase_orders (
  id                uuid primary key default gen_random_uuid(),
  order_code        text not null unique,
  vendor_name       text not null,
  category          public.procurement_category not null,
  project_name      text not null,
  item_summary      text not null,
  quantity          numeric(14, 2) not null default 0,
  total_amount      numeric(14, 2) not null default 0,
  status            public.purchase_order_status not null default 'Draft',
  raised_by         text,
  raised_on         date not null default now(),
  expected_delivery date,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table public.invoices (
  id           uuid primary key default gen_random_uuid(),
  invoice_code text not null unique,
  order_code   text,
  vendor_name  text not null,
  amount       numeric(14, 2) not null default 0,
  issued_on    date not null default now(),
  due_on       date,
  status       public.invoice_status not null default 'Pending',
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Module 8: Notifications
-- ---------------------------------------------------------------------------
create table public.notifications (
  id          uuid primary key default gen_random_uuid(),
  type        public.notification_type not null,
  title       text not null,
  message     text not null default '',
  severity    text not null default 'info',
  related_to  text,
  read        boolean not null default false,
  recipient   uuid references auth.users (id) on delete cascade,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Module 10: Reports & documentation
-- ---------------------------------------------------------------------------
create table public.generated_reports (
  id            uuid primary key default gen_random_uuid(),
  report_code   text not null unique,
  type          public.report_type not null,
  project_name  text not null,
  period_from   date,
  period_to     date,
  generated_by  text,
  generated_on  date not null default now(),
  format        public.export_format not null default 'PDF',
  size_kb       integer not null default 0,
  status        text not null default 'Ready',
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Module 11: Budget & cost
-- ---------------------------------------------------------------------------
create table public.budget_lines (
  id               uuid primary key default gen_random_uuid(),
  project_name     text not null,
  category         public.cost_category not null,
  estimated        numeric(14, 2) not null default 0,
  actual           numeric(14, 2) not null default 0,
  variance         numeric(14, 2) not null default 0,
  variance_percent numeric(6, 2) not null default 0,
  status           public.budget_line_status not null default 'Within Budget',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table public.expenses (
  id           uuid primary key default gen_random_uuid(),
  expense_code text not null unique,
  project_name text not null,
  category     public.cost_category not null,
  description  text not null default '',
  amount       numeric(14, 2) not null default 0,
  incurred_on  date not null default now(),
  approved_by  text,
  status       public.expense_status not null default 'Pending',
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------
create trigger projects_set_updated_at before update on public.projects
  for each row execute function public.set_updated_at();
create trigger milestones_set_updated_at before update on public.milestones
  for each row execute function public.set_updated_at();
create trigger resources_set_updated_at before update on public.resources
  for each row execute function public.set_updated_at();
create trigger material_items_set_updated_at before update on public.material_items
  for each row execute function public.set_updated_at();
create trigger workers_set_updated_at before update on public.workers
  for each row execute function public.set_updated_at();
create trigger vendors_set_updated_at before update on public.vendors
  for each row execute function public.set_updated_at();
create trigger purchase_orders_set_updated_at before update on public.purchase_orders
  for each row execute function public.set_updated_at();
create trigger budget_lines_set_updated_at before update on public.budget_lines
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Helpful indexes
-- ---------------------------------------------------------------------------
create index idx_milestones_project on public.milestones (project_id);
create index idx_progress_reports_project on public.progress_reports (project_id);
create index idx_activity_log_project on public.activity_log (project_id);
create index idx_notifications_recipient on public.notifications (recipient);
