# Hangulandia — developer guide

## Branches
| branch | contains | who writes |
| --- | --- | --- |
| `dev` | source: screens, tools, assets, SQL, CI | developers (push here) |
| `main` | built test site served by GitHub Pages | **CI only** — never push by hand |

Push to `dev` → `.github/workflows/deploy-test.yml` runs: sync e2e test → build → static gate → browser smoke test → publish to `main`.
If any step fails nothing is published; the live test app stays on the last good build.
Production bundle: run the `release-prod` workflow by hand; download the `hangulandia-prod` artifact.

## Layout
| path | what |
| --- | --- |
| `src/screens/*.dc.html` | the 6 screens (template `<x-dc>` + logic class) |
| `src/chat/` | old Carta (chat) build sources, reference only. `src/screens/Carta.dc.html` was edited after the last assembly, so **edit Carta.dc.html directly; do not run `assemble.py`** (it would drop those edits) |
| `assets/opt/` + `assets/meta.json` | images/fonts by content id, packed into `packs/*.bin` at build |
| `assets/media/` | intro videos, BGM |
| `tools/build.py` | build: `python3 tools/build.py --channel test|prod` → `.build/out/` |
| `tools/tpl/` | shell (`index.html`, `shell.js`), service worker, install banner, `hl-core.js` |
| `tools/check.py` | static release gate |
| `tools/qa/smoke.js` | every screen loads with zero script errors (browser) |
| `tools/qa/sync-e2e.js` | login/sync/carrots/paid/delete/version guard against a mock with the SQL rules |
| `supabase/migrations/` | database schema, RLS, functions (apply in order) |
| `tools/config.json` | per-channel Supabase URL + publishable key + `authEnabled` |

## Local run
```
python3 tools/build.py --channel test
python3 tools/check.py --channel test
npm i --no-save playwright@1.56.0 && npx playwright install chromium
node tools/qa/smoke.js
HL_FORCE_AUTH=1 python3 tools/build.py --channel test && node tools/qa/sync-e2e.js
```

## Release rules (update safety)
1. **Versions.** Every build stamps one `APP_VERSION` into the shell and all screens. If the shell and a screen differ (stale cache),
   `hl-core.js` updates the service worker and reloads once; a second mismatch is reported to `client_errors`.
2. **Stored data.** `yoolmi-data-v` is the device data version (now 6). Never change the shape of a stored value without adding a
   step to `STEPS` in `tools/tpl/hl-core.js` and bumping `LATEST`. Steps convert, never delete. The old per-screen guard only wipes
   data older than 6.
3. **Server changes are additive.** New columns/functions only; to change a function signature add `name_v2` and keep the old one
   until no client calls it. Apply migrations to a dev project first.
4. **Test-only code** lives between `<!--TEST-ONLY-->` markers (remote reset `EP`, `?reset=1`) and is removed from prod builds.
   Never commit `window.__comp` (the gate fails).
5. **Rollback.** `git revert <bad commit>` on `dev` and push; CI republishes the previous good build.

## Server (Supabase project `ycjnjjcmnxwsgclllzch`)
- Clients use only the publishable key. The service-role key never goes in this repo, the app, or chat.
- Every table has RLS; clients can only `select` their own rows. All writes go through functions:
  `get_my_state`, `save_state`, `delete_my_account`, `log_client_error`; admin: `admin_set_enrollment`,
  `admin_adjust_carrots`, `admin_find_student` (require `profiles.role = 'admin'`, logged in `admin_log`).
- Carrots and paid status are server-decided: spending always accepted, earning capped by `app_config.carrot_daily_cap` (60/day,
  KST), first upload from an old device up to `carrot_import_cap` (500). Paid = an `active` row in `enrollments`.
- Make someone admin (SQL editor): `update profiles set role = 'admin' where id = '<uuid>';`

## Turning on real login
1. Supabase dashboard → Authentication → Providers → Google: add the Google Cloud OAuth client id/secret.
   (Facebook: same, after Meta app review.)
2. Authentication → URL configuration: add redirect URLs — `https://wncks8234-stack.github.io/Hangulandia/`,
   `https://wncks8234-stack.github.io/Hangulandia/delete-account.html`, and the production domain.
3. Set `"authEnabled": true` for the channel in `tools/config.json`, push to `dev`.
Until then the app keeps the old local-only login (no server calls).

## Account deletion (Google Play requirement)
- In app: Settings → Eliminar cuenta (calls `delete_my_account`, removes every row via cascade, clears the device).
- On the web: `/delete-account.html` (sign in, confirm). Put this URL in the Play Console data-safety form.
