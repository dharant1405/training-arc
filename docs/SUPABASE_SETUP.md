# Supabase Setup

Steps to connect Training Arc to a live Supabase project for testing.

1. Create a Supabase project at https://supabase.com/dashboard.
2. Open the project's **SQL Editor**.
3. Run the contents of `supabase/migrations/0001_init.sql` to create the
   `profiles`, `workout_completions`, and `achievements` tables (with RLS
   policies already included).
4. In **Project Settings → API**, copy the **Project URL**.
5. In the same page, copy the **anon / public** key. Never use the
   `service_role` key in this app.
6. Copy `.env.example` to `.env` and fill in both values:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```
7. Restart the Expo dev server (`npx expo start -c`) so the new env vars are
   picked up — Expo only reads `EXPO_PUBLIC_*` vars at startup.
8. Test authentication: register a new warrior, confirm you land on Home;
   kill and reopen the app to confirm the session is restored automatically;
   sign out and confirm you're returned to the Auth screen.
9. Test profile creation: after registering, check the Supabase Table Editor
   — a matching row should appear in `profiles` with `xp = 0`, `level = 1`.
10. Test workout persistence: complete a workout, then check
    `workout_completions` and `achievements` (if one unlocked) for new rows,
    and confirm `profiles.xp`/`streak`/`total_workouts` updated. Restart the
    app and confirm the same progress reloads from the cloud.

If `.env` is missing or incomplete, the app still runs — it falls back to a
local, unsynced profile and shows a "cloud persistence unavailable" indicator
instead of crashing or pretending a cloud save succeeded.

## Development-only: email confirmation disabled

This project uses Supabase's built-in default email service (no custom SMTP
configured), which hard-caps outgoing auth emails at **2/hour** regardless of
the "Rate limit for sending emails" field in Auth → Rate Limits. That cap was
blocking repeated `signUp()` testing ("email rate limit exceeded").

To unblock device testing, **Auth → Sign In / Providers → Confirm email** was
turned **off** for this project. `signUp()` now returns a session immediately
— no confirmation email is sent or required, and `applyCompletion`/profile
creation proceed as normal. RLS and all other security settings were left
untouched.

**Before shipping or inviting real users, turn Confirm email back on** (Auth →
Sign In / Providers) — or configure custom SMTP if you want confirmation
emails to work reliably during dev without hitting the 2/hour cap.
