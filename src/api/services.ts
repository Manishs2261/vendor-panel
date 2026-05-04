import { apiClient } from "./client";
import axios from "axios";
import type {
  Vendor,
  Shop,
  Product,
  Category,
  Analytics,
  Payout,
  CommissionInfo,
  Notification,
  PaginatedResponse,
  ShopForm,
  ProductForm,
} from "../types";

const BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";

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

const normalizeProductPayload = (product: any): Product => ({
  ...product,
  status: String(product?.status || '').toUpperCase() as Product['status'],
  variations: product?.variations || product?.variants || [],
  tags: Array.isArray(product?.tags) ? product.tags : [],
});

const toProductRequest = (data: ProductForm | Partial<ProductForm>) => {
  const payload: Record<string, unknown> = { ...data };
  if ('variations' in payload) {
    payload.variants = payload.variations;
    delete payload.variations;
  }
  if (typeof payload.status === 'string') {
    payload.status = String(payload.status).toLowerCase();
  }
  return payload;
};

// â”€â”€â”€ Auth API â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post<AuthTokenResponse>("/auth/login/vendor", {
      email,
      password,
    }),

  register: (data: {
    name: string;
    email: string;
    phone: string;
    password: string;
  }) => apiClient.post<AuthTokenResponse>("/auth/register/vendor", data),

  sendEmailOtp: () =>
    apiClient.post("/auth/verify/email/send"),

  verifyEmailOtp: (otp: string) =>
    apiClient.post("/auth/verify/email/confirm", { otp }),

  sendPhoneOtp: () =>
    apiClient.post("/auth/verify/phone/send"),

  verifyPhoneOtp: (otp: string) =>
    apiClient.post("/auth/verify/phone/confirm", { otp }),

  forgotPassword: (email: string) =>
    apiClient.post("/auth/forgot-password", { email }),

  resetPassword: (token: string, password: string) =>
    apiClient.post("/auth/reset-password", { token, password }),

  me: () => apiClient.get<Vendor>("/auth/me"),

  updateProfile: (data: { name?: string; email?: string; phone?: string }) =>
    apiClient.put<Vendor>("/users/me", data),

  changePassword: (old_password: string, new_password: string) =>
    apiClient.post("/auth/change-password", { old_password, new_password }),

  refresh: (refresh_token: string) =>
    axios.post<{ access_token: string; refresh_token: string }>(
      `${BASE_URL}/auth/refresh`,
      { refresh_token },
    ),

  logout: () => apiClient.post("/auth/logout"),
};

// â”€â”€â”€ Shop API â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const vendorApi = {
  me: () => apiClient.get<VendorProfileResponse>("/vendor/me"),
  updateProfile: (data: Partial<VendorProfileResponse>) =>
    apiClient.put<VendorProfileResponse>("/vendor/me", data),
};

export const shopApi = {
  getMyShop: () => apiClient.get<Shop>("/vendor/shop"),

  createShop: (data: ShopForm) => apiClient.post<Shop>("/vendor/shop", data),

  updateShop: (data: Partial<ShopForm>) =>
    apiClient.put<Shop>("/vendor/shop", data),

  uploadLogo: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return apiClient.post<{ url: string }>("/vendor/shop/logo", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  uploadBanner: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return apiClient.post<{ url: string }>("/vendor/shop/banner", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  uploadGallery: (files: File[]) => {
    const fd = new FormData();
    files.forEach((f) => fd.append("files", f));
    return apiClient.post<{ urls: string[] }>("/vendor/shop/gallery", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  removeGalleryImage: (url: string) =>
    apiClient.delete("/vendor/shop/gallery", { data: { url } }),

  sendPhoneOtp: () => apiClient.post("/vendor/shop/verify-phone"),
  verifyPhoneOtp: (otp: string) =>
    apiClient.post("/vendor/shop/verify-phone/confirm", { otp }),
  sendEmailOtp: () => apiClient.post("/vendor/shop/verify-email"),
  verifyEmailOtp: (otp: string) =>
    apiClient.post("/vendor/shop/verify-email/confirm", { otp }),
};

// â”€â”€â”€ Product API â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const productApi = {
  list: (params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    category_id?: string;
    stock_filter?: string;
    stock_min?: number | string;
    stock_max?: number | string;
    min_price?: number | string;
    max_price?: number | string;
    discount_only?: boolean;
    created_from?: string;
    created_to?: string;
    updated_from?: string;
    updated_to?: string;
    sort_by?: string;
  }) => {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(
        ([, value]) =>
          value !== "" &&
          value !== undefined &&
          value !== null &&
          value !== false,
      ),
    );
    return apiClient.get<PaginatedResponse<Product>>("/vendor/products", {
      params: cleanParams,
    });
  },

  get: async (id: string) => {
    const response = await apiClient.get<Product>(`/vendor/products/${id}`);
    return { ...response, data: normalizeProductPayload(response.data) };
  },

  create: (data: ProductForm, images: File[], video?: File) => {
    const fd = new FormData();
    const payload = toProductRequest(data);
    fd.append("data", JSON.stringify(payload));
    images.forEach((img) => fd.append("images", img));
    if (video) fd.append("video", video);
    return apiClient.post<Product>("/vendor/products", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  update: (
    id: string,
    data: Partial<ProductForm>,
    newImages?: File[],
    video?: File,
  ) => {
    const fd = new FormData();
    const payload = toProductRequest(data);
    fd.append("data", JSON.stringify(payload));
    newImages?.forEach((img) => fd.append("images", img));
    if (video) fd.append("video", video);
    return apiClient.put<Product>(`/vendor/products/${id}`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  delete: (id: string) => apiClient.delete(`/vendor/products/${id}`),

  bulkDelete: (ids: string[]) =>
    apiClient.post("/vendor/products/bulk-delete", { ids }),

  bulkStatusUpdate: (ids: string[], status: "ACTIVE" | "INACTIVE") =>
    apiClient.post("/vendor/products/bulk-status", { ids, status }),

  toggleStatus: (id: string) =>
    apiClient.put<Product>(`/vendor/products/${id}/toggle-status`),
};

// â”€â”€â”€ Categories API â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const categoryApi = {
  list: () => apiClient.get<Category[]>("/categories"),
};

// â”€â”€â”€ Analytics API â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const analyticsApi = {
  get: (params: {
    period?: "7d" | "30d" | "90d" | "1y";
    start?: string;
    end?: string;
  }) => apiClient.get<Analytics>("/vendor/analytics", { params }),

  getVendorPublicProfile: (vendorId: string) =>
    apiClient.get(`/public/vendor/${vendorId}`),

  getVendorMarketplaceSettings: (vendorId: string) =>
    apiClient.get(`/public/vendor/${vendorId}/marketplace-settings`),

  getVendorsShowcase: () => apiClient.get("/public/showcase"),

  getProductAnalytics: (productId: string, params: { period?: string }) =>
    apiClient.get(`/vendor/analytics/product/${productId}`, { params }),

  // Marketplace Settings
  getMarketplaceSettings: () => apiClient.get("/vendor/marketplace-settings"),
  updateMarketplaceSettings: (settings: any) =>
    apiClient.put("/vendor/marketplace-settings", settings),
  publishMarketplaceSettings: () =>
    apiClient.post("/vendor/marketplace-settings/publish"),
  resetMarketplaceSettings: () =>
    apiClient.post("/vendor/marketplace-settings/reset"),
};

// â”€â”€â”€ Payments API â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const paymentApi = {
  getPayouts: (params: { page?: number; limit?: number; status?: string }) =>
    apiClient.get<PaginatedResponse<Payout>>("/vendor/payouts", { params }),

  getCommission: () => apiClient.get<CommissionInfo>("/vendor/commission"),

  requestPayout: (amount: number, account_number: string, ifsc: string) =>
    apiClient.post<Payout>("/vendor/payouts/request", {
      amount,
      account_number,
      ifsc,
    }),
};

// â”€â”€â”€ Notifications API â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const notificationApi = {
  list: (params: { page?: number; limit?: number; unread_only?: boolean }) =>
    apiClient.get<PaginatedResponse<Notification>>("/vendor/notifications", {
      params,
    }),

  markRead: (id: string) => apiClient.put(`/vendor/notifications/${id}/read`),

  markAllRead: () => apiClient.put("/vendor/notifications/read-all"),

  getUnreadCount: () =>
    apiClient.get<{ count: number }>("/vendor/notifications/unread-count"),

  saveFcmToken: (token: string) =>
    apiClient.post("/vendor/notifications/fcm-token", { token }),
};

// â”€â”€â”€ Dashboard API â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const dashboardApi = {
  getOverview: () =>
    apiClient.get<{
      total_products: number;
      active_products: number;
      inactive_products: number;
      total_views: number;
      total_orders: number;
      pending_orders: number;
      revenue: number;
      recent_products: Product[];
      completion_score: number;
    }>("/vendor/dashboard"),
};

// â”€â”€â”€ Public API â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const publicApi = {
  getVendorPublicProfile: (vendorId: string) =>
    apiClient.get<{
      shop: {
        id: string;
        name: string;
        description: string;
        logo_url?: string;
        banner_url?: string;
        gallery: string[];
        address: string;
        city: string;
        state: string;
        postal_code: string;
        contact_phone: string;
        contact_email: string;
      } | null;
      products: Array<{
        id: string;
        name: string;
        description: string;
        price: number;
        discount_percentage: number;
        discounted_price: number;
        category_name: string;
        images: string[];
        status: string;
        stock: number;
      }>;
    }>(`/public/vendor/${vendorId}`),

  getVendorsShowcase: () =>
    apiClient.get<{
      vendors: Array<{
        vendor_id: string;
        business_name: string;
        owner_name: string;
        description: string;
        address: string;
        contact_phone: string;
        contact_email: string;
        status: string;
        verified: boolean;
        joined_at: string;
        banner_url?: string;
        logo_url?: string;
        total_products: number;
        products: Array<{
          id: string;
          name: string;
          description: string;
          price: number;
          discount_percentage: number;
          discounted_price: number;
          category_name: string;
          images: string[];
          status: string;
          stock: number;
        }>;
      }>;
      total_vendors: number;
    }>("/public/showcase"),
};


