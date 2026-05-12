import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { sponsorshipApi } from '../../api/services';

export interface SponsorshipPlan {
  id: number;
  name: string;
  description?: string;
  price: number;
  duration_days: number;
  priority: number;
  max_categories: number;
  max_locations: number;
  is_active: boolean;
}

export interface VendorSponsorshipRequest {
  id: number;
  vendor_id: number;
  plan_id: number;
  status: string;
  target_categories: number[];
  target_locations: string[];
  target_keywords: string[];
  priority: number;
  start_date?: string;
  end_date?: string;
  click_count: number;
  view_count: number;
  admin_notes?: string;
  created_at: string;
  plan?: SponsorshipPlan;
}

interface SponsorshipState {
  plans: SponsorshipPlan[];
  myRequests: VendorSponsorshipRequest[];
  loading: boolean;
  applyLoading: boolean;
  error: string | null;
}

const initialState: SponsorshipState = {
  plans: [],
  myRequests: [],
  loading: false,
  applyLoading: false,
  error: null,
};

export const fetchAvailablePlans = createAsyncThunk(
  'sponsorship/fetchPlans',
  async (_, { rejectWithValue }) => {
    try { const { data } = await sponsorshipApi.getPlans(); return data; }
    catch (err: any) { return rejectWithValue(err.response?.data?.detail || 'Failed'); }
  }
);

export const fetchMyRequests = createAsyncThunk(
  'sponsorship/fetchMyRequests',
  async (_, { rejectWithValue }) => {
    try { const { data } = await sponsorshipApi.getMyStatus(); return data; }
    catch (err: any) { return rejectWithValue(err.response?.data?.detail || 'Failed'); }
  }
);

export const applyForSponsorship = createAsyncThunk(
  'sponsorship/apply',
  async (body: { plan_id: number; target_categories: number[]; target_locations: string[]; target_keywords: string[] }, { rejectWithValue }) => {
    try { const { data } = await sponsorshipApi.apply(body); return data; }
    catch (err: any) { return rejectWithValue(err.response?.data?.detail || 'Failed'); }
  }
);

export const cancelSponsorship = createAsyncThunk(
  'sponsorship/cancel',
  async (id: number, { rejectWithValue }) => {
    try { await sponsorshipApi.cancel(id); return { id }; }
    catch (err: any) { return rejectWithValue(err.response?.data?.detail || 'Failed'); }
  }
);

const sponsorshipSlice = createSlice({
  name: 'sponsorship',
  initialState,
  reducers: { clearError: (state) => { state.error = null; } },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAvailablePlans.pending, (state) => { state.loading = true; })
      .addCase(fetchAvailablePlans.fulfilled, (state, action) => { state.loading = false; state.plans = action.payload; })
      .addCase(fetchAvailablePlans.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })

      .addCase(fetchMyRequests.pending, (state) => { state.loading = true; })
      .addCase(fetchMyRequests.fulfilled, (state, action) => { state.loading = false; state.myRequests = action.payload; })
      .addCase(fetchMyRequests.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })

      .addCase(applyForSponsorship.pending, (state) => { state.applyLoading = true; })
      .addCase(applyForSponsorship.fulfilled, (state, action) => {
        state.applyLoading = false;
        state.myRequests.unshift(action.payload);
      })
      .addCase(applyForSponsorship.rejected, (state, action) => { state.applyLoading = false; state.error = action.payload as string; })

      .addCase(cancelSponsorship.fulfilled, (state, action) => {
        const idx = state.myRequests.findIndex(r => r.id === action.payload.id);
        if (idx !== -1) state.myRequests[idx] = { ...state.myRequests[idx], status: 'cancelled' };
      });
  },
});

export const { clearError } = sponsorshipSlice.actions;
export default sponsorshipSlice.reducer;
