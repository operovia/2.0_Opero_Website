import type { NextConfig } from 'next';

/** Hostnames from a comma-separated environment variable. */
const hosts = (value: string | undefined) =>
  (value ?? '')
    .split(',')
    .map((h) => h.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, ''))
    .filter(Boolean);

// The site's own public hostnames. Behind some proxies the forwarded host
// differs from the address in the browser, so these are allowed explicitly
// for Server Actions. Replit sets REPLIT_DOMAINS and REPLIT_DEV_DOMAIN; any
// other host can use SITE_URL and ALLOWED_ORIGINS.
const siteHosts = [
  ...hosts(process.env.SITE_URL),
  ...hosts(process.env.ALLOWED_ORIGINS),
  ...hosts(process.env.REPLIT_DOMAINS),
  ...hosts(process.env.REPLIT_DEV_DOMAIN),
];

const isProduction = process.env.NODE_ENV === 'production';

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()' },
  // Development previews (such as Replit's) show the site inside a frame, so framing is only blocked in production.
  ...(isProduction
    ? [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Strict-Transport-Security', value: 'max-age=31536000' },
      ]
    : []),
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  // The dev server only serves its assets to localhost unless other hosts are listed.
  allowedDevOrigins: [...new Set([...siteHosts.map((h) => h.split(':')[0]!), ...hosts(process.env.ALLOWED_DEV_ORIGINS)])],
  experimental: {
    serverActions: {
      allowedOrigins: [...new Set(siteHosts)],
    },
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    localPatterns: [{ pathname: '/media/**' }, { pathname: '/brand/**' }],
  },
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      // Surveys and the admin are never indexed.
      { source: '/s/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] },
      {
        source: '/admin/:path*',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
          { key: 'Cache-Control', value: 'no-store' },
        ],
      },
    ];
  },
};

export default nextConfig;
