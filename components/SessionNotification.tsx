// components/SessionNotification.tsx
import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/styles/theme';
import { useSessions } from '@/hooks/useSessions';
import SessionReviewModal from '@/components/SessionReviewModal';

export default function SessionNotification() {
  const {
    pendingSessions,
    hasPendingSessions,
    selectedSession,
    setSelectedSession,
    approveSession,
    rejectSession,
  } = useSessions();

  if (!hasPendingSessions || Platform.OS === 'web') return null;

  return (
    <>
      <Pressable
        style={styles.notification}
        onPress={() => setSelectedSession(pendingSessions[0])}
      >
        <View style={styles.iconContainer}>
          <Ionicons name="scan" size={24} color={theme.colors.primary} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>New Items Detected</Text>
          <Text style={styles.subtitle}>
            {pendingSessions.length} pending session{pendingSessions.length > 1 ? 's' : ''} to review
          </Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={theme.colors.text.secondary}
        />
      </Pressable>

      {selectedSession && (
        <SessionReviewModal
          session={selectedSession}
          visible={true}
          onClose={() => setSelectedSession(null)}
          onApprove={(items) => approveSession(selectedSession.sessionId, items)}
          onReject={() => rejectSession(selectedSession.sessionId)}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  notification: {
    position: 'absolute',
    bottom: 90, // Above tab bar
    left: theme.spacing.md,
    right: theme.spacing.md,
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  subtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
  },
});