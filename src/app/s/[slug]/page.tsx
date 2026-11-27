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
  const workspaces = await db.collection('workspaces').find({}).toArray();
  const workspace = workspaces.find(
    (w) => w.publicSocialPage?.slug === slug || w.slug === slug
  );

  if (!workspace || !workspace.publicSocialPage?.enabled) {
    notFound();
  }

  const allowedIds = workspace.publicSocialPage.publishedPostIds || [];
  const drafts = await db
    .collection('drafts')
    .find({ workspaceId: workspace._id, status: 'published' })
    .toArray();

  const curatedPosts = drafts.filter(
    (d) => allowedIds.includes(d._id) || d.publishedOnSocialPage
  );

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAFA', color: '#18181B', padding: '56px 20px', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <header style={{ marginBottom: 36, borderBottom: '1px solid #E4E4E7', paddingBottom: 24 }}>
          <Link href="/" style={{ display: 'inline-block', marginBottom: 16 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/logo-daoz360-transparent.png" alt="DAOZ360" width={130} height={26} />
          </Link>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 8px' }}>
            {workspace.publicSocialPage.title}
          </h1>
          <p style={{ fontSize: 15, color: '#52525B', margin: 0 }}>
            {workspace.publicSocialPage.bio}
          </p>
        </header>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {curatedPosts.map((post) => (
            <article key={post._id} style={{ background: '#FFFFFF', padding: 24, borderRadius: 16, border: '1px solid #E4E4E7' }}>
              <div style={{ fontSize: 12, color: '#71717A', marginBottom: 6 }}>
                Published {new Date(post.updatedAt).toLocaleDateString()} &bull; {post.campaign || 'Social Feed'}
              </div>
              <h2 style={{ fontSize: 19, fontWeight: 800, margin: '0 0 12px' }}>{post.title}</h2>
              {post.masterSegments.map((seg) => (
                <p key={seg.id} style={{ fontSize: 15, lineHeight: 1.65, color: '#27272A', margin: '0 0 10px' }}>
                  {seg.text}
                </p>
              ))}
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
