# Identity Runtime Verification Report — ClinPharm Hospital

## Scope and execution boundary

This report records the **staging-only** verification attempt performed on the GitHub audit branch. No production endpoint was accessed, no application code was changed, no Supabase schema or RLS policy was changed, no migration was created, and no Supabase user or clinical record was created. Secrets, passwords, API keys, JWTs, and token values are intentionally absent.

The requested runtime checks require an explicitly identified staging application plus pre-existing authenticated identities. The available session configuration and environment metadata did not identify a staging deployment, and no authorized staging browser session or pre-existing User A/User B evidence was available. Accordingly, no OAuth login, Supabase Auth session inspection, clinical write, or RLS data operation was performed against an unidentified environment.

> **Result status:** runtime verification is **BLOCKED**. In the required classification vocabulary, blocked runtime assertions are recorded as **UNVERIFIED**. No runtime assertion is classified as `VERIFIED`.

## Evidence-handling rules

| Rule | Applied control |
|---|---|
| Environment boundary | Only an explicitly identified staging target may be used; none was identified in the available session metadata. |
| Identity accounts | No user was created, provisioned, reset, or modified. |
| Data writes | No harmless staging record was written because the target and cleanup path were not established. |
| Sensitive values | Evidence contains only file names, line numbers, configuration presence states, and redacted status information. |
| Classification | `UNVERIFIED` means not proven by a staging runtime observation. Static observations are identified explicitly and are not treated as runtime proof. |

## Test record

| Test name | Exact procedure performed | Result | Evidence | Classification |
|---|---|---|---|---|
| RT-00 — Staging target identification | Inspected the availability state of Supabase, OAuth, and application configuration variables without printing values; inspected repository workflow and audit references for a distinct staging endpoint. | Values were present but none carried a staging/test identifier; no explicit staging URL or database target was available for safe selection. | Presence-only configuration check: public Supabase/OAuth variables were present but `PRESENT_NOT_STAGING_LABELED`; `SUPABASE_DB_URL` was absent. Audit documents describe staging as a prerequisite rather than an available target. | `UNVERIFIED` — BLOCKED |
| RT-01 — Existing staging Manus user | Checked session configuration for a browser connection and staging Manus session before attempting OAuth. | No enabled user-browser connector or identified staging OAuth session was available; no login was attempted. | Session configuration showed the available user-browser connector disabled. No `openId` or JWT payload was read. | `UNVERIFIED` — BLOCKED |
| RT-02 — Corresponding Supabase Auth user | Attempted to establish whether an existing staging Supabase Auth user could be inspected without Admin credentials or user provisioning. | Cannot determine whether a corresponding `auth.users` row exists. Public client configuration does not grant safe user enumeration, and no authorized staging Admin/query path was supplied. | No `auth.users` query was issued; no service-role key was used or requested. | `UNVERIFIED` — BLOCKED |
| RT-03 — Existing second staging user for RLS | Checked the available staging evidence for two pre-existing authenticated Supabase identities. | No evidence of User A and User B was available. Neither account was created or provisioned. | No authentication credentials, reusable staging sessions, or approved two-user test fixture was supplied. | `UNVERIFIED` — BLOCKED |
| RT-04 — Manus OAuth identity and server session | Planned staging OAuth login followed by redacted extraction of `openId` and server-session fields. | Not executed because RT-00 and RT-01 were blocked. | No OAuth flow, cookie, token, or JWT payload was accessed. | `UNVERIFIED` — BLOCKED |
| RT-05 — Supabase Auth session, `auth.users.id`, and `auth.uid()` | Planned inspection after a verified staging Manus session, using only redacted identifiers. | Not executed because no explicit staging environment and no authenticated staging identity were available. | No Supabase Auth call or protected table request was sent to an unidentified endpoint. | `UNVERIFIED` — BLOCKED |
| RT-06 — Clinical UI → tRPC/server → database write | Planned one harmless, pre-approved staging record with documented cleanup. | Not executed; no record was created and no cleanup was required. | No clinical mutation, API write, or database query was performed. | `UNVERIFIED` — BLOCKED |
| RT-07 — Two-user RLS isolation matrix | Planned own-record create/read/update and cross-user read/update attempts for two pre-existing staging users. | Not executed because neither an explicit staging target nor two pre-existing test users were available. | No User A/User B request was sent; no schema or RLS policy was modified. | `UNVERIFIED` — BLOCKED |
| RT-08 — Repository service-role search | Searched tracked non-document source for `service_role`, `SUPABASE_SERVICE_ROLE`, `SUPABASE_SERVICE_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`; collected file and line metadata only. | The only match was a negative assertion in `client/src/lib/supabase-live-config.test.ts:10`; no tracked non-document production code match was found for those service-role identifiers. | `client/src/lib/supabase-live-config.test.ts:10` asserts the publishable key must not contain the service-role marker. This proves only the tracked-source search result, not deployed-environment behavior. | `VERIFIED` — static-only; runtime service-role use remains `UNVERIFIED` |
| RT-09 — Supabase client path inventory | Searched tracked client code for `createClient`, `auth.getSession`, password sign-in, and reset-password calls; collected file and line metadata only. | Client-side Supabase session/auth and repository paths exist, but they were not invoked against staging. | `client/src/lib/supabase/client.ts:10`; `client/src/lib/supabase/auth.ts:13,22,25`; `client/src/hooks/useCloudPatients.ts:21,87`; `client/src/hooks/useCloudClinicalRecords.ts:16,28,34,45`; `client/src/components/SupabaseAuthPanel.tsx:22`. | `VERIFIED` — static-only; runtime behavior remains `UNVERIFIED` |

## Identity mapping status

The requested mapping cannot be confirmed without an authenticated staging run:

```text
Manus openId                         UNVERIFIED — no staging OAuth session
      | 
      v
Supabase auth.users.id               UNVERIFIED — no authorized staging user inspection
      |
      v
Supabase auth.uid()                  UNVERIFIED — no staging Supabase session/table request
      |
      v
clinical table owner_id              UNVERIFIED — no harmless staging write/read performed
```

The current repository contains static evidence that the server Manus path handles `openId` through its own server session and Drizzle/MySQL user path, while Supabase clinical tables use `auth.users.id`, `owner_id`, and RLS checks based on `auth.uid()`. That evidence is recorded in `docs/IDENTITY_AUTH_STATIC_AUDIT.md`; it does **not** establish a runtime mapping and must not be treated as one.

## Static path evidence, not runtime proof

The following locations identify the paths that need confirmation when a named staging environment and authorized existing identities are available:

| Concern | Observed tracked location(s) | Runtime conclusion |
|---|---|---|
| Manus server session / `openId` | `server/_core/sdk.ts` (OAuth exchange, session verification, and `openId` authentication path) | `UNVERIFIED` |
| Client Supabase session | `client/src/lib/supabase/auth.ts:13,22,25`; `client/src/components/SupabaseAuthPanel.tsx:22` | `UNVERIFIED` |
| Clinical repository writes | `client/src/lib/supabase/clinicalRepository.ts`; `client/src/lib/supabase/patientRepository.ts`; cloud hooks listed in RT-09 | `UNVERIFIED` |
| RLS source policy | `supabase/schema.sql:99–117` | Policy text exists; runtime allow/deny behavior is `UNVERIFIED` |
| Service-role identifiers | `client/src/lib/supabase-live-config.test.ts:10` only | Tracked-source absence is static-only; deployed use is `UNVERIFIED` |

## RLS matrix

No rows are marked ALLOW or DENY because the two pre-existing staging users required by the test were not available for safe execution.

| User | Operation | Result | Classification |
|---|---|---|---|
| User A | Create own harmless record | BLOCKED — no identified staging user/session | `UNVERIFIED` |
| User A | Read own record | BLOCKED — no identified staging user/session | `UNVERIFIED` |
| User A | Update own record | BLOCKED — no identified staging user/session | `UNVERIFIED` |
| User A | Read User B record | BLOCKED — no User B and no staging target | `UNVERIFIED` |
| User A | Update User B record | BLOCKED — no User B and no staging target | `UNVERIFIED` |
| User B | Create/read/update own record | BLOCKED — no User B and no staging target | `UNVERIFIED` |
| User B | Read/update User A record | BLOCKED — no User A and no staging target | `UNVERIFIED` |

## Required inputs before re-running

To run the blocked tests safely, provide an explicitly named staging application URL or deployment identifier and access to two **already existing** staging identities. The identities must be usable through an authorized staging browser session or an approved, non-secret test mechanism. The test operator must also have an authorized read path capable of determining a redacted `auth.users.id` and observing `auth.uid()`/`owner_id` without using or exposing a service-role secret in this report.

## Final conclusions

| Required question | Conclusion from this execution |
|---|---|
| Is Manus `openId` mapped to Supabase `auth.users.id`? | `UNVERIFIED` — blocked before staging login. |
| Does Manus login create a Supabase session? | `UNVERIFIED` — no staging login performed. |
| What reaches `auth.uid()`? | `UNVERIFIED` — no staging Supabase request was performed. |
| What becomes `owner_id`? | `UNVERIFIED` — no staging clinical write was performed. |
| Are clinical CRUD operations actually using Supabase? | `UNVERIFIED` at runtime; client repository paths exist statically. |
| Is service_role used? | No tracked non-document source use was found by the static search, except a negative test assertion; deployed runtime use remains `UNVERIFIED`. |
| Does RLS isolate users correctly? | `UNVERIFIED` — two pre-existing staging identities were not available. |
| Is the current architecture safe to migrate? | `UNVERIFIED` — identity mapping and RLS runtime behavior remain unproven. |

## Change boundary

Only this documentation file was updated for the staging verification attempt. No application code, production configuration, Supabase schema, RLS policy, migration, authentication architecture, user account, or clinical data was modified.
