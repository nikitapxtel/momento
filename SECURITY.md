# Security

## Reporting a problem

Please report security issues privately using GitHub's **Report a vulnerability** button on
the Security tab of this repository, rather than opening a public issue.

## How Momento protects people's memories

**The database is the gatekeeper.** Every table and the image bucket use Postgres Row Level
Security (`supabase/migrations`). The browser only ever holds the public _publishable_ key, so
even a modified copy of the app cannot read or change anything the rules don't allow:

- Profiles are private by default; memories are hidden by default.
- Others see a memory only when its owner's profile is public **and** the memory is shown.
- Only owners can add, change or delete their own profiles, memories, sides and images.
- Owners can't move a memory into someone else's box or point at someone else's images.
- Columns that must never change (like `owner_id`) are not granted for update.

These rules are tested in `supabase/tests/rls_test.sql`, which runs in CI on every change.

**Images**

- Stored in a private bucket and served only through signed links that expire after an hour.
- Re-encoded on the device before upload, which strips EXIF metadata such as GPS location.
- Checked by real file signature (not just the name), limited to JPEG/PNG/WebP and 15 MB, and
  the bucket only accepts WebP up to 10 MB.

**The web app**

- A strict Content Security Policy: scripts only from the site itself, no plugins, and
  network access limited to Supabase and the Open-Meteo weather and place-lookup services.
- No `dangerouslySetInnerHTML`; React escapes all user text.
- Sign-in uses one-time email links (PKCE flow), so there are no passwords to leak, and sign-in
  messages never reveal whether an account exists.
- The weather sky uses the city from the browser's time zone by default (no location prompt).
  Precise location is opt-in, rounded to about 11 km before it leaves the device, and never stored.

**The pipeline**

- CI runs lint, strict type checks, unit, browser and database tests, and `npm audit`.
- CodeQL scans the code for security issues on every change and weekly.
- Dependabot keeps dependencies and GitHub Actions up to date.

## Secrets

Never commit the Supabase `service_role` / secret key or database password. The app does not
need them. Only the project URL and publishable key belong in the build.
