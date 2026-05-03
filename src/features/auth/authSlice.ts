import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authApi } from '../../api/services';
import type { Vendor } from '../../types';

interface AuthState {
  vendor: Vendor | null;
  loading: boolean;
  error: string | null;
  otpStep: 'idle' | 'email_sent' | 'phone_sent' | 'verified';
}

const formatApiMessage = (value: any, fallback: string): string => {
  if (!value) return fallback;
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) {
    const messages = value
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item?.msg) {
          const field = Array.isArray(item.loc) ? item.loc[item.loc.length - 1] : null;
          return field ? `${field}: ${item.msg}` : item.msg;
        }
        return null;
      })
      .filter(Boolean);
    return messages.length ? messages.join(', ') : fallback;
  }
  if (typeof value === 'object' && typeof value.msg === 'string') {
    return value.msg;
  }
  return fallback;
};

const getApiErrorMessage = (err: any, fallback: string) =>
  formatApiMessage(err?.response?.data?.detail, formatApiMessage(err?.response?.data?.message, fallback));

const initialState: AuthState = {
  vendor: null,
  loading: false,
  error: null,
  otpStep: 'idle',
};

// ─── Thunks ───────────────────────────────────────────────────────────────────
export const loginThunk = createAsyncThunk(
  'auth/login',
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const { data } = await authApi.login(email, password);
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      return data.user;
    } catch (err: any) {
      return rejectWithValue(getApiErrorMessage(err, 'Login failed'));
    }
  }
);

export const registerThunk = createAsyncThunk(
  'auth/register',
  async (payload: { name: string; email: string; phone: string; password: string }, { rejectWithValue }) => {
    try {
      const { data } = await authApi.register(payload);
      return data;
    } catch (err: any) {
      return rejectWithValue(getApiErrorMessage(err, 'Registration failed'));
    }
  }
);


export const verifyEmailOtpThunk = createAsyncThunk(
  'auth/verifyEmailOtp',
  async ({ email, otp }: { email: string; otp: string }, { rejectWithValue }) => {
    try {
      const { data } = await authApi.verifyEmailOtp(email, otp);
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      return data.user;
    } catch (err: any) {
      return rejectWithValue(getApiErrorMessage(err, 'OTP verification failed'));
    }
  }
);

export const fetchMeThunk = createAsyncThunk('auth/me', async (_, { rejectWithValue }) => {
  try {
    const { data } = await authApi.me();
    return data;
  } catch (err: any) {
    return rejectWithValue(getApiErrorMessage(err, 'Session expired'));
  }
});

// ─── Slice ────────────────────────────────────────────────────────────────────
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.vendor = null;
      localStorage.clear();
    },
    setVendor(state, action) { state.vendor = action.payload; },
    clearError(state) { state.error = null; },
    setOtpStep(state, action) { state.otpStep = action.payload; },
  },
  extraReducers: (builder) => {
    const pending = (state: AuthState) => { state.loading = true; state.error = null; };
    const rejected = (state: AuthState, action: any) => { state.loading = false; state.error = action.payload as string; };

    builder
      .addCase(loginThunk.pending, pending)
      .addCase(loginThunk.fulfilled, (state, action) => { state.loading = false; state.vendor = action.payload; })
      .addCase(loginThunk.rejected, rejected)


      .addCase(verifyEmailOtpThunk.pending, pending)
      .addCase(verifyEmailOtpThunk.fulfilled, (state, action) => { state.loading = false; state.vendor = action.payload; state.otpStep = 'verified'; })
      .addCase(verifyEmailOtpThunk.rejected, rejected)

      .addCase(fetchMeThunk.pending, pending)
      .addCase(fetchMeThunk.fulfilled, (state, action) => { state.loading = false; state.vendor = action.payload; })
      .addCase(fetchMeThunk.rejected, (state) => { state.loading = false; state.vendor = null; localStorage.clear(); })

      .addCase(registerThunk.pending, pending)
      .addCase(registerThunk.fulfilled, (state) => { state.loading = false; state.otpStep = 'email_sent'; })
      .addCase(registerThunk.rejected, rejected);
  },
});

export const { logout, setVendor, clearError, setOtpStep } = authSlice.actions;
export default authSlice.reducer;
