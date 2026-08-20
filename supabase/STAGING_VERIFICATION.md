# ClinPharm Supabase Staging Verification

> **Environment:** Supabase project `ioekwknwhpeocvrxnwni` (`ClinPharm-Staging`).  
> **Scope:** Staging only. No production Supabase project, application deployment, client secret, service-role key, or user account was modified.

## Migration applied

The tracked initial schema was added as `supabase/migrations/0001_initial_schema.sql` and applied to the staging project through the authorized Supabase management connection.

| Item | Result |
|---|---|
| Migration name | `clinpharm_initial_schema` |
| Staging migration version | `20260818224725` |
| Migration status | Applied successfully |
| Initial table state | Empty before migration |
| Required extension | `pgcrypto` installed (`1.3`) |

## Verified database objects

| Object type | Verified objects |
|---|---|
| Tables with RLS enabled | `profiles`, `clinical_patients`, `clinical_cases`, `medication_reviews`, `clinical_interventions`, `guidelines`, `sync_queue` |
| Ownership references | `profiles.id` and every required `owner_id` reference `auth.users(id)` |
| Clinical indexes | `clinical_patients_owner_updated_idx`, `clinical_cases_owner_updated_idx`, `clinical_interventions_owner_created_idx`, `medication_reviews_owner_updated_idx` |
| Auth/profile function | `public.handle_new_user()` |
| Auth trigger | `auth.users` INSERT trigger `on_auth_user_created` |
| RLS policies | Owner policies for profiles, patients, cases, interventions, medication reviews, and sync queue; read policy for guidelines |
| Auth schema | `auth.users` exists; no Auth user was created for this verification |

## Authentication and runtime boundaries

The `auth.users` table and the profile trigger exist, but there were no pre-existing Auth users and none was created. Therefore this setup verifies the **schema-level Auth integration** only; sign-in, token refresh, `auth.uid()` evaluation, and multi-user RLS allow/deny behavior remain unverified until pre-existing authorized staging users are available.

The application already consumes a public Supabase URL/key pair from `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, with Vite fallbacks `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. These values were deliberately **not** changed in the current Manus project because it is the production deployment. They must be set only in a separate non-production Manus project.

## Advisor findings

### Security warning

Supabase flags `public.handle_new_user()` as a `SECURITY DEFINER` function executable by `anon` and `authenticated` roles. This is an external-facing warning because the function is exposed in `public`. No remediation was applied during this staging setup because the task applied the existing tracked schema exactly. Review the Supabase guidance before the next migration: [anon security definer function executable](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable) and [authenticated security definer function executable](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable).

### Performance information

Supabase reports missing covering indexes for `clinical_cases.patient_id`, `clinical_interventions.patient_id`, `medication_reviews.patient_id`, and `sync_queue.owner_id`. It also recommends changing `auth.uid()` policy expressions to `(select auth.uid())` for query planning at scale. These are advisory findings; no index or policy was changed automatically. The current owner/date indexes are reported unused because the staging database has no workload yet.

## Local verification

After adding the tracked migration file, local verification completed successfully:

| Command | Result |
|---|---|
| `pnpm test` | 8 test files passed; 17 tests passed |
| `pnpm check` | Passed |

## Remaining action

Create or open a separate Manus staging project before setting the public staging URL/key. Then configure only one supported pair in that separate project:

```text
EXPO_PUBLIC_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

or the existing Vite fallback pair:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

Never use `service_role` in client code or `VITE_*`/`EXPO_PUBLIC_*` variables. Runtime Auth and RLS isolation tests require two already authorized staging users and must run only against this staging project.

## Post-setup runtime indicators

After the isolated Manus staging application was configured and the user completed initial staging testing, an administrative **read-only aggregate** check returned three Auth users, three matching profile rows, and six patient rows owned by two distinct user IDs. No user identifiers, emails, passwords, tokens, or clinical record contents were read.

This confirms that the Auth trigger created matching profile records and that staged patient rows have non-null `owner_id` values associated with multiple users. The management connection used for the aggregate check bypasses end-user RLS, so it cannot itself prove a denial path.

### End-user RLS isolation result

The staging operator then completed the two-user application test: after signing in as the second staging user, the first user's patient data was not visible. This confirms the required cross-user read-denial path through the isolated staging application. No user identifiers, credentials, tokens, or clinical record contents were collected. **RLS isolation is VERIFIED for the tested patient-read scenario.**

The separate staging app displayed a persistent `STAGING` marker and a non-production preview URL. Update/delete and non-patient clinical-record denial paths should be exercised in the same manner before a production rollout.
