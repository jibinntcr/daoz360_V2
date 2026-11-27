'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function ScopedClientReviewPage() {
  const params = useParams();
  const token = String(params?.token || '');
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');
  const [reviewerName, setReviewerName] = useState('');
  const [comment, setComment] = useState('');
  const [submittedMsg, setSubmittedMsg] = useState('');

  useEffect(() => {
    if (!token) return;
    fetch(`/api/dashboard?clientReviewToken=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setData(json);
        else setError(json.error || 'Review link expired or revoked.');
      })
      .catch(() => setError('Failed to load review link.'));
  }, [token]);

  async function submitDecision(decision?: 'approved' | 'changes_requested') {
    const res = await fetch('/api/dashboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'submit_client_review',
        clientReviewToken: token,
        reviewerName: reviewerName || 'External Client Reviewer',
        comment,
        decision,
      }),
    });
    const json = await res.json();
    if (json.success) {
      setSubmittedMsg(`Thank you! Your review (${decision || 'comment'}) has been recorded on Revision #${data.draft.currentRevisionNumber}.`);
      setComment('');
    }
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ maxWidth: 420, textAlign: 'center' }}>
          <h2>Review Link Unavailable</h2>
          <p style={{ color: '#71717A' }}>{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Loading scoped draft review...</div>;
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAFA', padding: '48px 16px', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: 640, margin: '0 auto', background: '#FFFFFF', padding: 28, borderRadius: 16, border: '1px solid #E4E4E7' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#FF5A00', textTransform: 'uppercase' }}>
          DAOZ360 Scoped Client Review (Revision #{data.draft.currentRevisionNumber})
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: '6px 0 16px' }}>{data.draft.title}</h1>

        {submittedMsg && (
          <div style={{ padding: 12, background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#065F46', borderRadius: 8, marginBottom: 16, fontSize: 13.5 }}>
            {submittedMsg}
          </div>
        )}

        <div style={{ marginBottom: 20 }}>
          {data.draft.masterSegments.map((s: any, idx: number) => (
            <div key={s.id} style={{ padding: 14, borderRadius: 10, background: '#F4F4F5', marginBottom: 10 }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: '#71717A', marginBottom: 4 }}>Segment #{idx + 1}</div>
              <div style={{ fontSize: 14.5 }}>{s.text}</div>
            </div>
          ))}
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 4 }}>Your Name</label>
          <input
            type="text"
            value={reviewerName}
            onChange={(e) => setReviewerName(e.target.value)}
            placeholder="Client Reviewer Name"
            style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #D4D4D8', marginBottom: 10 }}
          />
          <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 4 }}>Feedback / Approval Note</label>
          <textarea
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add optional notes or requested edits..."
            style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #D4D4D8' }}
          />
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            onClick={() => submitDecision('approved')}
            style={{ padding: '10px 16px', borderRadius: 8, background: '#16A34A', color: '#FFF', border: 'none', fontWeight: 700, cursor: 'pointer' }}
          >
            ✓ Approve Draft
          </button>
          <button
            type="button"
            onClick={() => submitDecision('changes_requested')}
            style={{ padding: '10px 16px', borderRadius: 8, background: '#DC2626', color: '#FFF', border: 'none', fontWeight: 700, cursor: 'pointer' }}
          >
            Request Changes
          </button>
        </div>
      </div>
    </div>
  );
}
