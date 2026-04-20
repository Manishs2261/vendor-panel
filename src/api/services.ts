import { apiClient } from './client';
import axios from 'axios';
import type {
  Vendor, Shop, Product, Category, Analytics,
  Payout, CommissionInfo, Notification, PaginatedResponse,
  ShopForm, ProductForm,
} from '../types';

const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

type AuthTokenResponse = {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user_id: number;
  role: string;
};

export type VendorProfileResponse = {
  id: number;
  user_id: number;
  business_name: string;
  business_email?: string;
  business_phone?: string;
  gst_number?: string;
  status: string;
  verified: boolean;
  total_earnings?: number;
  created_at?: string;
};

// ─── Auth API ─────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post<AuthTokenResponse>(
      '/auth/login/vendor', { email, password }
    ),

  register: (data: { name: string; email: string; phone: string; password: string }) =>
    apiClient.post<AuthTokenResponse>('/auth/register/vendor', data),

  sendEmailOtp: (email: string) =>
    apiClient.post('/auth/otp/email/send', { email }),

  verifyEmailOtp: (email: string, otp: string) =>
    apiClient.post<{ access_token: string; refresh_token: string; user: Vendor }>(
      '/auth/otp/email/verify', { email, otp }
    ),

  sendPhoneOtp: (phone: string) =>
    apiClient.post('/auth/otp/phone/send', { phone }),

  verifyPhoneOtp: (phone: string, otp: string) =>
    apiClient.post('/auth/otp/phone/verify', { phone, otp }),

  googleLogin: (firebase_token: string) =>
    apiClient.post<{ access_token: string; refresh_token: string; user: Vendor }>(
      '/auth/google/vendor', { firebase_token }
    ),

  forgotPassword: (email: string) =>
    apiClient.post('/auth/forgot-password', { email }),

  resetPassword: (token: string, password: string) =>
    apiClient.post('/auth/reset-password', { token, password }),

  me: () => apiClient.get<Vendor>('/auth/me'),

  refresh: (refresh_token: string) =>
    axios.post<{ access_token: string; refresh_token: string }>(
      `${BASE_URL}/auth/refresh`, { refresh_token }
    ),

  logout: () => apiClient.post('/auth/logout'),
};

// ─── Shop API ─────────────────────────────────────────────────────────────────
export const vendorApi = {
  me: () => apiClient.get<VendorProfileResponse>('/vendor/me'),
};

export const shopApi = {
  getMyShop: () => apiClient.get<Shop>('/vendor/shop'),

  createShop: (data: ShopForm) => apiClient.post<Shop>('/vendor/shop', data),

  updateShop: (data: Partial<ShopForm>) => apiClient.put<Shop>('/vendor/shop', data),

  uploadLogo: (file: File) => {
    const fd = new FormData(); fd.append('file', file);
    return apiClient.post<{ url: string }>('/vendor/shop/logo', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  uploadBanner: (file: File) => {
    const fd = new FormData(); fd.append('file', file);
    return apiClient.post<{ url: string }>('/vendor/shop/banner', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  uploadGallery: (files: File[]) => {
    const fd = new FormData();
    files.forEach((f) => fd.append('files', f));
    return apiClient.post<{ urls: string[] }>('/vendor/shop/gallery', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  removeGalleryImage: (url: string) =>
    apiClient.delete('/vendor/shop/gallery', { data: { url } }),

  sendPhoneOtp: () => apiClient.post('/vendor/shop/verify-phone'),
  verifyPhoneOtp: (otp: string) => apiClient.post('/vendor/shop/verify-phone/confirm', { otp }),
  sendEmailOtp: () => apiClient.post('/vendor/shop/verify-email'),
  verifyEmailOtp: (otp: string) => apiClient.post('/vendor/shop/verify-email/confirm', { otp }),
};

// ─── Product API ──────────────────────────────────────────────────────────────
export const productApi = {
  list: (params: {
    page?: number; limit?: number; search?: string;
    status?: string; category_id?: string;
  }) => apiClient.get<PaginatedResponse<Product>>('/vendor/products', { params }),

  get: (id: string) => apiClient.get<Product>(`/vendor/products/${id}`),

  create: (data: ProductForm, images: File[], video?: File) => {
    const fd = new FormData();
    const { ...rest } = data;
    fd.append('data', JSON.stringify(rest));
    images.forEach((img) => fd.append('images', img));
    if (video) fd.append('video', video);
    return apiClient.post<Product>('/vendor/products', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  update: (id: string, data: Partial<ProductForm>, newImages?: File[], video?: File) => {
    const fd = new FormData();
    fd.append('data', JSON.stringify(data));
    newImages?.forEach((img) => fd.append('images', img));
    if (video) fd.append('video', video);
    return apiClient.put<Product>(`/vendor/products/${id}`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  delete: (id: string) => apiClient.delete(`/vendor/products/${id}`),

  bulkDelete: (ids: string[]) =>
    apiClient.post('/vendor/products/bulk-delete', { ids }),

  bulkStatusUpdate: (ids: string[], status: 'ACTIVE' | 'INACTIVE') =>
    apiClient.post('/vendor/products/bulk-status', { ids, status }),

  toggleStatus: (id: string) =>
    apiClient.put<Product>(`/vendor/products/${id}/toggle-status`),
};

// ─── Categories API ───────────────────────────────────────────────────────────
export const categoryApi = {
  list: () => apiClient.get<Category[]>('/categories'),
};

// ─── Analytics API ────────────────────────────────────────────────────────────
export const analyticsApi = {
  get: (params: { period?: '7d' | '30d' | '90d' | '1y'; start?: string; end?: string }) =>
    apiClient.get<Analytics>('/vendor/analytics', { params }),

  getProductAnalytics: (productId: string, params: { period?: string }) =>
    apiClient.get(`/vendor/analytics/product/${productId}`, { params }),
};

// ─── Payments API ─────────────────────────────────────────────────────────────
export const paymentApi = {
  getPayouts: (params: { page?: number; limit?: number; status?: string }) =>
    apiClient.get<PaginatedResponse<Payout>>('/vendor/payouts', { params }),

  getCommission: () => apiClient.get<CommissionInfo>('/vendor/commission'),

  requestPayout: (amount: number, account_number: string, ifsc: string) =>
    apiClient.post<Payout>('/vendor/payouts/request', { amount, account_number, ifsc }),
};

// ─── Notifications API ────────────────────────────────────────────────────────
export const notificationApi = {
  list: (params: { page?: number; limit?: number; unread_only?: boolean }) =>
    apiClient.get<PaginatedResponse<Notification>>('/vendor/notifications', { params }),

  markRead: (id: string) => apiClient.put(`/vendor/notifications/${id}/read`),

  markAllRead: () => apiClient.put('/vendor/notifications/read-all'),

  getUnreadCount: () => apiClient.get<{ count: number }>('/vendor/notifications/unread-count'),

  saveFcmToken: (token: string) =>
    apiClient.post('/vendor/notifications/fcm-token', { token }),
};

// ─── Dashboard API ────────────────────────────────────────────────────────────
export const dashboardApi = {
  getOverview: () =>
    apiClient.get<{
      total_products: number;
      active_products: number;
      inactive_products: number;
      total_views: number;
      growth_rate: number;
      recent_products: Product[];
      completion_score: number;
    }>('/vendor/dashboard'),
};
