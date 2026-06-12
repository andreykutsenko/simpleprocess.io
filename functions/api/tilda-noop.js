/**
 * Inert sink for legacy Tilda form posts.
 *
 * The page's Tilda script still submits to forms*.tildacdn.com over XHR.
 * That subscription is dead and its error response renders a "subscription
 * expired" box. The client redirects those posts here; this endpoint accepts
 * anything and reports success so no Tilda error is shown. Real delivery to
 * Telegram happens separately in /api/contact.
 */
export function onRequest() {
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
