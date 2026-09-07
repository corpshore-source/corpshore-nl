'use strict';

/* Vercel auto-parses application/json request bodies via its built-in middleware;
   req.body is reliably populated for JSON POST requests on all Vercel serverless
   functions using the Node.js runtime (framework: null).  No manual body-parser
   is needed.  The Vercel infrastructure enforces a hard 4.5 MB body size limit
   that cannot be changed via config for non-Next.js deployments.  A single 3 MB
   file encoded as base64 (~4 MB) fits within this limit; multiple large files
   may not.  For larger payloads consider pre-signed direct-upload URLs. */

const EMAIL_RE       = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_FILE_BYTES = 8 * 1024 * 1024; /* 8 MB per file (server-side guard) */

/* MIME types accepted for proposal attachments — mirrors the HTML accept attribute:
   .pdf .doc .docx .ppt .pptx .xls .xlsx .csv .png .jpg .jpeg */
const ALLOWED_PROPOSAL_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'image/png',
  'image/jpeg',
]);

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
  /* Dev bypass: when TURNSTILE_SECRET_KEY is absent (local dev / env not yet
     configured) we skip verification and allow all traffic through.  This is
     intentional — not a bug — so forms work without Cloudflare credentials in
     development.  TURNSTILE_SECRET_KEY must always be set on production. */
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
  res.setHeader('Access-Control-Allow-Origin', 'https://corpshore.nl');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = req.body || {};

    /* ── Required field validation — return 400 before calling Zoho ── */
    const naam  = (body.naam  || '').trim();
    const email = (body.email || '').trim();
    if (!naam)                 return res.status(400).json({ error: 'Naam is verplicht.' });
    if (!email)                return res.status(400).json({ error: 'E-mailadres is verplicht.' });
    if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'Geldig e-mailadres is verplicht.' });

    /* ── Turnstile bot check ──────────────────────────────────────── */
    const ok = await verifyTurnstile(body['cf-turnstile-response']);
    if (!ok) return res.status(400).json({ error: 'Bot-verificatie mislukt. Ververs de pagina en probeer opnieuw.' });

    if (process.env.ZOHO_CLIENT_ID && process.env.ZOHO_REFRESH_TOKEN) {
      const token = await getZohoAccessToken();

      const parts     = naam.split(' ');
      const firstName = parts[0] || 'Anoniem';
      const lastName  = parts.slice(1).join(' ') || firstName;

      const attachCount = Array.isArray(body.attachments) ? body.attachments.length : 0;

      const description = [
        '=== OFFERTEAANVRAAG / PROPOSAL REQUEST ===',
        '',
        `Naam:          ${naam}`,
        `Bedrijf:       ${body.organisatie    || '—'}`,
        `Functietitel:  ${body.functietitel   || '—'}`,
        `E-mail:        ${email}`,
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
            Email:       email,
            Phone:       body.telefoon      || '',
            Title:       body.functietitel  || '',
            Company:     body.organisatie   || '—',
            Industry:    body.sector        || '',
            Lead_Source: 'Website Offerte (corpshore.nl)',
            Description: description,
          }],
        }),
      });

      const leadData = await leadRes.json();

      /* Log Zoho CRM errors so ops can follow up */
      if (!leadRes.ok || leadData?.data?.[0]?.status === 'error') {
        console.error('proposal.js: CRM Lead API error:', JSON.stringify(leadData));
      }

      const leadId = leadData?.data?.[0]?.details?.id;
      if (!leadId) {
        /* Lead was not created — log for ops follow-up but still return 200
           so the prospect is not blocked and can be contacted via email. */
        console.error('proposal.js: leadId is null — lead not created. Zoho response:', JSON.stringify(leadData));
      }

      /* Upload file attachments to the lead — server-side size + type guard */
      if (leadId && Array.isArray(body.attachments) && body.attachments.length) {
        for (const att of body.attachments) {
          if (!att.name || !att.data) continue;
          try {
            const buffer = Buffer.from(att.data, 'base64');

            /* Skip files exceeding the server-side limit */
            if (buffer.byteLength > MAX_FILE_BYTES) {
              console.warn(`proposal.js: skipping oversized attachment ${att.name} (${buffer.byteLength} bytes)`);
              continue;
            }

            /* Skip disallowed MIME types; allow through when type is absent
               (some browsers omit it) so we do not reject valid files silently */
            if (att.type && !ALLOWED_PROPOSAL_TYPES.has(att.type)) {
              console.warn(`proposal.js: skipping disallowed file type ${att.type} for ${att.name}`);
              continue;
            }

            const blob = new Blob([buffer], { type: att.type || 'application/octet-stream' });
            const fd   = new FormData();
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

      /* Newsletter opt-in.
         Failure is swallowed — newsletter opt-in must never block a proposal submission. */
      if (body.newsletter === 'ja' && process.env.ZOHO_CAMPAIGNS_LIST_KEY) {
        const contactInfo = JSON.stringify({
          'Contact Email': email,
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
