/**
 * useAuth hook
 *
 * Convenience hook to access the AuthContext.
 * Follows the existing hook naming convention (useAuth, useFeed, etc.)
 */

import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext.jsx';

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
