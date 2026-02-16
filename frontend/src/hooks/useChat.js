/**
 * useChat hook
 *
 * Provides chat functionality: real-time message subscription,
 * sending messages, and reporting. Follows the existing hook pattern
 * (useState, useEffect, useCallback).
 *
 * SECURITY: All write operations go through Cloud Functions.
 * Messages are loaded via Firestore real-time listeners with
 * cursor-based pagination for performance at scale.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { subscribeToChatMessages, sendMessage, reportMessage } from '../firebase/firestore.js';

/**
 * @param {string} chatId - Firestore chat document ID
 * @param {object} options - Hook options
 * @param {number} options.pageSize - Messages per page (default 50)
 */
export function useChat(chatId, { pageSize = 50 } = {}) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);
  const lastSnapshotRef = useRef(null);

  // Subscribe to real-time chat messages
  useEffect(() => {
    if (!chatId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToChatMessages(
      chatId,
      (newMessages, snapshot) => {
        setMessages(newMessages);
        lastSnapshotRef.current = snapshot;
        setLoading(false);
        setError(null);
      },
      pageSize,
    );

    return () => unsubscribe();
  }, [chatId, pageSize]);

  // Send a message via Cloud Function
  const send = useCallback(
    async (message) => {
      if (!chatId || !message?.trim()) return;

      setSending(true);
      setError(null);

      try {
        const result = await sendMessage({ chatId, message: message.trim() });
        if (!result.data.success) {
          setError(result.data.error);
        }
        return result.data;
      } catch (err) {
        const errorMessage = err.message || 'Failed to send message';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setSending(false);
      }
    },
    [chatId],
  );

  // Report a message via Cloud Function
  const report = useCallback(
    async (messageId, reason) => {
      if (!chatId || !messageId) return;

      try {
        const result = await reportMessage({ chatId, messageId, reason });
        return result.data;
      } catch (err) {
        return { success: false, error: err.message };
      }
    },
    [chatId],
  );

  return {
    messages,
    loading,
    error,
    sending,
    send,
    report,
  };
}
