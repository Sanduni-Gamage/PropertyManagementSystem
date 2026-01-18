export type MessageType = 'tour' | 'apply' | 'question' | 'text';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  recipientId?: string;
  type: MessageType;
  name: string;
  email?: string;
  phone?: string;
  content: string;
  createdAt: string;
  isRead?: boolean;
}

export interface Conversation {
  id: string;
  propertyId?: number;
  landlordId?: string;
  tenantId?: string;
  createdAt: string;
}
