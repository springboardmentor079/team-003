-- BuildTrack — Seed demo auth users (one per role).
--
-- Creates confirmed email/password accounts so the app can be signed into
-- immediately. Password for every account: buildtrack123
-- The on_auth_user_created trigger creates the matching public.profiles row
-- from the metadata below.
--
-- NOTE: seeding auth.users directly is a convenience for this demo. In a real
-- deployment, create users via Supabase Auth (signUp / admin API) instead.

create extension if not exists pgcrypto with schema extensions;

do $$
declare
  u record;
  uid uuid;
begin
  for u in
    select *
    from (values
      ('admin@buildtrack.com',      'Ravi Menon',    'Administrator',   '+91 98400 11221'),
      ('manager@buildtrack.com',    'Anita Desai',   'Project Manager', '+91 98400 11222'),
      ('engineer@buildtrack.com',   'Karthik Iyer',  'Site Engineer',   '+91 98400 11223'),
      ('contractor@buildtrack.com', 'Sunil Rathore', 'Contractor',      '+91 98400 11224'),
      ('worker@buildtrack.com',     'Meena Kumari',  'Worker',          '+91 98400 11225'),
      ('client@buildtrack.com',     'Vikram Shah',   'Client',          '+91 98400 11226')
    ) as t(email, full_name, role, phone)
  loop
    if not exists (select 1 from auth.users where email = u.email) then
      uid := gen_random_uuid();

      insert into auth.users (
        instance_id, id, aud, role, email, encrypted_password,
        email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
        created_at, updated_at
      )
      values (
        '00000000-0000-0000-0000-000000000000',
        uid, 'authenticated', 'authenticated', u.email,
        extensions.crypt('buildtrack123', extensions.gen_salt('bf')),
        now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('full_name', u.full_name, 'role', u.role, 'phone', u.phone),
        now(), now()
      );

      insert into auth.identities (
        id, user_id, identity_data, provider, provider_id,
        last_sign_in_at, created_at, updated_at
      )
      values (
        gen_random_uuid(), uid,
        jsonb_build_object('sub', uid::text, 'email', u.email),
        'email', uid::text, now(), now(), now()
      );
    end if;
  end loop;
end $$;

-- Give the seeded profiles their employee IDs and departments.
update public.profiles set employee_id = 'BT-ADM-001', department = 'Platform Administration'  where email = 'admin@buildtrack.com';
update public.profiles set employee_id = 'BT-PM-014',  department = 'Project Delivery'          where email = 'manager@buildtrack.com';
update public.profiles set employee_id = 'BT-SE-032',  department = 'Site Operations'           where email = 'engineer@buildtrack.com';
update public.profiles set employee_id = 'BT-CON-058', department = 'Structural Contracting'    where email = 'contractor@buildtrack.com';
update public.profiles set employee_id = 'BT-WRK-311', department = 'Finishing Crew'            where email = 'worker@buildtrack.com';
update public.profiles set employee_id = 'BT-CLI-007', department = 'Greenfield Developers'     where email = 'client@buildtrack.com';
