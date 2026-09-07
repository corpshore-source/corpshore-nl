'use strict';

/* Vercel auto-parses application/json request bodies via its built-in middleware;
   req.body is reliably populated for JSON POST requests on all Vercel serverless
   functions using the Node.js runtime (framework: null).  No manual body-parser
   is needed.  The Vercel infrastructure enforces a hard 4.5 MB body size limit
   that cannot be changed via config for non-Next.js deployments.  A single 3 MB
   file encoded as base64 (~4 MB) fits within this limit; multiple large files
   may not.  For larger payloads consider pre-signed direct-upload URLs. */

const EMAIL_RE        = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_FILE_BYTES  = 8 * 1024 * 1024; /* 8 MB per file (server-side guard) */
/* MIME types accepted for CV uploads — mirrors the HTML accept attribute */
const ALLOWED_CV_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

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
    const naam  = (body.naam  || '').trim();
    const email = (body.email || '').trim();
    if (!naam)                 return res.status(400).json({ error: 'Naam is verplicht.' });
    if (!email)                return res.status(400).json({ error: 'E-mailadres is verplicht.' });
    if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'Geldig e-mailadres is verplicht.' });

    /* ── Turnstile bot check ──────────────────────────────────────── */
    const ok = await verifyTurnstile(body['cf-turnstile-response']);
    if (!ok) return res.status(400).json({ error: 'Bot verification failed. Ververs de pagina en probeer opnieuw.' });

    if (process.env.ZOHO_CLIENT_ID && process.env.ZOHO_REFRESH_TOKEN) {
      const accessToken = await getZohoAccessToken();

      const parts     = naam.split(' ');
      const firstName = parts[0] || '';
      const lastName  = parts.slice(1).join(' ') || firstName;

      /* Create Recruit Candidate — capture ID for CV attachment */
      const recruitRes = await fetch('https://recruit.zoho.com/recruit/v2/Candidates', {
        method:  'POST',
        headers: {
          Authorization:  `Zoho-oauthtoken ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: [{
            First_Name:              firstName,
            Last_Name:               lastName,
            Email:                   email,
            Mobile:                  body.telefoon          || '',
            Current_Location:        body.woonland          || '',
            LinkedIn_Profile:        body.linkedin          || '',
            Current_Job_Description: body.gewenste_functie  || '',
            Cover_Letter:            body.motivatiebrief    || '',
            Source:                  'corpshore.nl/vacatures/',
          }],
        }),
      });

      const recruitData = await recruitRes.json();

      /* Log Zoho Recruit API errors so ops can follow up without blocking the user */
      if (!recruitRes.ok || recruitData?.data?.[0]?.status === 'error') {
        console.error('apply.js: Recruit API returned error:', JSON.stringify(recruitData));
      }

      const candidateId = recruitData?.data?.[0]?.details?.id;
      if (!candidateId) {
        /* Candidate was not created — log for ops follow-up but still return 200
           so the applicant is not blocked and can be contacted via email. */
        console.error('apply.js: candidateId is null — candidate not created. Zoho response:', JSON.stringify(recruitData));
      }

      /* Upload CV file to Recruit Candidate — server-side size + type guard */
      if (candidateId && Array.isArray(body.attachments) && body.attachments.length) {
        for (const att of body.attachments) {
          if (!att.name || !att.data) continue;
          try {
            const buffer = Buffer.from(att.data, 'base64');

            /* Skip files exceeding the server-side limit */
            if (buffer.byteLength > MAX_FILE_BYTES) {
              console.warn(`apply.js: skipping oversized attachment ${att.name} (${buffer.byteLength} bytes)`);
              continue;
            }

            /* Skip disallowed MIME types; allow through when type is absent
               (some browsers omit it) so we do not reject valid CVs silently */
            if (att.type && !ALLOWED_CV_TYPES.has(att.type)) {
              console.warn(`apply.js: skipping disallowed file type ${att.type} for ${att.name}`);
              continue;
            }

            const blob = new Blob([buffer], { type: att.type || 'application/octet-stream' });
            const fd   = new FormData();
            fd.append('file', blob, att.name);
            await fetch(`https://recruit.zoho.com/recruit/v2/Candidates/${candidateId}/Attachments`, {
              method:  'POST',
              headers: { Authorization: `Zoho-oauthtoken ${accessToken}` },
              body:    fd,
            }).catch(e => console.error('Recruit attachment error:', e));
          } catch (e) {
            console.error('CV file encoding error:', e);
          }
        }
      }

      /* Campaigns subscription if talent pool consent given.
         Failure is swallowed — newsletter opt-in must never block a job application. */
      if (body.talentenbestand === 'ja' && process.env.ZOHO_CAMPAIGNS_LIST_KEY) {
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
          headers: { Authorization: `Zoho-oauthtoken ${accessToken}` },
        }).catch(e => console.error('Campaigns error:', e));
      }
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('apply handler:', err);
    return res.status(500).json({ error: 'Interne fout. Probeer het opnieuw.' });
  }
};
