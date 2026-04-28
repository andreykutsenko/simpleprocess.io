# SimpleProcess.io — Cloudflare Pages deployment

Static mirror of the legacy Tilda site, deployed as a separate Cloudflare Pages project under the production domain `simpleprocess.io`.

## Stack
- Static HTML + Tilda-exported assets (`static.tildacdn.one/`, `thb.tildacdn.one/`, `neo.tildacdn.com/`).
- Cloudflare Pages Functions: `functions/api/contact.js` forwards form submissions to Telegram.
- Custom mailbox `sales@simpleprocess.io` is hosted on **Zoho Mail Free** (separate from Cloudflare Pages).

## Local
```bash
npm run dev          # serve on :8082
```
Pages Functions only run after deploy — local form posts will fail silently.

## Deploy
Requires `wrangler` and Cloudflare API access (env vars in `.env`, never commit).
```bash
npm run deploy
```

## Cloudflare resources
- Account: `57f2b31f16b4e1bd9988bd7e091b8a2a`
- Zone: `simpleprocess.io` (`51ec2e0bedd968d20bdf62438e4bcc5e`)
- Pages project: `simpleprocess-io`
- DNS hosted on Cloudflare (NS: `dean.ns.cloudflare.com`, `nancy.ns.cloudflare.com`)

## Required Pages env vars (Production)
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`

## Email
`sales@simpleprocess.io` → Zoho Mail Free. MX/TXT/DKIM records live in Cloudflare DNS.
