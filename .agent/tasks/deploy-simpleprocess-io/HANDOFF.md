# Handoff — deploy-simpleprocess-io

> Written at end of the previous Claude Code session (started in `/home/kts/code/kutsenko.dev/`).
> The new session should start in `/home/kts/code/simpleprocess.io/` and read this file first, then `spec.md`.

## Current proof-loop phase

`spec freeze` — **DONE** (committed in `c2be9de`). Spec has 21 ACs.

**Next phase:** `build` (Phase A, see below) — blocked on user answers to the 5 questions in §"Open user decisions".

## What is already done

1. New repo `/home/kts/code/simpleprocess.io/` created from the kutsenko.dev mirror; pushed to `https://github.com/andreykutsenko/simpleprocess.io` (public, default branch `main`).
2. Cloudflare API token verified (active). Token + ids in `.env` (gitignored). `.env.example` not yet created (AC20).
3. Cloudflare zone `simpleprocess.io` is **active** (`activated_on 2026-04-28T03:19:12Z`). NS at GoDaddy already switched to `dean.ns.cloudflare.com` / `nancy.ns.cloudflare.com`.
4. proof-loop skill installed at `.claude/skills/repo-task-proof-loop/` (gitignored). Workflow agents installed at `.claude/agents/task-*.md`. CLAUDE.md has the managed proof-loop block.
5. Task initialized: `.agent/tasks/deploy-simpleprocess-io/` with `spec.md`, `evidence.md` (placeholder), `evidence.json` (placeholder), `verdict.json` (placeholder), `problems.md` (placeholder), and `raw/`.

## Resources (also in `.env`)

| Name | Value |
|---|---|
| Cloudflare account id | `57f2b31f16b4e1bd9988bd7e091b8a2a` |
| Cloudflare zone id (simpleprocess.io) | `51ec2e0bedd968d20bdf62438e4bcc5e` |
| Pages project name (planned) | `simpleprocess-io` |
| GitHub remote | `https://github.com/andreykutsenko/simpleprocess.io.git` |
| NS (active) | `dean.ns.cloudflare.com`, `nancy.ns.cloudflare.com` |

API token has scopes: `Account → Cloudflare Pages: Edit`, `Zone → DNS: Edit`, `Zone → SSL and Certificates: Edit`. **No** `Account → Zone: Edit` (zone was added via dashboard, not API).

## Existing DNS records auto-imported by Cloudflare from GoDaddy

```
A      simpleprocess.io                 -> 5.181.161.75                            proxied=true   (Tilda IP — replace)
CNAME  www.simpleprocess.io             -> simpleprocess.io                        proxied=true   (replace; should point to Pages)
CNAME  _domainconnect.simpleprocess.io  -> _domainconnect.gd.domaincontrol.com     proxied=true   (harmless GoDaddy service — keep unless user says otherwise)
CNAME  pay.simpleprocess.io             -> paylinks.commerce.godaddy.com           proxied=true   (likely unused — pending user confirmation to delete)
```

⚠️ Replacing the apex `A` record with a Pages target **will switch the live site from Tilda to our mirror**. User confirmation required before the builder runs.

## Open user decisions (block builder Phase A)

1. **`TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` values** — same ones already used by `simpleprocess-mirror` Pages project in the kutsenko.dev account. Either user pastes them (will be set via Cloudflare API and never logged), or user runs `npx wrangler pages secret put TELEGRAM_BOT_TOKEN --project-name=simpleprocess-io` and the same for `TELEGRAM_CHAT_ID` themselves after the first deploy.
2. **Cutover style** — switch apex DNS to Pages immediately after first successful deploy (one-step), or stage on a temporary subdomain like `new.simpleprocess.io` first and cut over apex only after manual review (two-step)?
3. **`pay.simpleprocess.io` CNAME** — delete or keep?
4. **`dig` install** — confirm running `sudo apt install dnsutils` is acceptable. Alternative is using Cloudflare/Google DNS-over-HTTPS via curl (no install needed but every dig in `spec.md` would need a wrapper).
5. **Zoho readiness** — user will be asked to sign up for Zoho Mail Free **after** Phase A is verified. Confirm willingness.

## Builder plan, in two phases

### Phase A — Pages + custom domain + Telegram + docs (autonomous, except for user inputs above)

1. Create Pages project `simpleprocess-io` via Cloudflare API in the target account.
2. Deploy current repo contents via `wrangler pages deploy . --project-name=simpleprocess-io --branch=main`.
3. Set production env vars `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` (from §1 of open decisions).
4. Add custom domains `simpleprocess.io` and `www.simpleprocess.io` to the Pages project via API.
5. Update DNS in zone `simpleprocess.io`:
   - delete the existing apex `A` (`5.181.161.75`) — replace with whatever Cloudflare prescribes for Pages custom domain (typically Pages auto-provisions a `CNAME` to `simpleprocess-io.pages.dev` flattened at apex, or A records to anycast — depends on what the API returns when adding the custom domain).
   - delete the existing `www` CNAME, replace with a CNAME to `simpleprocess-io.pages.dev` (proxied).
   - delete `pay` if user confirmed.
6. Re-deploy if needed (e.g., to ensure latest commit is the live one). Wait for SSL to provision.
7. Update README.md with full runbook covering: local dev, Cloudflare Pages create + deploy, env vars, custom domain, DNS records, Telegram bot, Zoho onboarding (placeholder section pending Phase B).
8. Create `.env.example` with the 5 required keys (placeholders only).
9. Pack evidence for Phase A (AC1–AC7, AC13, AC14, AC18–AC21).

### Phase B — Zoho mailbox + DNS records (user-blocking)

1. User signs up at https://www.zoho.com/mail/ (Free plan). Enters domain `simpleprocess.io`.
2. User pastes back to the session: domain-verification token (TXT or CNAME), DKIM selector + value, MX confirmation, any extra records Zoho prescribes.
3. Builder writes those records to the Cloudflare zone via API (also ensures SPF is a single merged TXT, adds DMARC `p=none`).
4. User completes Zoho domain verification, creates mailbox `sales@simpleprocess.io`.
5. User sends a test email from gmail to `sales@simpleprocess.io` and replies; both saved as evidence (screenshots + raw headers).
6. Pack evidence for Phase B (AC8–AC12, AC15–AC17).

## After both phases

`fresh verify` via `task-verifier` subagent. If anything not `PASS`, `task-fixer` makes the smallest fix, re-verify, until `PASS`.

## How to resume in the new session

1. Open Claude Code in `/home/kts/code/simpleprocess.io/`.
2. Read `CLAUDE.md` (auto-loaded), this file, then `.agent/tasks/deploy-simpleprocess-io/spec.md`.
3. Ask the user the 5 open decisions above (he may have already answered before this handoff was committed — check the chat).
4. Once answered, spawn `task-builder` for Phase A using the role prompt from `.claude/agents/task-builder.md`.

## Things to NOT redo

- Do **not** re-create the GitHub repo, the Cloudflare zone, or the proof-loop task folder.
- Do **not** touch the kutsenko.dev mirror's Cloudflare project (`simpleprocess-mirror`) or the `simpleprocess` CNAME in zone `kutsenko.dev`.
- Do **not** edit `index.html` content or any vendored Tilda asset.
