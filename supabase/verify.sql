-- ClinPharm post-migration verification
-- Read-only checks; safe to run in Supabase SQL Editor.

select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in ('profiles','clinical_patients','clinical_cases','medication_reviews','clinical_interventions','guidelines','sync_queue')
order by table_name;

select indexname, tablename
from pg_indexes
where schemaname = 'public'
  and tablename in ('clinical_patients','clinical_cases','clinical_interventions','medication_reviews')
order by tablename, indexname;

select tgname, tgrelid::regclass as table_name
from pg_trigger
where not tgisinternal
  and tgname = 'on_auth_user_created';

select schemaname, tablename, policyname, cmd, permissive
from pg_policies
where schemaname = 'public'
  and tablename in ('profiles','clinical_patients','clinical_cases','medication_reviews','clinical_interventions','guidelines','sync_queue')
order by tablename, policyname;

select relname as table_name, relrowsecurity as rls_enabled
from pg_class
join pg_namespace on pg_namespace.oid = pg_class.relnamespace
where nspname = 'public'
  and relname in ('profiles','clinical_patients','clinical_cases','medication_reviews','clinical_interventions','guidelines','sync_queue')
order by relname;
