-- ============================================================================
--  Minimo imprescindible que Supabase ya trae hecho, para poder aplicar las
--  migraciones contra un Postgres pelado y probar el RLS de verdad.
--  NO se despliega: solo lo usa `npm run db:verify`.
-- ============================================================================

create schema if not exists extensions;
create schema if not exists auth;
create schema if not exists storage;

create extension if not exists pgcrypto with schema extensions;

do $$ begin
  create role anon nologin noinherit;
exception when duplicate_object then null; end $$;
do $$ begin
  create role authenticated nologin noinherit;
exception when duplicate_object then null; end $$;
do $$ begin
  create role service_role nologin noinherit bypassrls;
exception when duplicate_object then null; end $$;

grant usage on schema public, extensions, auth, storage to anon, authenticated, service_role;

-- ------------------------------------------------------------------ auth ----
create table if not exists auth.users (
  instance_id uuid,
  id uuid primary key,
  aud text,
  role text,
  email text unique,
  encrypted_password text,
  email_confirmed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  raw_app_meta_data jsonb,
  raw_user_meta_data jsonb,
  is_sso_user boolean default false,
  is_anonymous boolean default false
);

create table if not exists auth.identities (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  provider_id text not null,
  identity_data jsonb not null,
  provider text not null,
  last_sign_in_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (provider_id, provider)
);

-- Misma definicion que usa Supabase: lee el sub del JWT de la peticion.
create or replace function auth.uid() returns uuid
language sql stable as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;

create or replace function auth.role() returns text
language sql stable as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )::text
$$;

grant select on auth.users to authenticated, service_role;

-- --------------------------------------------------------------- storage ----
create table if not exists storage.buckets (
  id text primary key,
  name text not null,
  public boolean default false,
  file_size_limit bigint,
  allowed_mime_types text[],
  created_at timestamptz default now()
);

create table if not exists storage.objects (
  id uuid primary key default extensions.gen_random_uuid(),
  bucket_id text references storage.buckets (id),
  name text,
  owner uuid,
  metadata jsonb,
  created_at timestamptz default now()
);

alter table storage.objects enable row level security;
grant select, insert, update, delete on storage.objects to anon, authenticated;
grant select on storage.buckets to anon, authenticated;

-- Supabase concede privilegios por defecto a los roles de API sobre lo que
-- cree el owner; sin esto, el RLS de las migraciones no se llegaria a evaluar.
alter default privileges in schema public
  grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on functions to anon, authenticated, service_role;
