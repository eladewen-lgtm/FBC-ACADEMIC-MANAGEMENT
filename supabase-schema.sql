-- Setup: disable public sign-ups in Supabase Auth settings, create the first user
-- in Authentication > Users, then run this file in SQL Editor. Finally, copy
-- that user's Auth UUID and run the bootstrap INSERT below with the real UUID.
-- Creates the four academic data tables and restricts access to allow-listed admins.
-- Relation records are stored on their parent curricula/classes rows.

create table if not exists public.curricula (
  id text primary key,
  data jsonb not null check (jsonb_typeof(data) = 'object' and coalesce(data ->> 'id', '') = id and id <> ''),
  subject_offerings jsonb not null default '[]'::jsonb,
  program_id text generated always as (data ->> 'programId') stored,
  year text generated always as (data ->> 'year') stored,
  status text generated always as (data ->> 'status') stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.curricula
  add column if not exists subject_offerings jsonb not null default '[]'::jsonb;
alter table public.curricula
  drop constraint if exists curricula_subject_offerings_array_check;
alter table public.curricula
  add constraint curricula_subject_offerings_array_check check (jsonb_typeof(subject_offerings) = 'array');

create table if not exists public.subjects (
  id text primary key,
  data jsonb not null check (jsonb_typeof(data) = 'object' and coalesce(data ->> 'id', '') = id and id <> ''),
  code text generated always as (data ->> 'code') stored,
  name text generated always as (data ->> 'name') stored,
  status text generated always as (data ->> 'status') stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.classes (
  id text primary key,
  data jsonb not null check (jsonb_typeof(data) = 'object' and coalesce(data ->> 'id', '') = id and id <> ''),
  class_subjects jsonb not null default '[]'::jsonb,
  curriculum_id text generated always as (data ->> 'curriculumId') stored,
  program_id text generated always as (data ->> 'programId') stored,
  academic_year text generated always as (data ->> 'academicYear') stored,
  year_level text generated always as (data ->> 'yearLevel') stored,
  section text generated always as (data ->> 'section') stored,
  semester text generated always as (data ->> 'semester') stored,
  status text generated always as (data ->> 'status') stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.classes
  add column if not exists class_subjects jsonb not null default '[]'::jsonb;
alter table public.classes
  drop constraint if exists classes_class_subjects_array_check;
alter table public.classes
  add constraint classes_class_subjects_array_check check (jsonb_typeof(class_subjects) = 'array');

create table if not exists public.teacher_assignments (
  id text primary key,
  data jsonb not null check (jsonb_typeof(data) = 'object' and coalesce(data ->> 'id', '') = id and id <> ''),
  record_type text generated always as (case when data ? 'teacherId' then 'assignment' else 'teacher' end) stored,
  class_id text generated always as (data ->> 'classId') stored,
  subject_id text generated always as (data ->> 'subjectId') stored,
  teacher_id text generated always as (data ->> 'teacherId') stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.teacher_assignments
  add column if not exists record_type text generated always as (case when data ? 'teacherId' then 'assignment' else 'teacher' end) stored;

create index if not exists curricula_program_id_idx on public.curricula (program_id);
create index if not exists subjects_code_idx on public.subjects (code);
create index if not exists classes_curriculum_id_idx on public.classes (curriculum_id);
create index if not exists teacher_assignments_class_id_idx on public.teacher_assignments (class_id);
create index if not exists teacher_assignments_teacher_id_idx on public.teacher_assignments (teacher_id);
create index if not exists teacher_assignments_record_type_idx on public.teacher_assignments (record_type);

alter table public.curricula enable row level security;
alter table public.subjects enable row level security;
alter table public.classes enable row level security;
alter table public.teacher_assignments enable row level security;

create table if not exists public.academic_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.academic_admins enable row level security;
revoke all on public.academic_admins from public, anon, authenticated;

create or replace function public.is_academic_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1 from public.academic_admins
    where user_id = (select auth.uid())
  );
$function$;
revoke all on function public.is_academic_admin() from public, anon;
grant execute on function public.is_academic_admin() to authenticated;

-- Bootstrap exactly the user created in Supabase Authentication > Users:
-- insert into public.academic_admins (user_id) values ('REPLACE-WITH-AUTH-USER-UUID');

do $policies$
declare
  table_name text;
begin
  foreach table_name in array array['curricula', 'subjects', 'classes', 'teacher_assignments'] loop
    execute format('revoke all on public.%I from public, anon', table_name);
    execute format('grant select, insert, update, delete on public.%I to authenticated', table_name);
    execute format('drop policy if exists "Public access" on public.%I', table_name);
    execute format('drop policy if exists "Admin access" on public.%I', table_name);
    execute format(
      'create policy "Admin access" on public.%I for all to authenticated using (public.is_academic_admin()) with check (public.is_academic_admin())',
      table_name
    );
  end loop;
end;
$policies$;

-- Migrate existing shared-table data. Existing four-table data is preserved.
do $migration$
begin
  if to_regclass('public.academic_records') is null then
    return;
  end if;

  insert into public.curricula (id, data)
  select id, data from public.academic_records where collection = 'curricula'
  on conflict (id) do nothing;

  insert into public.subjects (id, data)
  select id, data from public.academic_records where collection = 'subjects'
  on conflict (id) do nothing;

  insert into public.classes (id, data)
  select id, data from public.academic_records where collection = 'classes'
  on conflict (id) do nothing;

  insert into public.teacher_assignments (id, data)
  select id, data from public.academic_records where collection in ('teachers', 'assignments')
  on conflict (id) do nothing;

end;
$migration$;

-- Migrate relationship rows from the prior normalized-table layout if present.
do $migration$
begin
  if to_regclass('public.curriculum_subjects') is not null then
    update public.curricula as parent
    set subject_offerings = links.records, updated_at = now()
    from (
      select data ->> 'curriculumId' as parent_id,
        jsonb_agg(data order by id) as records
      from public.curriculum_subjects
      group by data ->> 'curriculumId'
    ) as links
    where parent.id = links.parent_id and parent.subject_offerings = '[]'::jsonb;
  end if;

  if to_regclass('public.class_subjects') is not null then
    update public.classes as parent
    set class_subjects = links.records, updated_at = now()
    from (
      select data ->> 'classId' as parent_id,
        jsonb_agg(data order by id) as records
      from public.class_subjects
      group by data ->> 'classId'
    ) as links
    where parent.id = links.parent_id and parent.class_subjects = '[]'::jsonb;
  end if;

  if to_regclass('public.teachers') is not null then
    insert into public.teacher_assignments (id, data)
    select id, data from public.teachers
    on conflict (id) do nothing;
  end if;
end;
$migration$;

-- Move legacy link rows directly into the four system tables.
do $migration$
begin
  if to_regclass('public.academic_records') is not null then
    update public.curricula as parent
    set subject_offerings = links.records, updated_at = now()
    from (
      select data ->> 'curriculumId' as parent_id, jsonb_agg(data order by id) as records
      from public.academic_records
      where collection = 'curriculumSubjects'
      group by data ->> 'curriculumId'
    ) as links
    where parent.id = links.parent_id and parent.subject_offerings = '[]'::jsonb;

    update public.classes as parent
    set class_subjects = links.records, updated_at = now()
    from (
      select data ->> 'classId' as parent_id, jsonb_agg(data order by id) as records
      from public.academic_records
      where collection = 'classSubjects'
      group by data ->> 'classId'
    ) as links
    where parent.id = links.parent_id and parent.class_subjects = '[]'::jsonb;
  end if;
end;
$migration$;

drop table if exists public.programs;
drop table if exists public.curriculum_subjects;
drop table if exists public.class_subjects;
drop table if exists public.teachers;
drop table if exists public.students;
drop table if exists public.student_enrollments;
drop table if exists public.academic_records;

create or replace function public.apply_academic_changes(
  p_changes jsonb default '[]'::jsonb,
  p_deletions jsonb default '[]'::jsonb
)
returns void
language plpgsql
security invoker
set search_path = public
as $function$
declare
  item jsonb;
  target_table text;
  relation_column text;
  relation_name text;
  parent_id text;
  relation_id text;
begin
  if coalesce(jsonb_typeof(p_changes), 'null') <> 'array'
    or coalesce(jsonb_typeof(p_deletions), 'null') <> 'array' then
    raise exception 'Changes and deletions must be JSON arrays.';
  end if;

  for item in select value from jsonb_array_elements(p_changes)
  loop
    target_table := case item ->> 'collection'
      when 'curricula' then 'curricula'
      when 'subjects' then 'subjects'
      when 'classes' then 'classes'
      when 'teachers' then 'teacher_assignments'
      when 'assignments' then 'teacher_assignments'
      else null
    end;

    if item ->> 'collection' = 'curriculumSubjects' then
      if coalesce(item ->> 'id', '') = ''
        or coalesce(jsonb_typeof(item -> 'data') <> 'object', true)
        or coalesce(item -> 'data' ->> 'id' = item ->> 'id', false) = false then
        raise exception 'Invalid curriculum subject offering.';
      end if;
      relation_id := item ->> 'id';
      parent_id := item -> 'data' ->> 'curriculumId';
      update public.curricula as parent
      set subject_offerings = coalesce((
        select jsonb_agg(offer order by position)
        from jsonb_array_elements(parent.subject_offerings) with ordinality as items(offer, position)
        where offer ->> 'id' <> relation_id
      ), '[]'::jsonb), updated_at = now()
      where parent.subject_offerings @> jsonb_build_array(jsonb_build_object('id', relation_id));
      update public.curricula
      set subject_offerings = subject_offerings || jsonb_build_array(item -> 'data'), updated_at = now()
      where id = parent_id;
      if not found then raise exception 'Curriculum for this subject offering was not found.'; end if;
      continue;
    elsif item ->> 'collection' = 'classSubjects' then
      if coalesce(item ->> 'id', '') = ''
        or coalesce(jsonb_typeof(item -> 'data') <> 'object', true)
        or coalesce(item -> 'data' ->> 'id' = item ->> 'id', false) = false then
        raise exception 'Invalid class subject link.';
      end if;
      relation_id := item ->> 'id';
      parent_id := item -> 'data' ->> 'classId';
      update public.classes as parent
      set class_subjects = coalesce((
        select jsonb_agg(link order by position)
        from jsonb_array_elements(parent.class_subjects) with ordinality as items(link, position)
        where link ->> 'id' <> relation_id
      ), '[]'::jsonb), updated_at = now()
      where parent.class_subjects @> jsonb_build_array(jsonb_build_object('id', relation_id));
      update public.classes
      set class_subjects = class_subjects || jsonb_build_array(item -> 'data'), updated_at = now()
      where id = parent_id;
      if not found then raise exception 'Class for this subject link was not found.'; end if;
      continue;
    end if;

    if target_table is null
      or coalesce(item ->> 'id', '') = ''
      or coalesce(jsonb_typeof(item -> 'data') <> 'object', true)
      or coalesce(item -> 'data' ->> 'id' = item ->> 'id', false) = false then
      raise exception 'Invalid or unsupported academic record change.';
    end if;

    execute format(
      'insert into public.%I (id, data) values ($1, $2) on conflict (id) do update set data = excluded.data, updated_at = now()',
      target_table
    ) using item ->> 'id', item -> 'data';
  end loop;

  for item in select value from jsonb_array_elements(p_deletions)
  loop
    relation_id := item ->> 'id';
    if coalesce(relation_id, '') = '' then raise exception 'Invalid academic record deletion.'; end if;
    relation_name := item ->> 'collection';

    if relation_name = 'curriculumSubjects' then
      update public.curricula
      set subject_offerings = coalesce((
        select jsonb_agg(offer order by position)
        from jsonb_array_elements(subject_offerings) with ordinality as items(offer, position)
        where offer ->> 'id' <> relation_id
      ), '[]'::jsonb), updated_at = now()
      where subject_offerings @> jsonb_build_array(jsonb_build_object('id', relation_id));
    elsif relation_name = 'classSubjects' then
      update public.classes
      set class_subjects = coalesce((
        select jsonb_agg(link order by position)
        from jsonb_array_elements(class_subjects) with ordinality as items(link, position)
        where link ->> 'id' <> relation_id
      ), '[]'::jsonb), updated_at = now()
      where class_subjects @> jsonb_build_array(jsonb_build_object('id', relation_id));
    else
      target_table := case relation_name
        when 'curricula' then 'curricula'
        when 'subjects' then 'subjects'
        when 'classes' then 'classes'
        when 'teachers' then 'teacher_assignments'
        when 'assignments' then 'teacher_assignments'
        else null
      end;
      if target_table is null then raise exception 'Unsupported academic record deletion.'; end if;
      execute format('delete from public.%I where id = $1', target_table) using relation_id;
    end if;
  end loop;
end;
$function$;

revoke all on function public.apply_academic_changes(jsonb, jsonb) from public;
revoke execute on function public.apply_academic_changes(jsonb, jsonb) from anon;
grant execute on function public.apply_academic_changes(jsonb, jsonb) to authenticated;

notify pgrst, 'reload schema';
