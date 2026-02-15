import { useState } from 'react';
import { useAuth } from '../hooks/useAuth.js';
import { setUsername, deleteAccount } from '../firebase/firestore.js';
import { BLOCKED_PATTERNS } from '../utils/blockedWords.js';
import './AccountPanel.css';

function containsBadWord(name) {
  const lower = name.toLowerCase();
  return BLOCKED_PATTERNS.some((pat) =>
    pat instanceof RegExp ? pat.test(lower) : lower.includes(pat),
  );
}

export default function AccountPanel({ onClose }) {
  const {
    profile,
    isAnonymous,
    signOut,
  } = useAuth();

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  // Username form state (only shown if username not yet set)
  const [usernameValue, setUsernameValue] = useState('');
  const [usernameError, setUsernameError] = useState(null);
  const [usernameLoading, setUsernameLoading] = useState(false);

  const displayName = profile?.display_name || (isAnonymous ? 'Guest' : 'User');
  const usernameSet = profile?.display_name_set === true;

  const handleSetUsername = async (e) => {
    e.preventDefault();
    const trimmed = usernameValue.trim();

    if (trimmed.length < 4 || trimmed.length > 20) {
      setUsernameError('Username must be 4-20 characters');
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
      setUsernameError('Letters, numbers, and underscores only');
      return;
    }
    if (containsBadWord(trimmed)) {
      setUsernameError('That username is not allowed');
      return;
    }

    setUsernameLoading(true);
    setUsernameError(null);

    try {
      const result = await setUsername({ username: trimmed });
      if (!result.data.success) {
        setUsernameError(result.data.error || 'Failed to set username');
      }
    } catch (err) {
      setUsernameError(err.message || 'Something went wrong');
    } finally {
      setUsernameLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      onClose();
    } catch { /* AuthContext handles error */ }
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      await deleteAccount();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to delete account');
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <aside className="account-panel" role="dialog" aria-label="Account">
      <div className="account-panel-header">
        <div className="account-panel-title">Account</div>
        <button
          type="button"
          className="account-panel-close"
          onClick={onClose}
          aria-label="Close"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className="account-panel-body">
        <div className="account-panel-section">
          <div className="account-panel-label">Username</div>
          {usernameSet ? (
            <div className="account-panel-value">
              {displayName}
              {isAnonymous && (
                <span className="account-panel-badge">Guest</span>
              )}
              {profile?.subscription_status === 'pro' && (
                <span className="account-panel-badge account-panel-badge--pro">Pro</span>
              )}
            </div>
          ) : (
            <form className="account-panel-username-form" onSubmit={handleSetUsername}>
              <div className="account-panel-value">
                <span className="account-panel-value-muted">{displayName}</span>
                <span className="account-panel-badge">Not set</span>
              </div>
              <input
                className="account-panel-input"
                type="text"
                placeholder="Choose a username"
                maxLength={20}
                value={usernameValue}
                onChange={(e) => setUsernameValue(e.target.value)}
                disabled={usernameLoading}
              />
              {usernameError && <p className="account-panel-error">{usernameError}</p>}
              <button
                className="account-panel-btn account-panel-btn--primary"
                type="submit"
                disabled={usernameLoading || usernameValue.trim().length < 4}
              >
                {usernameLoading ? 'Setting...' : 'Set username'}
              </button>
              <p className="account-panel-hint">4-20 characters. Letters, numbers, underscores.</p>
            </form>
          )}
        </div>

        <div className="account-panel-actions">
          <button
            type="button"
            className="account-panel-btn"
            onClick={handleSignOut}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Log out
          </button>

          <div className="account-panel-danger">
            {error && <p className="account-panel-error">{error}</p>}

            <button
              type="button"
              className={`account-panel-btn account-panel-btn--danger ${confirmDelete ? 'account-panel-btn--confirm' : ''}`}
              onClick={handleDelete}
              disabled={deleting}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
              {deleting
                ? 'Deleting...'
                : confirmDelete
                  ? 'Are you sure? Click again to confirm'
                  : 'Delete account and data'}
            </button>

            {confirmDelete && !deleting && (
              <button
                type="button"
                className="account-panel-btn account-panel-btn--cancel"
                onClick={() => setConfirmDelete(false)}
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
