# Connecting Supabase

You only need to do this once per Supabase project.

## 1. Create the tables, privacy rules and storage

1. Open your project at https://supabase.com/dashboard.
2. Go to **SQL Editor → New query**.
3. Paste the whole of [`migrations/20261119000000_init.sql`](migrations/20261119000000_init.sql)
   and click **Run**. You should see "Success. No rows returned".

## 2. Set up sign-in links

1. Go to **Authentication → URL Configuration**.
2. Set **Site URL** to `https://nikitapxtel.github.io/momento/`
3. Under **Redirect URLs** add:
   - `https://nikitapxtel.github.io/momento/`
   - `http://localhost:5173/momento/` (for local development)
4. Under **Authentication → Providers → Email**, make sure Email is enabled.

## 3. Tell the app where Supabase is

The deploy workflow already contains this project's public URL and publishable key. To use a
different project, add **repository variables** (Settings → Secrets and variables → Actions →
Variables) named `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

For local development put the same two values in `.env.local` (this file is not committed).

## Never share

The `service_role` / secret key and the database password. The app does not use them.
