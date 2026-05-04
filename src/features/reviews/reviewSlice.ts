import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { reviewApi } from '../../api/services';
import type { Review, ReviewStats } from '../../types';

interface ReviewsState {
  items: Review[];
  stats: ReviewStats | null;
  total: number;
  page: number;
  pages: number;
  loading: boolean;
  statsLoading: boolean;
  error: string | null;
  filters: {
    search: string;
    rating: string;
    product_id: string;
    limit: number;
  };
}

const initialState: ReviewsState = {
  items: [],
  stats: null,
  total: 0,
  page: 1,
  pages: 1,
  loading: false,
  statsLoading: false,
  error: null,
  filters: { search: '', rating: '', product_id: '', limit: 20 },
};

export const fetchReviews = createAsyncThunk('reviews/fetchList', async (_, { getState }) => {
  const state = (getState() as any).reviews as ReviewsState;
  const { filters, page } = state;
  const params: Record<string, any> = { page, limit: filters.limit };
  if (filters.search) params.search = filters.search;
  if (filters.rating) params.rating = Number(filters.rating);
  if (filters.product_id) params.product_id = filters.product_id;
  const res = await reviewApi.list(params);
  return res.data;
});

export const fetchReviewStats = createAsyncThunk('reviews/fetchStats', async () => {
  const res = await reviewApi.stats();
  return res.data;
});

const reviewSlice = createSlice({
  name: 'reviews',
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
      .addCase(fetchReviews.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchReviews.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.pages = action.payload.pages;
      })
      .addCase(fetchReviews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to load reviews';
      })
      .addCase(fetchReviewStats.pending, (state) => { state.statsLoading = true; })
      .addCase(fetchReviewStats.fulfilled, (state, action) => {
        state.statsLoading = false;
        state.stats = action.payload;
      })
      .addCase(fetchReviewStats.rejected, (state) => { state.statsLoading = false; });
  },
});

export const { setFilter, setPage, resetFilters } = reviewSlice.actions;
export default reviewSlice.reducer;
