'use strict';

const DOMAIN = 'https://corpshore.nl';

const ALL_URLS = [
  `${DOMAIN}/`,
  `${DOMAIN}/diensten/`,
  `${DOMAIN}/sectoren/`,
  `${DOMAIN}/tarieven/`,
  `${DOMAIN}/over-ons/`,
  `${DOMAIN}/vacatures/`,
  `${DOMAIN}/blog/`,
  `${DOMAIN}/casestudies/`,
  `${DOMAIN}/contact/`,
  `${DOMAIN}/offerte/`,
  `${DOMAIN}/en/`,
  `${DOMAIN}/de/`,
  `${DOMAIN}/vlaanderen/`,
  `${DOMAIN}/amsterdam/`,
  `${DOMAIN}/rotterdam/`,
  `${DOMAIN}/fr/`,
  `${DOMAIN}/frysk/`,
  `${DOMAIN}/privacybeleid/`,
  `${DOMAIN}/voorwaarden/`,
];

const CORS = {
  'Access-Control-Allow-Origin': 'https://corpshore.nl',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS);
    res.end();
    return;
  }

  const key = process.env.INDEXNOW_KEY;
  if (!key) {
    res.writeHead(503, { ...CORS, 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'INDEXNOW_KEY env var not set' }));
    return;
  }

  const secret = req.headers['x-indexnow-secret'] || req.query?.secret;
  const expectedSecret = process.env.INDEXNOW_SECRET;
  if (expectedSecret && secret !== expectedSecret) {
    res.writeHead(401, { ...CORS, 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Unauthorized' }));
    return;
  }

  const payload = {
    host: 'corpshore.nl',
    key,
    keyLocation: `${DOMAIN}/${key}.txt`,
    urlList: ALL_URLS,
  };

  const endpoints = [
    'https://api.indexnow.org/indexnow',
    'https://www.bing.com/indexnow',
    'https://yandex.com/indexnow',
  ];

  const results = [];
  for (const endpoint of endpoints) {
    try {
      const r = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(8000),
      });
      results.push({ endpoint, status: r.status });
    } catch (e) {
      results.push({ endpoint, error: e.message });
    }
  }

  res.writeHead(200, { ...CORS, 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ submitted: ALL_URLS.length, results }));
};
