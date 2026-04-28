# SimpleProcess Mirror

Static mirror of simpleprocess.io for deployment on Cloudflare Pages.

## Local Development

```bash
# From repo root
cd sites/simpleprocess
npx serve . -p 8081

# Or with Python
python3 -m http.server 8081
```

Open http://localhost:8081

**Note:** Contact form requires Pages Functions, which only work after deployment. For local testing, form submissions will fail silently.

## Deployment to Cloudflare Pages

### 1. Create Pages Project

```bash
npx wrangler pages project create simpleprocess-mirror
```

Or via Cloudflare Dashboard:
- Pages → Create a project → Connect to Git
- Select this repository
- Build settings:
  - Framework preset: None
  - Build command: (leave empty)
  - Build output directory: `sites/simpleprocess`
  - Root directory: `/`

### 2. Configure Environment Variables

In Pages project settings, add:

| Variable | Description |
|----------|-------------|
| `TELEGRAM_BOT_TOKEN` | Telegram bot token from @BotFather |
| `TELEGRAM_CHAT_ID` | Chat/group ID to receive form submissions |

### 3. Configure Custom Domain

1. In Cloudflare DNS for `kutsenko.dev`, add:
   ```
   CNAME  simpleprocess  simpleprocess-mirror.pages.dev
   ```

2. In Pages project → Custom domains → Add:
   ```
   simpleprocess.kutsenko.dev
   ```

### 4. Deploy

```bash
npx wrangler pages deploy sites/simpleprocess --project-name=simpleprocess-mirror
```

Or push to main branch for automatic deployment.

## Structure

```
sites/simpleprocess/
├── index.html          # Main page (mirrored from Tilda)
├── _headers            # Cloudflare Pages headers config
├── .env.example        # Environment variables template
├── functions/
│   └── api/
│       └── contact.js  # Contact form handler (sends to Telegram)
├── static.tildacdn.one/  # CSS, JS, images from Tilda CDN
├── thb.tildacdn.one/     # Thumbnails
└── neo.tildacdn.com/     # Additional scripts
```

## Differences from Original

| Feature | Original (Tilda) | Mirror |
|---------|------------------|--------|
| Form backend | Tilda servers | Cloudflare Pages Functions → Telegram |
| Analytics | Tilda Stats | Removed (scripts point to local files) |
| CDN | tildacdn.one | Local assets |

## Contact Form

Form submissions are sent to `/api/contact` which forwards to Telegram.

Fields:
- `name` (required)
- `email` (required)
- `details` (required)

Response: Always `{ "success": true }`
