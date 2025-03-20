import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/styles/theme';
import { type EditableFridgeItem } from '@/types/session';
import { SessionStatus } from './FilterHeader';

interface SessionItemProps {
  item: EditableFridgeItem;
  index: number;
  sessionStatus: SessionStatus;
  onEdit?: (index: number) => void;
}

const SessionItem: React.FC<SessionItemProps> = ({ 
  item, 
  index, 
  sessionStatus, 
  onEdit 
}) => {
  return (
    <View style={styles.itemRow}>
      {/* Optional image if provided by RPi5 camera */}
      {item.imageUrl && (
        <Image 
          source={{ uri: item.imageUrl }} 
          style={styles.itemImage}
          resizeMode="cover"
        />
      )}
      
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        
        {/* Show barcode if available */}
        {item.barcode && (
          <View style={styles.barcodeContainer}>
            <Ionicons name="barcode-outline" size={16} color={theme.colors.text.secondary} />
            <Text style={styles.barcodeText}>{item.barcode}</Text>
          </View>
        )}
        
        {/* Show confidence if below threshold */}
        {item.confidence < 0.8 && (
          <Text style={styles.lowConfidence}>
            Low confidence detection ({Math.round(item.confidence * 100)}%)
          </Text>
        )}
      </View>

      <View style={styles.itemDetails}>
        <Ionicons
          name={item.direction === 'in' ? 'arrow-down' : 'arrow-up'}
          size={20}
          color={theme.colors.text.primary}
        />
        <Text style={styles.direction}>
          {item.direction === 'in' ? 'In' : 'Out'}
        </Text>
        {item.quantity && item.direction === 'in' && (
          <Text style={styles.quantity}>× {item.quantity}</Text>
        )}
        
        {sessionStatus === 'pending' && onEdit && (
          <Pressable
            style={styles.editButton}
            onPress={() => onEdit(index)}
          >
            <Ionicons
              name="pencil"
              size={16}
              color={theme.colors.text.secondary}
            />
          </Pressable>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.background.secondary,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  itemImage: {
    width: 50,
    height: 50,
    borderRadius: theme.borderRadius.md,
    marginRight: theme.spacing.sm,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: theme.fontSize.md,
    fontWeight: '500',
    color: theme.colors.text.primary,
  },
  barcodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  barcodeText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    marginLeft: 4,
  },
  lowConfidence: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.status.warning,
    marginTop: 2,
  },
  itemDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  direction: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.primary,
  },
  quantity: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  editButton: {
    padding: theme.spacing.xs,
    marginLeft: theme.spacing.sm,
  },
});

export default SessionItem;