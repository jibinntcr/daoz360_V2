import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async redirects() {
    return [
      { source: '/home', destination: '/', permanent: true },
      { source: '/home/', destination: '/', permanent: true },
      { source: '/index.html', destination: '/', permanent: true },
      { source: '/privacy', destination: '/privacy-policy', permanent: true },
      { source: '/privacy/', destination: '/privacy-policy', permanent: true },
      { source: '/privacy-policy.html', destination: '/privacy-policy', permanent: true },
      { source: '/privacy-policy/index.html', destination: '/privacy-policy', permanent: true },
      { source: '/terms', destination: '/terms-conditions', permanent: true },
      { source: '/terms/', destination: '/terms-conditions', permanent: true },
      { source: '/terms-conditions.html', destination: '/terms-conditions', permanent: true },
      { source: '/terms-conditions/index.html', destination: '/terms-conditions', permanent: true },
      { source: '/pricing.html', destination: '/pricing', permanent: true },
      { source: '/pricing/index.html', destination: '/pricing', permanent: true },
      { source: '/contact.html', destination: '/contact', permanent: true },
      { source: '/contact/index.html', destination: '/contact', permanent: true },
      { source: '/social/login', destination: '/login', permanent: false },
      { source: '/social/register', destination: '/register', permanent: false },
    ];
  },
};

export default nextConfig;
