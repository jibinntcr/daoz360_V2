'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [workspaceName, setWorkspaceName] = useState('');
  const [planId, setPlanId] = useState<'starter' | 'growth' | 'agency'>('growth');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register',
          name,
          email,
          password,
          workspaceName,
          planId,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || 'Registration failed');
        setLoading(false);
        return;
      }
      router.push('/dashboard');
    } catch {
      setError('Network error while creating workspace.');
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAFA', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '40px 16px' }}>
      <div style={{ maxWidth: '480px', width: '100%', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <Link href="/" style={{ display: 'inline-block', marginBottom: '16px' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/logo-daoz360-transparent.png" alt="DAOZ360" width={170} height={34} />
          </Link>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#18181B', margin: '0 0 8px' }}>
            Create your DAOZ360 Workspace
          </h1>
          <p style={{ fontSize: '14px', color: '#52525B', margin: 0 }}>
            Start planning, collaborating, and publishing across your connected social channels.
          </p>
        </div>

        <div className="card-base" style={{ padding: '28px', background: '#FFFFFF', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.06)' }}>
          {error && (
            <div role="alert" style={{ padding: '12px 14px', background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C', borderRadius: '10px', fontSize: '13px', marginBottom: '18px' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleRegister}>
            <div style={{ marginBottom: '14px' }}>
              <label htmlFor="reg-name" style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#27272A', marginBottom: '6px' }}>
                Your Name
              </label>
              <input
                id="reg-name"
                type="text"
                placeholder="e.g. Alex Morgan"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="form-input"
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label htmlFor="reg-email" style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#27272A', marginBottom: '6px' }}>
                Work Email
              </label>
              <input
                id="reg-email"
                type="email"
                placeholder="alex@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="form-input"
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label htmlFor="reg-ws" style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#27272A', marginBottom: '6px' }}>
                Brand or Workspace Name
              </label>
              <input
                id="reg-ws"
                type="text"
                placeholder="e.g. Acme Studio"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                required
                className="form-input"
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label htmlFor="reg-plan" style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#27272A', marginBottom: '6px' }}>
                Initial Package Tier
              </label>
              <select
                id="reg-plan"
                value={planId}
                onChange={(e) => setPlanId(e.target.value as any)}
                className="form-input"
                style={{ width: '100%' }}
              >
                <option value="starter">Starter — 5 accounts, 1 user, 300 deliveries/mo</option>
                <option value="growth">Growth (Recommended) — 15 accounts, 3 users, 1,500 deliveries/mo</option>
                <option value="agency">Agency — 40 accounts, 10 users, 5,000 deliveries/mo</option>
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label htmlFor="reg-pass" style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#27272A', marginBottom: '6px' }}>
                Password
              </label>
              <input
                id="reg-pass"
                type="password"
                placeholder="At least 8 characters"
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="form-input"
                style={{ width: '100%' }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '12px 18px', fontSize: '15px' }}
            >
              <span>{loading ? 'Creating Workspace...' : 'Create Workspace & Continue'}</span>
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: '14px', color: '#52525B', marginTop: '20px' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: '#FF5A00', fontWeight: 700, textDecoration: 'none' }}>
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
