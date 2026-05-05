import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { feedbackApi } from '../../api/services';
import type { Feedback, FeedbackCreate } from '../../types';

interface HelpState {
  items: Feedback[];
  total: number;
  page: number;
  pages: number;
  loading: boolean;
  submitting: boolean;
  error: string | null;
  filters: {
    type: string;
    status: string;
    limit: number;
  };
}

const initialState: HelpState = {
  items: [],
  total: 0,
  page: 1,
  pages: 1,
  loading: false,
  submitting: false,
  error: null,
  filters: { type: '', status: '', limit: 20 },
};

export const fetchFeedbackList = createAsyncThunk('help/fetchList', async (_, { getState }) => {
  const state = (getState() as any).help as HelpState;
  const { filters, page } = state;
  const params: Record<string, any> = { page, limit: filters.limit };
  if (filters.type) params.type = filters.type;
  if (filters.status) params.status = filters.status;
  const res = await feedbackApi.list(params);
  return res.data;
});

export const submitFeedback = createAsyncThunk('help/submit', async (data: FeedbackCreate, { rejectWithValue }) => {
  try {
    const res = await feedbackApi.submit(data);
    return res.data;
  } catch (err: any) {
    const detail = err?.response?.data?.detail;
    return rejectWithValue(typeof detail === 'string' ? detail : 'Failed to submit feedback');
  }
});

const helpSlice = createSlice({
  name: 'help',
  initialState,
  reducers: {
    setFilter(state, action) {
      Object.assign(state.filters, action.payload);
      state.page = 1;
    },
    setPage(state, action) {
      state.page = action.payload;
    },
    resetFilters(state) {
      state.filters = initialState.filters;
      state.page = 1;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFeedbackList.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchFeedbackList.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.pages = action.payload.pages;
      })
      .addCase(fetchFeedbackList.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to load feedback';
      })
      .addCase(submitFeedback.pending, (state) => { state.submitting = true; })
      .addCase(submitFeedback.fulfilled, (state, action) => {
        state.submitting = false;
        state.items.unshift(action.payload);
        state.total += 1;
      })
      .addCase(submitFeedback.rejected, (state) => { state.submitting = false; });
  },
});

export const { setFilter, setPage, resetFilters } = helpSlice.actions;
export default helpSlice.reducer;
