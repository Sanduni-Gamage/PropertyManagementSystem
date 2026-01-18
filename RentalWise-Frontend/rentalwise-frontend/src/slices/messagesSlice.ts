import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import api from '../services/api';
import type { Conversation, Message } from '../types/Message';

// Thunks
export const fetchConversationByProperty = createAsyncThunk(
  'chat/fetchConversationByProperty',
  async (propertyId: number) => {
    const res = await api.get<Conversation | null>(`/messaging/property/${propertyId}/conversation`);
    return res.data;
  }
);

export const startConversation = createAsyncThunk(
  'chat/startConversation',
  async (payload: { propertyId: number; landlordId?: string; tenantId?: string }) => {
    const res = await api.post<Conversation>('/messaging/start', payload);
    return res.data;
  }
);

export const fetchMessages = createAsyncThunk(
  'chat/fetchMessages',
  async (conversationId: string) => {
    const res = await api.get<Message[]>(`/messaging/${conversationId}/messages`);
    return res.data;
  }
);

export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async (payload: { conversationId: string; content: string; type?: string; name?: string; email?: string; phone?: string }) => {
    const res = await api.post<Message>(`/messaging/${payload.conversationId}/messages`, payload);
    return res.data;
  }
);

interface ChatState {
  activeConversation: Conversation | null;
  items: Message[];
  loading: boolean;
  error: string | null;
}

const initialState: ChatState = { activeConversation: null, items: [], loading: false, error: null };

const slice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    receiveMessage(state, action: PayloadAction<Message>) {
      // Insert newest first to show at top, or push to end per UI preference
      state.items = [...state.items, action.payload];
    },
    setActiveConversation(state, action: PayloadAction<Conversation | null>) {
      state.activeConversation = action.payload;
      state.items = []; // reset messages on conversation change
    },
  },
  extraReducers(builder) {
    builder
      .addCase(fetchConversationByProperty.fulfilled, (s, a) => { if (a.payload) s.activeConversation = a.payload; })
      .addCase(startConversation.fulfilled, (s, a) => { s.activeConversation = a.payload; })
      .addCase(fetchMessages.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchMessages.fulfilled, (s, a) => { s.loading = false; s.items = a.payload; })
      .addCase(fetchMessages.rejected, (s, a) => { s.loading = false; s.error = a.error.message || 'Failed to load' })
      .addCase(sendMessage.fulfilled, (s, a) => { s.items.push(a.payload); });
  }
});

export const { receiveMessage, setActiveConversation } = slice.actions;
export default slice.reducer;
