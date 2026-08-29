import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/'],
    },
    sitemap: 'https://konsepstifin.com/sitemap-index.xml',
    host: 'https://konsepstifin.com',
  };
}
