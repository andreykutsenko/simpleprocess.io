# Task Spec: deploy-simpleprocess-io

## Metadata
- Task ID: deploy-simpleprocess-io
- Created: 2026-04-28T03:14:57+00:00
- Frozen: 2026-04-27
- Repo root: /home/kts/code/simpleprocess.io
- Working directory at init: /home/kts/code/simpleprocess.io

## Repo guidance sources
- `/home/kts/code/simpleprocess.io/CLAUDE.md` (project description + managed `repo-task-proof-loop` block)
- `/home/kts/code/simpleprocess.io/README.md` (deploy/runbook draft)
- `/home/kts/code/simpleprocess.io/.agent_seed_task.md` (original task statement)
- `/home/kts/code/simpleprocess.io/wrangler.toml`
- `/home/kts/code/simpleprocess.io/package.json`
- `/home/kts/code/simpleprocess.io/_headers`
- `/home/kts/code/simpleprocess.io/functions/api/contact.js`
- `/home/kts/code/simpleprocess.io/.claude/skills/repo-task-proof-loop/SKILL.md`
- `/home/kts/code/simpleprocess.io/.claude/skills/repo-task-proof-loop/references/COMMANDS.md`

## Original task statement

Quoted verbatim from `/home/kts/code/simpleprocess.io/.agent_seed_task.md`:

> # Task: Deploy simpleprocess.io to Cloudflare Pages with Zoho mailbox
>
> Deploy the static mirror of simpleprocess.io (already vendored in this repo) as a brand-new
> Cloudflare Pages project so that the production domain `simpleprocess.io` (and `www.simpleprocess.io`)
> serves it over HTTPS, the Telegram contact form keeps working, and a real mailbox at
> `sales@simpleprocess.io` exists on Zoho Mail Free (with MX/TXT/DKIM/SPF records configured in
> Cloudflare DNS for `simpleprocess.io`).
>
> ## Context already established
> - New repo: `/home/kts/code/simpleprocess.io/` (this directory).
> - Site contents copied from `/home/kts/code/kutsenko.dev/sites/simpleprocess/`.
> - Cloudflare account `57f2b31f16b4e1bd9988bd7e091b8a2a`.
> - Zone `simpleprocess.io` already added to Cloudflare (id `51ec2e0bedd968d20bdf62438e4bcc5e`),
>   status currently pending; nameservers `dean.ns.cloudflare.com`, `nancy.ns.cloudflare.com`.
> - User changed (or will change) NS at GoDaddy to those Cloudflare nameservers.
> - API token + ids are in `.env` (gitignored).
> - Existing mirror `simpleprocess.kutsenko.dev` (Pages project `simpleprocess-mirror` in the
>   kutsenko.dev repo) must remain untouched and working.
>
> ## Goals
> 1. New Cloudflare Pages project `simpleprocess-io` deployed from this repo.
> 2. Custom domains `simpleprocess.io` and `www.simpleprocess.io` attached, SSL active, HTTP→HTTPS.
> 3. DNS in the new Cloudflare zone configured: apex + www → Pages, plus Zoho MX/SPF/DKIM/CNAME for
>    verification, plus any records the Pages project needs.
> 4. Telegram contact form (`/api/contact`) works on production with secrets set in Pages env.
> 5. Zoho Mail Free signed up on this domain, mailbox `sales@simpleprocess.io` created and verified;
>    able to send and receive mail at that address.
> 6. README updated with full deploy & email runbook; `.env.example` updated with all needed vars.
> 7. Proof-loop evidence captures: Pages deploy URL, curl checks for HTML/assets/api, dig output for
>    A/AAAA/CNAME/MX/TXT, DKIM verification, a successful test email, and a screenshot of the
>    production page.

## Established context (resolved, do not re-question)
- The site files under `/home/kts/code/simpleprocess.io/` are a static mirror of simpleprocess.io. They were vendored from `/home/kts/code/kutsenko.dev/sites/simpleprocess/` and are not to be edited.
- Cloudflare account id: `57f2b31f16b4e1bd9988bd7e091b8a2a`.
- Zone `simpleprocess.io` already added in Cloudflare with id `51ec2e0bedd968d20bdf62438e4bcc5e`. Status currently `pending` until NS change at GoDaddy propagates. Assigned nameservers: `dean.ns.cloudflare.com`, `nancy.ns.cloudflare.com`.
- Domain registrar: GoDaddy. User changes NS manually.
- Production custom domains: `simpleprocess.io` (apex) and `www.simpleprocess.io`.
- Existing Pages project `simpleprocess-mirror` (in the kutsenko.dev account) serves `simpleprocess.kutsenko.dev` and must remain untouched and working — explicit non-regression target.
- Mailbox `sales@simpleprocess.io` will be hosted on **Zoho Mail Free**. DNS records (TXT verification, MX, DKIM CNAME/TXT, SPF TXT) live in the Cloudflare DNS zone for `simpleprocess.io`.
- Telegram contact form must continue to work in production via `functions/api/contact.js`. Required Pages production env vars: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`. Local form submission failing is by design.
- Cloudflare API token (in `.env`, gitignored) provides Pages:Edit, Zone:DNS:Edit, Zone:SSL:Edit. Cloudflare-side actions execute automatically via API or `wrangler`.
- Zoho-side actions (sign up, accept ownership, mailbox creation) are manual; the workflow guides the user step-by-step and then automates DNS records on Cloudflare.

## Acceptance criteria

Each AC must be independently verifiable by a fresh-session verifier with the exact commands listed in the verification plan.

### AC1: Pages project exists in the correct Cloudflare account
A Cloudflare Pages project named `simpleprocess-io` exists in account `57f2b31f16b4e1bd9988bd7e091b8a2a`.

**Check:** `GET https://api.cloudflare.com/client/v4/accounts/57f2b31f16b4e1bd9988bd7e091b8a2a/pages/projects/simpleprocess-io` returns HTTP 200 with `result.name == "simpleprocess-io"` and `success == true`.

### AC2: Successful production deployment exists and serves index.html
The Pages project has at least one deployment with `latest_stage.status == "success"` and `environment == "production"`. The deployment's `*.pages.dev` URL serves `index.html` at `/` with HTTP 200, `Content-Type: text/html; charset=utf-8`, and the body contains the marker substring `simpleprocess` (case-insensitive) plus a Tilda-recognizable token (e.g. `tildacdn` or `t-records`).

**Check:**
- `wrangler pages deployment list --project-name=simpleprocess-io` shows at least one production deployment.
- `curl -sSI https://simpleprocess-io.pages.dev/` returns `HTTP/2 200` and the html content-type.
- `curl -sS https://simpleprocess-io.pages.dev/ | grep -iE "tildacdn|t-records"` matches.

### AC3: Vendored Tilda assets are reachable from the production deployment
The deployment serves at least one asset from each of the three vendored CDN trees with HTTP 200 and a non-empty body:
- `static.tildacdn.one/`
- `thb.tildacdn.one/`
- `neo.tildacdn.com/`

**Check:** for each tree, identify a representative file path that exists in the repo (`find static.tildacdn.one -type f | head -1` etc.), then `curl -sSI https://simpleprocess-io.pages.dev/<path>` returns `HTTP/2 200` with `Content-Length > 0`. Save the three picked URLs and the `curl -I` outputs to `raw/`.

### AC4: Custom domain `simpleprocess.io` attached, active, HTTPS reachable
The Pages project lists `simpleprocess.io` in its custom domains with status `active` (or equivalent "verified + active") and the SSL certificate is issued. `https://simpleprocess.io/` returns HTTP 200 with `text/html` content-type and the same content marker as AC2.

**Check:**
- `GET https://api.cloudflare.com/client/v4/accounts/57f2b31f16b4e1bd9988bd7e091b8a2a/pages/projects/simpleprocess-io/domains/simpleprocess.io` returns HTTP 200, `result.status == "active"`, `result.certificate_authority` populated.
- `curl -sSI https://simpleprocess.io/` returns `HTTP/2 200` with html content-type.
- `curl -sSI http://simpleprocess.io/` returns 3xx with `Location:` to `https://simpleprocess.io/`.

### AC5: Custom domain `www.simpleprocess.io` attached, active, HTTPS reachable
Same as AC4 but for `www.simpleprocess.io`. May either redirect to the apex or serve the same content; both are acceptable.

**Check:**
- `GET .../domains/www.simpleprocess.io` returns `result.status == "active"`.
- `curl -sSI https://www.simpleprocess.io/` returns either `HTTP/2 200` with html, or `HTTP/2 30x` with `Location:` matching `https?://(www\.)?simpleprocess\.io/`.

### AC6: Cloudflare zone `simpleprocess.io` is active and NS propagated
Zone `51ec2e0bedd968d20bdf62438e4bcc5e` has `status == "active"`. Public DNS resolvers see `dean.ns.cloudflare.com` and `nancy.ns.cloudflare.com` as the NS records for `simpleprocess.io`.

**Check:**
- `GET https://api.cloudflare.com/client/v4/zones/51ec2e0bedd968d20bdf62438e4bcc5e` returns `result.status == "active"`.
- `dig +short NS simpleprocess.io @1.1.1.1` and `dig +short NS simpleprocess.io @8.8.8.8` both return exactly the two Cloudflare NS records (case-insensitive, trailing dot tolerated).

### AC7: Apex and www DNS records resolve to Pages
`simpleprocess.io` and `www.simpleprocess.io` resolve via Cloudflare to addresses owned by Cloudflare Pages (i.e. addresses Cloudflare returns for `simpleprocess-io.pages.dev`, served through Cloudflare's edge — typically proxied so the answers are Cloudflare-anycast IPs for the zone, not literal pages.dev IPs).

**Check:**
- `dig +short A simpleprocess.io @1.1.1.1` returns at least one A record; record exists in zone via `GET .../zones/<zone>/dns_records?name=simpleprocess.io` with `proxied == true` and `type` in `{A, AAAA, CNAME}`.
- `dig +short A www.simpleprocess.io @1.1.1.1` returns at least one A record; record exists in zone with `proxied == true`.
- `curl -sSI --resolve simpleprocess.io:443:<resolved-ip> https://simpleprocess.io/` returns 200, confirming the IP terminates on Cloudflare for this hostname.

### AC8: Zoho MX records configured in Cloudflare DNS
The Cloudflare zone has exactly the three Zoho MX records:
- `mx.zoho.com` priority `10`
- `mx2.zoho.com` priority `20`
- `mx3.zoho.com` priority `50`

(Priorities are the canonical Zoho values; if Zoho onboarding prescribes a different set during the run, those exact values must be used and recorded in evidence.)

**Check:**
- `dig +short MX simpleprocess.io @1.1.1.1` returns exactly three lines matching `^10 mx\.zoho\.com\.$`, `^20 mx2\.zoho\.com\.$`, `^50 mx3\.zoho\.com\.$`.
- `GET .../zones/<zone>/dns_records?type=MX&name=simpleprocess.io` returns three records with the same priorities and targets.

### AC9: Zoho SPF TXT record configured
A single SPF TXT record exists at the apex containing `v=spf1` and `include:zoho.com` and ending in `~all` or `-all`. Exactly one SPF record must exist (multiple SPF records break SPF).

**Check:**
- `dig +short TXT simpleprocess.io @1.1.1.1 | grep -c 'v=spf1'` returns `1`.
- The matching line contains `include:zoho.com` and ends in `~all` or `-all`.
- Recommended exact value: `"v=spf1 include:zoho.com ~all"` (the verbatim Zoho-published string; if the user has additional senders, document them but keep a single merged record).

### AC10: Zoho DKIM record published and verified
A DKIM record (CNAME or TXT, whichever Zoho prescribes for the chosen selector) exists at the Zoho-issued selector hostname `<selector>._domainkey.simpleprocess.io`. Zoho's admin console reports the DKIM status as `Verified` / `Active`.

**Check:**
- `dig +short TXT <selector>._domainkey.simpleprocess.io @1.1.1.1` (or `CNAME` if that's what Zoho instructs) returns the value Zoho provided.
- Screenshot of the Zoho admin DKIM page showing `Verified` saved to `raw/zoho-dkim-verified.png`.

### AC11: Zoho domain ownership verification TXT/CNAME present
The Zoho-issued ownership verification record (typically `zoho-verification=zb<token>` TXT at apex, or a CNAME at a Zoho-prescribed name) exists in the zone, and Zoho's admin reports the domain as `Verified`.

**Check:**
- `dig +short TXT simpleprocess.io @1.1.1.1 | grep -c 'zoho-verification='` returns `1`, OR the prescribed CNAME resolves to the Zoho-given target.
- Screenshot of Zoho admin domain page showing `Verified` saved to `raw/zoho-domain-verified.png`.

### AC12: DMARC record present (baseline policy)
A DMARC TXT record exists at `_dmarc.simpleprocess.io` with at least `v=DMARC1; p=none;` so SPF/DKIM alignment is reportable. (Zoho recommends DMARC; we use a baseline `none` policy that does not break delivery.)

**Check:**
- `dig +short TXT _dmarc.simpleprocess.io @1.1.1.1` returns a string starting with `v=DMARC1` and containing `p=none` (or stricter).

### AC13: Telegram contact form works in production end-to-end
`POST https://simpleprocess.io/api/contact` with a valid form payload (`name`, `email`, `details`) returns HTTP 200 with body `{"success":true}` and the message arrives in the configured Telegram chat within 30 seconds.

**Check:**
- `curl -sS -X POST https://simpleprocess.io/api/contact -H 'Content-Type: application/json' -d '{"name":"proof-loop","email":"verifier@example.com","details":"AC13 deploy-simpleprocess-io <timestamp>"}'` returns exit code 0, HTTP 200, body `{"success":true}`.
- Screenshot of the Telegram chat showing the test message with the `<timestamp>` saved to `raw/telegram-test-message.png`.

### AC14: Pages production env vars exist (names only, never values)
The Pages project's production environment lists both `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` as configured variables.

**Check:**
- `GET https://api.cloudflare.com/client/v4/accounts/57f2b31f16b4e1bd9988bd7e091b8a2a/pages/projects/simpleprocess-io` returns a `result.deployment_configs.production.env_vars` (or `.deployment_configs.production.deployment_variables`, whichever the API surfaces) object containing keys `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID`. Evidence stores only the key names, never values.

### AC15: Zoho mailbox `sales@simpleprocess.io` exists and is active
Zoho Mail Free account is registered for `simpleprocess.io`; mailbox `sales@simpleprocess.io` is created, verified, and able to log in via Zoho webmail.

**Check:**
- Screenshot of the Zoho admin "Users" / "Mail Accounts" page showing `sales@simpleprocess.io` with status `Active` saved to `raw/zoho-mailbox-active.png`.
- Screenshot of Zoho webmail (mail.zoho.com) signed in as `sales@simpleprocess.io` showing the inbox saved to `raw/zoho-webmail-inbox.png`.

### AC16: Inbound mail to `sales@simpleprocess.io` is delivered
A test email sent from a third-party address (e.g. the user's gmail or a temp-mail service) to `sales@simpleprocess.io` arrives in the Zoho inbox within 5 minutes.

**Check:**
- Send the test email; record sender, subject, and timestamp in `raw/inbound-test.txt`.
- Screenshot of the received message in the Zoho inbox saved to `raw/zoho-inbound-received.png`. Headers visible in the screenshot must show `Received-SPF: pass` (or neutral, depending on sender) and the message-id traced from the sender's outbox.

### AC17: Outbound mail from `sales@simpleprocess.io` is delivered with SPF/DKIM pass
Reply (or fresh send) from `sales@simpleprocess.io` to a third-party address arrives at the third-party inbox without spam classification, with SPF and DKIM both reporting `pass`.

**Check:**
- Send the email; capture full headers in the receiving mailbox.
- Save raw headers to `raw/outbound-headers.txt`. They must contain `spf=pass` (or `Received-SPF: Pass`) and `dkim=pass` (or `Authentication-Results: ... dkim=pass`) for the `simpleprocess.io` domain.
- Screenshot of the received message in the third-party inbox saved to `raw/outbound-test.png`.

### AC18: `simpleprocess.kutsenko.dev` mirror is non-regressed
The existing `simpleprocess-mirror` Pages project remains untouched, and `https://simpleprocess.kutsenko.dev/` continues to serve the same `index.html` content as before this task.

**Check:**
- Before any changes: `curl -sS https://simpleprocess.kutsenko.dev/ | sha256sum` (recorded as the baseline; if not captured before changes, fall back to `curl -sS https://simpleprocess.kutsenko.dev/ | wc -c` plus visual diff against the deployed kutsenko.dev mirror in the kutsenko.dev repo).
- At verify time: `curl -sSI https://simpleprocess.kutsenko.dev/` returns `HTTP/2 200` with html content-type, and `curl -sS https://simpleprocess.kutsenko.dev/ | sha256sum` matches the baseline.
- `wrangler pages deployment list --project-name=simpleprocess-mirror` shows the most recent deployment timestamp is older than the freeze time of this task.

### AC19: README documents the full deploy + email runbook
`/home/kts/code/simpleprocess.io/README.md` contains, in order, runbooks covering: local dev, Cloudflare Pages project creation, environment variables, custom domain attachment, DNS records (apex + www + Zoho MX/SPF/DKIM/verification + DMARC), Telegram bot setup, Zoho Mail Free onboarding (sign-up steps, ownership verification, mailbox creation, DKIM activation, MX cutover), and verification commands.

**Check:**
- `grep -ciE "cloudflare pages|zoho|telegram|dkim|spf|mx|dmarc|wrangler" README.md` returns at least 8 distinct hits.
- Manual review checklist in `evidence.md` confirms each subsection is present.

### AC20: `.env.example` lists every variable used
`/home/kts/code/simpleprocess.io/.env.example` exists, is committed, and lists at minimum: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_ZONE_ID`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`. No real secret values appear in the file.

**Check:**
- File exists and `git ls-files .env.example` returns the path.
- Each required key is present as `KEY=` (empty or placeholder value).
- `grep -E '^(CLOUDFLARE_API_TOKEN|CLOUDFLARE_ACCOUNT_ID|CLOUDFLARE_ZONE_ID|TELEGRAM_BOT_TOKEN|TELEGRAM_CHAT_ID)=' .env.example` returns 5 lines.
- No value in the file matches the live `.env` values (verifier compares only by key name and confirms placeholder format).

### AC21: Repo state is clean — no committed secrets, `.env` gitignored, GitHub remote canonical
- `.env` is listed in `.gitignore` and is not tracked.
- `git log --all --full-history -- .env` returns empty.
- `git grep -nE 'CLOUDFLARE_API_TOKEN=[A-Za-z0-9_-]{10,}|TELEGRAM_BOT_TOKEN=[0-9]+:[A-Za-z0-9_-]{20,}' -- .` returns no matches.
- `git remote get-url origin` returns the HTTPS or SSH URL for `andreykutsenko/simpleprocess.io` on GitHub.
- `git status` is clean (or only contains expected workflow artifacts under `.agent/tasks/`).

## Constraints
- **Do not edit** `index.html` content or any vendored Tilda asset under `static.tildacdn.one/`, `thb.tildacdn.one/`, `neo.tildacdn.com/`. The mirror is verbatim by design.
- **Do not touch** the kutsenko.dev mirror's Cloudflare resources (`simpleprocess-mirror` Pages project, the `simpleprocess` CNAME in zone `kutsenko.dev`).
- **Never commit secrets.** `.env` stays in `.gitignore`; only key names appear in `.env.example`. No real token values may appear in evidence files.
- **SPF must remain a single record.** If future senders are added, they must be merged into the same TXT, not added as a second SPF record. Use Zoho's verbatim SPF string `v=spf1 include:zoho.com ~all` as the baseline.
- **Pages production env vars are referenced by name only** in evidence. Never log, print, or commit `TELEGRAM_BOT_TOKEN` or `TELEGRAM_CHAT_ID` values.
- **Cloudflare API token scope** is limited to Pages:Edit, Zone:DNS:Edit, Zone:SSL:Edit. The verifier should not assume Account:Zone:Edit (zone creation/transfer) is available.
- **Idempotent operations.** All Cloudflare API and `wrangler` operations the builder runs must be safe to re-run (check-then-create or upsert semantics).
- **Smallest defensible diff.** No site redesign, no Tilda → custom rewrite, no contact-form refactor.

## Non-goals
- Redesigning the site or replacing the Tilda HTML with a custom build.
- Migrating the Telegram contact form to a different provider (e.g. SES, Mailgun).
- Retiring or rerouting `simpleprocess.kutsenko.dev` — it stays alongside production.
- Upgrading to Zoho paid plans or Google Workspace.
- Multi-region, staging, or preview-environment deployments. Production is the only target.
- Adding analytics, A/B tests, CMS, or any new functionality beyond what the mirror already has.
- Migrating the GitHub repo to a different owner or org.

## Verification plan

The fresh-session verifier executes the following commands, captures stdout/stderr to `raw/`, and judges each AC independently. All `<token>` placeholders are sourced from `.env` at verify time; values never enter evidence files.

### Cloudflare API base
```bash
TOKEN="$(grep ^CLOUDFLARE_API_TOKEN= .env | cut -d= -f2-)"
ACCOUNT="57f2b31f16b4e1bd9988bd7e091b8a2a"
ZONE="51ec2e0bedd968d20bdf62438e4bcc5e"
H="-H Authorization:\ Bearer\ ${TOKEN} -H Content-Type:\ application/json"
```

### Per-AC commands

| AC | Commands |
|----|----------|
| AC1 | `curl -sS $H https://api.cloudflare.com/client/v4/accounts/$ACCOUNT/pages/projects/simpleprocess-io \| jq '.success, .result.name'` |
| AC2 | `npx wrangler pages deployment list --project-name=simpleprocess-io`; `curl -sSI https://simpleprocess-io.pages.dev/`; `curl -sS https://simpleprocess-io.pages.dev/ \| grep -ciE "tildacdn\|t-records"` |
| AC3 | `find static.tildacdn.one -type f \| head -1`, `find thb.tildacdn.one -type f \| head -1`, `find neo.tildacdn.com -type f \| head -1`; `curl -sSI https://simpleprocess-io.pages.dev/<each>` |
| AC4 | `curl -sS $H https://api.cloudflare.com/client/v4/accounts/$ACCOUNT/pages/projects/simpleprocess-io/domains/simpleprocess.io \| jq '.result.status'`; `curl -sSI https://simpleprocess.io/`; `curl -sSI http://simpleprocess.io/` |
| AC5 | `curl -sS $H .../domains/www.simpleprocess.io \| jq '.result.status'`; `curl -sSI https://www.simpleprocess.io/` |
| AC6 | `curl -sS $H https://api.cloudflare.com/client/v4/zones/$ZONE \| jq '.result.status'`; `dig +short NS simpleprocess.io @1.1.1.1`; `dig +short NS simpleprocess.io @8.8.8.8` |
| AC7 | `dig +short A simpleprocess.io @1.1.1.1`; `dig +short A www.simpleprocess.io @1.1.1.1`; `curl -sS $H ".../zones/$ZONE/dns_records?name=simpleprocess.io" \| jq '.result[] \| {type,proxied}'` |
| AC8 | `dig +short MX simpleprocess.io @1.1.1.1`; `curl -sS $H ".../zones/$ZONE/dns_records?type=MX&name=simpleprocess.io" \| jq '.result[] \| {priority,content}'` |
| AC9 | `dig +short TXT simpleprocess.io @1.1.1.1 \| grep 'v=spf1'` (must be exactly one line) |
| AC10 | `dig +short TXT <selector>._domainkey.simpleprocess.io @1.1.1.1` (or CNAME equivalent); screenshot at `raw/zoho-dkim-verified.png` |
| AC11 | `dig +short TXT simpleprocess.io @1.1.1.1 \| grep zoho-verification`; screenshot at `raw/zoho-domain-verified.png` |
| AC12 | `dig +short TXT _dmarc.simpleprocess.io @1.1.1.1 \| grep '^"v=DMARC1'` |
| AC13 | `curl -sS -X POST https://simpleprocess.io/api/contact -H 'Content-Type: application/json' -d '{"name":"proof-loop","email":"verifier@example.com","details":"AC13 <ts>"}' -w '\nHTTP:%{http_code}\n'`; screenshot at `raw/telegram-test-message.png` |
| AC14 | `curl -sS $H .../pages/projects/simpleprocess-io \| jq '.result.deployment_configs.production.env_vars \| keys'` |
| AC15 | screenshots `raw/zoho-mailbox-active.png`, `raw/zoho-webmail-inbox.png` |
| AC16 | sender record in `raw/inbound-test.txt`; screenshot `raw/zoho-inbound-received.png` |
| AC17 | full headers saved to `raw/outbound-headers.txt`; screenshot `raw/outbound-test.png` |
| AC18 | `curl -sS https://simpleprocess.kutsenko.dev/ \| sha256sum`; `curl -sSI https://simpleprocess.kutsenko.dev/`; `npx wrangler pages deployment list --project-name=simpleprocess-mirror` |
| AC19 | `grep -ciE "cloudflare pages\|zoho\|telegram\|dkim\|spf\|mx\|dmarc\|wrangler" README.md` |
| AC20 | `test -f .env.example`; `grep -E '^(CLOUDFLARE_API_TOKEN\|CLOUDFLARE_ACCOUNT_ID\|CLOUDFLARE_ZONE_ID\|TELEGRAM_BOT_TOKEN\|TELEGRAM_CHAT_ID)=' .env.example \| wc -l` (expect `5`) |
| AC21 | `grep -E '^\.env$\|^\.env\b' .gitignore`; `git log --all --full-history -- .env`; `git remote get-url origin`; `git status --porcelain` |

### Expected status table at first verify pass

| AC | Likely status before async dependencies resolve |
|----|--------------------------------------------------|
| AC1, AC2, AC3 | `PASS` once builder deploys |
| AC4, AC5, AC7 | `UNKNOWN` until NS propagates (AC6) |
| AC6 | `UNKNOWN` until GoDaddy NS change propagates globally (can take minutes to 24h) |
| AC8–AC12, AC15–AC17 | `UNKNOWN` until user finishes Zoho onboarding |
| AC13, AC14 | `PASS` once builder sets env vars and the deploy is on a domain that resolves (so AC13 PASS depends on AC4) |
| AC18 | `PASS` if not regressed |
| AC19, AC20, AC21 | `PASS` once builder edits docs and `.env.example` |

## Assumptions (resolved narrowly)
- Cloudflare API token in `.env` has at least: `Account.Cloudflare Pages: Edit`, `Zone.DNS: Edit`, `Zone.SSL and Certificates: Edit`, scoped to account `57f2b31f...` and zone `simpleprocess.io`. It does **not** have `Account.Zone: Edit`; the zone was created via the dashboard.
- The user manages NS at GoDaddy. The builder/verifier may detect propagation but cannot force it.
- The user signs up for Zoho Mail Free manually, picks the DKIM selector, and supplies the verification token / selector / DKIM value back (e.g. by pasting into the chat or saving to a file the builder reads). The builder writes the resulting DNS records via the Cloudflare API.
- Telegram secrets (`TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`) are supplied by the user out of band and set as Pages production env vars via `wrangler pages secret put` or `wrangler pages project edit` / API. They must already be functional in the existing kutsenko.dev mirror, so values can be reused.
- The GitHub repo `andreykutsenko/simpleprocess.io` exists (or will be created by the user) and is the canonical `origin` remote.
- Production-only deployment is sufficient. No preview branch, no staging.
- Pages-Functions-based contact form continues to be the only server-side surface; no other Workers needed.
- Zoho's published baseline records (canonical at the time of freeze):
  - MX: `mx.zoho.com (10)`, `mx2.zoho.com (20)`, `mx3.zoho.com (50)`
  - SPF: `v=spf1 include:zoho.com ~all`
  - DKIM selector and value: provided by Zoho during onboarding, recorded in evidence verbatim
  - Domain verification: `zoho-verification=zb<token>` TXT at apex (or CNAME variant if Zoho prescribes that for the chosen plan)

  If Zoho's onboarding wizard prescribes different exact values during the live run, those exact values become the AC8–AC11 truth; the builder records the deviation and reason in `evidence.md`.
