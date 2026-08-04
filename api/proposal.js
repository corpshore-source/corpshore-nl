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

async function verifyTurnstile(token) {
  if (!process.env.TURNSTILE_SECRET_KEY) return true;
  if (!token) return false;
  const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret: process.env.TURNSTILE_SECRET_KEY, response: token }),
  });
  const d = await r.json();
  return d.success === true;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = req.body || {};

    const ok = await verifyTurnstile(body['cf-turnstile-response']);
    if (!ok) return res.status(400).json({ error: 'Bot-verificatie mislukt. Ververs de pagina en probeer opnieuw.' });

    if (process.env.ZOHO_CLIENT_ID && process.env.ZOHO_REFRESH_TOKEN) {
      const token = await getZohoAccessToken();

      const fullName  = (body.naam || '').trim();
      const parts     = fullName.split(' ');
      const firstName = parts[0] || 'Anoniem';
      const lastName  = parts.slice(1).join(' ') || firstName;

      const attachCount = Array.isArray(body.attachments) ? body.attachments.length : 0;

      const description = [
        '=== OFFERTEAANVRAAG / PROPOSAL REQUEST ===',
        '',
        `Naam:          ${fullName}`,
        `Bedrijf:       ${body.organisatie    || '—'}`,
        `Functietitel:  ${body.functietitel   || '—'}`,
        `E-mail:        ${body.email          || '—'}`,
        `Telefoon:      ${body.telefoon       || '—'}`,
        `Land:          ${body.land           || '—'}`,
        '',
        `Dienst:        ${body.dienst         || '—'}`,
        `Sector:        ${body.sector         || '—'}`,
        `Teamgrootte:   ${body.teamgrootte    || '—'}`,
        `Startmoment:   ${body.startmoment    || '—'}`,
        `Budget:        ${body.budget         || '—'}`,
        `Via:           ${body.via            || '—'}`,
        '',
        'Omschrijving:',
        body.omschrijving || '—',
        '',
        `Bijlagen: ${attachCount} bestand(en) bijgevoegd`,
        `Tijdstip: ${new Date().toISOString()}`,
      ].join('\n');

      /* Create CRM Lead */
      const leadRes = await fetch('https://www.zohoapis.com/crm/v2/Leads', {
        method:  'POST',
        headers: {
          Authorization:  `Zoho-oauthtoken ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: [{
            First_Name:  firstName,
            Last_Name:   lastName,
            Email:       body.email      || '',
            Phone:       body.telefoon   || '',
            Title:       body.functietitel || '',
            Company:     body.organisatie || '—',
            Industry:    body.sector      || '',
            Lead_Source: 'Website Offerte (corpshore.nl)',
            Description: description,
          }],
        }),
      });

      const leadData = await leadRes.json();
      const leadId   = leadData?.data?.[0]?.details?.id;

      /* Upload file attachments to the lead */
      if (leadId && Array.isArray(body.attachments) && body.attachments.length) {
        for (const att of body.attachments) {
          if (!att.name || !att.data) continue;
          try {
            const buffer = Buffer.from(att.data, 'base64');
            const blob   = new Blob([buffer], { type: att.type || 'application/octet-stream' });
            const fd     = new FormData();
            fd.append('file', blob, att.name);
            await fetch(`https://www.zohoapis.com/crm/v2/Leads/${leadId}/Attachments`, {
              method:  'POST',
              headers: { Authorization: `Zoho-oauthtoken ${token}` },
              body:    fd,
            }).catch(e => console.error('Attachment error:', e));
          } catch (e) {
            console.error('File encoding error:', e);
          }
        }
      }

      /* Newsletter opt-in */
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
          headers: { Authorization: `Zoho-oauthtoken ${token}` },
        }).catch(e => console.error('Campaigns error:', e));
      }
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('proposal handler:', err);
    return res.status(500).json({ error: 'Interne fout. Probeer het opnieuw.' });
  }
};
