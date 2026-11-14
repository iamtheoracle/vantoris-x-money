import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ShieldCheck, Loader2, CircleAlert } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

function readMfaCsrf() {
  const item = document.cookie.split(';').map(value => value.trim()).find(value => value.startsWith('__Host-vantoris_mfa_csrf='));
  return item ? decodeURIComponent(item.slice('__Host-vantoris_mfa_csrf='.length)) : '';
}

export default function Register() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { checkUserAuth } = useAuth();
  const [token, setToken] = useState(searchParams.get('token') || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [mfaSetup, setMfaSetup] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    setError('');
    if (!mfaSetup && password !== confirmPassword) {
      setError('The passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const confirming = Boolean(mfaSetup);
      const headers = { 'content-type': 'application/json', accept: 'application/json' };
      if (confirming) headers['x-csrf-token'] = readMfaCsrf();
      const body = confirming
        ? { action: 'mfa-enroll-confirm', otp }
        : { action: 'activate', token: token.trim(), password };
      const response = await fetch('/api/member-auth', {
        method: 'POST',
        credentials: 'same-origin',
        headers,
        body: JSON.stringify(body),
      });
      const result = await response.json().catch(() => ({}));
      if (result.error === 'mfa_setup_required') {
        setMfaSetup(result.mfaSetup || null);
        setError(result.message || 'Set up your Vantoris authenticator to finish activation.');
        return;
      }
      if (result.error === 'mfa_code_invalid') {
        setError('That authenticator code is not valid. Try the current six-digit code.');
        return;
      }
      if (!response.ok || !result.member?.id) {
        const messages = {
          activation_token_invalid: 'Enter the activation token issued by Vantoris.',
          password_policy_failed: 'Use at least 12 characters with uppercase, lowercase, a number and a symbol.',
          mfa_enrollment_expired: 'Your authenticator setup expired. Request a new activation token.',
        };
        throw new Error(messages[result.error] || 'Vantoris could not complete member activation.');
      }
      const authenticated = await checkUserAuth();
      if (!authenticated) throw new Error('Your new member session could not be confirmed.');
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || 'Member activation is temporarily unavailable.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F4F6F9] px-5 py-12">
      <section className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-navy/5 text-navy"><ShieldCheck size={23} /></span>
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Vantoris Private Banking</p>
        <h1 className="mt-2 text-2xl font-semibold text-navy">{mfaSetup ? 'Secure your member access' : 'Activate your Vantoris membership'}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Membership is approved by Vantoris. This one-time activation token is issued by Vantoris staff; it does not create membership by itself.
        </p>

        {error && <div role="status" className="mt-5 flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950"><CircleAlert size={17} className="mt-0.5 shrink-0" /><span>{error}</span></div>}

        <form onSubmit={submit} className="mt-6 space-y-4">
          {!mfaSetup ? (
            <>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Vantoris activation token
                <input value={token} onChange={event => setToken(event.target.value)} required autoComplete="one-time-code" className="mt-2 block w-full rounded-xl border border-slate-200 px-3 py-3 text-sm font-normal normal-case tracking-normal text-navy outline-none focus:border-navy" />
              </label>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Create password
                <input type="password" value={password} onChange={event => setPassword(event.target.value)} required minLength={12} autoComplete="new-password" className="mt-2 block w-full rounded-xl border border-slate-200 px-3 py-3 text-sm font-normal normal-case tracking-normal text-navy outline-none focus:border-navy" />
              </label>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Confirm password
                <input type="password" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} required minLength={12} autoComplete="new-password" className="mt-2 block w-full rounded-xl border border-slate-200 px-3 py-3 text-sm font-normal normal-case tracking-normal text-navy outline-none focus:border-navy" />
              </label>
              <p className="text-xs leading-5 text-slate-500">Use at least 12 characters, including uppercase and lowercase letters, a number and a symbol.</p>
            </>
          ) : (
            <>
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
                <p className="font-semibold">Add this account to your authenticator</p>
                <p className="mt-1 text-xs leading-5">This secret is displayed once. Store it securely before continuing.</p>
                <p className="mt-3 break-all rounded-lg bg-white p-3 font-mono text-xs">{mfaSetup.secret}</p>
                <p className="mt-2 break-all text-[11px] leading-4">{mfaSetup.otpauthUri}</p>
              </div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Six-digit authenticator code
                <input value={otp} onChange={event => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" maxLength={6} required className="mt-2 block w-full rounded-xl border border-slate-200 px-3 py-3 text-center text-lg tracking-[0.35em] text-navy outline-none focus:border-navy" />
              </label>
            </>
          )}
          <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-navy px-5 py-3.5 text-sm font-semibold text-white disabled:opacity-50">
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? 'Please wait…' : mfaSetup ? 'Verify authenticator and activate' : 'Activate membership'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-500">Already activated? <Link to="/login" className="font-semibold text-navy hover:underline">Sign in</Link></p>
      </section>
    </main>
  );
}
