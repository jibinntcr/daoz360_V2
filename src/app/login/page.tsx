'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('alex@acmestudio.io');
  const [password, setPassword] = useState('Customer!2026');
  const [totpCode, setTotpCode] = useState('');
  const [requiresMfa, setRequiresMfa] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          email,
          password,
          totpCode: totpCode || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        if (data.requiresMfa) {
          setRequiresMfa(true);
        }
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

  function fillDemoAccount(role: 'customer' | 'editor' | 'reviewer' | 'super_admin' | 'ops_admin') {
    setError('');
    if (role === 'customer') {
      setEmail('alex@acmestudio.io');
      setPassword('Customer!2026');
      setRequiresMfa(false);
      setTotpCode('');
    } else if (role === 'editor') {
      setEmail('maya@acmestudio.io');
      setPassword('Editor!2026');
      setRequiresMfa(false);
      setTotpCode('');
    } else if (role === 'reviewer') {
      setEmail('liam@acmestudio.io');
      setPassword('Reviewer!2026');
      setRequiresMfa(false);
      setTotpCode('');
    } else if (role === 'super_admin') {
      setEmail('admin@daoz360.ai');
      setPassword('ChangeMeImmediately!2026');
      setRequiresMfa(true);
      setTotpCode('123456');
    } else if (role === 'ops_admin') {
      setEmail('ops@daoz360.ai');
      setPassword('OpsAdmin!2026');
      setRequiresMfa(true);
      setTotpCode('123456');
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAFA', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '40px 16px' }}>
      <div style={{ maxWidth: '460px', width: '100%', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <Link href="/" style={{ display: 'inline-block', marginBottom: '16px' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/logo-daoz360-transparent.png" alt="DAOZ360" width={170} height={34} />
          </Link>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#18181B', margin: '0 0 8px' }}>
            Sign in to DAOZ360
          </h1>
          <p style={{ fontSize: '14px', color: '#52525B', margin: 0 }}>
            Access your social media workspace or platform administration console.
          </p>
        </div>

        <div className="card-base" style={{ padding: '28px', background: '#FFFFFF', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.06)' }}>
          {error && (
            <div role="alert" style={{ padding: '12px 14px', background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C', borderRadius: '10px', fontSize: '13px', marginBottom: '18px' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '16px' }}>
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

            <div style={{ marginBottom: '16px' }}>
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

            {requiresMfa && (
              <div style={{ marginBottom: '18px', padding: '14px', background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: '10px' }}>
                <label htmlFor="login-totp" style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#9A3412', marginBottom: '6px' }}>
                  Platform Administrator MFA Code (6-digit TOTP)
                </label>
                <input
                  id="login-totp"
                  type="text"
                  maxLength={6}
                  placeholder="123456"
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value)}
                  className="form-input"
                  style={{ width: '100%', letterSpacing: '3px', fontWeight: 700 }}
                />
                <span style={{ display: 'block', fontSize: '11px', color: '#C2410C', marginTop: '6px' }}>
                  Platform Super Admins and Operations Admins require MFA verification.
                </span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '12px 18px', fontSize: '15px' }}
            >
              <span>{loading ? 'Signing in...' : 'Sign In'}</span>
            </button>
          </form>

          <div style={{ marginTop: '22px', paddingTop: '18px', borderTop: '1px solid #E4E4E7' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#71717A', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
              Quick Sandbox Role Switcher
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              <button type="button" onClick={() => fillDemoAccount('customer')} style={{ fontSize: '12px', padding: '6px 10px', borderRadius: '8px', border: '1px solid #E4E4E7', background: '#F4F4F5', cursor: 'pointer', fontWeight: 600 }}>
                Workspace Owner (Alex)
              </button>
              <button type="button" onClick={() => fillDemoAccount('editor')} style={{ fontSize: '12px', padding: '6px 10px', borderRadius: '8px', border: '1px solid #E4E4E7', background: '#F4F4F5', cursor: 'pointer', fontWeight: 600 }}>
                Editor (Maya)
              </button>
              <button type="button" onClick={() => fillDemoAccount('reviewer')} style={{ fontSize: '12px', padding: '6px 10px', borderRadius: '8px', border: '1px solid #E4E4E7', background: '#F4F4F5', cursor: 'pointer', fontWeight: 600 }}>
                Publisher / Approver (Liam)
              </button>
              <button type="button" onClick={() => fillDemoAccount('super_admin')} style={{ fontSize: '12px', padding: '6px 10px', borderRadius: '8px', border: '1px solid #FED7AA', background: '#FFF7ED', color: '#C2410C', cursor: 'pointer', fontWeight: 600 }}>
                Platform Super Admin (+MFA)
              </button>
              <button type="button" onClick={() => fillDemoAccount('ops_admin')} style={{ fontSize: '12px', padding: '6px 10px', borderRadius: '8px', border: '1px solid #FED7AA', background: '#FFF7ED', color: '#C2410C', cursor: 'pointer', fontWeight: 600 }}>
                Operations Admin (+MFA)
              </button>
            </div>
          </div>
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
