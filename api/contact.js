'use strict';

/* Vercel auto-parses application/json request bodies via its built-in middleware;
   req.body is reliably populated for JSON POST requests on all Vercel serverless
   functions using the Node.js runtime (framework: null).  No manual body-parser
   is needed. */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* Shared Zoho token helper — refresh token -> access token */
async function getZohoAccessToken() {
  const params = new URLSearchParams({
    client_id:     process.env.ZOHO_CLIENT_ID,
    client_secret: process.env.ZOHO_CLIENT_SECRET,
    refresh_token: process.env.ZOHO_REFRESH_TOKEN,
    grant_type:    'refresh_token',
  });
  const res  = await fetch(`https://accounts.zoho.com/oauth/v2/token?${params}`, { method: 'POST' });
  const data = await res.json();
  if (data.error) throw new Error(`Zoho token error: ${data.error}`);
  return data.access_token;
}

/* Turnstile verification */
async function verifyTurnstile(token) {
  /* Dev bypass: when TURNSTILE_SECRET_KEY is absent (local dev / env not yet
     configured) we skip verification and allow all traffic through.  This is
     intentional — not a bug — so forms work without Cloudflare credentials in
     development.  TURNSTILE_SECRET_KEY must always be set on production. */
  if (!process.env.TURNSTILE_SECRET_KEY) return true;
  if (!token) return false;
  const res  = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret: process.env.TURNSTILE_SECRET_KEY, response: token }),
  });
  const data = await res.json();
  return data.success === true;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://corpshore.nl');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = req.body || {};

    /* ── Required field validation — return 400 before calling Zoho ── */
    const voornaam    = (body.voornaam    || '').trim();
    const achternaam  = (body.achternaam  || '').trim();
    const email       = (body.email       || '').trim();
    const functietitel = (body.functietitel || '').trim();
    const organisatie  = (body.organisatie  || '').trim();
    const land        = (body.land        || '').trim();
    const bericht     = (body.bericht     || '').trim();

    if (!voornaam)              return res.status(400).json({ error: 'Voornaam is verplicht.' });
    if (!achternaam)            return res.status(400).json({ error: 'Achternaam is verplicht.' });
    if (!email)                 return res.status(400).json({ error: 'E-mailadres is verplicht.' });
    if (!EMAIL_RE.test(email))  return res.status(400).json({ error: 'Geldig e-mailadres is verplicht.' });
    if (!functietitel)          return res.status(400).json({ error: 'Functietitel is verplicht.' });
    if (!organisatie)           return res.status(400).json({ error: 'Organisatienaam is verplicht.' });
    if (!land)                  return res.status(400).json({ error: 'Land is verplicht.' });
    if (!bericht)               return res.status(400).json({ error: 'Bericht is verplicht.' });

    /* ── Turnstile bot check ──────────────────────────────────────── */
    const ok = await verifyTurnstile(body['cf-turnstile-response']);
    if (!ok) return res.status(400).json({ error: 'Bot verification failed. Ververs de pagina en probeer opnieuw.' });

    /* Skip CRM if env vars not configured */
    if (process.env.ZOHO_CLIENT_ID && process.env.ZOHO_REFRESH_TOKEN) {
      const accessToken = await getZohoAccessToken();

      /* Create CRM Lead */
      const leadRes = await fetch('https://www.zohoapis.com/crm/v2/Leads', {
        method:  'POST',
        headers: {
          Authorization:  `Zoho-oauthtoken ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: [{
            Salutation:  body.aanhef          || '',
            First_Name:  voornaam,
            Last_Name:   achternaam,
            Title:       functietitel,
            Company:     organisatie,
            Industry:    body.organisatietype || '',
            Email:       email,
            Phone:       body.telefoonnummer  || '',
            Lead_Source: 'Website corpshore.nl',
            Description: [
              `Gewenste dienst: ${body.gewenste_dienst || '—'}`,
              `Land: ${land}`,
              '',
              bericht,
            ].join('\n'),
          }],
        }),
      });

      const leadData = await leadRes.json();
      /* Log Zoho CRM errors so ops can follow up */
      if (!leadRes.ok || leadData?.data?.[0]?.status === 'error') {
        console.error('contact.js: CRM Lead API error:', JSON.stringify(leadData));
      }

      /* Campaigns subscription if opted in.
         Failure is swallowed — newsletter opt-in must never block a contact submission. */
      if (body.newsletter === 'ja' && process.env.ZOHO_CAMPAIGNS_LIST_KEY) {
        const contactInfo = JSON.stringify({
          'Contact Email': email,
          'First Name':    voornaam,
          'Last Name':     achternaam,
        });
        const cpParams = new URLSearchParams({
          resfmt:      'json',
          listkey:     process.env.ZOHO_CAMPAIGNS_LIST_KEY,
          contactinfo: contactInfo,
        });
        await fetch(`https://campaigns.zoho.com/api/v1.1/json/listsubscribe?${cpParams}`, {
          method:  'POST',
          headers: { Authorization: `Zoho-oauthtoken ${accessToken}` },
        }).catch(err => console.error('Campaigns error:', err));
      }
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('contact handler:', err);
    return res.status(500).json({ error: 'Interne fout. Probeer het opnieuw.' });
  }
};
