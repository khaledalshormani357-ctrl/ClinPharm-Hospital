# Proposed Issues — ClinPharm Hospital (Phase 0)

هذه قائمة Issues مقترحة (DOC-only) محفوظة على فرع feature/clinpharm-audit-report. لم تُنشأ أي Issues فعلية في GitHub — هذه مجرد مقترحات للمراجعة.

تعليمات: كل Issue التالي يحتوي على: Title, Priority (P0–P3), Problem, Root cause, Evidence (من الشيفرة), Files affected, Risk, Proposed solution, Acceptance criteria, Migration required, Dependencies. كما تم تمييز ما تم التحقق منه من الكود، ما هو استنتاج/افتراض، وما يحتاج وصول Supabase/تشغيل لاختباره.

---

1) Title: Identity duplication between Supabase and Drizzle/MySQL
Priority: P0
Problem: User identity data exists in two places: Supabase (auth.users + public.profiles) and local MySQL managed by Drizzle (users table). This can cause mismatched roles, inconsistent permissions, and authentication confusion.
Root cause: Historical architecture used a local MySQL users table (drizzle) for session/user records; Supabase was later introduced for clinical data and auth, resulting in two identity stores without a canonical mapping.
Evidence (code):
- drizzle/schema.ts defines `users` table (openId, role, timestamps).
- server/db.ts implements getDb(), upsertUser(), getUserByOpenId() using drizzle(process.env.DATABASE_URL).
- server/_core/sdk.ts calls db.getUserByOpenId and db.upsertUser in authenticateRequest (lines: 288–316 and 294–303).
- supabase/schema.sql defines public.profiles referencing auth.users(id).
Files affected:
- drizzle/schema.ts
- server/db.ts
- server/_core/sdk.ts
- supabase/schema.sql
Risk:
- Critical: inconsistent access control where a user exists in one store but not the other; difficulty in enforcing RLS tied to auth.uid(); potential security gaps.
Proposed solution:
- Short term: Document exact flow and implement a read-only sync job to copy necessary fields from MySQL to Supabase profiles (non-destructive). Use this to validate mapping.
- Long term: Migrate canonical identity to Supabase (auth.users + public.profiles) and update server SDK to read from Supabase instead of MySQL. Phase out Drizzle writes once parity is confirmed.
Acceptance criteria:
- Documented mapping between Drizzle.users.openId and Supabase.auth.users.id (or an explicit matching table).
- Server code path for authenticateRequest updated in a feature branch to optionally read from Supabase without breaking existing flow (feature flagged).
- Tests showing a user created via OAuth is visible in Supabase public.profiles and has correct role mapping.
Migration required: Yes (data sync / potential schema add on public.profiles)
Dependencies:
- Access to Supabase staging or schema-only dump to validate profiles schema and auth.users mapping.
What is verified from code: Drizzle usage in authentication path is confirmed.
What is an assumption/needs verification: Existence of a stable mapping between openId and auth.users.id in Supabase — requires Supabase access.
What requires running app/Supabase to confirm: That auth.uid() in Supabase corresponds to the same openId values used by Drizzle.

---

2) Title: Missing clinical domain tables required by spec (Encounters, Diagnoses, Medications, etc.)
Priority: P1
Problem: The current Supabase schema includes core clinical tables (patients, cases, medication_reviews, interventions) but lacks many domain-specific tables specified for the full ClinPharm Hospital (Encounters, Diagnoses, Allergies, Medications, MedicationHistory, MedicationOrders, MedicationReconciliation, VitalSigns, LaboratoryResults, ClinicalProblems, DrugRelatedProblems, MonitoringPlans, EvidenceSources, etc.).
Root cause: Initial app focused on patient-level notes and reviews; full EHR-style clinical domain modeling was not implemented yet.
Evidence (code):
- supabase/schema.sql lists clinical_patients, clinical_cases, medication_reviews, clinical_interventions, guidelines, sync_queue but no medications/encounters/diagnoses tables.
Files affected:
- supabase/schema.sql
- client/src/pages (UI pages will require forms and screens to manage these entities)
Risk:
- Medium: Incomplete clinical model prevents building medication workflow, DRP engine, and accurate clinical decision support.
Proposed solution:
- Create design documents and proposed schema migrations for each missing domain table.
- Prioritize core tables for Phase 1 (Encounters, Medications, MedicationHistory, MedicationOrders, Allergies, Diagnoses) and implement them via non-destructive migrations in staging.
Acceptance criteria:
- Schema design doc approved.
- Migrations created and tested on staging (no changes to production until approved).
Migration required: Yes (when implementing the tables)
Dependencies:
- Product input on minimal required fields for each table.
What is verified from code: Missing tables are absent from schema.sql.
What is assumption/needs verification: The client UI's readiness to consume and create these models — needs running the app and mapping screens.
What requires running app/Supabase to confirm: Real flows for creating encounters and linking medications to patients.

---

3) Title: Local cache & sync flow needs verification (offline behavior and sync_queue)
Priority: P1
Problem: The repository documents a "Cloud First + Local Cache" flow and a sync_queue table, but the implementation and robustness of offline behavior, conflict resolution, migration of legacy cache, and retries is not verified.
Root cause: Offline-first features are complex and often under-tested; code documents intent but functional tests are missing.
Evidence (code):
- supabase/README.md describes the cache and sync migration from clinpharm-patient-drafts.
- supabase/schema.sql defines sync_queue table and RLS.
Files affected:
- supabase/README.md
- supabase/schema.sql
- client/src/hooks (likely cache/sync logic) — needs verification of which hook files implement syncing.
Risk:
- High: data loss or inconsistent state in offline→online transitions; failed syncs may leave records unsaved.
Proposed solution:
- Run end-to-end tests for offline->online sync, including conflict scenarios, retry attempts, and error logging.
- Harden sync_queue processing with backoff and alerting on repeated failures.
Acceptance criteria:
- Functional tests for offline creation/edit of patients pass and data is synced to Supabase in staging.
- Sync_queue shows processed items with documented retries/explanations.
Migration required: No (verification only)
Dependencies:
- Access to a Supabase staging project and ability to run the client in offline simulation mode.
What is verified from code: sync_queue table exists and README mentions migration from local cache.
What is assumption/needs verification: Implementation correctness and client hooks behavior; requires running the app.
What requires running app/Supabase to confirm: Full offline->online sync and conflict resolution.

---

4) Title: LLM/AI layer exists but lacks PHI/PII leakage protections
Priority: P1
Problem: There is an LLM invocation layer (server/_core/llm.ts) but no code-level safeguards preventing protected health information (PHI) or personally identifiable information (PII) from being sent to external LLM providers.
Root cause: LLM layer was implemented as a generic client to the Manus Forge API but clinical safety filters and data minimization may not have been integrated yet.
Evidence (code):
- server/_core/llm.ts exists and invokes ENV.forgeApiKey bearer requests to the configured endpoint.
- No additional filters or scrubbing functions present in llm.ts; no explicit clinical prompt templates were found in the repository.
Files affected:
- server/_core/llm.ts
- potential caller locations in server/_core/* and server routers (no explicit clinical copilot integration found)
Risk:
- High: accidental leakage of PHI/PII to third-party LLM providers, regulatory exposure (HIPAA/GDPR) and clinical risk from hallucinations.
Proposed solution:
- Introduce a data-scrubbing layer that removes PHI/PII from prompts before dispatch, and add a strict allowlist for what patient data is forwarded.
- Implement logging and audit trails for LLM requests and responses, and keep minimal clinical context (hashed IDs) where possible.
- Add a review/approval gate before enabling LLM features in production.
Acceptance criteria:
- A documented filter pipeline exists for LLM inputs that can be audited.
- Requests to LLM in staging are logged with redaction applied and justification for context included.
Migration required: No (architectural change + code additions)
Dependencies:
- Security review and product decision on allowed data to forward to LLM.
What is verified from code: llm.ts exists and is used as an LLM client.
What is assumption/needs verification: Actual callers passing patient data to llm.invoke — requires code search for callers and running app to confirm.
What requires running app/Supabase to confirm: Real examples of LLM calls with clinical context.

---

5) Title: RLS policies present but need functional verification in staging
Priority: P1
Problem: RLS policies are defined in supabase/schema.sql (profiles, clinical_patients, clinical_cases, interventions, medication_reviews, guidelines, sync_queue) but their runtime behavior hasn't been verified in a Supabase environment with sample data and sessions.
Root cause: Policies declared in migration SQL but require testing with actual sessions (auth.uid()) to ensure they enforce intended access.
Evidence (code):
- supabase/schema.sql includes alter table ... enable row level security and create policy statements for each table.
Files affected:
- supabase/schema.sql
Risk:
- High: Incorrect RLS could allow data exposure between users or block legitimate access.
Proposed solution:
- Create a staging Supabase with schema.sql applied, seed test users and data, and run integration tests verifying allowed and denied actions match policy intent.
Acceptance criteria:
- Test matrix covering read/write/update/delete for each table per role passes in staging.
Migration required: No (testing only; schema already present)
Dependencies:
- Access to Supabase staging and test accounts.
What is verified from code: RLS statements exist in SQL.
What is assumption/needs verification: Execution of these policies in a live Supabase instance.
What requires running app/Supabase to confirm: Behavior of policies under different auth sessions.

---

6) Title: No Supabase Storage bucket configured for attachments (planned)
Priority: P2
Problem: The README explicitly notes that no storage bucket is created and recommends adding one before supporting attachments (PDFs, images, certs). The repo lacks code to manage attachments currently.
Root cause: Attachments functionality not yet implemented.
Evidence (code):
- supabase/README.md notes "No Supabase Storage bucket is created because the current UI does not persist PDF, image ...".
Files affected:
- supabase/README.md
- potential client/server storageProxy and server/storage.ts for implementation
Risk:
- Low: Not a blocker, but required for later features like certificates and evidence documents.
Proposed solution:
- Add a private Supabase bucket with owner-scoped policies when implementing attachments; update storageProxy.ts and server/storage.ts and client upload UI accordingly.
Acceptance criteria:
- Storage bucket created in staging, uploads controlled by owner policies, client can upload/download attachments.
Migration required: No (infrastructure change on Supabase)
Dependencies:
- Supabase project admin access.
What is verified from code: README statements and existence of server/storage.ts and server/_core/storageProxy.ts.
What is assumption/needs verification: No active code currently writes to Supabase Storage.
What requires running app/Supabase to confirm: Upload/download behavior.

---

7) Title: Missing Medications/Formulary table and DRP storage
Priority: P1
Problem: There is no medications table or formulary model, and no storage model for detected Drug Related Problems (DRPs).
Root cause: Domain modeling for medication management not implemented yet.
Evidence (code):
- supabase/schema.sql lacks medications, formularies, drug_related_problems tables.
Files affected:
- supabase/schema.sql
- client UI pages that will use medication lists / reconciliation
Risk:
- High: Medication workflows (orders, reconciliation, DRP detection) require these tables; missing them blocks core functionality.
Proposed solution:
- Design medications and DRP tables and include fields for identifiers (e.g., RxNorm/CVN), dosing, start/end dates, indication, prescriber, source.
- Implement DRP results table with references to patient, medication, detected_problem, severity, suggested_intervention, and timestamp.
Acceptance criteria:
- Schema design doc reviewed.
- Migrations prepared for staging.
Migration required: Yes (when implemented)
Dependencies:
- Clinical product input on minimum viable fields.
What is verified from code: Missing tables.
What is assumption/needs verification: How UI maps to medication data structures.
What requires running app/Supabase to confirm: Reconciliation flows.

---

8) Title: Dev environment and runbook missing or incomplete
Priority: P1
Problem: The repository lacks a concise dev runbook and env.example to quickly stand up a local dev environment with Supabase staging and stubbed credentials.
Root cause: Early stage project scaffolding didn't include a full onboarding runbook.
Evidence (code):
- No .env.example found in repo root.
- package.json includes dev/build scripts but no clear step-by-step in README for local dev.
Files affected:
- README (repo root / client README if exists)
- package.json
Risk:
- Medium: Slower onboarding and risk of developers misconfiguring env keys or accidentally committing secrets.
Proposed solution:
- Add docs/DEV_RUNBOOK.md and .env.example with placeholders for VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, DATABASE_URL, OAUTH_SERVER_URL, etc.
- Include sample test user creation scripts and instructions to seed minimal data.
Acceptance criteria:
- A developer can follow DEV_RUNBOOK.md to run the app locally and run basic integration tests.
Migration required: No
Dependencies:
- None; purely repo docs and small code changes to ensure dev-friendly config.
What is verified from code: Missing .env.example and runbook.
What is assumption/needs verification: That existing scripts work with minimal env values — requires local run.
What requires running app/Supabase to confirm: Full dev flow.

---

9) Title: Potential build/dependency mismatches (tailwind/nanoid overrides, esbuild version)
Priority: P3
Problem: package.json contains dependency overrides and older major versions (esbuild pinned to ^0.25.0, tailwindcss v4 with a nanoid override). This may cause build or security issues.
Root cause: Dependency pinning and mixing of ecosystem versions without harmonization.
Evidence (code):
- package.json dependencies: esbuild ^0.25.0, tailwindcss ^4.1.14 and an overrides entry: "tailwindcss>nanoid": "3.3.7".
Files affected:
- package.json
Risk:
- Low/Medium: build failures, security alerts from outdated packages.
Proposed solution:
- Run `pnpm install` and `pnpm build` in CI/dev to identify warnings; incrementally update esbuild and tailwind to supported versions and test.
Acceptance criteria:
- Clean dev build and CI without critical dependency vulnerabilities.
Migration required: No
Dependencies:
- Basic CI run or local dev build.
What is verified from code: package.json entries.
What is assumption/needs verification: Build success; requires running build.
What requires running app/Supabase to confirm: None — local build only.

---

10) Title: Documentation gap for role-based access (admin, clinical_pharmacist, pharmacy_student, supervisor)
Priority: P2
Problem: Schema defines roles in profiles.role but there is no documentation or code-level enforcement showing how these roles affect UI/permissions.
Root cause: Roles defined at DB level but role-based UI/UX and server checks may be incomplete.
Evidence (code):
- supabase/schema.sql profiles.role check (admin, clinical_pharmacist, pharmacy_student, supervisor)
Files affected:
- supabase/schema.sql
- client/src (authorization usage may be implemented in hooks/components, needs search)
Risk:
- Medium: Users may see actions they shouldn't or be blocked from necessary actions.
Proposed solution:
- Map role -> permissions matrix, update server-side authorization checks, and conditionally render UI based on roles.
Acceptance criteria:
- Role-permission matrix documented.
- Server-side checks in place for at least critical flows (e.g., editing clinical interventions, accepting/rejecting interventions).
Migration required: No (documentation + code changes)
Dependencies:
- Product decisions on role capabilities.
What is verified from code: role exists in profiles.
What is assumption/needs verification: That UI & server enforce role-based permissions currently — requires code search and tests.
What requires running app/Supabase to confirm: Role assignment and permission tests.

---

End of Proposed Issues list.

ملف محفوظ على: docs/PROPOSED_ISSUES.md في فرع feature/clinpharm-audit-report.

سأتوقف هنا بانتظار مراجعتك. لا أفتح Issues فعلية أو أبدأ PRs كما طلبت.