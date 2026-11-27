import React from 'react';
import Link from 'next/link';
import { getDb } from '@/lib/db';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function PublicSocialPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const db = await getDb();

  const workspace = await db
    .collection('workspaces')
    .findOne({ 'publicSocialPage.slug': slug });

  if (!workspace || !workspace.publicSocialPage?.enabled) {
    notFound();
  }

  const publishedDrafts = await db
    .collection('drafts')
    .find({
      workspaceId: workspace._id,
      status: 'published',
      _id: { $in: workspace.publicSocialPage.publishedPostIds || [] },
    })
    .sort({ updatedAt: -1 })
    .toArray();

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAFA', color: '#18181B', padding: '48px 16px' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        <header style={{ marginBottom: '36px', paddingBottom: '24px', borderBottom: '1px solid #E4E4E7', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 12px', borderRadius: '999px', background: '#FFF7ED', color: '#C2410C', fontSize: '12px', fontWeight: 700, marginBottom: '12px' }}>
              <span>DAOZ360 Public Social Page</span>
            </div>
            <h1 style={{ fontSize: '30px', fontWeight: 800, margin: '0 0 8px' }}>
              {workspace.publicSocialPage.title || workspace.name}
            </h1>
            <p style={{ fontSize: '15px', color: '#52525B', margin: 0 }}>
              {workspace.publicSocialPage.bio || `Curated social threads and published updates from ${workspace.name}.`}
            </p>
          </div>
          <Link href="/" style={{ fontSize: '13px', fontWeight: 600, color: '#FF5A00', textDecoration: 'none' }}>
            Powered by DAOZ360 &rarr;
          </Link>
        </header>

        {publishedDrafts.length === 0 ? (
          <div className="card-base" style={{ padding: '32px', textAlign: 'center', background: '#FFFFFF', borderRadius: '14px' }}>
            <p style={{ margin: 0, color: '#71717A' }}>No published posts have been selected for public display yet.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {publishedDrafts.map((draft) => (
              <article
                key={draft._id}
                className="card-base"
                style={{ padding: '24px', background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E4E4E7' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>{draft.title}</h2>
                  <span style={{ fontSize: '12px', color: '#71717A' }}>
                    {new Date(draft.updatedAt).toLocaleDateString()}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {draft.masterSegments.map((seg) => (
                    <p
                      key={seg.id}
                      style={{
                        margin: 0,
                        padding: '12px 14px',
                        background: '#FAFAFA',
                        borderRadius: '10px',
                        fontSize: '15px',
                        lineHeight: 1.6,
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {seg.text}
                    </p>
                  ))}
                </div>
                {draft.tags && draft.tags.length > 0 && (
                  <div style={{ display: 'flex', gap: '6px', marginTop: '14px', flexWrap: 'wrap' }}>
                    {draft.tags.map((t) => (
                      <span
                        key={t}
                        style={{
                          fontSize: '11px',
                          padding: '3px 9px',
                          borderRadius: '999px',
                          background: '#F4F4F5',
                          color: '#52525B',
                          fontWeight: 600,
                        }}
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
