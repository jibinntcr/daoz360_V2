import React from 'react';
import Link from 'next/link';
import { PublicSiteShell } from '@/components/PublicSiteShell';

export default function HomePage() {
  return (
    <PublicSiteShell currentPage="home">
      {/* 1. HERO SECTION */}
      <section className="hero-section" aria-labelledby="hero-heading">
        <div className="container hero-container">
          <div className="hero-copy-column">
            <div className="hero-eyebrow">
              <span className="eyebrow-dot" aria-hidden="true"></span>
              <span>SOCIAL MEDIA MANAGEMENT</span>
            </div>

            <h1 id="hero-heading" className="hero-headline">
              <span className="headline-line">Your social media.</span>
              <span className="headline-line highlight-accent">All together.</span>
            </h1>

            <p className="hero-description">
              Bring your content, publishing and team into one workspace. Plan ahead, stay organised and make more room for the ideas that matter.
            </p>

            <div className="hero-actions-row">
              <button type="button" className="btn-primary hero-btn-main" data-open-contact>
                <span>Talk to Us</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </button>

              <Link
                href="/register"
                className="btn-secondary hero-btn-sub"
                style={{ textDecoration: 'none' }}
              >
                <span>Get Started</span>
              </Link>

              <button type="button" id="hero-explore-btn" className="btn-secondary hero-btn-sub">
                <span>Explore the Platform</span>
              </button>
            </div>

            <div className="hero-support-line">
              <span className="support-dot" aria-hidden="true">&bull;</span>
              <span className="support-text">Plan. Publish. Grow.</span>
            </div>
          </div>

          <div className="hero-visual-column">
            <div id="hero-visual-wrapper" className="hero-visual-wrapper">
              <div className="hero-image-card">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/assets/hero-3d.jpg"
                  alt="DAOZ360 Workspace Visual — Central sculptural orange chat form with white ceramic calendar and content tiles"
                  className="hero-3d-render"
                  width={720}
                  height={540}
                  loading="eager"
                />

                <div className="hero-floating-card top-right-card">
                  <span className="floating-indicator" aria-hidden="true"></span>
                  <span>Scheduled for publish</span>
                </div>

                <div className="hero-floating-card bottom-left-card">
                  <span className="status-check-icon">&#10003;</span>
                  <span>Draft approved</span>
                </div>
              </div>

              <div className="hero-visual-meta">
                <span className="badge-illustrative">Illustrative preview</span>

                <button
                  type="button"
                  id="hero-replay-btn"
                  className="animation-replay-btn"
                  title="Replay assembly entrance"
                  aria-label="Replay visual animation"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                  <span>Replay</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. VALUE STATEMENT SECTION */}
      <section className="section section-soft value-section" aria-labelledby="value-heading">
        <div className="container">
          <div className="value-header">
            <div className="section-eyebrow">Core Purpose</div>
            <h2 id="value-heading" className="section-title value-title">
              More creating. Less coordinating.
            </h2>
            <p className="value-body">
              Social media works better when your ideas, content and people move together. DAOZ360 brings structure to the work behind every post, so you can focus on what you want to say.
            </p>
          </div>

          <div className="benefits-grid">
            <div className="benefit-card card-base">
              <div className="benefit-icon-wrapper">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="benefit-icon"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
              </div>
              <h3 className="benefit-card-title">A clearer publishing plan</h3>
              <p className="benefit-card-desc">Structured visual timeline across every channel and date.</p>
              <div className="benefit-check-row">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="benefit-check-icon"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
                <span>Structured workflow</span>
              </div>
            </div>

            <div className="benefit-card card-base">
              <div className="benefit-icon-wrapper">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="benefit-icon"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </div>
              <h3 className="benefit-card-title">A more connected team</h3>
              <p className="benefit-card-desc">Review drafts, share feedback, and approve with clarity.</p>
              <div className="benefit-check-row">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="benefit-check-icon"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
                <span>Structured workflow</span>
              </div>
            </div>

            <div className="benefit-card card-base">
              <div className="benefit-icon-wrapper">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="benefit-icon"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/></svg>
              </div>
              <h3 className="benefit-card-title">A consistent brand presence</h3>
              <p className="benefit-card-desc">Maintain voice, styling, and cadence with less friction.</p>
              <div className="benefit-check-row">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="benefit-check-icon"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
                <span>Structured workflow</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. INTERACTIVE WORKFLOW SHOWCASE */}
      <section id="how-it-works" className="section workflow-section" aria-labelledby="workflow-heading">
        <div className="container">
          <div className="section-header">
            <div className="section-eyebrow">Interactive Workflow</div>
            <h2 id="workflow-heading" className="section-title">
              From the first idea to the next post.
            </h2>
            <p className="section-subtitle">Bring each stage of your social media workflow into view.</p>
          </div>

          <div className="workflow-tablist-wrapper">
            <div role="tablist" aria-label="Workflow Stages" className="workflow-tablist">
              <button
                id="tab-btn-plan"
                data-tab-id="plan"
                role="tab"
                type="button"
                aria-selected="true"
                aria-controls="workflow-tabpanel"
                tabIndex={0}
                className="workflow-tab-btn is-active"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="tab-btn-icon" aria-hidden="true"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                <span className="tab-btn-label">Plan</span>
              </button>

              <button
                id="tab-btn-create"
                data-tab-id="create"
                role="tab"
                type="button"
                aria-selected="false"
                aria-controls="workflow-tabpanel"
                tabIndex={-1}
                className="workflow-tab-btn"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="tab-btn-icon" aria-hidden="true"><path d="m12 19 7-7 3 3-7 7-3-3z"/><path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><circle cx="11" cy="11" r="2"/></svg>
                <span className="tab-btn-label">Create</span>
              </button>

              <button
                id="tab-btn-publish"
                data-tab-id="publish"
                role="tab"
                type="button"
                aria-selected="false"
                aria-controls="workflow-tabpanel"
                tabIndex={-1}
                className="workflow-tab-btn"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="tab-btn-icon" aria-hidden="true"><line x1="22" x2="11" y1="2" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                <span className="tab-btn-label">Publish</span>
              </button>

              <button
                id="tab-btn-learn"
                data-tab-id="learn"
                role="tab"
                type="button"
                aria-selected="false"
                aria-controls="workflow-tabpanel"
                tabIndex={-1}
                className="workflow-tab-btn"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="tab-btn-icon" aria-hidden="true"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>
                <span className="tab-btn-label">Learn</span>
              </button>
            </div>
          </div>

          <div
            id="workflow-tabpanel"
            role="tabpanel"
            aria-labelledby="tab-btn-plan"
            className="workflow-panel card-base"
          >
            <div className="panel-info-row">
              <div className="panel-text-content">
                <h3 id="workflow-stage-title" className="panel-stage-title">
                  Give your content a clear direction.
                </h3>
                <p id="workflow-stage-body" className="panel-stage-body">
                  Organise upcoming posts in a visual calendar and see how your content fits together across the week.
                </p>
              </div>
              <div className="panel-meta-pill">
                <span className="meta-pill-indicator"></span>
                <span id="workflow-stage-metrics">3 Campaigns active &bull; 14 Posts mapped</span>
              </div>
            </div>

            <div className="panel-preview-container">
              <div data-workflow-mock="plan" className="mock-plan-view">
                <div className="mock-toolbar">
                  <div className="mock-toolbar-left">
                    <span className="mock-view-label">Calendar View</span>
                    <span className="mock-badge-active">October 2026</span>
                  </div>
                  <span className="badge-illustrative">Illustrative preview</span>
                </div>
                <div className="mock-calendar-grid">
                  <div className="mock-day-col">
                    <div className="mock-day-header">Mon 26</div>
                    <div className="mock-post-card draft">
                      <span className="post-tag">Campaign</span>
                      <p className="post-snippet">Product launch teaser announcement</p>
                      <div className="post-time">10:00 AM</div>
                    </div>
                  </div>
                  <div className="mock-day-col is-today">
                    <div className="mock-day-header highlight">Tue 27 (Today)</div>
                    <div className="mock-post-card scheduled">
                      <span className="post-tag orange">Social</span>
                      <p className="post-snippet">Feature highlight: Clearer team workflows</p>
                      <div className="post-time">&#10003; 02:30 PM</div>
                    </div>
                    <div className="mock-post-card scheduled">
                      <span className="post-tag">Thread</span>
                      <p className="post-snippet">Behind the scenes with our creative team</p>
                      <div className="post-time">&#10003; 05:00 PM</div>
                    </div>
                  </div>
                  <div className="mock-day-col">
                    <div className="mock-day-header">Wed 28</div>
                    <div className="mock-post-card draft">
                      <span className="post-tag">Everyday</span>
                      <p className="post-snippet">Mid-week community question &amp; poll</p>
                      <div className="post-time">11:15 AM</div>
                    </div>
                  </div>
                  <div className="mock-day-col">
                    <div className="mock-day-header">Thu 29</div>
                    <div className="mock-post-card ready">
                      <span className="post-tag orange">Insights</span>
                      <p className="post-snippet">Weekly publishing patterns summary</p>
                      <div className="post-time">&#10003; 09:00 AM</div>
                    </div>
                  </div>
                </div>
              </div>

              <div data-workflow-mock="create" className="mock-create-view" hidden>
                <div className="mock-toolbar">
                  <span className="mock-view-label">Multi-Channel Composer</span>
                  <span className="badge-illustrative">Illustrative preview</span>
                </div>
                <div className="mock-create-split">
                  <div className="mock-editor-pane">
                    <div className="mock-channel-tags">
                      <span className="channel-chip active">Channel A</span>
                      <span className="channel-chip active">Channel B</span>
                      <span className="channel-chip">Channel C</span>
                    </div>
                    <div className="mock-textarea-box">
                      <p className="mock-input-text">
                        Bringing all your social content into one shared view. Plan campaigns ahead, preview how they look, and publish with confidence.
                      </p>
                      <div className="mock-editor-tools">
                        <span className="tool-pill">Channel preview</span>
                        <span className="tool-pill">Media attachment</span>
                        <span className="tool-pill">Format check</span>
                      </div>
                    </div>
                  </div>
                  <div className="mock-preview-pane">
                    <div className="mock-phone-card">
                      <div className="phone-header">
                        <div className="phone-avatar"></div>
                        <div className="phone-meta">
                          <span className="phone-brand">DAOZ360</span>
                          <span className="phone-time">Preview mode</span>
                        </div>
                      </div>
                      <div className="phone-content-body">
                        Bringing all your social content into one shared view. Plan campaigns ahead...
                      </div>
                      <div className="phone-media-box">
                        <div className="phone-media-placeholder">Visual preview</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div data-workflow-mock="publish" className="mock-publish-view" hidden>
                <div className="mock-toolbar">
                  <span className="mock-view-label">Publishing &amp; Dispatch Queue</span>
                  <span className="badge-illustrative">Illustrative preview</span>
                </div>
                <div className="mock-queue-list">
                  <div className="queue-item">
                    <div className="queue-status-col text-orange">&#10003;</div>
                    <div className="queue-info">
                      <span className="queue-title">Autumn Feature Series &bull; Part 1</span>
                      <span className="queue-accounts">Connected accounts: Primary brand</span>
                    </div>
                    <div className="queue-meta">
                      <span className="queue-badge ready">Scheduled for 14:00</span>
                    </div>
                  </div>
                  <div className="queue-item">
                    <div className="queue-status-col">&#9201;</div>
                    <div className="queue-info">
                      <span className="queue-title">Product Walkthrough Video Clip</span>
                      <span className="queue-accounts">Connected accounts: Video feeds</span>
                    </div>
                    <div className="queue-meta">
                      <span className="queue-badge queued">Tomorrow at 09:30</span>
                    </div>
                  </div>
                  <div className="queue-item">
                    <div className="queue-status-col">&#9998;</div>
                    <div className="queue-info">
                      <span className="queue-title">Weekend Discussion Starter</span>
                      <span className="queue-accounts">Connected accounts: Discussion channels</span>
                    </div>
                    <div className="queue-meta">
                      <span className="queue-badge draft">Draft pending review</span>
                    </div>
                  </div>
                </div>
              </div>

              <div data-workflow-mock="learn" className="mock-learn-view" hidden>
                <div className="mock-toolbar">
                  <span className="mock-view-label">Content Performance Summary</span>
                  <span className="badge-illustrative">Example data</span>
                </div>
                <div className="mock-charts-grid">
                  <div className="chart-stat-card">
                    <span className="chart-label">Publishing Consistency</span>
                    <span className="chart-number">98.4%</span>
                    <span className="chart-desc">Posts delivered on schedule</span>
                  </div>
                  <div className="chart-stat-card">
                    <span className="chart-label">Content Engagement Trend</span>
                    <div className="mini-bars-row">
                      <span className="bar" style={{ height: '40%' }}></span>
                      <span className="bar" style={{ height: '60%' }}></span>
                      <span className="bar" style={{ height: '55%' }}></span>
                      <span className="bar highlight" style={{ height: '85%' }}></span>
                      <span className="bar" style={{ height: '70%' }}></span>
                      <span className="bar highlight" style={{ height: '95%' }}></span>
                    </div>
                    <span className="chart-desc">Engagement patterns across recent posts</span>
                  </div>
                  <div className="chart-stat-card">
                    <span className="chart-label">Top Content Format</span>
                    <span className="chart-number">Visual Stories</span>
                    <span className="chart-desc">Highest resonance with core followers</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="workflow-bottom-cta">
            <button type="button" id="workflow-explore-features-btn" className="btn-secondary">
              <span>Explore Product Features</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>
            </button>
          </div>
        </div>
      </section>

      {/* 4. PRODUCT STORIES SECTION */}
      <section id="product-stories" className="section stories-section" aria-label="Product Features in Detail">
        <div className="container">
          <div className="stories-list">
            <div id="planning" className="story-row">
              <div className="story-content-col">
                <div className="story-category-tag">Calendar &amp; Scheduling</div>
                <h3 className="story-heading">A clearer calendar. A more consistent presence.</h3>
                <p className="story-body">
                  See what is planned, prepare what is next and keep your publishing schedule organised. DAOZ360 helps you bring everyday posts and campaign content into the same view.
                </p>
                <ul className="story-points-list">
                  <li className="story-point-item">
                    <span className="point-icon-box" aria-hidden="true">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="point-check"><path d="M20 6 9 17l-5-5"/></svg>
                    </span>
                    <span className="point-text">Visual content planning.</span>
                  </li>
                  <li className="story-point-item">
                    <span className="point-icon-box" aria-hidden="true">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="point-check"><path d="M20 6 9 17l-5-5"/></svg>
                    </span>
                    <span className="point-text">Scheduled publishing.</span>
                  </li>
                  <li className="story-point-item">
                    <span className="point-icon-box" aria-hidden="true">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="point-check"><path d="M20 6 9 17l-5-5"/></svg>
                    </span>
                    <span className="point-text">Platform-specific content preparation.</span>
                  </li>
                </ul>
                <button type="button" className="story-link-btn" data-open-contact>
                  <span>Explore Planning and Publishing</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                </button>
              </div>
              <div className="story-visual-col">
                <div className="story-image-card card-base">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/assets/story-planning-3d.jpg"
                    alt="A clearer calendar. A more consistent presence. visual"
                    className="story-3d-image"
                    loading="lazy"
                    width={600}
                    height={450}
                  />
                  <div className="story-badge-wrapper">
                    <span className="badge-illustrative">Illustrative preview</span>
                  </div>
                </div>
              </div>
            </div>

            <div id="collaboration" className="story-row is-reversed">
              <div className="story-content-col">
                <div className="story-category-tag">Team Review</div>
                <h3 className="story-heading">Keep the conversation close to the content.</h3>
                <p className="story-body">
                  Bring drafts, feedback and approvals into a shared workflow. Give your team a clearer view of what needs attention and what is ready for the next step.
                </p>
                <ul className="story-points-list">
                  <li className="story-point-item">
                    <span className="point-icon-box" aria-hidden="true">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="point-check"><path d="M20 6 9 17l-5-5"/></svg>
                    </span>
                    <span className="point-text">Shared content review.</span>
                  </li>
                  <li className="story-point-item">
                    <span className="point-icon-box" aria-hidden="true">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="point-check"><path d="M20 6 9 17l-5-5"/></svg>
                    </span>
                    <span className="point-text">Clear approval steps.</span>
                  </li>
                  <li className="story-point-item">
                    <span className="point-icon-box" aria-hidden="true">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="point-check"><path d="M20 6 9 17l-5-5"/></svg>
                    </span>
                    <span className="point-text">Better visibility across the team.</span>
                  </li>
                </ul>
                <button type="button" className="story-link-btn" data-open-contact>
                  <span>Explore Team Collaboration</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                </button>
              </div>
              <div className="story-visual-col">
                <div className="story-image-card card-base">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/assets/story-collaboration-3d.jpg"
                    alt="Keep the conversation close to the content. visual"
                    className="story-3d-image"
                    loading="lazy"
                    width={600}
                    height={450}
                  />
                  <div className="story-badge-wrapper">
                    <span className="badge-illustrative">Illustrative preview</span>
                  </div>
                </div>
              </div>
            </div>

            <div id="insights" className="story-row">
              <div className="story-content-col">
                <div className="story-category-tag">Performance Insights</div>
                <h3 className="story-heading">Know what to build on.</h3>
                <p className="story-body">
                  Look back at your content performance and identify the ideas worth developing. Bring those insights into your next round of planning.
                </p>
                <ul className="story-points-list">
                  <li className="story-point-item">
                    <span className="point-icon-box" aria-hidden="true">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="point-check"><path d="M20 6 9 17l-5-5"/></svg>
                    </span>
                    <span className="point-text">Review content performance.</span>
                  </li>
                  <li className="story-point-item">
                    <span className="point-icon-box" aria-hidden="true">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="point-check"><path d="M20 6 9 17l-5-5"/></svg>
                    </span>
                    <span className="point-text">Understand engagement patterns.</span>
                  </li>
                  <li className="story-point-item">
                    <span className="point-icon-box" aria-hidden="true">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="point-check"><path d="M20 6 9 17l-5-5"/></svg>
                    </span>
                    <span className="point-text">Make more informed content decisions.</span>
                  </li>
                </ul>
                <button type="button" className="story-link-btn" data-open-contact>
                  <span>Explore Insights</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                </button>
              </div>
              <div className="story-visual-col">
                <div className="story-image-card card-base">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/assets/story-insights-3d.jpg"
                    alt="Know what to build on. visual"
                    className="story-3d-image"
                    loading="lazy"
                    width={600}
                    height={450}
                  />
                  <div className="story-badge-wrapper">
                    <span className="badge-illustrative">Example data</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. SUPPORTING CAPABILITIES SECTION */}
      <section id="product" className="section section-soft capabilities-section" aria-labelledby="capabilities-heading">
        <div className="container">
          <div className="section-header">
            <div className="section-eyebrow">Supporting Capabilities</div>
            <h2 id="capabilities-heading" className="section-title">
              The details that keep work flowing.
            </h2>
            <p className="section-subtitle">
              Thoughtful capabilities designed to support everyday marketing operations without unnecessary clutter.
            </p>
          </div>

          <div className="capabilities-grid">
            <div className="capability-card card-base">
              <div className="cap-icon-box">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="cap-icon"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/><path d="M8 10v4"/><path d="M12 10v2"/><path d="M16 10v6"/></svg>
              </div>
              <h3 className="cap-card-title">Media Library</h3>
              <p className="cap-card-desc">Keep your images and videos organised and ready for your next post.</p>
            </div>

            <div className="capability-card card-base">
              <div className="cap-icon-box">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="cap-icon"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
              </div>
              <h3 className="cap-card-title">Content Previews</h3>
              <p className="cap-card-desc">Review how your message is presented before you publish.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. AUDIENCE / SOLUTIONS SECTION */}
      <section id="solutions" className="section audience-section" aria-labelledby="audience-heading">
        <div className="container">
          <div className="section-header">
            <div className="section-eyebrow">Target Solutions</div>
            <h2 id="audience-heading" className="section-title">
              Built around the people behind the posts.
            </h2>
            <p className="section-subtitle">
              Tailored for the teams and specialists driving modern social content forward.
            </p>
          </div>

          <div className="audience-grid">
            <div className="audience-card card-base">
              <div className="audience-header-row">
                <div className="audience-icon-box">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="audience-icon"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
                </div>
                <span className="audience-focus-pill">Campaign Alignment</span>
              </div>
              <h3 className="audience-card-title">Marketing teams</h3>
              <p className="audience-card-desc">Bring campaign planning, content preparation and publishing into a shared workflow.</p>
            </div>

            <div className="audience-card card-base">
              <div className="audience-header-row">
                <div className="audience-icon-box">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="audience-icon"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/></svg>
                </div>
                <span className="audience-focus-pill">Cadence &amp; Organisation</span>
              </div>
              <h3 className="audience-card-title">Social media managers</h3>
              <p className="audience-card-desc">Keep everyday publishing organised while making room for your next creative idea.</p>
            </div>

            <div className="audience-card card-base">
              <div className="audience-header-row">
                <div className="audience-icon-box">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="audience-icon"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>
                </div>
                <span className="audience-focus-pill">Consistent Presence</span>
              </div>
              <h3 className="audience-card-title">Growing businesses</h3>
              <p className="audience-card-desc">Build a more consistent social presence with a clearer way to manage your content.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FAQ SECTION */}
      <section id="faqs" className="section section-soft faq-section" aria-labelledby="faq-heading">
        <div className="container">
          <div className="section-header">
            <div className="section-eyebrow">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>
              <span>Got Questions?</span>
            </div>
            <h2 id="faq-heading" className="section-title">Frequently Asked Questions</h2>
            <p className="section-subtitle">Clear answers about DAOZ360 and getting started.</p>
          </div>

          <div className="faq-accordion-group">
            <details className="faq-disclosure card-base" open>
              <summary className="faq-summary">
                <span className="faq-question-text">What is DAOZ360?</span>
                <span className="faq-icon-wrapper" aria-hidden="true">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="faq-chevron"><path d="m6 9 6 6 6-6"/></svg>
                </span>
              </summary>
              <div className="faq-answer-content">
                <p>DAOZ360 is a social media management tool designed to bring the work behind your social presence into one place.</p>
              </div>
            </details>

            <details className="faq-disclosure card-base">
              <summary className="faq-summary">
                <span className="faq-question-text">Who is DAOZ360 for?</span>
                <span className="faq-icon-wrapper" aria-hidden="true">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="faq-chevron"><path d="m6 9 6 6 6-6"/></svg>
                </span>
              </summary>
              <div className="faq-answer-content">
                <p>DAOZ360 is designed for marketing teams, social media managers and businesses looking for a more organised social media workflow.</p>
              </div>
            </details>

            <details className="faq-disclosure card-base">
              <summary className="faq-summary">
                <span className="faq-question-text">Which social platforms can I connect?</span>
                <span className="faq-icon-wrapper" aria-hidden="true">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="faq-chevron"><path d="m6 9 6 6 6-6"/></svg>
                </span>
              </summary>
              <div className="faq-answer-content">
                <p>Contact us with the platforms and account types you use. We can help you check the available integrations and supported publishing formats.</p>
              </div>
            </details>

            <details className="faq-disclosure card-base">
              <summary className="faq-summary">
                <span className="faq-question-text">Can my team work together in DAOZ360?</span>
                <span className="faq-icon-wrapper" aria-hidden="true">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="faq-chevron"><path d="m6 9 6 6 6-6"/></svg>
                </span>
              </summary>
              <div className="faq-answer-content">
                <p>DAOZ360 brings content review and collaboration into a shared workflow, helping your team coordinate the steps before publishing.</p>
              </div>
            </details>

            <details className="faq-disclosure card-base">
              <summary className="faq-summary">
                <span className="faq-question-text">How can I learn more about DAOZ360?</span>
                <span className="faq-icon-wrapper" aria-hidden="true">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="faq-chevron"><path d="m6 9 6 6 6-6"/></svg>
                </span>
              </summary>
              <div className="faq-answer-content">
                <p>Tell us about your social media workflow at mail@daoz360.ai. We will help you explore whether DAOZ360 fits your needs.</p>
              </div>
            </details>
          </div>
        </div>
      </section>

      {/* 8. FINAL CTA SECTION */}
      <section id="contact" className="final-cta-section" aria-labelledby="cta-heading">
        <div className="container">
          <div className="final-cta-card">
            <div className="cta-ambient-glow" aria-hidden="true"></div>

            <div className="cta-content-inner">
              <div className="cta-eyebrow">
                <span className="cta-eyebrow-dot" aria-hidden="true"></span>
                <span>Direct Conversation</span>
              </div>

              <h2 id="cta-heading" className="cta-title">
                Bring your next campaign together.
              </h2>

              <p className="cta-body">
                Tell us how you manage social media today. Let’s explore a clearer way to plan, publish and work together.
              </p>

              <div className="cta-actions-group">
                <button type="button" className="btn-primary cta-main-btn" data-open-contact>
                  <span>Talk to Us</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                </button>

                <div className="cta-email-box">
                  <a href="mailto:mail@daoz360.ai" className="cta-email-link" title="Send direct email">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                    <span>mail@daoz360.ai</span>
                  </a>

                  <button
                    type="button"
                    id="cta-copy-email-btn"
                    className="cta-copy-btn"
                    title="Copy email address"
                    aria-label="Copy email address"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                    <span id="cta-copy-email-label">Copy</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PublicSiteShell>
  );
}
