# Valen Crash V1 — UI Starter

Premium dark-cinematic dashboard starter for **Valen Crash — By KyZX Devs**.

## Included
- Next.js + TypeScript
- Responsive monochrome / dark-crimson UI
- Custom VC SVG favicon and logo mark
- 16:9 banner video URL setting
- Looping background video URL setting
- Moving welcome ticker
- Floating bottom-center VC dock with Dashboard, Bug Menu, Tools, Profile
- Local visual settings and demo profile saved in browser storage
- Safe testing form demo (does not send messages or run external actions)

## Run locally
```bash
npm install
npm run dev
```
Open `http://localhost:3000`.

## Video settings
Tap the gear icon and enter direct, browser-accessible `.mp4` or compatible video URLs. Settings are saved in this browser's local storage. They are not global settings and are not shared with other users.

## Important limitations
This is the initial frontend/UI starter, not a production authentication system.
- Account stats currently show placeholders.
- Profile is a local demo profile, not a secure user account.
- The testing form is a UI demonstration only and does not contact Telegram or WhatsApp.
- `data/users.json` is intentionally not used for password storage in this frontend starter. For real login, use a server-side API, hashed passwords, secure sessions, authorization checks, and a database/private source.
- Never expose Telegram bot tokens, API secrets, or private sender credentials in browser code or a public GitHub repository.
- Use messaging integrations only for authorized testing and approved APIs.

## Suggested next stage
Add backend auth + expiration checks, database-backed sender ownership, admin-only global sender configuration, task history, and authenticated Telegram bot job delivery for permitted test jobs.
