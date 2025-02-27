import { FridgeSession } from '../services/mqtt/mockMqttService';

export interface EditableFridgeItem {
  name: string;
  direction: 'in' | 'out';
  confidence: number;
  quantity: number;
  expiryDate?: string;
  category?: string;
  notes?: string;
}

export interface EditableSession extends Omit<FridgeSession, 'items'> {
  items: EditableFridgeItem[];
}

export type SessionStatus = 'pending' | 'approved' | 'rejected';
