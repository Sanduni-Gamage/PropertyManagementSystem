// src/types/chat.ts

// -------------------------
// Participant roles
// -------------------------
export type ParticipantRole = 1 | 2 | 3;

export const ParticipantRoles = {
  Landlord: 1 as ParticipantRole,
  Tenant: 2 as ParticipantRole,
  Admin: 3 as ParticipantRole,
};

// -------------------------
// Message attachments
// -------------------------
export interface MessageAttachment {
  id: string;
  messageId: string;
  fileName: string;
  contentType: string;
  url: string;
  sizeBytes: number;
}

// -------------------------
// Chat messages
// -------------------------
export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderEmail?: string; // lightweight display
  body: string;
  createdAtUtc: string; // ISO string
  editedAtUtc?: string;
  replyToMessageId?: string | null;
  attachments?: MessageAttachment[];
}

// -------------------------
// Conversation participants
// -------------------------
export interface ConversationParticipant {
  id: string;
  conversationId: string;
  userId: string;
  role: ParticipantRole;
  joinedAtUtc: string;
  leftAtUtc?: string | null;
}

// -------------------------
// Conversations
// -------------------------
export interface Conversation {
  id: string;
  propertyId?: string;
  createdAtUtc: string;
  isArchived: boolean;
  participants: ConversationParticipant[];
  messages: ChatMessage[];
}

// -------------------------
// Redux slice type
// -------------------------
export interface ChatState {
  connected: boolean;
  messages: Record<string, ChatMessage[]>; // conversationId -> messages
  joined: string[]; // conversationIds currently joined
  loading?: boolean;
  error?: string;
}
