# Project TODO

- [x] Establish the clinical dashboard shell with responsive sidebar navigation and the requested module destinations.
- [x] Add patient intake and patient list workflows.
- [x] Implement the step-by-step Clinical Pharmacist Copilot flow without allowing stage skipping.
- [x] Implement patient assessment data collection and medication review surfaces.
- [x] Implement Drug-Related Problems detection for interactions, contraindications, dose, duplication, omission, and monitoring issues.
- [x] Add evidence hierarchy display, source traceability, evidence level, and Insufficient evidence handling.
- [x] Add mandatory AI Safety Layer for high-risk clinical decisions and source-verification confirmation.
- [x] Add clinical calculators, renal/hepatic dose-adjustment workflow, and calculation history surface.
- [x] Add SOAP note generation and pharmacist intervention documentation.
- [x] Add medication reconciliation workflow.
- [x] Add training hub, case simulator, question bank, study plan, progress, and student competency tracking.
- [x] Add clinical alerts for severe interactions, high-alert medications, and unsafe doses.
- [x] Add guideline finder/comparison and evidence search surfaces.
- [x] Add responsive mobile-friendly clinical visual design and accessibility states.
- [x] Add Vitest coverage for critical clinical logic and UI-safe data transformations.
- [x] Run type checks, tests, and visual verification before delivery.

## Follow-up gaps identified during verification

- [x] Implement all requested dashboard destinations as actual sections or views, including Today's Rounds, Clinical Logbook, Student Training, Cases, Questions, Progress, and Alerts.
- [x] Add a real patient intake workflow with validation, submit/save behavior, and integration into the patient list.
- [x] Build a dedicated medication review surface with structured assessment fields and review actions.
- [x] Enforce the high-risk AI safety confirmation so recommendations cannot be finalized or advanced without verified-source acknowledgment.
- [x] Add and verify explicit accessibility states for custom controls, focus-visible styling, keyboard interaction, labels, and assistive feedback.

## Imported requirements from pasted_content.txt

- [x] Read and apply all explicit requirements and content from the newly attached pasted_content.txt file.
- [x] Re-run type checks, tests, and visual verification after applying the imported requirements.

## Supabase migration hardening gaps

- [x] Implement Supabase-backed CRUD repositories for the persisted clinical entities used by current workflows, not only patient creation.
- [x] Complete Cloud First + Local Cache sync for create, update, delete, retry, duplicate prevention, failed states, and conflict resolution, and surface status in the UI.
- [x] Add protected app sections based on Supabase session restoration and user-isolated access, including reset-password flow verification.
- [x] Document and implement Supabase Storage buckets only for any current attachment/document workflows that require file persistence.
- [x] Run a fresh post-Supabase visual verification pass and confirm the imported requirements before final delivery.

## End-to-end Supabase verification gaps

- [x] Wire clinical cases, interventions/SOAP, guidelines, and medication review workflows to Supabase CRUD instead of static/local-only state.
- [x] Add concrete offline update/delete paths with retry UI and integrate conflict resolution into the sync flow.
- [x] Enforce Supabase-session protection for cloud-backed sections and add code-level tests for session restoration and reset-password handling.
- [x] Re-run visual verification only after the end-to-end Supabase requirements are wired and validated.

## Final Supabase hardening gaps

- [x] Wire the Medication review workflow to actual Supabase CRUD/state, not only local inputs and navigation.
- [x] Integrate resolveConflict into real sync reconciliation and add explicit retry/failed/conflict recovery UI for queued operations.
- [x] Add Vitest coverage for Supabase auth session restoration and reset-password flow behavior.
- [x] Run and record final visual verification after the remaining Supabase end-to-end gaps are implemented.

## Last end-to-end migration gaps

- [x] Remove or fully wire the duplicate local Medication review panel in Home.tsx to the Supabase-backed review workflow.
- [x] Add explicit per-operation queued failure/conflict UI and recovery actions across synced entities.
- [x] Add tests that exercise authService session restoration and reset-password request handling through mocked Supabase Auth behavior.
- [x] Re-run visual verification after the final migration cleanup.

## Closing verification gaps

- [x] Implement visible queued-operation recovery UI with per-entity pending, failed, and conflict items plus retry and dismiss actions.
- [x] Add Vitest tests with a mocked Supabase Auth client for getSession restoration and reset-password request handling through authService.
- [x] Run the final visual verification after the closing gaps are resolved.

## Explicit conflict visibility

- [x] Render conflict status and recovery messaging explicitly for patient-conflict and other conflict queue entries.
- [x] Re-run final visual verification after explicit conflict visibility is implemented.

## Supabase production verification request

- [ ] Verify Supabase project connection, configuration, and safe execution prerequisites.
- [ ] Apply supabase/schema.sql and verify tables, indexes, and RLS policies in the real Supabase project.
- [ ] Create or use a user-provided disposable Supabase test account without storing credentials in code or logs.
- [ ] Verify sign-in, session restoration, password-reset request, patient sync, medication-review CRUD, and conflict recovery against real Supabase.
- [ ] Add and run E2E tests for patient creation, medication review, and conflict upload/recovery.

## Existing Supabase project integration

- [x] Use the existing Supabase project URL `https://iwtyddokiwcqwnmmlwlt.supabase.co` without creating a new Vite or mobile project.
- [x] Verify the current React/Capacitor app structure and identify the existing Supabase client, config, schema, Auth, RLS, and sync data paths.
- [x] Configure only `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` for mobile-safe public access; never place service_role or secret keys in client code.
- [x] Run or safely prepare the existing database schema SQL, then verify database schema and RLS policy definitions using administrative SQL access without exposing secrets.
- [ ] Connect the existing data layer to the selected Supabase project and test patient-linked CRUD, Auth/session restoration, queue flush, and conflict handling.
- [ ] Preserve all existing screens, web preview, Android wrapper, local cache, offline behavior, and clinical safety gates.
- [ ] Run TypeScript, Vitest, web build, Android build, and Supabase integration checks before the next checkpoint.

## Post-migration Supabase verification

- [ ] Run real-project SQL verification queries for ClinPharm tables, indexes, trigger, and `pg_policies` RLS entries, then record the returned results.
- [ ] Verify Auth user creation/session restoration and patient-linked CRUD using a disposable test account, with cleanup documented.

## Private GitHub repository setup

- [x] Audit the current Git state, ignored files, environment files, keystores, release kits, and generated artifacts before publishing.
- [x] Strengthen ignore rules so Supabase secrets, `.env` files, keystores, passwords, release kits, and local build outputs cannot be committed.
- [x] Create a new private GitHub repository for the existing ClinPharm project without creating or replacing the app.
- [x] Commit and push the current source, Android wrapper, Supabase schema/docs, tests, and project documentation to the private repository.
- [x] Verify the remote, default branch, repository visibility, and absence of secret-like files in the pushed tree.
- [x] Document the repository URL and safe GitHub Secrets required for any future Supabase workflow.

## GitHub repository verification follow-up

- [x] Verify and record that the private GitHub tree contains the Android wrapper, Capacitor config, tests, Supabase schema/docs, and project documentation.
- [x] Add a permanent repository document with the private GitHub URL and names/purposes of safe GitHub Secrets for future Supabase workflows, without secret values.

## Android wrapper repository gap

- [x] Restore the existing Capacitor Android wrapper in the current project tree before pushing the repository update; do not create a new app or replace the React app.
- [ ] Re-run the Android debug build and verify the regenerated wrapper is represented in the private GitHub tree while excluding local.properties and build outputs.

## Optional GitHub verification workflow

- [ ] Add a manually triggered GitHub Actions workflow that runs project checks and read-only Supabase verification using protected GitHub Secrets only.
- [ ] Document that the workflow must not auto-apply migrations or print database URLs, passwords, publishable keys, or service-role keys.
