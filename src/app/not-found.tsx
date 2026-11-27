import React from 'react';
import Link from 'next/link';
import { PublicSiteShell } from '@/components/PublicSiteShell';

export default function NotFoundPage() {
  return (
    <PublicSiteShell currentPage="404">
      <section className="section" style={{ padding: '112px 0' }} aria-labelledby="error-404-heading">
        <div className="container" style={{ maxWidth: 640, textAlign: 'center' }}>
          <div className="section-eyebrow" style={{ margin: '0 auto 16px' }}>404 — Page Not Found</div>
          <h1 id="error-404-heading" className="section-title" style={{ marginBottom: 16 }}>
            We couldn’t find that page.
          </h1>
          <p className="section-subtitle" style={{ margin: '0 auto 32px' }}>
            The link you followed may be outdated or the page may have moved. Explore our social media management platform or reach out to our team directly.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'center' }}>
            <Link href="/" className="btn-primary" style={{ textDecoration: 'none' }}>
              <span>Return to Home</span>
            </Link>
            <Link href="/pricing" className="btn-secondary" style={{ textDecoration: 'none' }}>
              <span>View Pricing</span>
            </Link>
            <Link href="/contact" className="btn-secondary" style={{ textDecoration: 'none' }}>
              <span>Contact Us</span>
            </Link>
          </div>
        </div>
      </section>
    </PublicSiteShell>
  );
}
