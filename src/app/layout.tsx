import type { Metadata, Viewport } from 'next';
import React from 'react';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#FF5A00',
};

export const metadata: Metadata = {
  metadataBase: new URL('https://daoz360.ai'),
  title: 'DAOZ360 | Social Media Management',
  description:
    'Bring your social media workflow together with DAOZ360. Explore a clearer way to organise your content and manage your social presence.',
  keywords: [
    'social media management',
    'social media scheduler',
    'content calendar',
    'social analytics',
    'multi-platform publishing',
    'DAOZ360',
  ],
  authors: [{ name: 'DAOZ360 / Digital PRIZM PTE LTD' }],
  robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
  alternates: {
    canonical: 'https://daoz360.ai/',
  },
  applicationName: 'DAOZ360',
  appleWebApp: {
    capable: true,
    title: 'DAOZ360',
    statusBarStyle: 'black-translucent',
  },
  icons: {
    icon: [{ url: '/favicon.png', sizes: '32x32', type: 'image/png' }],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
  manifest: '/site.webmanifest',
  openGraph: {
    type: 'website',
    siteName: 'DAOZ360',
    url: 'https://daoz360.ai/',
    title: 'DAOZ360 | Social Media Management',
    description:
      'Bring your social media workflow together with DAOZ360. Explore a clearer way to organise your content and manage your social presence.',
    locale: 'en_US',
    images: [
      {
        url: 'https://daoz360.ai/assets/og-preview.png',
        secureUrl: 'https://daoz360.ai/assets/og-preview.png',
        type: 'image/png',
        width: 1200,
        height: 630,
        alt: 'DAOZ360 - Social Media Management',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DAOZ360 | Social Media Management',
    description:
      'Bring your social media workflow together with DAOZ360. Explore a clearer way to organise your content and manage your social presence.',
    images: ['https://daoz360.ai/assets/og-preview.png'],
  },
};

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://daoz360.ai/#organization',
      name: 'DAOZ360',
      url: 'https://daoz360.ai/',
      logo: {
        '@type': 'ImageObject',
        url: 'https://daoz360.ai/favicon.png',
      },
      email: 'mail@daoz360.ai',
      address: {
        '@type': 'PostalAddress',
        streetAddress: '60 Paya Lebar Road, #04-23, Paya Lebar Square',
        postalCode: '409051',
        addressCountry: 'SG',
      },
    },
    {
      '@type': 'WebSite',
      '@id': 'https://daoz360.ai/#website',
      url: 'https://daoz360.ai/',
      name: 'DAOZ360',
      description:
        'Bring your social media workflow together with DAOZ360. Explore a clearer way to organise your content and manage your social presence.',
      publisher: {
        '@id': 'https://daoz360.ai/#organization',
      },
    },
    {
      '@type': 'WebApplication',
      '@id': 'https://daoz360.ai/#webapp',
      name: 'DAOZ360',
      url: 'https://daoz360.ai/',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'All',
      description:
        'Social media management tool for planning, scheduling, team collaboration, and performance insights.',
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Manrope:wght@500;600;700;800&display=swap"
          rel="stylesheet"
        />
        {/* eslint-disable-next-line @next/next/no-css-tags */}
        <link rel="stylesheet" href="/css/style.css" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
