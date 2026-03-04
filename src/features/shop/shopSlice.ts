import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { shopApi } from '../../api/services';
import type { Shop, ShopForm, AsyncState } from '../../types';

interface ShopState extends AsyncState<Shop> {
  uploading: boolean;
  otpStep: 'idle' | 'phone_sent' | 'email_sent' | 'phone_verified' | 'email_verified';
}

const initialState: ShopState = { data: null, loading: false, error: null, uploading: false, otpStep: 'idle' };

export const fetchMyShop = createAsyncThunk('shop/fetch', async (_, { rejectWithValue }) => {
  try { const { data } = await shopApi.getMyShop(); return data; }
  catch (err: any) { return rejectWithValue(err.response?.data?.message || 'Failed to fetch shop'); }
});

export const createShop = createAsyncThunk('shop/create', async (form: ShopForm, { rejectWithValue }) => {
  try { const { data } = await shopApi.createShop(form); return data; }
  catch (err: any) { return rejectWithValue(err.response?.data?.message || 'Failed to create shop'); }
});

export const updateShop = createAsyncThunk('shop/update', async (form: Partial<ShopForm>, { rejectWithValue }) => {
  try { const { data } = await shopApi.updateShop(form); return data; }
  catch (err: any) { return rejectWithValue(err.response?.data?.message || 'Failed to update shop'); }
});

export const uploadLogo = createAsyncThunk('shop/uploadLogo', async (file: File, { rejectWithValue }) => {
  try { const { data } = await shopApi.uploadLogo(file); return data.url; }
  catch { return rejectWithValue('Logo upload failed'); }
});

export const uploadBanner = createAsyncThunk('shop/uploadBanner', async (file: File, { rejectWithValue }) => {
  try { const { data } = await shopApi.uploadBanner(file); return data.url; }
  catch { return rejectWithValue('Banner upload failed'); }
});

export const uploadGallery = createAsyncThunk('shop/uploadGallery', async (files: File[], { rejectWithValue }) => {
  try { const { data } = await shopApi.uploadGallery(files); return data.urls; }
  catch { return rejectWithValue('Gallery upload failed'); }
});

const shopSlice = createSlice({
  name: 'shop',
  initialState,
  reducers: {
    clearError(state) { state.error = null; },
    setOtpStep(state, action) { state.otpStep = action.payload; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyShop.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchMyShop.fulfilled, (state, action) => { state.loading = false; state.data = action.payload; })
      .addCase(fetchMyShop.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })

      .addCase(createShop.pending, (state) => { state.loading = true; })
      .addCase(createShop.fulfilled, (state, action) => { state.loading = false; state.data = action.payload; })
      .addCase(createShop.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })

      .addCase(updateShop.pending, (state) => { state.loading = true; })
      .addCase(updateShop.fulfilled, (state, action) => { state.loading = false; state.data = action.payload; })
      .addCase(updateShop.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })

      .addCase(uploadLogo.pending, (state) => { state.uploading = true; })
      .addCase(uploadLogo.fulfilled, (state, action) => { state.uploading = false; if (state.data) state.data.logo = action.payload; })
      .addCase(uploadLogo.rejected, (state) => { state.uploading = false; })

      .addCase(uploadBanner.pending, (state) => { state.uploading = true; })
      .addCase(uploadBanner.fulfilled, (state, action) => { state.uploading = false; if (state.data) state.data.banner = action.payload; })
      .addCase(uploadBanner.rejected, (state) => { state.uploading = false; })

      .addCase(uploadGallery.pending, (state) => { state.uploading = true; })
      .addCase(uploadGallery.fulfilled, (state, action) => { state.uploading = false; if (state.data) state.data.gallery = [...state.data.gallery, ...action.payload]; })
      .addCase(uploadGallery.rejected, (state) => { state.uploading = false; });
  },
});

export const { clearError, setOtpStep } = shopSlice.actions;
export default shopSlice.reducer;
