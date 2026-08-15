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
