# ClinPharm Hospital Supabase setup

The app now uses a **Cloud First + Local Cache** data layer. The public client uses `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`; no Service Role Key is accepted or required by the client.

## Manual Supabase step

Open the Supabase SQL Editor and run [`schema.sql`](./schema.sql). This creates the private clinical tables, indexes, ownership constraints, RLS policies, and the profile trigger for new Auth users. The project cannot create these tables through the anon key because that would weaken the security boundary.

## Authentication

Enable Email provider in Supabase Authentication settings. The UI supports sign in, sign up, persisted sessions, sign out, and password-reset email requests. Supabase Auth owns passwords and sessions; the application does not store passwords.

## Data flow

When a Supabase Auth session exists, patient reads and writes use Supabase and are isolated by `auth.uid() = owner_id`. When offline or signed out, the existing local cache remains available. New local records enter `syncQueue`; on reconnection or session restoration, queued create/update/delete operations are retried. Duplicate queue entries are rejected by operation id, and conflicts use the most recently updated record.

## Migration

On the first successful session for a user, the hook checks the legacy `clinpharm-patient-drafts` cache. If the cloud table is empty, it attempts an idempotent upload and stores a per-user migration marker. Invalid or duplicate records remain in the local cache for review instead of being deleted.

## Storage

No Supabase Storage bucket is created because the current UI does not persist PDF, image, certificate, or clinical-document attachments. Add a private bucket and owner-scoped policies before introducing such a workflow.
