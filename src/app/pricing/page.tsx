import React from 'react';
import type { Metadata } from 'next';
import { PublicSiteShell } from '@/components/PublicSiteShell';

export const metadata: Metadata = {
  title: 'Pricing & Plans | DAOZ360',
  description:
    'Explore DAOZ360 pricing plans for creators, growing marketing teams, and agencies. Start with the accounts you manage today and scale your social media workflow.',
  alternates: {
    canonical: 'https://daoz360.ai/pricing',
  },
};

export default function PricingPage() {
  return (
    <PublicSiteShell currentPage="pricing">
      <section className="pricing-hero-section" aria-labelledby="pricing-heading">
        <div className="container">
          <div className="pricing-hero-grid">
            <div className="pricing-hero-copy">
              <div className="hero-eyebrow">
                <span className="eyebrow-dot" aria-hidden="true"></span>
                <span>DAOZ360 PRICING</span>
              </div>

              <h1 id="pricing-heading" className="pricing-headline">
                A plan for every stage of your social presence.
              </h1>

              <p className="pricing-intro">
                Start with the accounts you manage today. Choose the space, publishing capacity and collaboration your team needs as it grows.
              </p>

              <div id="pricing-mode-banner" className="pricing-mode-banner" role="status">
                <span className="pricing-mode-dot" aria-hidden="true"></span>
                <span>
                  <strong>Preview &amp; Quote Mode:</strong> Select any package below to prefill your enquiry with your preferred plan, billing interval, and currency.
                </span>
              </div>
            </div>

            <div className="pricing-scale-visual" aria-hidden="true">
              <div className="scale-3d-card card-base">
                <div className="scale-3d-stage">
                  <div className="scale-step scale-step-starter">
                    <div className="scale-pillar">
                      <span className="scale-dot"></span>
                    </div>
                    <span className="scale-caption">5 Accounts</span>
                  </div>
                  <div className="scale-step scale-step-growth">
                    <div className="scale-pillar is-accent">
                      <span className="scale-dot"></span>
                      <span className="scale-dot"></span>
                    </div>
                    <span className="scale-caption">15 Accounts</span>
                  </div>
                  <div className="scale-step scale-step-agency">
                    <div className="scale-pillar is-tall">
                      <span className="scale-dot"></span>
                      <span className="scale-dot"></span>
                      <span className="scale-dot"></span>
                    </div>
                    <span className="scale-caption">40 Accounts</span>
                  </div>
                </div>
                <div className="scale-3d-footer">
                  <span className="badge-illustrative">Illustrative preview</span>
                  <span className="scale-3d-note">Bundled seats &amp; monthly delivery capacity</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pricing-controls-bar" aria-label="Billing interval and currency controls">
            <div className="pricing-control-group">
              <span className="pricing-control-label" id="billing-toggle-label">Billing Interval</span>
              <div className="pricing-segmented-control" role="group" aria-labelledby="billing-toggle-label">
                <button
                  type="button"
                  id="billing-btn-monthly"
                  data-billing-select="monthly"
                  className="pricing-seg-btn is-active"
                  aria-pressed="true"
                >
                  <span>Monthly</span>
                </button>
                <button
                  type="button"
                  id="billing-btn-yearly"
                  data-billing-select="yearly"
                  className="pricing-seg-btn"
                  aria-pressed="false"
                >
                  <span>Yearly — save 2 months</span>
                </button>
              </div>
            </div>

            <div className="pricing-control-group">
              <span className="pricing-control-label" id="currency-toggle-label">Regional Price Book</span>
              <div className="pricing-segmented-control" role="group" aria-labelledby="currency-toggle-label">
                <button
                  type="button"
                  id="currency-btn-inr"
                  data-currency-select="INR"
                  className="pricing-seg-btn is-active"
                  aria-pressed="true"
                >
                  <span>INR (₹)</span>
                </button>
                <button
                  type="button"
                  id="currency-btn-usd"
                  data-currency-select="USD"
                  className="pricing-seg-btn"
                  aria-pressed="false"
                >
                  <span>USD ($)</span>
                </button>
              </div>
            </div>
          </div>

          <div className="pricing-cards-grid" role="list">
            {/* Starter */}
            <article className="pricing-plan-card card-base" data-plan-card="starter" role="listitem">
              <div className="plan-card-top">
                <div className="plan-header-row">
                  <h2 className="plan-name">Starter</h2>
                </div>
                <p className="plan-audience">For creators and independent professionals.</p>

                <div className="plan-price-block">
                  <div className="plan-price-main-row">
                    <span className="plan-price-amount" data-plan-price="starter">₹999</span>
                    <span className="plan-price-unit" data-plan-unit="starter">/month</span>
                  </div>
                  <p className="plan-billing-subtext" data-plan-subtext="starter">Billed monthly.</p>
                </div>
              </div>

              <div className="plan-card-divider" aria-hidden="true"></div>

              <ul className="plan-features-list" aria-label="Starter plan features">
                <li className="plan-feature-item"><span className="plan-check-icon" aria-hidden="true">&#10003;</span><span><strong>5</strong> connected social accounts.</span></li>
                <li className="plan-feature-item"><span className="plan-check-icon" aria-hidden="true">&#10003;</span><span><strong>1</strong> user.</span></li>
                <li className="plan-feature-item"><span className="plan-check-icon" aria-hidden="true">&#10003;</span><span><strong>300</strong> successful platform deliveries per month.</span></li>
                <li className="plan-feature-item"><span className="plan-check-icon" aria-hidden="true">&#10003;</span><span>Post scheduling and publishing.</span></li>
                <li className="plan-feature-item"><span className="plan-check-icon" aria-hidden="true">&#10003;</span><span>Supported-network analytics.</span></li>
                <li className="plan-feature-item"><span className="plan-check-icon" aria-hidden="true">&#10003;</span><span>Email support.</span></li>
              </ul>

              <div className="plan-card-footer">
                <button
                  type="button"
                  className="btn-secondary w-full plan-cta-btn"
                  data-plan-enquire="starter"
                  data-plan-cta="starter"
                >
                  <span>Enquire About Starter</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                </button>
              </div>
            </article>

            {/* Growth */}
            <article className="pricing-plan-card card-base is-recommended" data-plan-card="growth" role="listitem">
              <div className="plan-recommended-badge">
                <span>Recommended for Teams</span>
              </div>

              <div className="plan-card-top">
                <div className="plan-header-row">
                  <h2 className="plan-name">Growth</h2>
                </div>
                <p className="plan-audience">For growing businesses and small marketing teams.</p>

                <div className="plan-price-block">
                  <div className="plan-price-main-row">
                    <span className="plan-price-amount" data-plan-price="growth">₹2,499</span>
                    <span className="plan-price-unit" data-plan-unit="growth">/month</span>
                  </div>
                  <p className="plan-billing-subtext" data-plan-subtext="growth">Billed monthly.</p>
                </div>
              </div>

              <div className="plan-card-divider" aria-hidden="true"></div>

              <ul className="plan-features-list" aria-label="Growth plan features">
                <li className="plan-feature-item"><span className="plan-check-icon" aria-hidden="true">&#10003;</span><span><strong>15</strong> connected social accounts.</span></li>
                <li className="plan-feature-item"><span className="plan-check-icon" aria-hidden="true">&#10003;</span><span><strong>3</strong> users.</span></li>
                <li className="plan-feature-item"><span className="plan-check-icon" aria-hidden="true">&#10003;</span><span><strong>1,500</strong> successful platform deliveries per month.</span></li>
                <li className="plan-feature-item"><span className="plan-check-icon" aria-hidden="true">&#10003;</span><span>Post scheduling and publishing.</span></li>
                <li className="plan-feature-item"><span className="plan-check-icon" aria-hidden="true">&#10003;</span><span>Supported-network analytics.</span></li>
                <li className="plan-feature-item"><span className="plan-check-icon" aria-hidden="true">&#10003;</span><span>Team collaboration and content approvals.</span></li>
                <li className="plan-feature-item"><span className="plan-check-icon" aria-hidden="true">&#10003;</span><span>Email support.</span></li>
              </ul>

              <div className="plan-card-footer">
                <button
                  type="button"
                  className="btn-primary w-full plan-cta-btn"
                  data-plan-enquire="growth"
                  data-plan-cta="growth"
                >
                  <span>Enquire About Growth</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                </button>
              </div>
            </article>

            {/* Agency */}
            <article className="pricing-plan-card card-base" data-plan-card="agency" role="listitem">
              <div className="plan-card-top">
                <div className="plan-header-row">
                  <h2 className="plan-name">Agency</h2>
                </div>
                <p className="plan-audience">For teams managing a larger portfolio of social accounts.</p>

                <div className="plan-price-block">
                  <div className="plan-price-main-row">
                    <span className="plan-price-amount" data-plan-price="agency">₹5,999</span>
                    <span className="plan-price-unit" data-plan-unit="agency">/month</span>
                  </div>
                  <p className="plan-billing-subtext" data-plan-subtext="agency">Billed monthly.</p>
                </div>
              </div>

              <div className="plan-card-divider" aria-hidden="true"></div>

              <ul className="plan-features-list" aria-label="Agency plan features">
                <li className="plan-feature-item"><span className="plan-check-icon" aria-hidden="true">&#10003;</span><span><strong>40</strong> connected social accounts.</span></li>
                <li className="plan-feature-item"><span className="plan-check-icon" aria-hidden="true">&#10003;</span><span><strong>10</strong> users.</span></li>
                <li className="plan-feature-item"><span className="plan-check-icon" aria-hidden="true">&#10003;</span><span><strong>5,000</strong> successful platform deliveries per month.</span></li>
                <li className="plan-feature-item"><span className="plan-check-icon" aria-hidden="true">&#10003;</span><span>Post scheduling and publishing.</span></li>
                <li className="plan-feature-item"><span className="plan-check-icon" aria-hidden="true">&#10003;</span><span>Supported-network analytics.</span></li>
                <li className="plan-feature-item"><span className="plan-check-icon" aria-hidden="true">&#10003;</span><span>Team collaboration and content approvals.</span></li>
                <li className="plan-feature-item"><span className="plan-check-icon" aria-hidden="true">&#10003;</span><span>Email support.</span></li>
              </ul>

              <div className="plan-card-footer">
                <button
                  type="button"
                  className="btn-secondary w-full plan-cta-btn"
                  data-plan-enquire="agency"
                  data-plan-cta="agency"
                >
                  <span>Enquire About Agency</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                </button>
              </div>
            </article>
          </div>

          <div className="pricing-custom-strip card-base">
            <div className="custom-strip-copy">
              <span className="custom-strip-badge">Custom Package</span>
              <h3 className="custom-strip-title">Need more accounts or a different setup?</h3>
              <p className="custom-strip-body">
                Tell us about your account volume, team and workflow. We will help you explore a suitable package.
              </p>
            </div>
            <div className="custom-strip-actions">
              <button type="button" className="btn-primary" data-plan-enquire="custom">
                <span>Talk to Our Team</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </button>
            </div>
          </div>

          <p className="pricing-shared-note">
            Prices exclude applicable taxes. Annual plans are charged upfront. Each social profile, page or channel counts as one connected account. Publishing allowances are shared across the subscription. Supported features and formats vary by network.
          </p>
        </div>
      </section>

      <section className="section section-soft pricing-comparison-section" aria-labelledby="comparison-heading">
        <div className="container">
          <div className="section-header">
            <div className="section-eyebrow">Plan Entitlements &amp; Definitions</div>
            <h2 id="comparison-heading" className="section-title">
              Clear allowances. Transparent comparison.
            </h2>
            <p className="section-subtitle">
              Understand how accounts, user seats, and monthly publishing allowances work across every tier.
            </p>
          </div>

          <div className="allowance-defs-grid" aria-label="Plan allowance definitions">
            <div className="allowance-def-card card-base">
              <h3 className="allowance-def-title">Social account</h3>
              <p className="allowance-def-desc">
                One connected profile, page or channel. One Instagram account plus one Facebook Page counts as two accounts.
              </p>
            </div>
            <div className="allowance-def-card card-base">
              <h3 className="allowance-def-title">User</h3>
              <p className="allowance-def-desc">
                One individual login, including the subscription owner. Shared credentials are not the intended collaboration model.
              </p>
            </div>
            <div className="allowance-def-card card-base">
              <h3 className="allowance-def-title">Publishing allowance</h3>
              <p className="allowance-def-desc">
                One successful delivery to one destination account. Sending one content item to five accounts counts as five deliveries.
              </p>
            </div>
            <div className="allowance-def-card card-base">
              <h3 className="allowance-def-title">Annual access</h3>
              <p className="allowance-def-desc">
                One upfront annual payment, not twelve monthly charges. Publishing capacity renews each subscription month.
              </p>
            </div>
            <div className="allowance-def-card card-base">
              <h3 className="allowance-def-title">Network and format availability</h3>
              <p className="allowance-def-desc">
                Depends on the live support matrix, platform permissions and technical restrictions; a larger plan does not create support for an unintegrated network.
              </p>
            </div>
          </div>

          <div className="comparison-table-wrapper card-base">
            <table className="comparison-table">
              <caption>Comparison of included entitlements across Starter, Growth, and Agency plans</caption>
              <thead>
                <tr>
                  <th scope="col" className="comp-col-feature">Included item</th>
                  <th scope="col" className="comp-col-plan">
                    <span className="comp-plan-title">Starter</span>
                    <span className="comp-plan-price" data-table-price="starter">₹999/mo</span>
                  </th>
                  <th scope="col" className="comp-col-plan is-highlighted">
                    <span className="comp-plan-pill">Recommended for Teams</span>
                    <span className="comp-plan-title">Growth</span>
                    <span className="comp-plan-price" data-table-price="growth">₹2,499/mo</span>
                  </th>
                  <th scope="col" className="comp-col-plan">
                    <span className="comp-plan-title">Agency</span>
                    <span className="comp-plan-price" data-table-price="agency">₹5,999/mo</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">Connected social accounts</th>
                  <td><strong>5</strong></td>
                  <td className="is-highlighted"><strong>15</strong></td>
                  <td><strong>40</strong></td>
                </tr>
                <tr>
                  <th scope="row">Total user seats, including owner</th>
                  <td><strong>1</strong></td>
                  <td className="is-highlighted"><strong>3</strong></td>
                  <td><strong>10</strong></td>
                </tr>
                <tr>
                  <th scope="row">Successful platform deliveries per month</th>
                  <td><strong>300</strong></td>
                  <td className="is-highlighted"><strong>1,500</strong></td>
                  <td><strong>5,000</strong></td>
                </tr>
                <tr>
                  <th scope="row">Scheduling and publishing</th>
                  <td><span className="comp-included">&#10003; Included</span></td>
                  <td className="is-highlighted"><span className="comp-included">&#10003; Included</span></td>
                  <td><span className="comp-included">&#10003; Included</span></td>
                </tr>
                <tr>
                  <th scope="row">Supported-network analytics</th>
                  <td><span className="comp-included">&#10003; Included</span></td>
                  <td className="is-highlighted"><span className="comp-included">&#10003; Included</span></td>
                  <td><span className="comp-included">&#10003; Included</span></td>
                </tr>
                <tr>
                  <th scope="row">Team collaboration</th>
                  <td><span className="comp-excluded">Not included</span></td>
                  <td className="is-highlighted"><span className="comp-included">&#10003; Included</span></td>
                  <td><span className="comp-included">&#10003; Included</span></td>
                </tr>
                <tr>
                  <th scope="row">Content approval workflow</th>
                  <td><span className="comp-excluded">Not included</span></td>
                  <td className="is-highlighted"><span className="comp-included">&#10003; Included</span></td>
                  <td><span className="comp-included">&#10003; Included</span></td>
                </tr>
                <tr>
                  <th scope="row">Email support</th>
                  <td><span className="comp-included">&#10003; Included</span></td>
                  <td className="is-highlighted"><span className="comp-included">&#10003; Included</span></td>
                  <td><span className="comp-included">&#10003; Included</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </PublicSiteShell>
  );
}
