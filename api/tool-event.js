'use strict';

async function getZohoAccessToken() {
  const params = new URLSearchParams({
    client_id:     process.env.ZOHO_CLIENT_ID,
    client_secret: process.env.ZOHO_CLIENT_SECRET,
    refresh_token: process.env.ZOHO_REFRESH_TOKEN,
    grant_type:    'refresh_token',
  });
  const r = await fetch(`https://accounts.zoho.com/oauth/v2/token?${params}`, { method: 'POST' });
  const d = await r.json();
  if (d.error) throw new Error(`Zoho token: ${d.error}`);
  return d.access_token;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://corpshore.nl');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { tool, selections = {}, result = '', referrer = '' } = req.body || {};
    if (!tool) return res.status(400).json({ error: 'tool required' });

    const now = new Date().toISOString();
    const selLines = Object.entries(selections).map(([k, v]) => `  ${k}: ${v}`);
    const description = [
      `Tool: ${tool}`,
      `Pagina: ${referrer || 'onbekend'}`,
      `Tijdstip: ${now}`,
      '',
      'Selecties:',
      ...selLines,
      ...(result ? ['', `Resultaat: ${result}`] : []),
    ].join('\n');

    if (process.env.ZOHO_CLIENT_ID && process.env.ZOHO_REFRESH_TOKEN) {
      const token = await getZohoAccessToken();
      await fetch('https://www.zohoapis.com/crm/v2/Leads', {
        method:  'POST',
        headers: { Authorization: `Zoho-oauthtoken ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: [{
            First_Name:  'Anoniem',
            Last_Name:   'Websitebezoeker',
            Company:     'Onbekend (website tool)',
            Lead_Source: `Website Tool: ${tool}`,
            Description: description,
          }],
        }),
      }).catch(e => console.error('CRM tool-event:', e));
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('tool-event:', err);
    return res.status(500).json({ error: 'internal' });
  }
};
