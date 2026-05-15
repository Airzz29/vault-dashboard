'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Starfield from '@/components/Starfield';

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [tfa, setTfa] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, tfa }),
      });
      if (res.ok) {
        router.push('/dashboard/products');
      } else {
        const data = await res.json();
        setError(data.error || 'Invalid credentials');
      }
    } catch {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center">
      <Starfield />
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-vault-card border border-vault-border rounded-vault p-8">
          <div className="text-center mb-8">
            <div className="text-3xl mb-2">
              <span className="text-vault-gold">⚡</span>{' '}
              <span className="text-vault-gold font-bold text-2xl tracking-widest">
                VAULT
              </span>
            </div>
            <p className="text-vault-muted text-sm">
              StreetVault Internal Dashboard
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-vault-muted mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-vault-bg border border-vault-border rounded-lg px-3 py-2.5 text-vault-text focus:outline-none focus:border-vault-accent"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-vault-muted mb-1.5">
                2FA Code
              </label>
              <input
                type="text"
                value={tfa}
                onChange={(e) => setTfa(e.target.value)}
                className="w-full bg-vault-bg border border-vault-border rounded-lg px-3 py-2.5 text-vault-text focus:outline-none focus:border-vault-accent"
                required
              />
            </div>
            {error && (
              <p className="text-vault-danger text-sm text-center">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-vault-accent hover:bg-vault-accent/80 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
