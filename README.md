# Valen Crash — V3

Valen Crash is a Next.js dashboard with a responsive, centered bottom navigation dock and mandatory login/register before accessing the site.

## Features
- Login and registration page at `/login`.
- User records stored as JSON in a **separate private GitHub repository**.
- Passwords are stored as salted scrypt hashes, never as plain text.
- Signed HTTP-only session cookie, seven-day session lifetime, logout button.
- Responsive mobile and desktop UI; bottom dock is horizontally centered and fits small screens.
- Existing dashboard, bug-menu demo, tools menu, settings, banner, and profile UI retained.

## Setup GitHub JSON database
1. Create a separate **private** GitHub repository, e.g. `valen-crash-data`.
2. Add a file at `database/users.json` with this content:
   ```json
   {
     "users": []
   }
   ```
3. Create a GitHub token with access to that private data repository and **Contents: Read and write** permission. Keep it server-side; never expose it in browser code.
4. Copy `.env.example` to `.env.local` and fill in:
   - `GITHUB_OWNER`: GitHub account/org that owns the data repository.
   - `GITHUB_REPO`: private data repository name.
   - `GITHUB_USERS_PATH`: JSON file path, default `database/users.json`.
   - `GITHUB_TOKEN`: token authorized to read/write the data repository.
   - `SESSION_SECRET`: random secret of at least 32 characters.
5. Install and run:
   ```bash
   npm install
   npm run dev
   ```
6. Deploy to Vercel and add the same environment variables in Project Settings → Environment Variables, then redeploy.

## Important notes
- Do not put the GitHub token in `NEXT_PUBLIC_*` variables or commit `.env.local`.
- The JSON data repository must be private. A public JSON file exposes account metadata and password hashes.
- GitHub Contents API is a simple JSON-backed store for testing/small projects, not a high-concurrency database. Simultaneous registrations can conflict; retry if prompted.
- If GitHub settings are missing or incorrect, registration/login will show a setup error until the environment variables and token permissions are fixed.
- The dashboard's testing console is a safe UI demo and does not perform external actions.

## V4 UI/auth updates

- Floating navigation is centered and the close (X) control is raised between Bug Menu and Tools Menu when the dock is open.
- The VC monogram alignment has been corrected.
- Dashboard `Status akun / Role` now displays the signed-in user's actual role.
- The `Expired` card displays the account expiration date; Owner accounts without `expiresAt` are shown as `UNLIMITED`.
- New self-registered accounts receive the `user` role and a 7-day `expiresAt` value. Registration still requires valid GitHub repository credentials with Contents read/write permission.
- `database/users.owner.example.json` is a one-account Owner database. For that file, username is `owner` and password is `ValenOwner-876b5d54fd17b28e!`. Replace `database/users.json` in your private data repository with its contents if you want to use this Owner login.

Note: the application source was updated and the ZIP archive was checked for integrity, but a full Next.js production build was not run in this environment because dependencies are not installed here.
