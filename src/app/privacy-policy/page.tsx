import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { PublicSiteShell } from '@/components/PublicSiteShell';

export const metadata: Metadata = {
  title: 'Privacy Policy | DAOZ360',
  description:
    'Read the official DAOZ360 Privacy Policy. Understand our data practices, safeguards, and compliance with applicable data protection laws.',
  alternates: {
    canonical: 'https://daoz360.ai/privacy-policy',
  },
};

export default function PrivacyPolicyPage() {
  return (
    <PublicSiteShell currentPage="privacy-policy">
      <div className="legal-page-wrapper">
        <div className="container">
          <header className="legal-header">
            <nav className="legal-breadcrumb" aria-label="Breadcrumb">
              <Link href="/" className="legal-breadcrumb-link">DAOZ360</Link>
              <span className="legal-breadcrumb-sep">/</span>
              <span>Legal</span>
              <span className="legal-breadcrumb-sep">/</span>
              <span className="legal-breadcrumb-current">Privacy Policy</span>
            </nav>

            <div className="legal-meta-pills">
              <span className="legal-badge-pill">
                <span>Official Privacy Notice</span>
              </span>
              <span className="legal-date-pill">Effective: 26 October 2026</span>
            </div>

            <h1 className="legal-page-title">Privacy Policy</h1>
            <p className="legal-page-summary">
              This Privacy Policy outlines how DAOZ360 handles, processes, and protects details collected across our social media management platform.
            </p>

            <div className="legal-page-actions">
              <Link href="/" className="legal-back-btn">
                <span>Back to Home</span>
              </Link>
              <Link href="/terms-conditions" className="legal-alt-link">
                <span>View Terms &amp; Conditions</span>
              </Link>
              <Link href="/contact" className="legal-alt-link">
                <span>Contact Privacy Team</span>
              </Link>
            </div>
          </header>

          <div className="legal-layout-grid">
            <aside className="legal-toc-sidebar" aria-label="Table of Contents">
              <div className="legal-toc-title"><span>Policy Sections</span></div>
              <ul className="legal-toc-list">
                <li><a href="#data-handled" className="legal-toc-link is-active"><span className="legal-toc-num">1.</span><span>Data handled</span></a></li>
                <li><a href="#processing-purposes" className="legal-toc-link"><span className="legal-toc-num">2.</span><span>Processing purposes</span></a></li>
                <li><a href="#disclosure" className="legal-toc-link"><span className="legal-toc-num">3.</span><span>Disclosure</span></a></li>
                <li><a href="#protection" className="legal-toc-link"><span className="legal-toc-num">4.</span><span>Protection</span></a></li>
                <li><a href="#platform-administration" className="legal-toc-link"><span className="legal-toc-num">5.</span><span>Platform administration</span></a></li>
                <li><a href="#enquiries" className="legal-toc-link"><span className="legal-toc-num">6.</span><span>Enquiries &amp; Correspondence</span></a></li>
              </ul>
            </aside>

            <div className="legal-content-body">
              <section id="data-handled" className="legal-section-card">
                <div className="legal-section-header">
                  <span className="legal-section-num">1.</span>
                  <h2 className="legal-section-title">Data handled</h2>
                </div>
                <p className="legal-section-paragraph">
                  We collect details supplied through registration, platform use and support: contact identity, login/profile details, linked social accounts and posts, usage measurements, and messaging preferences.
                </p>
              </section>

              <section id="processing-purposes" className="legal-section-card">
                <div className="legal-section-header">
                  <span className="legal-section-num">2.</span>
                  <h2 className="legal-section-title">Processing purposes</h2>
                </div>
                <p className="legal-section-paragraph">
                  We use this data to operate and improve DAOZ360, administer transactions, deliver service notices, answer support enquiries, understand usage, and address misuse or fraud.
                </p>
              </section>

              <section id="disclosure" className="legal-section-card">
                <div className="legal-section-header">
                  <span className="legal-section-num">3.</span>
                  <h2 className="legal-section-title">Disclosure</h2>
                </div>
                <p className="legal-section-paragraph">
                  We do not sell or trade personal details. Transfers require your permission except for legal duties, protection of rights or safety, and business transactions described by this policy.
                </p>
              </section>

              <section id="protection" className="legal-section-card">
                <div className="legal-section-header">
                  <span className="legal-section-num">4.</span>
                  <h2 className="legal-section-title">Protection</h2>
                </div>
                <p className="legal-section-paragraph">
                  We apply safeguards against unauthorised handling, loss or alteration, including authenticated encryption at rest for tenant OAuth tokens. Internet transmission cannot be guaranteed completely secure.
                </p>
              </section>

              <section id="platform-administration" className="legal-section-card">
                <div className="legal-section-header">
                  <span className="legal-section-num">5.</span>
                  <h2 className="legal-section-title">Platform administration</h2>
                </div>
                <p className="legal-section-paragraph">
                  Platform administration and infrastructure operations are maintained under Digital PRIZM PTE LTD / DAOZ360. Connected social accounts can be disconnected at any time in Connections or via official provider data deletion callbacks.
                </p>
              </section>

              <section id="enquiries" className="legal-section-card">
                <div className="legal-section-header">
                  <span className="legal-section-num">6.</span>
                  <h2 className="legal-section-title">Enquiries &amp; Correspondence</h2>
                </div>
                <p className="legal-section-paragraph">
                  For privacy questions, access requests, or regulatory inquiries, contact us directly at mail@daoz360.ai (60 Paya Lebar Road, #04-23, Paya Lebar Square, Singapore 409051).
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </PublicSiteShell>
  );
}
