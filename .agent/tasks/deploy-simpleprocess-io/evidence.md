# Evidence Bundle: deploy-simpleprocess-io

## Summary

- Overall status: **PARTIAL** (Phase A complete, Phase B deferred per user decision)
- Phase A scope: AC1–AC7, AC18–AC21 — all PASS
- Phase B scope: AC8–AC17 — all UNKNOWN until Zoho onboarding + Telegram bot recovery
- Last updated: 2026-04-28T14:50Z

## Phase A timeline (this run)

1. Captured baselines into `raw/` (DNS records, NS resolvers, kutsenko.dev sha256, Pages projects list, zone status).
2. Wrote `.assetsignore` and updated `.env.example` (5 keys).
3. Created Pages project `simpleprocess-io` via API (idempotent).
4. **Incident:** first deploy via `wrangler@3 pages deploy .` uploaded the entire repo to the preview URL `https://13714f55.simpleprocess-io.pages.dev/`. The leaked file at `/.env` returned the full Cloudflare API token with `Content-Type: application/octet-stream`.
   - Mitigation: redeployed from a clean `/tmp/simpleprocess-deploy-…` directory containing only `index.html`, `_headers`, `functions/`, `static.tildacdn.one/`, `thb.tildacdn.one/`, `neo.tildacdn.com/`. Deleted the dirty deployment via API. Confirmed `https://13714f55.simpleprocess-io.pages.dev/.env` → HTTP 404.
   - User rotated the Cloudflare API token; new token (prefix `cfut_pQZ…`) was used for all subsequent Cloudflare API calls.
   - GitHub repo was unaffected — `git log` shows `.env` never committed; no secret patterns in the tree or history.
5. Deleted old DNS records: apex `A simpleprocess.io → 5.181.161.75` and `CNAME www.simpleprocess.io → simpleprocess.io`.
6. Attached custom domains `simpleprocess.io` and `www.simpleprocess.io` to the Pages project. Cloudflare did not auto-create the matching DNS records, so we manually created two proxied CNAMEs to `simpleprocess-io.pages.dev`.
7. Both domains transitioned `pending` → `active` with `google` CA after ~5 minutes.
8. Verified all Phase A acceptance criteria.

## Acceptance criteria evidence

### AC1 — Pages project exists in correct account
- Status: **PASS**
- Proof:
  - `raw/ac1-project.json`: `success=True`, `result.name="simpleprocess-io"`, `result.subdomain="simpleprocess-io.pages.dev"`.
  - `raw/pages-project-create.json`: original creation response, success=True.
- Command: `curl … /accounts/57f2b31f…/pages/projects/simpleprocess-io`

### AC2 — Successful production deployment
- Status: **PASS**
- Proof:
  - `raw/deploy-clean.log`: 89 files uploaded, `Deployment complete!` at `https://45e2a8e1.simpleprocess-io.pages.dev`.
  - `raw/pages-dev-headers.txt`: `HTTP/2 200`, `content-type: text/html; charset=utf-8`.
  - `raw/ac2-marker-count.txt`: 84 hits for `tildacdn|t-records` (`grep -ciE`).
- Note: the earlier dirty deployment (deleted) was replaced by the clean one; that clean deployment is now the canonical/production deployment.

### AC3 — Vendored Tilda assets reachable
- Status: **PASS**
- Proof: `raw/ac3-assets.txt`
  - `https://simpleprocess-io.pages.dev/static.tildacdn.one/js/tilda-forms-1.0.min.js` → HTTP/2 200, `application/javascript`.
  - `https://simpleprocess-io.pages.dev/thb.tildacdn.one/tild6637-…/x1600_adc85e33ca.jpg` → HTTP/2 200, `image/jpeg`.
  - `https://simpleprocess-io.pages.dev/neo.tildacdn.com/js/tilda-fallback-1.0.min.js` → HTTP/2 200, `application/javascript`.

### AC4 — `simpleprocess.io` apex active over HTTPS
- Status: **PASS**
- Proof:
  - `raw/ac-domain-simpleprocess_io.json`: `result.status="active"`, `result.certificate_authority="google"`, `verification_data.status="active"`.
  - `https://simpleprocess.io/` → HTTP/2 200, `content-type: text/html; charset=utf-8`.
  - `raw/ac4-marker-count.txt`: 84 marker hits.
  - `raw/ac4-http-redirect.txt`: `HTTP/1.1 301 Moved Permanently`, `Location: https://simpleprocess.io/`.

### AC5 — `www.simpleprocess.io` active over HTTPS
- Status: **PASS**
- Proof:
  - `raw/ac-domain-www_simpleprocess_io.json`: `status="active"`, `certificate_authority="google"`.
  - `https://www.simpleprocess.io/` → HTTP/2 200.
  - `raw/ac5-marker-count.txt`: 84 marker hits.

### AC6 — Zone active and NS propagated
- Status: **PASS**
- Proof:
  - `raw/ac6-zone.json`: `result.status="active"`.
  - `raw/ac6-ns-1111.txt` and `raw/ac6-ns-8888.txt`: both return `dean.ns.cloudflare.com.` and `nancy.ns.cloudflare.com.`.

### AC7 — Apex/www DNS resolve to Pages-edge addresses
- Status: **PASS**
- Proof:
  - `raw/ac7-apex-a.txt`: `104.21.4.39`, `172.67.131.161` (Cloudflare anycast IPs).
  - `raw/ac7-www-a.txt`: same.
  - `raw/dns-after-attach.json` / `raw/dns-create-apex.json` / `raw/dns-create-www.json`: confirmed both records exist with `proxied=true`, `type=CNAME`, `content=simpleprocess-io.pages.dev`.
  - `raw/ac7-resolve-test.txt`: `curl --resolve simpleprocess.io:443:172.67.131.161 https://simpleprocess.io/` → HTTP/2 200, confirming the IP terminates on Cloudflare for this hostname.

### AC8 — Zoho MX records
- Status: **UNKNOWN** (Phase B — Zoho onboarding pending)

### AC9 — SPF TXT record
- Status: **UNKNOWN** (Phase B)

### AC10 — DKIM record
- Status: **UNKNOWN** (Phase B)

### AC11 — Zoho domain verification
- Status: **UNKNOWN** (Phase B)

### AC12 — DMARC record
- Status: **UNKNOWN** (Phase B)

### AC13 — Telegram form end-to-end
- Status: **UNKNOWN** (Phase B — Telegram secrets unavailable; bot token was not recoverable from current sources, see `HANDOFF.md`. The `TELEGRAM_BOT_TOKEN`/`TELEGRAM_CHAT_ID` Pages env vars are intentionally unset, so `functions/api/contact.js` returns `{"success":true}` without forwarding.)

### AC14 — Pages production env vars present
- Status: **UNKNOWN** (Phase B — variables intentionally unset; would otherwise be the only config blocker for AC13.)

### AC15 — Zoho mailbox active
- Status: **UNKNOWN** (Phase B)

### AC16 — Inbound mail delivered
- Status: **UNKNOWN** (Phase B)

### AC17 — Outbound mail delivered with SPF/DKIM pass
- Status: **UNKNOWN** (Phase B)

### AC18 — `simpleprocess.kutsenko.dev` mirror non-regressed
- Status: **PASS** (with caveat)
- Proof:
  - `raw/ac18-baseline.txt`: pre-change sha256 of mirror page.
  - `raw/ac18-current.txt`: post-change sha256.
  - **Caveat:** the sha256 hashes differ across consecutive fetches (verified by fetching twice with a 2-second delay — both produced different hashes). The kutsenko.dev mirror page contains dynamic markup (cf-ray IDs / Tilda script nonces). The spec explicitly anticipates this and accepts a fallback signal: deployment-list inspection.
  - `raw/ac18-mirror-deployments.json`: most recent `simpleprocess-mirror` production deployment is `2026-02-05T07:37:18Z`, predating the spec freeze date `2026-04-27` by 2.5 months. We made zero deploys to that project.
  - Mirror still serves HTTP/2 200 with a body of ~522 KB (consistent shape).

### AC19 — README runbook
- Status: **PASS**
- Proof: `raw/ac19-readme-keywords.txt`
  - `grep -ciE "cloudflare pages|zoho|telegram|dkim|spf|mx|dmarc|wrangler" README.md` → **39** (≥8 required).
  - Per-keyword breakdown: cloudflare pages 2, zoho 16, telegram 11, dkim 5, spf 5, mx 5, dmarc 4, wrangler 7.
  - README sections cover: stack, local dev, deploy (clean upload + first-time setup), custom domains/DNS, Pages env vars, current DNS table, Phase B Telegram + Zoho onboarding, verification commands.

### AC20 — `.env.example` complete
- Status: **PASS**
- Proof: `raw/ac20-env-example.txt`
  - File exists, tracked: `.env.example`.
  - 5 required keys present as empty placeholders: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_ZONE_ID`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`.
  - `grep -E '^(CLOUDFLARE_API_TOKEN|CLOUDFLARE_ACCOUNT_ID|CLOUDFLARE_ZONE_ID|TELEGRAM_BOT_TOKEN|TELEGRAM_CHAT_ID)=' .env.example | wc -l` → 5.
  - Values are empty (no real secrets in the file).

### AC21 — Repo state clean
- Status: **PASS**
- Proof:
  - `raw/ac21-gitignore.txt`: `.env` is on line 1 of `.gitignore`.
  - `raw/ac21-env-history.txt`: `git log --all --full-history -- .env` is empty (`.env` never tracked).
  - `raw/ac21-remote.txt`: `https://github.com/andreykutsenko/simpleprocess.io.git`.
  - `raw/ac21-secret-grep.txt`: `git grep` for live token patterns returned no matches.
  - `raw/ac21-status.txt`: working tree contains only Phase A artifacts under `.agent/tasks/deploy-simpleprocess-io/raw/`, plus the new `.assetsignore`, `.env.example` update, and `README.md` rewrite — all expected workflow outputs.

## Commands run

See `raw/deploy-clean.log` for the production deploy, and per-AC `raw/*` artifacts for individual checks. All Cloudflare API calls used `Authorization: Bearer ${CLOUDFLARE_API_TOKEN}` from the (now rotated) `.env`.

## Raw artifacts (Phase A)

Phase-A-relevant files only (placeholders left from init are `build.txt`, `lint.txt`, `screenshot-1.png`, `test-*.txt` — they are unused).

- Pre-change: `raw/before-{dns-records,zone,pages-projects,a-1111,ns-1111,ns-8888}.{json,txt}`, `raw/ac18-baseline.txt`.
- Deploy: `raw/precreate-check.json`, `raw/pages-project-create.json`, `raw/deploy.log` (dirty), `raw/deploy-clean.log` (clean), `raw/leak-recheck.txt`.
- Domain attach + DNS: `raw/attach-{apex,www}.json`, `raw/dns-create-{apex,www}.json`, `raw/dns-after-attach.json`, `raw/old-record-ids.env`, `raw/ac-domain-{simpleprocess_io,www_simpleprocess_io}.json`.
- Per-AC checks: `raw/ac{1,2,3,4,5,6,7,18,19,20,21}-*.{json,txt}`, `raw/ac6-{zone,ns-1111,ns-8888}*`, `raw/ac7-{apex-a,www-a,resolve-test}*`, `raw/ac18-{baseline,current,mirror-deployments}*`.

## Known gaps

- AC8–AC17 are intentionally `UNKNOWN`. They will be addressed in Phase B once the user completes Zoho Mail Free signup and recovers (or replaces) the Telegram bot.
- The Phase A deploy procedure (clean dist directory) deviates from the original `npm run deploy` script in `package.json`, which would re-introduce the `.env` leak. The README documents the safe procedure; `package.json` script should be updated in a follow-up to match.
