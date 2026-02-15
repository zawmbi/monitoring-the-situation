import { useState } from 'react';
import { useAuth } from '../hooks/useAuth.js';
import { deleteAccount } from '../firebase/firestore.js';
import './AccountPanel.css';

export default function AccountPanel({ onClose }) {
  const {
    profile,
    isAnonymous,
    signOut,
  } = useAuth();

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  const displayName = profile?.display_name || (isAnonymous ? 'Guest' : 'User');

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
      // Auth state listener will handle the rest
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
          <div className="account-panel-value">
            {displayName}
            {!profile?.display_name_set && (
              <span className="account-panel-badge">Not set</span>
            )}
            {isAnonymous && (
              <span className="account-panel-badge">Guest</span>
            )}
            {profile?.subscription_status === 'pro' && (
              <span className="account-panel-badge account-panel-badge--pro">Pro</span>
            )}
          </div>
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
