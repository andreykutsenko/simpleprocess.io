# simpleprocess.io

Static mirror of simpleprocess.io deployed on Cloudflare Pages, with a contact-form
forwarder Pages Function and a Zoho Mail Free mailbox at `sales@simpleprocess.io`.

## Stack

- Vendored Tilda export (HTML + assets under `static.tildacdn.one/`, `thb.tildacdn.one/`, `neo.tildacdn.com/`).
- Cloudflare Pages project `simpleprocess-io` in account `57f2b31f16b4e1bd9988bd7e091b8a2a`.
- Pages Function `functions/api/contact.js` forwards POST submissions to Telegram (Phase B).
- Zoho Mail Free hosts `sales@simpleprocess.io` (Phase B). MX/SPF/DKIM/DMARC records live in
  Cloudflare DNS for the zone `simpleprocess.io` (`51ec2e0bedd968d20bdf62438e4bcc5e`).

## Local development

```bash
npm run dev          # serves repo root on http://localhost:8082
```

The Pages Function (`/api/contact`) only runs after deploy — local form submissions are
not handled and will fall through to the Tilda-shim that returns success without delivering.

## Deploy

### Prerequisites

- Node.js ≥18 (Node 20+ is preferred — wrangler 4 requires it; we use wrangler 3 for Node 18).
- `.env` with `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_ZONE_ID` (gitignored;
  never commit). Token scope: `Account.Pages:Edit`, `Zone.DNS:Edit`, `Zone.SSL:Edit`.

### Production deploy (clean upload)

`wrangler pages deploy <dir>` uploads the contents of `<dir>` verbatim — including hidden
files. **Do not deploy the repo root**, or `.env` will be exposed publicly. Deploy from a
clean directory containing only the static site assets:

```bash
set -a && source .env && set +a
DIST=$(mktemp -d)
cp index.html _headers "$DIST/"
cp -r functions static.tildacdn.one thb.tildacdn.one neo.tildacdn.com "$DIST/"
CLOUDFLARE_API_TOKEN="$CLOUDFLARE_API_TOKEN" \
CLOUDFLARE_ACCOUNT_ID="$CLOUDFLARE_ACCOUNT_ID" \
  npx wrangler@3 pages deploy "$DIST" \
    --project-name=simpleprocess-io --branch=main --commit-dirty=true
```

Wrangler 3 ignores `.assetsignore` and `.gitignore` for Pages, so isolation is enforced
by the deploy directory — not by ignore files.

### First-time project setup (idempotent)

```bash
# Check if the Pages project already exists
curl -sS -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/pages/projects/simpleprocess-io"

# Create it if 404
curl -sS -X POST -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/pages/projects" \
  --data '{"name":"simpleprocess-io","production_branch":"main"}'
```

### Custom domains and DNS

Two custom domains are attached to the Pages project: `simpleprocess.io` (apex) and
`www.simpleprocess.io`. Both are proxied through Cloudflare and resolved via two CNAMEs
to `simpleprocess-io.pages.dev` (apex uses CNAME flattening).

```bash
# Attach domain
curl -sS -X POST -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/pages/projects/simpleprocess-io/domains" \
  --data '{"name":"simpleprocess.io"}'

# Create the matching CNAME (Cloudflare does not auto-create when records already exist)
curl -sS -X POST -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/dns_records" \
  --data '{"type":"CNAME","name":"simpleprocess.io","content":"simpleprocess-io.pages.dev","proxied":true}'
```

### Required Pages production env vars

| Variable | Phase | Description |
|---|---|---|
| `TELEGRAM_BOT_TOKEN` | B | Token from @BotFather. Phase A leaves unset → contact form is inert. |
| `TELEGRAM_CHAT_ID` | B | Chat ID receiving form submissions. Phase A leaves unset. |

Set via the Cloudflare API or `npx wrangler@3 pages secret put TELEGRAM_BOT_TOKEN --project-name=simpleprocess-io`.

## DNS records (zone `simpleprocess.io`)

Production state after Phase A:

| Type | Name | Target | Proxied | Owner |
|---|---|---|---|---|
| CNAME | `simpleprocess.io` (apex) | `simpleprocess-io.pages.dev` | ✓ | Pages |
| CNAME | `www.simpleprocess.io` | `simpleprocess-io.pages.dev` | ✓ | Pages |
| CNAME | `_domainconnect.simpleprocess.io` | `_domainconnect.gd.domaincontrol.com` | ✓ | Legacy GoDaddy (kept) |
| CNAME | `pay.simpleprocess.io` | `paylinks.commerce.godaddy.com` | ✓ | GoDaddy Payments (kept) |

Phase B will add at the apex (or matching subdomains):

| Type | Name | Target | Notes |
|---|---|---|---|
| MX | apex | `mx.zoho.com` (10), `mx2.zoho.com` (20), `mx3.zoho.com` (50) | Inbound mail to `sales@…` |
| TXT | apex | `v=spf1 include:zoho.com ~all` | SPF — must remain a single record |
| TXT | `<selector>._domainkey` | Zoho-issued DKIM value | DKIM key for outbound signing |
| TXT | apex | `zoho-verification=zb<token>` | Domain ownership for Zoho |
| TXT | `_dmarc` | `v=DMARC1; p=none;` | DMARC baseline policy |

## Phase B: Telegram bot + Zoho Mail (TODO)

Phase B is intentionally deferred; it requires an out-of-band Telegram-bot token and a
manual Zoho Mail Free signup.

### Telegram bot restoration

1. Create or recover a Telegram bot via `@BotFather` (`/mybots` → existing bot `/token`,
   or `/newbot` for a fresh one). Save the token.
2. Send a manual `sendMessage` from the bot to your chat to capture the chat id:
   ```bash
   curl -s "https://api.telegram.org/bot<TOKEN>/getUpdates" | jq '.result[].message.chat.id' | head -1
   ```
3. Set both as Pages production env vars (one-time):
   ```bash
   echo "$TELEGRAM_BOT_TOKEN" | npx wrangler@3 pages secret put TELEGRAM_BOT_TOKEN --project-name=simpleprocess-io
   echo "$TELEGRAM_CHAT_ID"   | npx wrangler@3 pages secret put TELEGRAM_CHAT_ID   --project-name=simpleprocess-io
   ```
4. Trigger a redeploy so the function picks up the new env. End-to-end test:
   ```bash
   curl -sS -X POST https://simpleprocess.io/api/contact \
     -H 'Content-Type: application/json' \
     -d '{"name":"smoke","email":"verifier@example.com","details":"hello"}'
   ```
   Expect HTTP 200 + `{"success":true}` and a chat message.

### Zoho Mail Free onboarding

1. Sign up at https://www.zoho.com/mail (Free plan). Add domain `simpleprocess.io`.
2. Zoho prints a verification record (TXT or CNAME). Add it to Cloudflare DNS via the
   API (key step is to keep the SPF as a single merged TXT — never two SPF records).
3. After verification, Zoho prescribes the MX records; add the three Zoho MX entries
   listed above. Confirm with `dig +short MX simpleprocess.io @1.1.1.1`.
4. Activate DKIM. Zoho gives a selector + value. Publish as `<selector>._domainkey` TXT
   (or CNAME). Mark active in Zoho admin → DKIM should report Verified.
5. Add a baseline DMARC TXT at `_dmarc.simpleprocess.io`: `v=DMARC1; p=none;`.
6. Create the mailbox `sales@simpleprocess.io` in Zoho admin → Users.
7. Send a test email both directions and verify SPF/DKIM `pass` headers in the receiving
   mailbox.

## Verification commands

```bash
# Project + production deployment
curl -sS -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/pages/projects/simpleprocess-io" \
  | jq '.result.canonical_deployment.url'
curl -sSI https://simpleprocess.io/
curl -sSI http://simpleprocess.io/         # expect 301 → HTTPS
curl -sS https://simpleprocess.io/ | grep -ciE "tildacdn|t-records"

# DNS sanity
dig +short NS simpleprocess.io @1.1.1.1
dig +short A simpleprocess.io @1.1.1.1
dig +short A www.simpleprocess.io @1.1.1.1
dig +short MX simpleprocess.io @1.1.1.1     # Phase B
dig +short TXT simpleprocess.io @1.1.1.1    # Phase B (SPF, Zoho-verification)
dig +short TXT _dmarc.simpleprocess.io @1.1.1.1   # Phase B
```

## Repo task proof loop

The deploy is tracked under `.agent/tasks/deploy-simpleprocess-io/` per the
repo-task-proof-loop convention. See `CLAUDE.md` for the workflow.
