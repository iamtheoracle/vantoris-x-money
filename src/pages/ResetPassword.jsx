import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, LockKeyhole } from 'lucide-react';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [token, setToken] = useState(params.get('token') || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function submit(event) {
    event.preventDefault();
    setError('');
    setSuccess('');
    if (password !== confirmPassword) {
      setError('The passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('/api/member-auth', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({ action: 'reset-password', token: token.trim(), password }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        const messages = {
          password_policy_failed: 'Use at least 12 characters with uppercase, lowercase, a number and a symbol.',
          password_reset_token_invalid: 'Enter the one-time recovery token issued by Vantoris.',
        };
        throw new Error(messages[result.error] || 'Vantoris could not reset this password.');
      }
      setSuccess('Your password has been updated. Sign in with your Vantoris authenticator.');
      setTimeout(() => navigate('/login', { replace: true }), 1200);
    } catch (err) {
      setError(err.message || 'Password recovery is temporarily unavailable.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F4F6F9] px-5 py-12">
      <section className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-navy/5 text-navy"><LockKeyhole size={22} /></span>
        <h1 className="mt-6 text-2xl font-semibold text-navy">Reset your Vantoris password</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">Enter the one-time recovery token issued by Vantoris staff and create a new password. Existing ledger records are not changed.</p>
        {error && <p role="alert" className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
        {success && <p role="status" className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{success}</p>}
        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
            Recovery token
            <input value={token} onChange={event => setToken(event.target.value)} required className="mt-2 block w-full rounded-xl border border-slate-200 px-3 py-3 text-sm font-normal normal-case tracking-normal text-navy" />
          </label>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
            New password
            <input type="password" value={password} onChange={event => setPassword(event.target.value)} required minLength={12} autoComplete="new-password" className="mt-2 block w-full rounded-xl border border-slate-200 px-3 py-3 text-sm font-normal normal-case tracking-normal text-navy" />
          </label>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
            Confirm new password
            <input type="password" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} required minLength={12} autoComplete="new-password" className="mt-2 block w-full rounded-xl border border-slate-200 px-3 py-3 text-sm font-normal normal-case tracking-normal text-navy" />
          </label>
          <p className="text-xs leading-5 text-slate-500">At least 12 characters, including uppercase and lowercase letters, a number and a symbol.</p>
          <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-navy px-5 py-3.5 text-sm font-semibold text-white disabled:opacity-50">
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? 'Updating password…' : 'Update password'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-500"><Link to="/login" className="font-semibold text-navy hover:underline">Return to sign in</Link></p>
      </section>
    </main>
  );
}
