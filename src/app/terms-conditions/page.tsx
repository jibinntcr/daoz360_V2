import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { PublicSiteShell } from '@/components/PublicSiteShell';

export const metadata: Metadata = {
  title: 'Terms & Conditions | DAOZ360',
  description:
    'Review the official terms and conditions for using the DAOZ360 social media management platform.',
  alternates: {
    canonical: 'https://daoz360.ai/terms-conditions',
  },
};

export default function TermsConditionsPage() {
  return (
    <PublicSiteShell currentPage="terms-conditions">
      <div className="legal-page-wrapper">
        <div className="container">
          <header className="legal-header">
            <nav className="legal-breadcrumb" aria-label="Breadcrumb">
              <Link href="/" className="legal-breadcrumb-link">DAOZ360</Link>
              <span className="legal-breadcrumb-sep">/</span>
              <span>Legal</span>
              <span className="legal-breadcrumb-sep">/</span>
              <span className="legal-breadcrumb-current">Terms &amp; Conditions</span>
            </nav>

            <div className="legal-meta-pills">
              <span className="legal-badge-pill"><span>Platform Terms of Use</span></span>
              <span className="legal-date-pill">Effective: 26 October 2026</span>
            </div>

            <h1 className="legal-page-title">Terms &amp; Conditions</h1>
            <p className="legal-page-summary">
              These Terms &amp; Conditions establish the agreement between you and DAOZ360 governing use of the platform, accounts, content, and services.
            </p>

            <div className="legal-page-actions">
              <Link href="/" className="legal-back-btn"><span>Back to Home</span></Link>
              <Link href="/privacy-policy" className="legal-alt-link"><span>View Privacy Policy</span></Link>
              <Link href="/contact" className="legal-alt-link"><span>Contact Support</span></Link>
            </div>
          </header>

          <div className="legal-layout-grid">
            <aside className="legal-toc-sidebar" aria-label="Table of Contents">
              <div className="legal-toc-title"><span>Agreement Clauses</span></div>
              <ul className="legal-toc-list">
                <li><a href="#agreement" className="legal-toc-link is-active"><span className="legal-toc-num">1.</span><span>Agreement</span></a></li>
                <li><a href="#website-material-permission" className="legal-toc-link"><span className="legal-toc-num">2.</span><span>Website-material permission</span></a></li>
                <li><a href="#account-duties" className="legal-toc-link"><span className="legal-toc-num">3.</span><span>Account duties</span></a></li>
                <li><a href="#conduct" className="legal-toc-link"><span className="legal-toc-num">4.</span><span>Conduct</span></a></li>
                <li><a href="#charges" className="legal-toc-link"><span className="legal-toc-num">5.</span><span>Charges</span></a></li>
                <li><a href="#ownership" className="legal-toc-link"><span className="legal-toc-num">6.</span><span>Ownership</span></a></li>
                <li><a href="#access-removal" className="legal-toc-link"><span className="legal-toc-num">7.</span><span>Access removal</span></a></li>
                <li><a href="#liability" className="legal-toc-link"><span className="legal-toc-num">8.</span><span>Liability</span></a></li>
                <li><a href="#revisions" className="legal-toc-link"><span className="legal-toc-num">9.</span><span>Revisions</span></a></li>
                <li><a href="#questions" className="legal-toc-link"><span className="legal-toc-num">10.</span><span>Questions</span></a></li>
              </ul>
            </aside>

            <div className="legal-content-body">
              <section id="agreement" className="legal-section-card">
                <div className="legal-section-header"><span className="legal-section-num">1.</span><h2 className="legal-section-title">Agreement</h2></div>
                <p className="legal-section-paragraph">Using DAOZ360 means accepting these conditions. If you disagree, discontinue use.</p>
              </section>
              <section id="website-material-permission" className="legal-section-card">
                <div className="legal-section-header"><span className="legal-section-num">2.</span><h2 className="legal-section-title">Website-material permission</h2></div>
                <p className="legal-section-paragraph">Only temporary personal, non-commercial viewing is permitted. Copying, alteration, commercial/public presentation, reverse engineering, removal of ownership notices, redistribution and mirroring are restricted. Ownership does not transfer.</p>
              </section>
              <section id="account-duties" className="legal-section-card">
                <div className="legal-section-header"><span className="legal-section-num">3.</span><h2 className="legal-section-title">Account duties</h2></div>
                <p className="legal-section-paragraph">Protect login details and devices, keep registration details accurate, and remain responsible for account activity.</p>
              </section>
              <section id="conduct" className="legal-section-card">
                <div className="legal-section-header"><span className="legal-section-num">4.</span><h2 className="legal-section-title">Conduct</h2></div>
                <p className="legal-section-paragraph">Do not break laws, infringe rights, distribute harmful material, enter systems without permission, disrupt operations or send spam.</p>
              </section>
              <section id="charges" className="legal-section-card">
                <div className="legal-section-header"><span className="legal-section-num">5.</span><h2 className="legal-section-title">Charges</h2></div>
                <p className="legal-section-paragraph">Paid features require upfront fees and accurate billing details. Applicable recurring charges require authorisation. Cancellation follows the relevant policy.</p>
              </section>
              <section id="ownership" className="legal-section-card">
                <div className="legal-section-header"><span className="legal-section-num">6.</span><h2 className="legal-section-title">Ownership</h2></div>
                <p className="legal-section-paragraph">DAOZ360 and its licensors retain rights in original service materials and functionality.</p>
              </section>
              <section id="access-removal" className="legal-section-card">
                <div className="legal-section-header"><span className="legal-section-num">7.</span><h2 className="legal-section-title">Access removal</h2></div>
                <p className="legal-section-paragraph">Access may be suspended or ended immediately at the service&apos;s discretion, including for violations.</p>
              </section>
              <section id="liability" className="legal-section-card">
                <div className="legal-section-header"><span className="legal-section-num">8.</span><h2 className="legal-section-title">Liability</h2></div>
                <p className="legal-section-paragraph">DAOZ360 and associated parties exclude indirect, incidental, consequential, special and punitive losses, including lost profit, information, goodwill or use.</p>
              </section>
              <section id="revisions" className="legal-section-card">
                <div className="legal-section-header"><span className="legal-section-num">9.</span><h2 className="legal-section-title">Revisions</h2></div>
                <p className="legal-section-paragraph">Material changes receive at least thirty days&apos; advance notice.</p>
              </section>
              <section id="questions" className="legal-section-card">
                <div className="legal-section-header"><span className="legal-section-num">10.</span><h2 className="legal-section-title">Questions</h2></div>
                <p className="legal-section-paragraph">If you have questions regarding these terms, contact us at mail@daoz360.ai (60 Paya Lebar Road, #04-23, Paya Lebar Square, Singapore 409051).</p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </PublicSiteShell>
  );
}
