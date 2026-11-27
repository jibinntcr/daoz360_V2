'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@daoz360.ai');
  const [password, setPassword] = useState('ChangeMeImmediately!2026');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function performSignIn(targetEmail: string, targetPassword: string) {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          email: targetEmail,
          password: targetPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || 'Login failed');
        setLoading(false);
        return;
      }

      if (data.user?.platformRole === 'super_admin' || data.user?.platformRole === 'operations_admin') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } catch {
      setError('Network error while signing in.');
      setLoading(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    await performSignIn(email, password);
  }

  function instantSignInAs(role: 'customer' | 'editor' | 'reviewer' | 'super_admin' | 'ops_admin') {
    if (role === 'super_admin') {
      setEmail('admin@daoz360.ai');
      setPassword('ChangeMeImmediately!2026');
      performSignIn('admin@daoz360.ai', 'ChangeMeImmediately!2026');
    } else if (role === 'ops_admin') {
      setEmail('ops@daoz360.ai');
      setPassword('OpsAdmin!2026');
      performSignIn('ops@daoz360.ai', 'OpsAdmin!2026');
    } else if (role === 'customer') {
      setEmail('alex@acmestudio.io');
      setPassword('Customer!2026');
      performSignIn('alex@acmestudio.io', 'Customer!2026');
    } else if (role === 'editor') {
      setEmail('maya@acmestudio.io');
      setPassword('Editor!2026');
      performSignIn('maya@acmestudio.io', 'Editor!2026');
    } else if (role === 'reviewer') {
      setEmail('liam@acmestudio.io');
      setPassword('Reviewer!2026');
      performSignIn('liam@acmestudio.io', 'Reviewer!2026');
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
            Sign in to DAOZ360
          </h1>
          <p style={{ fontSize: '14px', color: '#52525B', margin: 0 }}>
            1-Click Instant Testing Access (MFA friction disabled for testing phase)
          </p>
        </div>

        <div className="card-base" style={{ padding: '28px', background: '#FFFFFF', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.06)' }}>
          {/* 1-Click Instant Login Buttons at the Top */}
          <div style={{ marginBottom: '22px', paddingBottom: '20px', borderBottom: '1px solid #E4E4E7' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#18181B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
              ⚡ 1-Click Instant Login (Click any role to enter immediately)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
              <button
                type="button"
                disabled={loading}
                onClick={() => instantSignInAs('super_admin')}
                style={{ fontSize: '13px', padding: '10px 12px', borderRadius: '10px', border: '1px solid #FF5A00', background: '#FF5A00', color: '#FFFFFF', cursor: 'pointer', fontWeight: 700 }}
              >
                🚀 Super Admin (/admin)
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => instantSignInAs('customer')}
                style={{ fontSize: '13px', padding: '10px 12px', borderRadius: '10px', border: '1px solid #18181B', background: '#18181B', color: '#FFFFFF', cursor: 'pointer', fontWeight: 700 }}
              >
                📊 Workspace Owner (/dashboard)
              </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              <button
                type="button"
                disabled={loading}
                onClick={() => instantSignInAs('ops_admin')}
                style={{ flex: 1, fontSize: '12px', padding: '8px 10px', borderRadius: '8px', border: '1px solid #FED7AA', background: '#FFF7ED', color: '#C2410C', cursor: 'pointer', fontWeight: 600 }}
              >
                Operations Admin
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => instantSignInAs('editor')}
                style={{ flex: 1, fontSize: '12px', padding: '8px 10px', borderRadius: '8px', border: '1px solid #E4E4E7', background: '#F4F4F5', color: '#18181B', cursor: 'pointer', fontWeight: 600 }}
              >
                Editor (Maya)
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => instantSignInAs('reviewer')}
                style={{ flex: 1, fontSize: '12px', padding: '8px 10px', borderRadius: '8px', border: '1px solid #E4E4E7', background: '#F4F4F5', color: '#18181B', cursor: 'pointer', fontWeight: 600 }}
              >
                Approver (Liam)
              </button>
            </div>
          </div>

          {error && (
            <div role="alert" style={{ padding: '12px 14px', background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C', borderRadius: '10px', fontSize: '13px', marginBottom: '18px' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '14px' }}>
              <label htmlFor="login-email" style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#27272A', marginBottom: '6px' }}>
                Work Email
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="form-input"
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label htmlFor="login-password" style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#27272A', marginBottom: '6px' }}>
                Password
              </label>
              <input
                id="login-password"
                type="password"
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
              <span>{loading ? 'Signing in...' : 'Sign In'}</span>
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: '14px', color: '#52525B', marginTop: '20px' }}>
          New to DAOZ360?{' '}
          <Link href="/register" style={{ color: '#FF5A00', fontWeight: 700, textDecoration: 'none' }}>
            Create a workspace
          </Link>{' '}
          &bull;{' '}
          <Link href="/" style={{ color: '#52525B', textDecoration: 'none' }}>
            Back to Home
          </Link>
        </p>
      </div>
    </div>
  );
}
