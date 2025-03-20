// hooks/useSessions.ts
// Hook for managing sessions in the application

import { useState, useEffect, useCallback, useRef } from 'react';
import { FridgeSession, FridgeItem } from '@/services/mqtt/mqttService';
import { sessionManager } from '@/services/sessionManager';
import { toastStore } from '@/services/toastStore';

export const useSessions = () => {
  const [sessions, setSessions] = useState<FridgeSession[]>([]);
  const [showNotification, setShowNotification] = useState(false);
  const previousSessionIds = useRef(new Set<string>());

  useEffect(() => {
    const unsubscribe = sessionManager.subscribe((newSessions) => {
      setSessions(newSessions);
      
      // Check for new pending sessions that we haven't seen before
      const currentSessionIds = new Set(newSessions.map(s => s.sessionId));
      const hasNewPendingSessions = newSessions.some(session => 
        session.status === 'pending' && !previousSessionIds.current.has(session.sessionId)
      );

      if (hasNewPendingSessions) {
        setShowNotification(true);
      }

      // Update our reference of known session IDs
      previousSessionIds.current = currentSessionIds;
    });
    
    return unsubscribe;
  }, []);

  const handleApproveSession = useCallback(async (sessionId: string, updatedItems: FridgeItem[]) => {
    try {
      const changes = await sessionManager.approveSession(sessionId, updatedItems);
      if (changes) {
        let message = [];
        if (changes.added > 0) message.push(`${changes.added} items added`);
        if (changes.removed > 0) message.push(`${changes.removed} items removed`);
        
        toastStore.success(message.join(', '));
      }
    } catch (error) {
      console.error('Error approving session:', error);
      toastStore.error('Failed to update items');
    }
  }, []);

  const handleRejectSession = useCallback(async (sessionId: string) => {
    try {
      await sessionManager.rejectSession(sessionId);
      toastStore.success('Session rejected');
    } catch (error) {
      console.error('Error rejecting session:', error);
      toastStore.error('Failed to reject session');
    }
  }, []);

  const dismissNotification = useCallback(() => {
    setShowNotification(false);
  }, []);

  const pendingSessions = sessions.filter(session => session.status === 'pending');
  const hasPendingSessions = pendingSessions.length > 0 && showNotification;

  return {
    sessions,
    pendingSessions,
    hasPendingSessions,
    approveSession: handleApproveSession,
    rejectSession: handleRejectSession,
    dismissNotification,
  };
};