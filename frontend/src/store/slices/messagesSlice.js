import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiClient } from '../../utils/api';

export const fetchConversations = createAsyncThunk(
  'messages/fetchConversations',
  async (token, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/messages/conversations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch conversations');
    }
  }
);

export const fetchMessages = createAsyncThunk(
  'messages/fetchMessages',
  async ({ conversationId, token }, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/messages/conversations/${conversationId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch messages');
    }
  }
);

export const sendMessage = createAsyncThunk(
  'messages/sendMessage',
  async ({ conversationId, text, token }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(
        `/messages/conversations/${conversationId}/messages`,
        { text },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to send message');
    }
  }
);

export const createConversation = createAsyncThunk(
  'messages/createConversation',
  async ({ recipientId, subject, firstMessage, token }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(
        '/messages/conversations',
        { recipientId, subject, firstMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create conversation');
    }
  }
);

export const searchUsers = createAsyncThunk(
  'messages/searchUsers',
  async ({ query, token }, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/users/search-public?q=${query}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to search users');
    }
  }
);

const initialState = {
  conversations: [],
  messages: [],
  selectedConversation: null,
  users: [],
  loading: false,
  messagesLoading: false,
  sending: false,
  error: null,
};

const messagesSlice = createSlice({
  name: 'messages',
  initialState,
  reducers: {
    setSelectedConversation: (state, action) => {
      state.selectedConversation = action.payload;
    },
    addMessage: (state, action) => {
      const convId = state.selectedConversation?._id || state.selectedConversation?.id;
      const msgConvId = action.payload.conversationId?.toString() || action.payload.conversationId;
      
      if (convId === msgConvId) {
        const exists = state.messages.some(m => m.id === action.payload.id);
        if (!exists) {
          state.messages.push(action.payload);
        }
      }
      const convIndex = state.conversations.findIndex(c => 
        (c._id?.toString() === msgConvId || c.id?.toString() === msgConvId)
      );
      if (convIndex !== -1) {
        state.conversations[convIndex].preview = action.payload.text;
        state.conversations[convIndex].time = action.payload.createdAt || new Date().toISOString();
      }
    },
    updateTypingStatus: (state, action) => {
      const { conversationId, isTyping } = action.payload;
      const convIndex = state.conversations.findIndex(c => c.id === conversationId);
      if (convIndex !== -1) {
        state.conversations[convIndex].typing = isTyping;
      }
    },
    clearMessages: (state) => {
      state.messages = [];
      state.selectedConversation = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchConversations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.loading = false;
        state.conversations = action.payload;
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchMessages.pending, (state) => {
        state.messagesLoading = true;
        state.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.messagesLoading = false;
        state.messages = action.payload;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.messagesLoading = false;
        state.error = action.payload;
      })
      .addCase(sendMessage.pending, (state) => {
        state.sending = true;
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.sending = false;
        const newMsg = action.payload;
        const exists = state.messages.some(m => m.id === newMsg.id);
        if (!exists) {
          state.messages.push(newMsg);
        }
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.sending = false;
        state.error = action.payload;
      })
      .addCase(createConversation.fulfilled, (state, action) => {
        const conv = action.payload;
        if (conv && conv.id) {
          state.conversations.unshift({
            ...conv,
            _id: conv._id || conv.id
          });
        }
      })
      .addCase(searchUsers.fulfilled, (state, action) => {
        state.users = action.payload;
      });
  },
});

export const { setSelectedConversation, addMessage, updateTypingStatus, clearMessages, clearError } = messagesSlice.actions;
export default messagesSlice.reducer;
