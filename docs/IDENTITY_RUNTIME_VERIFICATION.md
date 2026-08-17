# Identity Runtime Verification Plan — ClinPharm Hospital

## Status and scope

**Status: NOT YET PERFORMED.** This document defines the staging-only runtime verification procedure. It does not report completed runtime tests, does not classify any runtime behavior as `VERIFIED`, and does not authorize production changes.

The execution must use **STAGING only**. It must not modify production, application code, database schema, RLS policies, authentication architecture, or repository secrets. It must not create or provision Supabase users. No runtime test has been performed as part of this documentation change.

Each executed test must record the test name, exact procedure, result, evidence, and one of the following classifications: `VERIFIED`, `UNVERIFIED`, `CONFLICT`, or `SECURITY RISK`. Until the staging procedure is actually run, the applicable classification for every runtime assertion in this document is **UNVERIFIED — not executed**.

## Preconditions and safety controls

The operator must have access to the existing staging Manus OAuth session and an existing staging Supabase environment. If two authenticated staging identities are required for RLS isolation, they must already exist; this verification must not create or provision them. Secrets, API keys, JWT secrets, service-role keys, passwords, access tokens, and complete JWTs must never be printed, committed, or copied into this report.

The operator must capture only redacted evidence: field names, HTTP status classes, table/procedure names, redacted identifiers, and sanitized response metadata. JWT inspection is limited to the non-sensitive payload fields necessary for identity comparison; the token itself must never be exposed.

## Verification record template

For each test, complete the following record only after the staging procedure has been executed:

| Field | Required content |
|---|---|
| Test name | A unique name for the runtime check |
| Exact procedure | The UI/API steps performed in staging |
| Result | Observed behavior, including allow/deny or present/absent |
| Evidence | Redacted screenshot, response status, query result summary, or log reference |
| Classification | `VERIFIED`, `UNVERIFIED`, `CONFLICT`, or `SECURITY RISK` |

## A. Manus identity

**Objective:** determine the authenticated Manus `openId` during a staging OAuth login without exposing the OAuth token.

**Procedure:** perform a staging Manus OAuth login through the existing application flow. Inspect only the authenticated user metadata and the minimum non-sensitive JWT payload fields needed for comparison. Record the `openId` in redacted form, for example by retaining only a stable prefix and suffix.

**Current result:** Not executed.

**Current evidence:** None collected.

**Current classification:** `UNVERIFIED`.

## B. Supabase Auth

**Objective:** determine whether the same identity has a corresponding `auth.users` record, whether the client receives a Supabase Auth session after Manus login, and what the actual Supabase user ID is in redacted form.

**Procedure:** after the staging Manus login, inspect the client authentication state through the existing application flow. Determine whether a Supabase session exists without printing access or refresh tokens. Using an authorized staging-only inspection path, check whether a corresponding `auth.users` record exists and record only a redacted Supabase user ID.

**Current result:** Not executed. No Supabase users were created or provisioned.

**Current evidence:** None collected.

**Current classification:** `UNVERIFIED`.

## C. Identity mapping

The following mapping must be determined explicitly during staging execution:

```text
Manus OAuth openId
        |
        v
Supabase auth.users.id
        |
        v
Supabase auth.uid()
        |
        v
Clinical table owner_id
```

The runtime report must state whether each arrow exists, is absent, or conflicts with the other identity source. It must distinguish a Manus session from a Supabase Auth session and must not infer equivalence from matching display names or email addresses alone.

**Current result:** Not executed.

**Current evidence:** None collected.

**Current classification:** `UNVERIFIED`.

## D. Clinical write path

**Objective:** identify the exact staging UI → tRPC/server → database write path using one harmless staging test record only, without modifying schema or RLS.

**Procedure:** use an already authorized staging identity and a harmless test record only if the staging environment and its cleanup procedure are already available. Trace the UI action to the client repository, tRPC procedure or server route, database call, and resulting clinical table row. Determine which procedure performs the write, how `owner_id` is generated, and whether it corresponds to the authenticated Supabase user ID. Record the cleanup outcome without including patient data or credentials.

**Current result:** Not executed. No staging record was written.

**Current evidence:** None collected.

**Current classification:** `UNVERIFIED`.

## E. Service-role and Supabase client static search

The repository search must cover the entire tracked repository for the following terms, while reporting filenames and line numbers only and never printing values:

```text
service_role
SUPABASE_SERVICE_ROLE
SUPABASE_SERVICE_KEY
SUPABASE_SERVICE_ROLE_KEY
createClient(
SUPABASE_URL
SUPABASE_ANON_KEY
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

Search results must distinguish safe public client configuration from service-role or secret usage. Any service-role key in client code, committed environment file, browser bundle, or log is a `SECURITY RISK`. The search itself is a static inspection and must not be presented as runtime proof.

**Current result:** Not recorded in this plan document.

**Current evidence:** None collected.

**Current classification:** `UNVERIFIED` for the runtime verification record.

## F. RLS isolation in staging

**Objective:** verify owner isolation using two already-existing authenticated staging users, User A and User B. Do not create or provision either user.

For **User A**, execute and record: create a harmless staging record, read the record owned by User A, update the record owned by User A, attempt to read User B's record, and attempt to update User B's record. Record exact `ALLOW` or `DENY` outcomes and redacted evidence.

For **User B**, execute the same operations symmetrically. A correct owner-isolated result should allow each user to create, read, and update their own record while denying cross-user reads and updates. Any unexpected cross-user access is a `SECURITY RISK`; any denial of an authorized own-record operation is a `CONFLICT` or an implementation failure requiring separate investigation.

**Current result:** Not executed. No users or records were created.

**Current evidence:** None collected.

**Current classification:** `UNVERIFIED`.

## G. Runtime architecture diagram

The final report must replace the placeholders below with observed runtime facts. Until execution, this is a proposed verification model rather than a confirmed architecture:

```mermaid
flowchart TD
  A[Manus OAuth login] --> B[Manus session / openId]
  B --> C{Supabase Auth session exists?}
  C -->|yes| D[Supabase auth.users.id]
  C -->|no| E[Identity mapping absent or conflicting]
  D --> F[auth.uid()]
  F --> G[owner_id on clinical row]
  G --> H[RLS owner-isolated CRUD]
  A --> I[Existing app UI]
  I --> J[tRPC or server repository]
  J --> H
```

The final evidence must identify which portions actually ran in staging and which remain unverified.

## H. Required final conclusions after execution

After staging execution, the report must answer explicitly:

1. Is Manus `openId` mapped to `supabase auth.users.id`?
2. Does Manus login create a Supabase session?
3. What reaches `auth.uid()`?
4. What becomes `owner_id`?
5. Are clinical CRUD operations actually using Supabase?
6. Is `service_role` used, and if so, where and under what protection?
7. Does RLS isolate users correctly for own-record and cross-user operations?
8. Is the current architecture safe to migrate?

At the time of this documentation change, all eight answers remain **UNVERIFIED because staging runtime execution has not been performed**.

## Change boundary for this phase

This phase adds only this verification-plan document. It does not run staging tests, create users, write clinical records, change application code, modify `supabase/schema.sql`, modify RLS policies, alter authentication architecture, create issues, or open pull requests.
