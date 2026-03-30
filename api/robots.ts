const ROBOTS = `User-agent: Googlebot
Allow: /
Crawl-delay: 1

User-agent: Bingbot
Allow: /
Crawl-delay: 2

User-agent: Twitterbot
Allow: /

User-agent: facebookexternalhit
Allow: /

User-agent: *
Allow: /
Disallow: /bosspage
Disallow: /bosspage-login

Sitemap: https://reelsanylizer.in/sitemap.xml
`;

export default async function handler(_req: any, res: any) {
  res.setHeader("Content-Type", "text/plain");
  res.setHeader("Cache-Control", "s-maxage=900, stale-while-revalidate");
  res.status(200).send(ROBOTS);
}
