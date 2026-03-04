import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { analyticsApi, dashboardApi, paymentApi, notificationApi } from '../../api/services';
import type { Analytics, Payout, CommissionInfo, Notification, AsyncState, ListState } from '../../types';

// ─── Analytics Slice ─────────────────────────────────────────────────────────
interface AnalyticsState extends AsyncState<Analytics> {
  period: '7d' | '30d' | '90d' | '1y';
}

export const fetchAnalytics = createAsyncThunk(
  'analytics/fetch',
  async (period: '7d' | '30d' | '90d' | '1y' = '30d', { rejectWithValue }) => {
    try { const { data } = await analyticsApi.get({ period }); return data; }
    catch (err: any) { return rejectWithValue(err.response?.data?.message || 'Failed to fetch analytics'); }
  }
);

export const analyticsSlice = createSlice({
  name: 'analytics',
  initialState: { data: null, loading: false, error: null, period: '30d' } as AnalyticsState,
  reducers: { setPeriod(state, action) { state.period = action.payload; } },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAnalytics.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchAnalytics.fulfilled, (state, action) => { state.loading = false; state.data = action.payload; })
      .addCase(fetchAnalytics.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; });
  },
});
export const { setPeriod } = analyticsSlice.actions;

// ─── Dashboard Slice ──────────────────────────────────────────────────────────
export const fetchDashboard = createAsyncThunk('dashboard/fetch', async (_, { rejectWithValue }) => {
  try { const { data } = await dashboardApi.getOverview(); return data; }
  catch (err: any) { return rejectWithValue(err.response?.data?.message || 'Failed to fetch dashboard'); }
});

export const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState: { data: null, loading: false, error: null } as AsyncState<any>,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboard.pending, (state) => { state.loading = true; })
      .addCase(fetchDashboard.fulfilled, (state, action) => { state.loading = false; state.data = action.payload; })
      .addCase(fetchDashboard.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; });
  },
});

// ─── Payments Slice ───────────────────────────────────────────────────────────
interface PaymentState extends ListState<Payout> {
  commission: CommissionInfo | null;
}

export const fetchPayouts = createAsyncThunk('payments/fetchPayouts', async (params: { page?: number; status?: string } = {}, { rejectWithValue }) => {
  try { const { data } = await paymentApi.getPayouts(params); return data; }
  catch (err: any) { return rejectWithValue(err.response?.data?.message || 'Failed to fetch payouts'); }
});

export const fetchCommission = createAsyncThunk('payments/fetchCommission', async (_, { rejectWithValue }) => {
  try { const { data } = await paymentApi.getCommission(); return data; }
  catch (err: any) { return rejectWithValue('Failed to fetch commission'); }
});

export const paymentSlice = createSlice({
  name: 'payments',
  initialState: { items: [], total: 0, page: 1, pages: 0, loading: false, error: null, commission: null } as PaymentState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPayouts.pending, (state) => { state.loading = true; })
      .addCase(fetchPayouts.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.total = action.payload.total;
        state.pages = action.payload.pages;
      })
      .addCase(fetchPayouts.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(fetchCommission.fulfilled, (state, action) => { state.commission = action.payload; });
  },
});

// ─── Notifications Slice ──────────────────────────────────────────────────────
interface NotificationState extends ListState<Notification> {
  unreadCount: number;
}

export const fetchNotifications = createAsyncThunk('notifications/fetch', async (params: { page?: number; unread_only?: boolean } = {}, { rejectWithValue }) => {
  try { const { data } = await notificationApi.list(params); return data; }
  catch (err: any) { return rejectWithValue('Failed to fetch notifications'); }
});

export const markRead = createAsyncThunk('notifications/markRead', async (id: string) => {
  await notificationApi.markRead(id); return id;
});

export const markAllRead = createAsyncThunk('notifications/markAllRead', async () => {
  await notificationApi.markAllRead();
});

export const notificationSlice = createSlice({
  name: 'notifications',
  initialState: { items: [], total: 0, page: 1, pages: 0, loading: false, error: null, unreadCount: 0 } as NotificationState,
  reducers: { setUnreadCount(state, action) { state.unreadCount = action.payload; } },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => { state.loading = true; })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.total = action.payload.total;
        state.pages = action.payload.pages;
        state.unreadCount = action.payload.items.filter((n: Notification) => !n.is_read).length;
      })
      .addCase(fetchNotifications.rejected, (state) => { state.loading = false; })
      .addCase(markRead.fulfilled, (state, action) => {
        const notif = state.items.find(n => n.id === action.payload);
        if (notif && !notif.is_read) { notif.is_read = true; state.unreadCount = Math.max(0, state.unreadCount - 1); }
      })
      .addCase(markAllRead.fulfilled, (state) => {
        state.items.forEach(n => { n.is_read = true; });
        state.unreadCount = 0;
      });
  },
});
export const { setUnreadCount } = notificationSlice.actions;
