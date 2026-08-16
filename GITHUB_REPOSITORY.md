# ClinPharm Hospital — private GitHub repository

The existing ClinPharm Hospital project is mirrored in the private repository:

`https://github.com/khaledalshormani357-ctrl/ClinPharm-Hospital`

The repository contains the current React application, the Capacitor Android wrapper, Supabase schema and verification SQL, tests, and project documentation. It must remain private because the code includes clinical workflow logic and integration configuration.

## Safe GitHub Actions configuration for future Supabase workflows

If a workflow is added later, store credentials only in GitHub Actions Secrets or an equivalent protected environment. Use `SUPABASE_ACCESS_TOKEN` for the Supabase CLI login, `SUPABASE_PROJECT_REF` with value `iwtyddokiwcqwnmmlwlt`, and `SUPABASE_DB_PASSWORD` only when a database migration command explicitly requires the database password. Never commit `.env` files, service-role keys, database passwords, keystores, signing passwords, or release kits.

The mobile and browser clients use only `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. The publishable key is protected by Supabase RLS and is not a substitute for an administrative secret. Any workflow that applies SQL must be reviewed before execution and must not print secret values in logs.

## Manual verification workflow

The repository includes `.github/workflows/verify.yml`, which runs only when manually dispatched. It installs dependencies, runs TypeScript and Vitest checks, and optionally executes the read-only `supabase/verify.sql` file when the protected `SUPABASE_DB_URL` secret exists. It never applies migrations automatically and does not print credentials. Configure `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and, only for read-only SQL verification, `SUPABASE_DB_URL` in GitHub Secrets before running it.
