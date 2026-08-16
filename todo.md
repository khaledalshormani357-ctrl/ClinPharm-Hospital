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

- [x] Deferred by user: verify Supabase project connection, configuration, and safe execution prerequisites.
- [x] Deferred by user: apply supabase/schema.sql and verify tables, indexes, and RLS policies in the real Supabase project.
- [x] Deferred by user: create or use a user-provided disposable Supabase test account without storing credentials in code or logs.
- [x] Deferred by user: verify sign-in, session restoration, password-reset request, patient sync, medication-review CRUD, and conflict recovery against real Supabase.
- [x] Deferred by user: add and run E2E tests for patient creation, medication review, and conflict upload/recovery.

## Deferred Supabase work

- [x] Deferred by user: execute supabase/schema.sql and verify the real Supabase project when access is available.
- [x] Deferred by user: create/use a disposable Supabase test account and run live auth/sync validation.
- [x] Deferred by user: add and run live Supabase E2E tests after database activation.

## Non-Supabase continuation

- [x] Improve the remaining clinical and educational workflows without depending on live Supabase access.
- [x] Add additional automated tests and visual verification for the continued workflows.

## Prioritized non-Supabase improvements

- [x] Persist chief complaint, allergies, and current therapy in the patient assessment draft and expose them to the review step.
- [x] Add a visible evidence/source validation state to the recommendation step, including an explicit insufficient-evidence path.
- [x] Add additional unit tests for high-risk Copilot gating, drug-related problem detection, and patient draft serialization.
- [x] Perform desktop and mobile visual verification after these improvements.

## Continued workflow verification gaps

- [x] Expose complaint, allergies, and current therapy in a later Copilot review/summary step before completion.
- [x] Add dedicated DRP-detection tests for interaction, high-alert, renal-dose, and omission scenarios.
- [x] Add one concrete educational workflow improvement, such as a case progress action or question completion state, without requiring live Supabase.
- [x] Re-run automated tests and desktop/mobile visual verification after these workflow changes.

## Next phase: audit and training improvements

- [x] Add a local audit log model and persistence for patient drafts, medication reviews, SOAP/intervention actions, and Copilot evidence confirmations.
- [x] Add an accessible Clinical logbook view that lists audit events with timestamps, actor, action, and source/evidence context.
- [x] Add interactive training question state with answer selection, immediate rationale feedback, and completion tracking.
- [x] Add unit tests for audit event serialization and training answer evaluation.
- [x] Run type checks, tests, and desktop/mobile visual verification for this phase.

## Training question completion hardening

- [x] Add explicit question completion tracking with completed question IDs, correctness count, progress indicator, and local persistence.
- [x] Add tests for question completion state and persisted training progress.
- [x] Re-run type checks, tests, and desktop/mobile visual verification after question completion tracking.

## Question progress test gap

- [x] Extract question-progress serialization/update logic into pure functions and add Vitest coverage for completion IDs, correctness counting, and local persistence restoration.
- [x] Re-run type checks, tests, and visual verification after the question-progress test fix.

## New phase: audit export and timed training

- [x] Add a safe local CSV export for the clinical audit log with clear columns and escaping.
- [x] Add a timed training session mode with start, pause/reset, remaining time, and completion state.
- [x] Add a local performance summary for training accuracy, completed questions, and session duration.
- [x] Add unit tests for CSV escaping/export transformation and timed-session state transitions.
- [x] Run type checks, tests, and desktop/mobile visual verification for the new phase.

## Training performance summary hardening

- [x] Add a dedicated local training performance summary showing completed questions, accuracy, correct count, and session duration/elapsed time.
- [x] Persist the training performance summary locally and add Vitest coverage for summary calculation and serialization.
- [x] Re-run type checks, tests, and desktop/mobile visual verification after the summary fix.

## Supabase connection re-enabled

- [x] Deferred by user: verify the newly connected Supabase URL, anon configuration, and safe environment setup without exposing secrets.
- [x] Deferred by user: verify that the ClinPharm schema tables, indexes, and RLS policies exist in the connected project.
- [x] Deferred by user: verify Supabase Auth session restoration, sign-in/reset-password request behavior, and user isolation.
- [x] Deferred by user: run live-safe patient, medication-review, and conflict-sync checks using a disposable authenticated test session.
- [x] Deferred by user: run the project test suite and final desktop/mobile visual verification after the Supabase connection is confirmed.

## Supabase deferred again

- [x] Deferred by user: keep live Supabase schema execution, live Auth validation, and live E2E checks deferred until the user has suitable computer access.
- [x] Continue only with local-cache clinical and educational improvements that do not require live Supabase.

## Local clinical timeline and documentation phase

- [x] Add a local patient timeline model with timestamped assessment, medication review, intervention, SOAP, and alert events.
- [x] Add a local timeline view with filtering by event type and patient identifier.
- [x] Add quick documentation templates for SOAP, medication review, and intervention notes with local save.
- [x] Add unit tests for timeline ordering/filtering and template serialization.
- [x] Run type checks, tests, and desktop/mobile visual verification for this local phase.

## Structured documentation template hardening

- [x] Render template-specific fields for SOAP, medication review, and intervention documentation.
- [x] Add pure serialization and parsing functions for structured template entries and save them in the local timeline.
- [x] Add Vitest coverage for template field mapping, serialization, and parsing.
- [x] Re-run type checks, tests, and desktop/mobile visual verification after the structured template fix.

## Documentation template mapping test hardening

- [x] Add explicit Vitest assertions for each documentation template's expected field labels and placeholders.
- [x] Re-run type checks, tests, and desktop/mobile visual verification after strengthening template mapping tests.

## Android APK conversion

- [x] Evaluate whether the current environment can build a signed or debug APK locally and choose Capacitor/Expo packaging accordingly.
- [x] Add Android app metadata, package identifier, package name, and offline-safe web/app shell behavior.
- [x] Build a debug APK artifact and add a reproducible Capacitor/Gradle build path.
- [x] Verify the Android wrapper build inputs and preserve the web preview.
- [x] Document APK installation and signing limitations clearly without exposing secrets.

## Next phase: Android device validation, branding, release signing, and Supabase readiness

- [x] Prepare a real-device APK validation checklist for patient flows, Copilot gating, training, and offline persistence.
- [x] Add branded Android launcher icon and splash-screen assets/configuration without storing secrets.
- [x] Verify the branded debug APK after Capacitor sync and Gradle build.
- [x] Add a secure release-signing configuration template that reads keystore values from environment variables and keeps keystore files out of Git.
- [x] Document release signing, APK installation, and device test evidence requirements.
- [x] Document deferred Supabase activation prerequisites and live E2E validation steps.
- [x] Run type checks and Vitest after the Android branding/signing changes.

## Upgrade audit and Clinical Pharmacist Intelligence Platform specification

- [x] Audit the existing source, screens, navigation, components, database, Supabase, authentication, API, AI, clinical modules, patient workflows, drug information, logbook, training, calculations, synchronization, offline behavior, environment, and dependencies.
- [x] Produce an internal inventory of existing, partial, missing, broken, and duplicated functionality without replacing working features.
- [x] Map existing data structures to the requested clinical domains and identify only safe additive migrations.
- [x] Audit existing AI provider, prompts, context, citations, clinical safety, privacy, and hallucination controls before extending Copilot behavior.
- [x] Audit RTL, accessibility, mobile usability, loading/error/empty states, and Android wrapper compatibility.
- [x] Implement the next highest-priority gaps without creating duplicate workflows or tables.
- [x] Add regression tests and verify navigation, authentication, forms, database operations, offline behavior, RTL, web preview, and Android build after each major change.
- [x] Deliver a durable audit and upgrade report with recommended development order and remaining blockers.

## Audit follow-up hardening

- [x] Add a targeted regression test for the upgraded SOAP/intervention evidence gate and ensure no placeholder source can be saved.
- [x] Remove patient_id null defaults from medication review/intervention/case save paths by requiring or explicitly selecting a patient context.
- [x] Complete a focused post-change verification pass for navigation, authentication, forms, offline behavior, RTL, and cloud/local data operations.

## Runtime verification hardening

- [x] Add regression coverage for patient-context-required save gating in Medication review, Interventions, and Cases.
- [x] Perform and record an RTL-specific visual verification pass with Arabic direction enabled.
- [x] Exercise and document local/cloud clinical-record save/update queue behavior after the evidence and patient-context hardening.

## Verification correction follow-up

- [x] Require patient context as well as evidence for the Interventions/SOAP save action and test the combined gate.
- [x] Extend queue regression coverage to include a patient-linked update operation in addition to create.
- [x] Record hook-level/local queue verification limitations explicitly without claiming live Supabase CRUD.
