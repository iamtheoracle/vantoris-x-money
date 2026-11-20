import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { ShieldCheck, Lock, X, Loader2, AlertTriangle, Clock } from 'lucide-react';
import {
  requestExceptionAuth,
  logExceptionAuthEvent,
  getActionLabel,
  isLockedOut,
  getLockoutRemaining,
} from '@/lib/exceptionAuth';

// ============================================================
// Super Administrator Exception Authentication Context
// ============================================================
// Provides a `requestAuth(user, action, target)` function that
// shows a secure credential modal and returns a promise resolving
// with { success, grant, reason }.
//
// The credential is collected via a password input (NOT chat text),
// sent to the backend for validation, and immediately cleared from
// React state. It is never stored in browser storage, URLs, logs,
// or chat messages.
// ============================================================

const ExceptionAuthContext = createContext(null);

export function useExceptionAuth() {
  const ctx = useContext(ExceptionAuthContext);
  if (!ctx) {
    throw new Error('useExceptionAuth must be used within ExceptionAuthProvider');
  }
  return ctx;
}

export function ExceptionAuthProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [action, setAction] = useState('');
  const [target, setTarget] = useState('');
  const [credential, setCredential] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lockoutRemaining, setLockoutRemaining] = useState(0);
  const resolveRef = useRef(null);
  const userRef = useRef(null);

  // Trigger the exception auth modal for a specific action + target
  // Returns a promise that resolves with { success, grant, reason }
  const requestAuth = useCallback((user, actionKey, targetResource) => {
    // Fail closed before collecting any credential: the server-side verifier is not configured.
    logExceptionAuthEvent(user, actionKey, targetResource, null, null, 'EXCEPTION_AUTH_UNAVAILABLE');
    return Promise.resolve({
      success: false,
      grant: null,
      reason: 'Privileged exception authorization is not configured. No action was authorized.',
    });
  }, []);

  const close = useCallback((result) => {
    // Immediate cleanup: clear credential from state
    setCredential('');
    setIsOpen(false);
    setAction('');
    setTarget('');
    setError('');
    setLoading(false);
    if (resolveRef.current) {
      resolveRef.current(result);
      resolveRef.current = null;
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!credential.trim() || loading) return;

    // Check lockout
    if (isLockedOut()) {
      setLockoutRemaining(getLockoutRemaining());
      setError(`Temporarily locked out. Try again in ${Math.ceil(getLockoutRemaining() / 60000)} minute(s).`);
      logExceptionAuthEvent(userRef.current, action, target, 'EXCEPTION_AUTHORIZATION_LOCKED', null, 'EXCEPTION_AUTH_LOCKOUT');
      return;
    }

    setLoading(true);
    setError('');

    const cred = credential; // capture before clearing
    setCredential(''); // immediate cleanup

    const user = userRef.current;
    const result = await requestExceptionAuth(user, action, target, cred);

    // Audit log the event (never logs the credential)
    const eventType = result.success ? 'EXCEPTION_AUTH_SUCCESS' : 'EXCEPTION_AUTH_FAILURE';
    await logExceptionAuthEvent(user, action, target, result.result, null, eventType);

    if (result.success) {
      close({ success: true, grant: result.grant, reason: null });
    } else {
      setLoading(false);
      setError(result.reason || 'Exception authentication failed.');
      if (isLockedOut()) {
        setLockoutRemaining(getLockoutRemaining());
      }
    }
  }, [credential, loading, action, target, close]);

  const handleCancel = useCallback(() => {
    // Log the cancellation as a failed attempt
    if (userRef.current && action) {
      logExceptionAuthEvent(userRef.current, action, target, 'EXCEPTION_AUTHORIZATION_FAILED', 'cancelled_by_user', 'EXCEPTION_AUTH_FAILURE');
    }
    close({ success: false, grant: null, reason: 'Cancelled by user' });
  }, [action, target, close]);

  return (
    <ExceptionAuthContext.Provider value={{ requestAuth }}>
      {children}
      {isOpen && (
        <ExceptionAuthModal
          action={action}
          target={target}
          credential={credential}
          setCredential={setCredential}
          loading={loading}
          error={error}
          lockoutRemaining={lockoutRemaining}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      )}
    </ExceptionAuthContext.Provider>
  );
}

// ---- The Modal Component ----
function ExceptionAuthModal({
  action,
  target,
  credential,
  setCredential,
  loading,
  error,
  lockoutRemaining,
  onSubmit,
  onCancel,
}) {
  const inputRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !loading && credential.trim() && !lockoutRemaining) {
      onSubmit();
    }
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  const isLocked = lockoutRemaining > 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md vantoris-glass-premium p-6 animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-navy flex items-center justify-center">
              <ShieldCheck size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Exception Authentication</h2>
              <p className="text-[10px] text-gray uppercase tracking-wider">Super Administrator Only</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            disabled={loading}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-30"
          >
            <X size={18} className="text-gray" />
          </button>
        </div>

        {/* Action description */}
        <div className="mb-5 p-3.5 rounded-xl bg-navy/5 border border-navy/10">
          <p className="text-[10px] text-gray uppercase tracking-wider font-semibold mb-1">Requested Action</p>
          <p className="text-sm font-medium text-foreground">{getActionLabel(action)}</p>
          {target && target !== '*' && (
            <p className="text-xs text-gray mt-1">Target: {target}</p>
          )}
        </div>

        {/* Security notice */}
        <div className="mb-4 flex items-start gap-2 p-3 rounded-lg bg-brass/8 border border-brass/15">
          <Lock size={14} className="text-brass flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-foreground/70 leading-relaxed">
            This action requires Super Administrator exception authorization. The credential is validated securely and is never stored, logged, or sent to the AI.
          </p>
        </div>

        {/* Credential input */}
        <input
          ref={inputRef}
          type="password"
          value={credential}
          onChange={(e) => setCredential(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter exception credential"
          disabled={loading || isLocked}
          autoComplete="off"
          className="w-full bg-white border border-border rounded-xl px-4 py-3 text-sm focus:border-navy/30 focus:outline-none disabled:opacity-50 selectable-content"
        />

        {/* Error / lockout */}
        {error && (
          <div className="mt-3 flex items-start gap-2 p-2.5 rounded-lg bg-crimson/8 border border-crimson/15">
            {isLocked ? <Clock size={14} className="text-crimson flex-shrink-0 mt-0.5" /> : <AlertTriangle size={14} className="text-crimson flex-shrink-0 mt-0.5" />}
            <p className="text-xs text-crimson">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2.5 mt-5">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium text-gray hover:bg-slate-50 transition-colors disabled:opacity-30"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={loading || !credential.trim() || isLocked}
            className="flex-1 py-2.5 rounded-xl bg-navy text-white text-sm font-semibold hover:bg-navy/90 transition-colors disabled:opacity-30 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Verifying...
              </>
            ) : (
              'Authorize'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}