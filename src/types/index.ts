// ─── Auth ────────────────────────────────────────────────────────────────────
export interface Vendor {
  id: string;
  email: string;
  phone: string;
  name: string;
  avatar?: string;
  is_email_verified: boolean;
  is_phone_verified: boolean;
  role: 'VENDOR';
  shop?: Shop;
  created_at: string;
}

// ─── Shop ────────────────────────────────────────────────────────────────────
export interface Shop {
  id: string;
  vendor_id: string;
  name: string;
  description: string;
  logo_url?: string;
  banner_url?: string;
  gallery: string[];
  address: string;
  city: string;
  state: string;
  postal_code: string;
  business_type: 'RETAIL' | 'WHOLESALE' | 'BOTH';
  gst_number?: string;
  latitude?: number;
  longitude?: number;
  contact_phone: string;
  contact_email: string;
  id_type?: string;
  id_document_url?: string;
  is_verified: boolean;
  completion_score: number;
  created_at: string;
}

// ─── Product ─────────────────────────────────────────────────────────────────
export interface Product {
  id: string;
  shop_id: string;
  name: string;
  description: string;
  price: number;
  discount_percentage: number;
  discounted_price: number;
  category_id: string;
  category_name: string;
  subcategory_id?: string;
  subcategory_name?: string;
  brand?: string;
  tags: string[];
  sku: string;
  stock: number;
  images: string[];
  video?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'REJECTED';
  is_deleted: boolean;
  click_count: number;
  search_count: number;
  variations: ColorVariation[];
  latitude?: number;
  longitude?: number;
  created_at: string;
  updated_at: string;
}

export interface ColorVariation {
  color: string;
  hex: string;
  stock: number;
  images: string[];
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
  parent_id?: string;
  children?: Category[];
}

// ─── Analytics ───────────────────────────────────────────────────────────────
export interface Analytics {
  total_views: number;
  total_clicks: number;
  total_searches: number;
  revenue_estimate: number;
  views_by_day: TimeSeriesData[];
  clicks_by_day: TimeSeriesData[];
  top_products: TopProduct[];
  top_cities: CityData[];
  growth_rate: number;
}

export interface TimeSeriesData { date: string; value: number; }
export interface TopProduct { product_id: string; name: string; image?: string; views: number; clicks: number; searches: number; }
export interface CityData { city: string; count: number; percentage: number; }

// ─── Payments ────────────────────────────────────────────────────────────────
export interface Payout {
  id: string;
  shop_id: string;
  amount: number;
  commission: number;
  net_amount: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  utr_number?: string;
  razorpay_payout_id?: string;
  created_at: string;
  processed_at?: string;
}

export interface CommissionInfo {
  rate: number;
  total_earned: number;
  total_paid: number;
  pending_amount: number;
}

// ─── Notifications ────────────────────────────────────────────────────────────
export interface Notification {
  id: string;
  title: string;
  body: string;
  image?: string;
  type: 'ORDER' | 'PAYMENT' | 'PRODUCT' | 'SYSTEM' | 'PROMOTION';
  is_read: boolean;
  data?: Record<string, string>;
  created_at: string;
}

// ─── Reviews ─────────────────────────────────────────────────────────────────
export interface Review {
  id: string;
  product_id: string;
  product_name: string;
  product_image?: string;
  reviewer_name: string;
  rating: number;
  comment?: string;
  created_at: string;
}

export interface ReviewStats {
  average_rating: number;
  total_reviews: number;
  breakdown: Record<string, number>; // "1" → count, "2" → count, …
}

// ─── Help & Feedback ─────────────────────────────────────────────────────────
export interface Feedback {
  id: number;
  vendor_id: number;
  type: 'feedback' | 'bug_report' | 'feature_request' | 'general';
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  attachments?: string[];
  admin_response?: string;
  admin_response_at?: string;
  created_at: string;
  updated_at?: string;
}

export interface FeedbackCreate {
  type: Feedback['type'];
  subject: string;
  description: string;
  priority: Feedback['priority'];
}

// ─── API ─────────────────────────────────────────────────────────────────────
export interface PaginatedResponse<T> { items: T[]; total: number; page: number; pages: number; limit: number; }
export interface AsyncState<T> { data: T | null; loading: boolean; error: string | null; }
export interface ListState<T> { items: T[]; total: number; page: number; pages: number; loading: boolean; error: string | null; }

export interface ProductForm {
  name: string; description: string; price: number; discount_percentage: number;
  category_id: string; subcategory_id?: string; brand: string; tags: string[];
  sku?: string; stock: number; latitude?: number; longitude?: number;
  variations: ColorVariation[]; status: 'ACTIVE' | 'INACTIVE';
}

export interface ShopForm {
  name: string; description: string; address: string; city: string;
  state: string; postal_code: string; business_type: 'RETAIL' | 'WHOLESALE' | 'BOTH';
  gst_number: string; contact_phone: string; contact_email: string;
  id_type?: string;
  id_document_url?: string;
  latitude?: number; longitude?: number;
}
