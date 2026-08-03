'use strict';

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

async function verifyTurnstile(token) {
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
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = req.body || {};

    const ok = await verifyTurnstile(body['cf-turnstile-response']);
    if (!ok) return res.status(400).json({ error: 'Bot verification failed. Ververs de pagina en probeer opnieuw.' });

    if (process.env.ZOHO_CLIENT_ID && process.env.ZOHO_REFRESH_TOKEN) {
      const accessToken = await getZohoAccessToken();

      const fullName  = (body.naam || '').trim();
      const parts     = fullName.split(' ');
      const firstName = parts[0] || '';
      const lastName  = parts.slice(1).join(' ') || firstName;

      /* Create Recruit Candidate */
      await fetch('https://recruit.zoho.com/recruit/v2/Candidates', {
        method:  'POST',
        headers: {
          Authorization:  `Zoho-oauthtoken ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: [{
            First_Name:              firstName,
            Last_Name:               lastName,
            Email:                   body.email,
            Mobile:                  body.telefoon || '',
            Current_Location:        body.woonland || '',
            LinkedIn_Profile:        body.linkedin || '',
            Current_Job_Description: body.gewenste_functie || '',
            Cover_Letter:            body.motivatiebrief || '',
            Source:                  'corpshore.nl/vacatures/',
          }],
        }),
      }).catch(err => console.error('Recruit error:', err));

      /* Campaigns subscription if talent pool consent given */
      if (body.talentenbestand === 'ja' && process.env.ZOHO_CAMPAIGNS_LIST_KEY) {
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
    console.error('apply handler:', err);
    return res.status(500).json({ error: 'Interne fout. Probeer het opnieuw.' });
  }
};
