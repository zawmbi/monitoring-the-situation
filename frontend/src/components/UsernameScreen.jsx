import { useState } from 'react';
import { setUsername } from '../firebase/firestore.js';
import './UsernameScreen.css';

export default function UsernameScreen() {
  const [value, setValue] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = value.trim();

    if (trimmed.length < 2 || trimmed.length > 20) {
      setError('Username must be 2-20 characters');
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
      setError('Letters, numbers, and underscores only');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await setUsername({ username: trimmed });
      if (!result.data.success) {
        setError(result.data.error || 'Failed to set username');
        setLoading(false);
      }
      // On success, the Firestore listener in AuthContext will pick up the
      // profile change and automatically dismiss this screen.
    } catch (err) {
      setError(err.message || 'Something went wrong');
      setLoading(false);
    }
  };

  return (
    <div className="username-screen">
      <form className="username-card" onSubmit={handleSubmit}>
        <h2 className="username-title">Choose a username</h2>
        <p className="username-subtitle">
          This is how others will see you in chat.
        </p>

        <input
          className="username-input"
          type="text"
          placeholder="Username"
          maxLength={20}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoFocus
          disabled={loading}
        />

        {error && <p className="username-error">{error}</p>}

        <button
          className="username-btn"
          type="submit"
          disabled={loading || value.trim().length < 2}
        >
          {loading ? 'Setting...' : 'Continue'}
        </button>

        <p className="username-hint">
          2-20 characters. Letters, numbers, underscores.
        </p>
      </form>
    </div>
  );
}
