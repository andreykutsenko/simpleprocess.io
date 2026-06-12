/**
 * Contact Form Handler - sends to Telegram
 * Minimal implementation, always returns success
 */

const RATE_WINDOW_MS = 60_000;
const RATE_MAX_PER_WINDOW = 5;
const hitsByIp = new Map();

// Per-isolate throttle: not a global guarantee, but enough to stop
// a single source from flooding the Telegram chat
function isRateLimited(ip) {
  const now = Date.now();
  const entry = hitsByIp.get(ip);
  if (!entry || now - entry.windowStart >= RATE_WINDOW_MS) {
    if (hitsByIp.size > 1000) hitsByIp.clear();
    hitsByIp.set(ip, { windowStart: now, count: 1 });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_MAX_PER_WINDOW;
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const ip = request.headers.get('cf-connecting-ip') || 'unknown';
    if (isRateLimited(ip)) {
      // Silently drop: same success response, nothing sent to Telegram
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Parse form data
    const contentType = request.headers.get('content-type') || '';
    let data;

    if (contentType.includes('application/json')) {
      data = await request.json();
    } else {
      const formData = await request.formData();
      data = Object.fromEntries(formData);
    }

    const field = (value, maxLength) => String(value ?? '').slice(0, maxLength) || '-';
    const name = field(data.name, 200);
    const email = field(data.email, 200);
    const details = field(data.details, 3000);

    // Format plain text message (Telegram hard limit is 4096 chars)
    const message = `New contact form submission\n\nName: ${name}\nEmail: ${email}\nDetails: ${details}`;

    // Send to Telegram (fire and forget)
    const botToken = env.TELEGRAM_BOT_TOKEN;
    const chatId = env.TELEGRAM_CHAT_ID;

    if (botToken && chatId) {
      // waitUntil keeps the request alive after the response is returned;
      // a bare fire-and-forget fetch can be cancelled by the runtime
      context.waitUntil(
        fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text: message }),
        }).catch(() => {})
      );
    }

  } catch (e) {
    // Ignore errors
  }

  // Always return success
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
