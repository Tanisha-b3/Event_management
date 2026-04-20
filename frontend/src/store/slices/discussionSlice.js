import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const fetchDiscussions = createAsyncThunk(
  'discussions/fetchAll',
  async ({ eventId, page = 1, limit = 10, sort = '-isPinned -createdAt' }, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth.token;
      const response = await axios.get(`${API_URL}/discussions/${eventId}`, {
        params: { page, limit, sort },
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch discussions');
    }
  }
);

export const fetchDiscussionById = createAsyncThunk(
  'discussions/fetchById',
  async (discussionId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/discussions/thread/${discussionId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch discussion');
    }
  }
);

export const createDiscussion = createAsyncThunk(
  'discussions/create',
  async ({ eventId, data }, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth.token;
      const response = await axios.post(`${API_URL}/discussions/${eventId}`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create discussion');
    }
  }
);

export const updateDiscussion = createAsyncThunk(
  'discussions/update',
  async ({ discussionId, data }, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth.token;
      const response = await axios.put(`${API_URL}/discussions/thread/${discussionId}`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update discussion');
    }
  }
);

export const deleteDiscussion = createAsyncThunk(
  'discussions/delete',
  async (discussionId, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth.token;
      await axios.delete(`${API_URL}/discussions/thread/${discussionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return discussionId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete discussion');
    }
  }
);

export const addComment = createAsyncThunk(
  'discussions/addComment',
  async ({ discussionId, data }, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth.token;
      const response = await axios.post(`${API_URL}/discussions/thread/${discussionId}/comments`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add comment');
    }
  }
);

export const updateComment = createAsyncThunk(
  'discussions/updateComment',
  async ({ discussionId, commentId, data }, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth.token;
      const response = await axios.put(
        `${API_URL}/discussions/thread/${discussionId}/comments/${commentId}`,
        data,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update comment');
    }
  }
);

export const deleteComment = createAsyncThunk(
  'discussions/deleteComment',
  async ({ discussionId, commentId, replyId }, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth.token;
      const params = replyId ? { replyId } : {};
      await axios.delete(
        `${API_URL}/discussions/thread/${discussionId}/comments/${commentId}`,
        { params, headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      return { discussionId, commentId, replyId };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete comment');
    }
  }
);

export const likeDiscussion = createAsyncThunk(
  'discussions/like',
  async (discussionId, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth.token;
      const response = await axios.post(
        `${API_URL}/discussions/thread/${discussionId}/like`,
        {},
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      return { discussionId, likes: response.data.likes, liked: response.data.liked };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to like discussion');
    }
  }
);

const discussionSlice = createSlice({
  name: 'discussions',
  initialState: {
    discussions: [],
    currentDiscussion: null,
    loading: false,
    error: null,
    pagination: {
      page: 1,
      limit: 10,
      total: 0,
      pages: 1,
    },
  },
  reducers: {
    clearCurrentDiscussion: (state) => {
      state.currentDiscussion = null;
    },
    clearDiscussions: (state) => {
      state.discussions = [];
      state.currentDiscussion = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Discussions
      .addCase(fetchDiscussions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDiscussions.fulfilled, (state, action) => {
        state.loading = false;
        state.discussions = action.payload.discussions || [];
        if (action.payload.pagination) {
          state.pagination = action.payload.pagination;
        }
      })
      .addCase(fetchDiscussions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch Discussion By ID
      .addCase(fetchDiscussionById.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchDiscussionById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentDiscussion = action.payload.discussion;
      })
      .addCase(fetchDiscussionById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Create Discussion
      .addCase(createDiscussion.pending, (state) => {
        state.loading = true;
      })
      .addCase(createDiscussion.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.discussion) {
          state.discussions.unshift(action.payload.discussion);
        }
      })
      .addCase(createDiscussion.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update Discussion
      .addCase(updateDiscussion.fulfilled, (state, action) => {
        if (action.payload.discussion) {
          const index = state.discussions.findIndex(d => d._id === action.payload.discussion._id);
          if (index !== -1) {
            state.discussions[index] = action.payload.discussion;
          }
          if (state.currentDiscussion?._id === action.payload.discussion._id) {
            state.currentDiscussion = action.payload.discussion;
          }
        }
      })

      // Delete Discussion
      .addCase(deleteDiscussion.fulfilled, (state, action) => {
        state.discussions = state.discussions.filter(d => d._id !== action.payload);
      })

      // Add/Update/Delete Comment
      .addCase(addComment.fulfilled, (state, action) => {
        if (action.payload.discussion) {
          state.currentDiscussion = action.payload.discussion;
        }
      })
      .addCase(updateComment.fulfilled, (state, action) => {
        if (action.payload.discussion) {
          state.currentDiscussion = action.payload.discussion;
        }
      })
      .addCase(deleteComment.fulfilled, (state, action) => {
        if (state.currentDiscussion) {
          const { commentId, replyId } = action.payload;
          if (replyId) {
            const comment = state.currentDiscussion.comments.id(commentId);
            if (comment) {
              comment.replies = comment.replies.filter(r => r._id !== replyId);
            }
          } else {
            state.currentDiscussion.comments = state.currentDiscussion.comments.filter(c => c._id !== commentId);
          }
        }
      })

      // Like Discussion
      .addCase(likeDiscussion.fulfilled, (state, action) => {
        const { discussionId, likes, liked } = action.payload;
        const discussion = state.discussions.find(d => d._id === discussionId);
        if (discussion) {
          discussion.likes = likes;
        }
        if (state.currentDiscussion?._id === discussionId) {
          state.currentDiscussion.likes = likes;
        }
      });
  },
});

export const { clearCurrentDiscussion, clearDiscussions } = discussionSlice.actions;
export default discussionSlice.reducer;