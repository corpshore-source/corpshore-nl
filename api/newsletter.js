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

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { email } = req.body || {};
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Geldig e-mailadres is verplicht.' });
    }

    if (process.env.ZOHO_CLIENT_ID && process.env.ZOHO_REFRESH_TOKEN && process.env.ZOHO_CAMPAIGNS_LIST_KEY) {
      const accessToken   = await getZohoAccessToken();
      const contactInfo   = JSON.stringify({ 'Contact Email': email });
      const cpParams      = new URLSearchParams({
        resfmt:      'json',
        listkey:     process.env.ZOHO_CAMPAIGNS_LIST_KEY,
        contactinfo: contactInfo,
      });
      await fetch(`https://campaigns.zoho.com/api/v1.1/json/listsubscribe?${cpParams}`, {
        method:  'POST',
        headers: { Authorization: `Zoho-oauthtoken ${accessToken}` },
      }).catch(err => console.error('Campaigns error:', err));
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('newsletter handler:', err);
    return res.status(500).json({ error: 'Interne fout. Probeer het opnieuw.' });
  }
};
