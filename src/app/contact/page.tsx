import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { PublicSiteShell } from '@/components/PublicSiteShell';

export const metadata: Metadata = {
  title: 'Contact Us | DAOZ360',
  description:
    'Contact DAOZ360 for product enquiries, technical support, privacy questions, and billing assistance.',
  alternates: {
    canonical: 'https://daoz360.ai/contact',
  },
};

export default function ContactPage() {
  return (
    <PublicSiteShell currentPage="contact">
      <div className="legal-page-wrapper">
        <div className="container">
          <header className="legal-header">
            <nav className="legal-breadcrumb" aria-label="Breadcrumb">
              <Link href="/" className="legal-breadcrumb-link">DAOZ360</Link>
              <span className="legal-breadcrumb-sep">/</span>
              <span className="legal-breadcrumb-current">Contact</span>
            </nav>

            <div className="legal-meta-pills">
              <span className="legal-badge-pill">
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                <span>Direct Inquiries</span>
              </span>
              <span className="legal-date-pill">Official Channel: mail@daoz360.ai</span>
            </div>

            <h1 className="legal-page-title">Let&apos;s talk about your social media workflow.</h1>
            <p className="legal-page-summary">
              Tell us about your team, the channels you manage and what you would like to simplify. For product enquiries, account support, privacy questions or billing queries, email mail@daoz360.ai.
            </p>

            <div className="legal-page-actions">
              <Link href="/" className="legal-back-btn" aria-label="Back to Homepage">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
                <span>Back to Home</span>
              </Link>

              <Link href="/privacy-policy" className="legal-alt-link">
                <span>Privacy Policy</span>
              </Link>

              <Link href="/terms-conditions" className="legal-alt-link">
                <span>Terms &amp; Conditions</span>
              </Link>
            </div>
          </header>

          <div className="contact-page-grid">
            <div className="contact-info-col">
              <div className="contact-channel-card">
                <div className="contact-channel-icon-wrap">
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                </div>
                <h2 className="contact-channel-title">Direct Email</h2>
                <p className="contact-channel-desc">
                  For product enquiries, account support, privacy questions or billing queries, send your requirements directly.
                </p>
                <a href="mailto:mail@daoz360.ai" className="contact-channel-action" aria-label="Send email to DAOZ360">
                  <span>mail@daoz360.ai</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 17 17 7"/><path d="M7 7h10v10"/></svg>
                </a>
              </div>

              <div className="contact-channel-card">
                <div className="contact-channel-icon-wrap">
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="2" x2="22" y1="12" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                </div>
                <h2 className="contact-channel-title">Official Domain</h2>
                <p className="contact-channel-desc">
                  Verified platform web address and authorized portal endpoints.
                </p>
                <a href="https://daoz360.ai/" target="_blank" rel="noopener noreferrer" className="contact-channel-action">
                  <span>daoz360.ai</span>
                </a>
              </div>

              <div className="contact-channel-card">
                <div className="contact-channel-icon-wrap">
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                </div>
                <h2 className="contact-channel-title">Registered Office</h2>
                <p className="contact-channel-desc">
                  60 Paya Lebar Road, #04-23, Paya Lebar Square, Singapore 409051
                </p>
                <span className="contact-channel-desc" style={{ color: '#71717A', display: 'block', margin: 0 }}>
                  Digital PRIZM PTE LTD / DAOZ360
                </span>
              </div>
            </div>

            <form id="contact-page-form" className="contact-form-card" method="POST" action="/contact/submit">
              <input type="hidden" id="contact-page-category-input" name="category" defaultValue="Product Enquiry" />

              <h2 className="contact-form-title">Draft Your Inquiry</h2>
              <p className="contact-form-desc">
                Select your topic and prepare a structured inquiry to send directly to our team with a verified reference number.
              </p>

              <div id="contact-page-status" className="form-status-banner" hidden role="status" style={{ marginBottom: 18 }}></div>

              <div className="contact-form-group">
                <label className="contact-form-label">Inquiry Category</label>
                <div className="contact-type-selector">
                  <button type="button" data-inquiry-type="product" className="contact-type-btn is-selected">
                    <span className="contact-type-label">Product Enquiry</span>
                    <span className="contact-type-desc">Questions on scheduling, publishing, and workflows</span>
                  </button>
                  <button type="button" data-inquiry-type="support" className="contact-type-btn">
                    <span className="contact-type-label">Account Support</span>
                    <span className="contact-type-desc">Assistance with account setup or platform features</span>
                  </button>
                  <button type="button" data-inquiry-type="privacy" className="contact-type-btn">
                    <span className="contact-type-label">Privacy &amp; Data</span>
                    <span className="contact-type-desc">Questions regarding data handling or compliance</span>
                  </button>
                  <button type="button" data-inquiry-type="billing" className="contact-type-btn">
                    <span className="contact-type-label">Billing Queries</span>
                    <span className="contact-type-desc">Inquiries about plans, invoicing, or subscriptions</span>
                  </button>
                </div>
              </div>

              <div className="contact-form-group">
                <label htmlFor="contact-page-name" className="contact-form-label">Your Name</label>
                <input
                  id="contact-page-name"
                  name="name"
                  type="text"
                  className="contact-input"
                  placeholder="e.g. Alex Morgan"
                  required
                />
              </div>

              <div className="contact-form-group">
                <label htmlFor="contact-page-email" className="contact-form-label">Work Email</label>
                <input
                  id="contact-page-email"
                  name="email"
                  type="email"
                  className="contact-input"
                  placeholder="alex@company.com"
                  required
                />
              </div>

              <div className="contact-form-group">
                <label htmlFor="contact-page-channels" className="contact-form-label">Social Channels Managed (Optional)</label>
                <input
                  id="contact-page-channels"
                  name="channels"
                  type="text"
                  className="contact-input"
                  placeholder="e.g. Instagram, LinkedIn, X"
                />
              </div>

              <div className="contact-form-group">
                <label htmlFor="contact-page-message" className="contact-form-label">Message Details</label>
                <textarea
                  id="contact-page-message"
                  name="message"
                  className="contact-textarea"
                  placeholder="Tell us about your team and what you would like to simplify..."
                  required
                ></textarea>
              </div>

              <div className="contact-form-actions">
                <button type="submit" className="btn-primary">
                  <span>Send Inquiry</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 17 17 7"/><path d="M7 7h10v10"/></svg>
                </button>

                <a
                  id="contact-page-mailto-btn"
                  href="mailto:mail@daoz360.ai"
                  className="btn-secondary"
                  style={{ textDecoration: 'none' }}
                >
                  <span>Open in Email Client</span>
                </a>

                <button
                  type="button"
                  id="contact-copy-draft-btn"
                  className="contact-copy-draft-btn"
                >
                  <span id="contact-copy-draft-label">Copy Draft to Clipboard</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </PublicSiteShell>
  );
}
