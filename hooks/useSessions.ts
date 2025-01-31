// hooks/useSessions.ts
import { useState, useEffect, useCallback } from 'react';
import { type FridgeSession, type FridgeItem } from '@/services/mqtt/mockMqttService';
import { sessionManager } from '@/services/sessionManager';

export const useSessions = () => {
  const [sessions, setSessions] = useState<FridgeSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<FridgeSession | null>(null);

  useEffect(() => {
    const unsubscribe = sessionManager.subscribe(setSessions);
    return unsubscribe;
  }, []);

  const handleApproveSession = useCallback(async (sessionId: string, updatedItems: FridgeItem[]) => {
    try {
      const changes = await sessionManager.approveSession(sessionId, updatedItems);
      if (changes) {
        let message = [];
        if (changes.added > 0) message.push(`Added ${changes.added} new items`);
        if (changes.updated > 0) message.push(`Updated ${changes.updated} existing items`);
        if (changes.removed > 0) message.push(`Removed ${changes.removed} items`);
        
        Alert.alert(
          'Session Approved',
          message.join('\n'),
          [{ text: 'OK' }]
        );
      }
      setSelectedSession(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to update items');
      console.error('Error approving session:', error);
    }
  }, []);

  const handleRejectSession = useCallback(async (sessionId: string) => {
    await sessionManager.rejectSession(sessionId);
    setSelectedSession(null);
  }, []);

  const pendingSessions = sessions.filter(session => session.status === 'pending');
  const hasPendingSessions = pendingSessions.length > 0;

  return {
    sessions,
    pendingSessions,
    hasPendingSessions,
    selectedSession,
    setSelectedSession,
    approveSession: handleApproveSession,
    rejectSession: handleRejectSession,
  };
};