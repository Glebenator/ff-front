// types/session.ts
// Type definitions for fridge sessions

import { FridgeSession, FridgeItem } from '../services/mqtt/mqttService';

export interface EditableFridgeItem extends FridgeItem {
  expiryDate?: string;
  category?: string;
  notes?: string;
}

export interface EditableSession extends Omit<FridgeSession, 'items'> {
  items: EditableFridgeItem[];
}

export type SessionStatus = 'pending' | 'approved' | 'rejected';