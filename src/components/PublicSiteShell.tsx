import React from 'react';
import Link from 'next/link';
import Script from 'next/script';

export function PublicSiteShell({
  children,
  currentPage,
}: {
  children: React.ReactNode;
  currentPage: 'home' | 'pricing' | 'contact' | 'privacy-policy' | 'terms-conditions' | '404';
}) {
  const isLegalPage = currentPage !== 'home';
  const currentYear = new Date().getFullYear();

  return (
    <>
      <canvas id="daoz-particles-canvas" className="daoz-particles-canvas" aria-hidden="true"></canvas>
      <div className="site-wrapper">
        <header className="site-header">
          <div className="container header-container">
            <Link href="/" className="brand-logo-link" aria-label="DAOZ360 Home">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/assets/logo-daoz360-transparent.png"
                alt="DAOZ360"
                className="brand-logo-img"
                width={170}
                height={34}
              />
            </Link>

            <nav className="desktop-nav" aria-label="Main Navigation">
              <ul className="nav-list">
                {isLegalPage && (
                  <li>
                    <Link href="/" className="nav-link">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
                      <span>Home</span>
                    </Link>
                  </li>
                )}
                <li><Link href="/#product" className="nav-link">Product</Link></li>
                <li><Link href="/#how-it-works" className="nav-link">How It Works</Link></li>
                <li><Link href="/#solutions" className="nav-link">Solutions</Link></li>
                <li>
                  <Link
                    href="/pricing"
                    className={`nav-link ${currentPage === 'pricing' ? 'is-active' : ''}`}
                  >
                    Pricing
                  </Link>
                </li>
                <li><Link href="/#faqs" className="nav-link">FAQs</Link></li>
                <li>
                  <Link
                    href="/contact"
                    className={`nav-link ${currentPage === 'contact' ? 'is-active' : ''}`}
                  >
                    Contact
                  </Link>
                </li>
              </ul>
            </nav>

            <div className="header-actions">
              <Link
                href="/login"
                className="header-signin-link"
                aria-label="Sign In to DAOZ360"
              >
                <span>Sign In</span>
              </Link>

              <Link
                href="/register"
                className="btn-secondary"
                style={{ padding: '10px 16px', fontSize: '14px', textDecoration: 'none' }}
                aria-label="Get Started with DAOZ360"
              >
                <span>Get Started</span>
              </Link>

              <button type="button" className="btn-primary header-cta" data-open-contact aria-label="Talk to Us">
                <span>Talk to Us</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 17 17 7"/><path d="M7 7h10v10"/></svg>
              </button>

              <button
                type="button"
                id="mobile-menu-toggle"
                className="mobile-toggle-btn"
                aria-label="Open Menu"
                aria-expanded="false"
              >
                <svg id="mobile-toggle-icon-menu" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
                <svg id="mobile-toggle-icon-close" style={{ display: 'none' }} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
          </div>

          <div id="mobile-drawer-backdrop" className="mobile-drawer-backdrop" hidden aria-hidden="true"></div>
          <div id="mobile-drawer" className="mobile-drawer" hidden role="dialog" aria-modal="true" aria-label="Navigation Menu">
            <nav className="mobile-nav">
              <ul className="mobile-nav-list">
                <li>
                  <Link href="/" className={`mobile-nav-link ${!isLegalPage ? 'is-active' : ''}`}>Home</Link>
                </li>
                <li><Link href="/#product" className="mobile-nav-link">Product</Link></li>
                <li><Link href="/#how-it-works" className="mobile-nav-link">How It Works</Link></li>
                <li><Link href="/#solutions" className="mobile-nav-link">Solutions</Link></li>
                <li>
                  <Link href="/pricing" className={`mobile-nav-link ${currentPage === 'pricing' ? 'is-active' : ''}`}>Pricing</Link>
                </li>
                <li><Link href="/#faqs" className="mobile-nav-link">FAQs</Link></li>
                <li>
                  <Link href="/contact" className={`mobile-nav-link ${currentPage === 'contact' ? 'is-active' : ''}`}>Contact</Link>
                </li>

                <li className="mobile-drawer-divider">
                  <span className="mobile-drawer-section-label">Legal &amp; Access</span>
                </li>
                <li>
                  <Link href="/privacy-policy" className={`mobile-nav-link ${currentPage === 'privacy-policy' ? 'is-active' : ''}`}>Privacy Policy</Link>
                </li>
                <li>
                  <Link href="/terms-conditions" className={`mobile-nav-link ${currentPage === 'terms-conditions' ? 'is-active' : ''}`}>Terms &amp; Conditions</Link>
                </li>
                <li>
                  <Link
                    href="/login"
                    className="mobile-nav-link"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                  >
                    <span>Sign In</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6 }}><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/register"
                    className="mobile-nav-link"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                  >
                    <span>Get Started</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6 }}><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                  </Link>
                </li>
              </ul>

              <div className="mobile-drawer-cta">
                <button type="button" className="btn-primary w-full" data-open-contact>
                  <span>Talk to Us</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 17 17 7"/><path d="M7 7h10v10"/></svg>
                </button>
                <div className="mobile-email-support">
                  Direct inquiry: <a href="mailto:mail@daoz360.ai">mail@daoz360.ai</a>
                </div>
              </div>
            </nav>
          </div>
        </header>

        <main id="main-content">{children}</main>

        <footer className="site-footer">
          <div className="container">
            <div className="footer-top-row">
              <div className="footer-brand-col">
                <Link href="/" className="footer-logo-link" aria-label="DAOZ360 Home">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/assets/logo-daoz360-transparent.png"
                    alt="DAOZ360"
                    className="footer-logo-img"
                    width={160}
                    height={32}
                  />
                </Link>
                <p className="footer-tagline-text">Plan. Publish. Grow.</p>
                <p className="footer-desc-text">Your social media, managed in one place.</p>
                <div className="footer-address-note">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="footer-contact-icon" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                  <span>Singapore: 60 Paya Lebar Road, #04-23, Singapore 409051</span>
                </div>
              </div>

              <div className="footer-nav-col">
                <span className="footer-col-title">Platform</span>
                <ul className="footer-links-list">
                  <li><Link href="/" className="footer-link">Home</Link></li>
                  <li><Link href="/#product" className="footer-link">Product</Link></li>
                  <li><Link href="/#how-it-works" className="footer-link">How It Works</Link></li>
                  <li><Link href="/#solutions" className="footer-link">Solutions</Link></li>
                  <li><Link href="/pricing" className="footer-link">Pricing</Link></li>
                  <li><Link href="/#faqs" className="footer-link">FAQs</Link></li>
                  <li><Link href="/contact" className="footer-link">Contact</Link></li>
                </ul>
              </div>

              <div className="footer-nav-col">
                <span className="footer-col-title">Legal &amp; Access</span>
                <ul className="footer-links-list">
                  <li><Link href="/privacy-policy" className="footer-link">Privacy Policy</Link></li>
                  <li><Link href="/terms-conditions" className="footer-link">Terms &amp; Conditions</Link></li>
                  <li><Link href="/contact" className="footer-link">Contact</Link></li>
                  <li>
                    <Link href="/login" className="footer-link">
                      <span>Sign In</span>
                    </Link>
                  </li>
                  <li>
                    <Link href="/register" className="footer-link">
                      <span>Get Started</span>
                    </Link>
                  </li>
                  <li>
                    <Link href="/dashboard" className="footer-link">
                      <span>Customer Dashboard</span>
                    </Link>
                  </li>
                  <li>
                    <Link href="/admin" className="footer-link">
                      <span>Admin Console</span>
                    </Link>
                  </li>
                </ul>
              </div>

              <div className="footer-contact-col">
                <span className="footer-col-title">Direct Inquiries</span>
                <div className="footer-contact-item">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="footer-contact-icon" aria-hidden="true"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                  <a href="mailto:mail@daoz360.ai" className="footer-link">mail@daoz360.ai</a>
                </div>
                <div className="footer-contact-item">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="footer-contact-icon" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="2" x2="22" y1="12" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                  <a href="https://daoz360.ai/" target="_blank" rel="noopener noreferrer" className="footer-link">https://daoz360.ai/</a>
                </div>
                <a
                  href="mailto:mail@daoz360.ai"
                  className="footer-contact-btn"
                  style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  Email DAOZ360
                </a>
              </div>
            </div>

            <div className="footer-bottom-row">
              <div className="footer-copy">&copy; {currentYear} DAOZ360. All rights reserved.</div>
              <div className="footer-meta-status">
                <span className="footer-status-dot"></span>
                <span>Social Media Management &bull; DAOZ360</span>
              </div>
              <button type="button" id="footer-back-top-btn" className="footer-back-top-btn" aria-label="Back to top">
                <span>Back to top</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m18 15-6-6-6 6"/></svg>
              </button>
            </div>
          </div>
        </footer>

        {/* Chat Widget */}
        <button
          type="button"
          id="daoz-chat-launcher"
          className="daoz-chat-launcher"
          aria-label="Chat with DAOZ360"
          aria-expanded="false"
        >
          <span className="daoz-launcher-icon-wrap">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/logo-daoz360-transparent.png"
              alt=""
              className="daoz-launcher-emblem"
              width={26}
              height={26}
            />
          </span>
          <span className="daoz-launcher-text">Chat with DAOZ360</span>
        </button>

        <div
          id="daoz-chat-window"
          className="daoz-chat-window"
          hidden
          role="dialog"
          aria-modal="true"
          aria-labelledby="daoz-chat-title"
        >
          <header className="daoz-chat-header">
            <div className="daoz-chat-header-info">
              <div className="daoz-chat-avatar">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/assets/logo-daoz360-transparent.png"
                  alt="DAOZ360"
                  className="daoz-chat-avatar-img"
                  width={20}
                  height={20}
                />
              </div>
              <div>
                <h2 id="daoz-chat-title" className="daoz-chat-name">DAOZ360 Assistant</h2>
                <div className="daoz-chat-status">
                  <span className="daoz-chat-status-dot"></span>
                  <span>Automated replies</span>
                </div>
              </div>
            </div>

            <div className="daoz-chat-header-actions">
              <button
                type="button"
                id="daoz-chat-reset-btn"
                className="daoz-chat-icon-btn"
                hidden
                title="End conversation"
                aria-label="End conversation"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
              </button>
              <button
                type="button"
                id="daoz-chat-close-btn"
                className="daoz-chat-icon-btn"
                title="Close chat"
                aria-label="Close chat"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
          </header>

          <div id="daoz-chat-confirm-overlay" className="daoz-chat-overlay" hidden role="alertdialog">
            <div className="daoz-chat-confirm-box">
              <h3 className="daoz-confirm-title">End this conversation?</h3>
              <p className="daoz-confirm-desc">
                This will clear the active message history on your screen. Any follow-up requests
                already submitted with a reference identifier will remain safely queued for our team.
              </p>
              <div className="daoz-confirm-actions">
                <button type="button" id="daoz-confirm-end-yes" className="daoz-confirm-btn-danger">
                  Yes, End Chat
                </button>
                <button type="button" id="daoz-confirm-end-cancel" className="daoz-confirm-btn-cancel">
                  Keep Chatting
                </button>
              </div>
            </div>
          </div>

          <div id="daoz-prechat-container" className="daoz-prechat-container">
            <div className="daoz-prechat-intro">
              <h3 className="daoz-prechat-heading">Let&apos;s get started.</h3>
              <p className="daoz-prechat-subtext">
                Enter your details so we can address your enquiry and follow up if needed.
              </p>
            </div>

            <form id="daoz-prechat-form" className="daoz-prechat-form" noValidate>
              <div className="daoz-field-group">
                <label htmlFor="prechat-name" className="daoz-field-label">
                  Your Name <span className="daoz-req">*</span>
                </label>
                <input
                  id="prechat-name"
                  type="text"
                  className="daoz-input"
                  placeholder="e.g. Alex Morgan"
                  maxLength={80}
                  autoComplete="name"
                />
                <span id="prechat-error-name" className="daoz-field-error" hidden role="alert"></span>
              </div>

              <div className="daoz-field-group">
                <label htmlFor="prechat-email" className="daoz-field-label">
                  Email Address <span className="daoz-req">*</span>
                </label>
                <input
                  id="prechat-email"
                  type="email"
                  className="daoz-input"
                  placeholder="alex@company.com"
                  autoComplete="email"
                />
                <span id="prechat-error-email" className="daoz-field-error" hidden role="alert"></span>
              </div>

              <div className="daoz-field-group">
                <label htmlFor="prechat-company" className="daoz-field-label">
                  Company or Brand (Optional)
                </label>
                <input
                  id="prechat-company"
                  type="text"
                  className="daoz-input"
                  placeholder="e.g. Acme Studio"
                  maxLength={120}
                  autoComplete="organization"
                />
              </div>

              <div className="daoz-privacy-notice">
                <span>We use these details to handle your enquiry and follow up when needed. Read our </span>
                <Link href="/privacy-policy" className="daoz-privacy-link">Privacy Policy</Link>.
              </div>

              <div id="prechat-error-form" className="daoz-form-alert" hidden role="alert"></div>

              <button type="submit" className="btn-primary daoz-start-btn">
                <span id="daoz-start-btn-label">Start Chat</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="22" x2="11" y1="2" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              </button>
            </form>
          </div>

          <div id="daoz-conversation-wrapper" className="daoz-conversation-wrapper" hidden>
            <div id="daoz-messages-feed" className="daoz-messages-feed" role="log" aria-live="polite"></div>

            <form id="daoz-chat-input-form" className="daoz-chat-input-bar">
              <input
                id="daoz-chat-input"
                type="text"
                className="daoz-chat-input"
                placeholder="Ask a question or type your topic..."
              />
              <button
                type="submit"
                id="daoz-chat-send-btn"
                className="daoz-chat-send-btn"
                disabled
                aria-label="Send message"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" x2="11" y1="2" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              </button>
            </form>
          </div>
        </div>

        {/* Contact Modal */}
        <div id="contact-modal-backdrop" className="modal-backdrop" hidden role="presentation">
          <div
            id="contact-modal-dialog"
            className="contact-modal card-base"
            role="dialog"
            aria-modal="true"
            aria-labelledby="contact-modal-title"
          >
            <button
              type="button"
              id="contact-modal-close"
              className="modal-close-btn"
              aria-label="Close dialog"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>

            <div className="modal-header">
              <div className="modal-eyebrow">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                <span id="contact-modal-eyebrow-text">Connect with DAOZ360</span>
              </div>
              <h2 id="contact-modal-title" className="modal-title">
                Let’s talk about your social media workflow.
              </h2>
              <p id="contact-modal-subtitle" className="modal-subtitle">
                Tell us about your team, the channels you manage, and what you would like to simplify. We will help you explore how DAOZ360 could fit your workflow.
              </p>

              <div id="modal-plan-prefill-pill" className="modal-plan-prefill-pill" hidden>
                <span className="modal-plan-pill-dot" aria-hidden="true"></span>
                <span id="modal-plan-prefill-text">Selected Package: Growth • Monthly (INR)</span>
                <button type="button" id="modal-plan-prefill-clear" className="modal-plan-pill-clear" aria-label="Clear selected plan">&times;</button>
              </div>
            </div>

            <div id="contact-modal-status" className="form-status-banner" hidden role="status"></div>

            <form id="contact-modal-form" className="contact-form" method="POST" action="/contact/submit">
              <input type="hidden" id="modal-contact-category" name="category" defaultValue="Product Enquiry" />
              <input type="hidden" id="modal-contact-plan" name="plan" defaultValue="" />
              <input type="hidden" id="modal-contact-billing" name="billing" defaultValue="" />
              <input type="hidden" id="modal-contact-currency" name="currency" defaultValue="" />

              <div className="form-group">
                <label htmlFor="modal-contact-name" className="form-label">Name</label>
                <input
                  type="text"
                  id="modal-contact-name"
                  name="name"
                  className="form-input"
                  placeholder="e.g. Alex Morgan"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="modal-contact-email" className="form-label">Work Email</label>
                <input
                  type="email"
                  id="modal-contact-email"
                  name="email"
                  className="form-input"
                  placeholder="alex@company.com"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="modal-contact-company" className="form-label">Company or Brand</label>
                <input
                  type="text"
                  id="modal-contact-company"
                  name="company"
                  className="form-input"
                  placeholder="Company or Brand Name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="modal-contact-message" className="form-label">Message</label>
                <textarea
                  id="modal-contact-message"
                  name="message"
                  rows={4}
                  className="form-textarea"
                  placeholder="Tell us about the platforms you use and what you're looking to achieve..."
                  required
                ></textarea>
              </div>

              <div className="modal-actions-row">
                <button type="submit" id="modal-submit-btn" className="btn-primary modal-submit-btn">
                  <span id="modal-submit-btn-text">Send Enquiry</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="22" x2="11" y1="2" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                </button>

                <button
                  type="button"
                  id="modal-copy-btn"
                  className="btn-secondary modal-copy-btn"
                  title="Copy message text to clipboard"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                  <span id="modal-copy-text">Copy Text</span>
                </button>
              </div>

              <div className="modal-direct-note">
                Direct email: <a href="mailto:mail@daoz360.ai" style={{ color: '#B93D00', fontWeight: 600 }}>mail@daoz360.ai</a>. No passwords or social login credentials are collected.
              </div>
            </form>
          </div>
        </div>
      </div>
      <Script src="/js/app.js" strategy="afterInteractive" />
    </>
  );
}
