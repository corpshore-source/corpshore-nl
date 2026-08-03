'use strict';

/* Shared Zoho token helper — refresh token → access token */
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
  if (!process.env.TURNSTILE_SECRET_KEY) return true; // skip in dev
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
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = req.body || {};

    const ok = await verifyTurnstile(body['cf-turnstile-response']);
    if (!ok) return res.status(400).json({ error: 'Bot verification failed. Ververs de pagina en probeer opnieuw.' });

    /* Skip CRM if env vars not configured */
    if (process.env.ZOHO_CLIENT_ID && process.env.ZOHO_REFRESH_TOKEN) {
      const accessToken = await getZohoAccessToken();

      const firstName = body.voornaam || '';
      const lastName  = body.achternaam || firstName || 'Onbekend';

      /* Create CRM Lead */
      await fetch('https://www.zohoapis.com/crm/v2/Leads', {
        method:  'POST',
        headers: {
          Authorization:  `Zoho-oauthtoken ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: [{
            Salutation:  body.aanhef || '',
            First_Name:  firstName,
            Last_Name:   lastName,
            Title:       body.functietitel || '',
            Company:     body.organisatie  || '—',
            Industry:    body.organisatietype || '',
            Email:       body.email,
            Phone:       body.telefoonnummer || '',
            Lead_Source: 'Website corpshore.nl',
            Description: [
              `Gewenste dienst: ${body.gewenste_dienst || '—'}`,
              `Land: ${body.land || '—'}`,
              '',
              body.bericht || '',
            ].join('\n'),
          }],
        }),
      }).catch(err => console.error('CRM error:', err));

      /* Campaigns subscription if opted in */
      if (body.newsletter === 'ja' && process.env.ZOHO_CAMPAIGNS_LIST_KEY) {
        const contactInfo = JSON.stringify({
          'Contact Email': body.email,
          'First Name':    firstName,
          'Last Name':     lastName,
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
