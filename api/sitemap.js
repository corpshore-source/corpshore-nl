'use strict';

const DOMAIN = 'https://corpshore.nl';

const PAGES = [
  { loc: '/',            priority: '1.0', changefreq: 'weekly',  hreflang: true },
  { loc: '/diensten/',   priority: '0.9', changefreq: 'monthly', hreflang: false },
  { loc: '/sectoren/',   priority: '0.9', changefreq: 'monthly', hreflang: false },
  { loc: '/tarieven/',   priority: '0.9', changefreq: 'monthly', hreflang: false },
  { loc: '/over-ons/',   priority: '0.8', changefreq: 'monthly', hreflang: false },
  { loc: '/vacatures/',  priority: '0.8', changefreq: 'weekly',  hreflang: false },
  { loc: '/blog/',       priority: '0.8', changefreq: 'weekly',  hreflang: false },
  { loc: '/casestudies/',priority: '0.8', changefreq: 'monthly', hreflang: false },
  { loc: '/contact/',    priority: '0.8', changefreq: 'monthly', hreflang: false },
  { loc: '/offerte/',    priority: '0.7', changefreq: 'monthly', hreflang: false },
  { loc: '/en/',         priority: '0.7', changefreq: 'weekly',  hreflang: false },
  { loc: '/de/',         priority: '0.7', changefreq: 'monthly', hreflang: false },
  { loc: '/vlaanderen/', priority: '0.8', changefreq: 'monthly', hreflang: false },
  { loc: '/amsterdam/',  priority: '0.8', changefreq: 'monthly', hreflang: false },
  { loc: '/rotterdam/',  priority: '0.8', changefreq: 'monthly', hreflang: false },
  { loc: '/fr/',         priority: '0.7', changefreq: 'monthly', hreflang: false },
  { loc: '/frysk/',      priority: '0.4', changefreq: 'monthly', hreflang: false },
  { loc: '/privacybeleid/', priority: '0.3', changefreq: 'yearly', hreflang: false },
  { loc: '/voorwaarden/',   priority: '0.3', changefreq: 'yearly', hreflang: false },
];

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

module.exports = (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS);
    res.end();
    return;
  }

  const today = new Date().toISOString().slice(0, 10);

  const urls = PAGES.map(p => {
    const hreflangBlock = p.hreflang ? `
    <xhtml:link rel="alternate" hreflang="nl" href="${DOMAIN}/"/>
    <xhtml:link rel="alternate" hreflang="en" href="${DOMAIN}/en/"/>
    <xhtml:link rel="alternate" hreflang="fy" href="${DOMAIN}/frysk/"/>
    <xhtml:link rel="alternate" hreflang="de" href="${DOMAIN}/de/"/>` : '';
    return `  <url>
    <loc>${DOMAIN}${p.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>${hreflangBlock}
  </url>`;
  }).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>`;

  res.writeHead(200, {
    ...CORS,
    'Content-Type': 'application/xml; charset=utf-8',
    'Cache-Control': 'public, max-age=3600, s-maxage=86400',
  });
  res.end(xml);
};
