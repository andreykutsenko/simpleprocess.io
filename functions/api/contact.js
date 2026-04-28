/**
 * Contact Form Handler - sends to Telegram
 * Minimal implementation, always returns success
 */

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    // Parse form data
    const contentType = request.headers.get('content-type') || '';
    let data;

    if (contentType.includes('application/json')) {
      data = await request.json();
    } else {
      const formData = await request.formData();
      data = Object.fromEntries(formData);
    }

    const { name, email, details } = data;

    // Format plain text message
    const message = `New contact form submission\n\nName: ${name || '-'}\nEmail: ${email || '-'}\nDetails: ${details || '-'}`;

    // Send to Telegram (fire and forget)
    const botToken = env.TELEGRAM_BOT_TOKEN;
    const chatId = env.TELEGRAM_CHAT_ID;

    if (botToken && chatId) {
      fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: message }),
      }).catch(() => {});
    }

  } catch (e) {
    // Ignore errors
  }

  // Always return success
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
