import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { publicApi } from '../../api/services';

interface MarketplaceSettings {
  primary_color?: string;
  secondary_color?: string;
  background_color?: string;
  banner_text?: string;
  banner_subtext?: string;
  show_ratings?: boolean;
  products_per_page?: number;
  products_per_row?: number;
  custom_css?: string;
  facebook_url?: string;
  instagram_url?: string;
  twitter_url?: string;
  whatsapp_number?: string;
  website_url?: string;
  social_email?: string;
  shipping_message?: string;
  contact_hours?: string;
  about_text?: string;
  promo_headline?: string;
  promo_subtext?: string;
  promo_cta_label?: string;
  promo_cta_link?: string;
  meta_title?: string;
  meta_description?: string;
  banner_slides?: Array<{
    tag?: string;
    title?: string;
    subtext?: string;
    ctaLabel?: string;
    ctaLink?: string;
    imageUrl?: string;
    bgColor?: string;
    sideImageUrl?: string;
  }>;
}

const storefrontToFlat = (s: any): MarketplaceSettings => ({
  primary_color: s?.theme?.accentColor,
  secondary_color: s?.theme?.primaryColor,
  background_color: s?.theme?.backgroundColor,
  banner_text: s?.banner?.slides?.[0]?.title || s?.branding?.storeName,
  banner_subtext: s?.banner?.slides?.[0]?.subtext || s?.branding?.tagline,
  show_ratings: true,
  products_per_page: (s?.layout?.productsPerRow || 4) * 6,
  products_per_row: s?.layout?.productsPerRow || 4,
  custom_css: s?.branding?.customCss,
  facebook_url: s?.social?.facebook,
  instagram_url: s?.social?.instagram,
  twitter_url: s?.social?.twitter,
  whatsapp_number: s?.social?.whatsapp,
  website_url: s?.social?.website,
  social_email: s?.social?.email,
  shipping_message: s?.branding?.shippingMessage,
  contact_hours: s?.branding?.contactHours,
  about_text: s?.about?.text,
  promo_headline: s?.promo?.headline,
  promo_subtext: s?.promo?.subtext,
  promo_cta_label: s?.promo?.ctaLabel,
  promo_cta_link: s?.promo?.ctaLink,
  meta_title: s?.seo?.metaTitle,
  meta_description: s?.seo?.metaDescription,
  banner_slides: s?.banner?.slides || [],
});

const _PH_PALETTES = [
  { bg: 'linear-gradient(145deg,#f5efe6 0%,#ede2d0 100%)', color: '#c8a96e' },
  { bg: 'linear-gradient(145deg,#e8f0e8 0%,#cde8cd 100%)', color: '#2d6a4f' },
  { bg: 'linear-gradient(145deg,#e8eef5 0%,#ccdced 100%)', color: '#1a3d5c' },
  { bg: 'linear-gradient(145deg,#f5e8e8 0%,#f0d2d2 100%)', color: '#8b3a3a' },
  { bg: 'linear-gradient(145deg,#f0eaf5 0%,#e0d0ed 100%)', color: '#6b3d8b' },
];
const _getInitials = (name: string) =>
  name.trim().split(/\s+/).slice(0, 2).map((w) => w[0] || '').join('').toUpperCase() || '?';
const _getPH = (name: string) => _PH_PALETTES[(name.charCodeAt(0) || 0) % _PH_PALETTES.length];

const ProductPlaceholder: React.FC<{ name: string; category: string; size?: 'sm' | 'lg' }> = ({ name, category, size = 'sm' }) => {
  const ph = _getPH(name);
  const initials = _getInitials(name);
  const ring = size === 'lg' ? 72 : 52;
  const fs = size === 'lg' ? 28 : 20;
  return (
    <div style={{ width: '100%', height: '100%', background: ph.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
      <div style={{ width: ring, height: ring, borderRadius: '50%', background: `${ph.color}18`, border: `2px solid ${ph.color}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Playfair Display', serif", fontSize: fs, color: ph.color, fontWeight: 600, letterSpacing: '0.04em', flexShrink: 0 }}>
        {initials}
      </div>
      <div style={{ fontSize: 9.5, color: ph.color, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 500, opacity: 0.7, textAlign: 'center', padding: '0 8px' }}>
        {category || 'Product'}
      </div>
    </div>
  );
};

interface PublicVendorData {
  vendor: {
    id: string;
    business_name: string;
    business_email?: string;
    business_phone?: string;
    gst_number?: string;
    pan_number?: string;
    status: string;
    verified: boolean;
  };
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
    opening_time?: string;
    closing_time?: string;
    working_days?: string[];
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
    rating?: number;
    review_count?: number;
  }>;
}

const PublicVendorPage: React.FC = () => {
  const { vendorId } = useParams<{ vendorId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [data, setData] = useState<PublicVendorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [marketplaceSettings, setMarketplaceSettings] = useState<MarketplaceSettings | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [modalImg, setModalImg] = useState(0);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [viewAll, setViewAll] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const PRODUCTS_PER_PAGE = 8;
  const sentinelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const toggleLike = (id: string) =>
    setLiked((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const openProduct = (p: any) => { setSelectedProduct(p); setModalImg(0); };
  const closeProduct = () => setSelectedProduct(null);
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Reset page when category, view or search changes
  useEffect(() => { setCurrentPage(1); }, [activeCategory, viewAll, debouncedSearch]);

  // Debounce search — 300 ms after user stops typing
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const [previewSettings, setPreviewSettings] = useState<MarketplaceSettings | null>(() => {
    const previewKey = new URLSearchParams(location.search).get('preview');
    if (!previewKey) return null;
    try {
      const raw = localStorage.getItem(previewKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (String(parsed.vendorId) !== String(vendorId)) return null;
      return parsed.settings as MarketplaceSettings;
    } catch { return null; }
  });

  useEffect(() => {
    const previewKey = new URLSearchParams(location.search).get('preview');
    if (!previewKey) return;

    // postMessage from the Editor's direct preview iframe
    const msgHandler = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      if (e.data?.type === 'MP_PREVIEW_UPDATE' && String(e.data.vendorId) === String(vendorId)) {
        setPreviewSettings(e.data.settings as MarketplaceSettings);
      }
    };
    window.addEventListener('message', msgHandler);

    // BroadcastChannel picks up live draft changes from the Editor
    // even when this page is loaded inside the Marketplace iframe (not the Editor preview iframe)
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('mp_preview');
      bc.onmessage = (e) => {
        if (e.data?.type === 'MP_PREVIEW_UPDATE' && String(e.data.vendorId) === String(vendorId)) {
          setPreviewSettings(e.data.settings as MarketplaceSettings);
        }
      };
    } catch { /* BroadcastChannel not supported */ }

    return () => {
      window.removeEventListener('message', msgHandler);
      bc?.close();
    };
  }, [location.search, vendorId]);

  useEffect(() => {
    if (!vendorId) {
      setError('Vendor ID is required');
      setLoading(false);
      return;
    }

    const fetchVendorData = async () => {
      try {
        setLoading(true);

        const vendorResponse = await publicApi.getVendorPublicProfile(vendorId);
        setData(vendorResponse.data);

        try {
          const settingsResponse = await publicApi.getVendorMarketplaceSettings(vendorId);
          const payload = settingsResponse.data?.payload || settingsResponse.data;
          setMarketplaceSettings(storefrontToFlat(payload));
        } catch {
          // fall back to storefront embedded in vendor profile
          if (vendorResponse.data?.storefront) {
            setMarketplaceSettings(storefrontToFlat(vendorResponse.data.storefront));
          }
        }

        setError(null);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to load vendor profile');
        setData(null);
        setMarketplaceSettings(null);
      } finally {
        setLoading(false);
      }
    };

    fetchVendorData();
  }, [vendorId]);

  // Reset slide index when preview slide count changes so we don't land on a missing slide
  const previewSlideCount = previewSettings?.banner_slides?.length;
  useEffect(() => {
    if (previewSlideCount !== undefined) {
      setCurrentSlide((prev) => (prev >= previewSlideCount ? 0 : prev));
    }
  }, [previewSlideCount]);

  useEffect(() => {
    const count = previewSlideCount ?? 2;
    if (count <= 1) return;
    const timer = window.setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % count);
    }, 4000);
    return () => window.clearInterval(timer);
  }, [previewSlideCount]);

  const metaTitle = marketplaceSettings?.meta_title || previewSettings?.meta_title;
  useEffect(() => {
    if (metaTitle) document.title = metaTitle;
    return () => { document.title = 'LocalShop'; };
  }, [metaTitle]);

  // Infinite scroll sentinel
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setDisplayCount((c) => c + 12);
    }, { rootMargin: '200px' });
    observer.observe(el);
    return () => observer.disconnect();
  });

  if (loading) {
    const Sk = ({ w, h, r = 6, style = {} }: { w: number | string; h: number; r?: number; style?: React.CSSProperties }) => (
      <div style={{
        width: w, height: h, borderRadius: r, flexShrink: 0,
        background: 'linear-gradient(90deg,#ede8df 25%,#f5f1ea 50%,#ede8df 75%)',
        backgroundSize: '600px 100%',
        animation: 'skshimmer 1.4s infinite linear',
        ...style,
      }} />
    );
    const ProductCardSk = () => (
      <div style={{ background: 'white', borderRadius: 14, overflow: 'hidden', border: '1px solid #ede8df' }}>
        <Sk w="100%" h={180} r={0} />
        <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Sk w={80} h={10} />
          <Sk w="85%" h={14} />
          <Sk w="60%" h={11} />
          <Sk w="45%" h={11} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
            <Sk w={60} h={18} />
            <Sk w={32} h={32} r={50} />
          </div>
        </div>
      </div>
    );

    return (
      <div style={{ width: '100%', background: '#faf8f5', fontFamily: "'DM Sans', sans-serif", overflowX: 'hidden' }}>
        <style>{`html,body,#root{background:#faf8f5}@keyframes skshimmer{0%{background-position:-600px 0}100%{background-position:600px 0}}`}</style>

        {/* topbar */}
        <div style={{ background: '#1a1208', padding: '10px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Sk w={220} h={12} />
          <Sk w={160} h={12} />
        </div>

        {/* header */}
        <div style={{ background: 'white', borderBottom: '1px solid #ede8df', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Sk w={140} h={20} />
            <Sk w={80} h={10} />
          </div>
          <Sk w={220} h={36} r={24} />
          <div style={{ display: 'flex', gap: 10 }}>
            <Sk w={36} h={36} r={50} />
            <Sk w={36} h={36} r={50} />
            <Sk w={36} h={36} r={50} />
          </div>
        </div>

        {/* nav */}
        <div style={{ background: 'white', borderBottom: '1px solid #ede8df', padding: '0 24px', display: 'flex', gap: 8, alignItems: 'center', height: 44 }}>
          {[60, 90, 70, 80, 65, 75, 55, 68].map((w, i) => <Sk key={i} w={w} h={12} />)}
        </div>

        {/* hero banner */}
        <Sk w="100%" h={340} r={0} />

        {/* main */}
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>

          {/* category header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <Sk w={180} h={26} />
            <Sk w={60} h={12} />
          </div>
          {/* category grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 12, marginBottom: 40 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ background: 'white', borderRadius: 12, padding: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, border: '1px solid #ede8df' }}>
                <Sk w={56} h={56} r={10} />
                <Sk w={60} h={11} />
                <Sk w={44} h={10} />
              </div>
            ))}
          </div>

          {/* about block */}
          <div style={{ background: 'white', border: '1px solid #ede8df', borderRadius: 14, padding: '28px 32px', marginBottom: 40, display: 'flex', gap: 20, alignItems: 'flex-start' }}>
            <Sk w={40} h={40} r={8} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Sk w={160} h={18} />
              <Sk w="90%" h={13} />
              <Sk w="70%" h={13} />
              <div style={{ display: 'flex', gap: 24, marginTop: 6 }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <Sk w={36} h={20} />
                    <Sk w={52} h={10} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* featured header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <Sk w={200} h={26} />
            <Sk w={60} h={12} />
          </div>
          {/* featured products */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 18, marginBottom: 40 }}>
            {Array.from({ length: 4 }).map((_, i) => <ProductCardSk key={i} />)}
          </div>

          {/* promo banner */}
          <div style={{ background: '#1a1208', borderRadius: 14, padding: '28px 32px', marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Sk w={260} h={20} style={{ background: 'linear-gradient(90deg,#2d2318 25%,#3d3020 50%,#2d2318 75%)', backgroundSize: '600px 100%' }} />
              <Sk w={180} h={12} style={{ background: 'linear-gradient(90deg,#2d2318 25%,#3d3020 50%,#2d2318 75%)', backgroundSize: '600px 100%' }} />
            </div>
            <Sk w={140} h={42} r={6} style={{ background: 'linear-gradient(90deg,#b8962a 25%,#c8a96e 50%,#b8962a 75%)', backgroundSize: '600px 100%' }} />
          </div>

          {/* recently added header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <Sk w={190} h={26} />
            <Sk w={60} h={12} />
          </div>
          {/* recently added products */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 18, marginBottom: 40 }}>
            {Array.from({ length: 4 }).map((_, i) => <ProductCardSk key={i} />)}
          </div>
        </div>

        {/* social footer */}
        <div style={{ background: '#1a1208', padding: '48px 24px' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 40 }}>
            {Array.from({ length: 3 }).map((_, col) => (
              <div key={col} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <Sk w={120} h={16} style={{ background: 'linear-gradient(90deg,#2d2318 25%,#3d3020 50%,#2d2318 75%)', backgroundSize: '600px 100%' }} />
                {[140, 110, 160, 90].map((w, i) => (
                  <Sk key={i} w={w} h={11} style={{ background: 'linear-gradient(90deg,#2d2318 25%,#3d3020 50%,#2d2318 75%)', backgroundSize: '600px 100%' }} />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* footer */}
        <div style={{ background: '#120d06', padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <Sk w={120} h={18} style={{ background: 'linear-gradient(90deg,#1d1509 25%,#2d2010 50%,#1d1509 75%)', backgroundSize: '600px 100%' }} />
          <Sk w={200} h={11} style={{ background: 'linear-gradient(90deg,#1d1509 25%,#2d2010 50%,#1d1509 75%)', backgroundSize: '600px 100%' }} />
          <Sk w={160} h={10} style={{ background: 'linear-gradient(90deg,#1d1509 25%,#2d2010 50%,#1d1509 75%)', backgroundSize: '600px 100%' }} />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ maxWidth: 420, width: '100%', background: 'white', borderRadius: 24, padding: 28, textAlign: 'center', boxShadow: '0 24px 80px rgba(25,18,8,0.10)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>Store</div>
          <h1 style={{ margin: 0, fontSize: 24, color: '#1a1208' }}>Vendor Profile Not Found</h1>
          <p style={{ color: '#6b5c45', margin: '12px 0 20px' }}>{error}</p>
          <Link to="/" style={{ display: 'inline-block', padding: '12px 20px', borderRadius: 12, background: '#1a1208', color: 'white', textDecoration: 'none' }}>
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }

  const { vendor, shop, products } = data;
  const settings = previewSettings || marketplaceSettings;
  const accentColor = settings?.primary_color || '#c8a96e';
  const darkColor = settings?.secondary_color || '#1a1208';
  const creamColor = settings?.background_color || '#faf8f5';
  const midColor = '#6b5c45';
  const lightColor = '#ede8df';
  const warmColor = '#f0ebe2';
  const brandName = shop?.name || vendor.business_name;
  const tagline = settings?.banner_subtext?.trim() || shop?.description || 'Thoughtfully crafted local products with premium quality and warm service.';
  const heroTitle = settings?.banner_text?.trim() || brandName;
  const productsPerRow = settings?.products_per_row || 4;
  const activeProducts = products
    .filter((product) => ['active', 'approved'].includes(product.status?.toLowerCase() ?? ''));
  const filteredProducts = activeProducts
    .filter(p => !activeCategory || p.category_name === activeCategory)
    .filter(p => {
      if (!debouncedSearch.trim()) return true;
      const q = debouncedSearch.toLowerCase();
      return p.name.toLowerCase().includes(q)
        || p.description?.toLowerCase().includes(q)
        || p.category_name?.toLowerCase().includes(q);
    });
  const isPaginatedView = viewAll || !!activeCategory || !!debouncedSearch.trim();
  // Normal home view slices (used only when !isPaginatedView)
  const featuredProducts = activeProducts.slice(0, productsPerRow);
  const recentProducts = activeProducts.slice(productsPerRow, productsPerRow * 2).length > 0
    ? activeProducts.slice(productsPerRow, productsPerRow * 2)
    : activeProducts.slice(0, productsPerRow);
  const categories = Object.values(
    activeProducts.reduce((acc, p) => {
      if (!p.category_name) return acc;
      if (!acc[p.category_name]) acc[p.category_name] = { name: p.category_name, count: 0, image: '' };
      acc[p.category_name].count += 1;
      if (!acc[p.category_name].image && p.images?.[0]) acc[p.category_name].image = p.images[0];
      return acc;
    }, {} as Record<string, { name: string; count: number; image: string }>)
  ).slice(0, 6);
  const addressText = [shop?.address, shop?.city, shop?.state, shop?.postal_code].filter(Boolean).join(', ');
  const supportLine = shop?.contact_email || vendor.business_email || 'support@localshop.in';
  const workingDays = shop?.working_days && shop.working_days.length > 0 ? shop.working_days.join(' / ') : 'Mon-Sat';
  const businessHours = shop?.opening_time && shop?.closing_time ? `${shop.opening_time} - ${shop.closing_time}` : '9am - 7pm';
  const overallReviews = activeProducts.reduce((sum, product) => sum + (product.review_count || 0), 0);
  const averageRating =
    activeProducts.reduce((sum, product) => sum + (product.rating || 4.6), 0) /
    Math.max(activeProducts.length, 1);
  const socialLinks = [
    settings?.facebook_url,
    settings?.instagram_url,
    settings?.twitter_url,
    settings?.whatsapp_number,
  ].filter(Boolean);

  const defaultSlideBackgrounds = [
    shop?.banner_url
      ? `linear-gradient(120deg, rgba(26,18,8,0.78) 55%, rgba(61,46,24,0.62) 100%), url(${shop.banner_url}) center/cover`
      : `linear-gradient(120deg, ${darkColor} 55%, ${accentColor} 180%)`,
    'linear-gradient(120deg, #0d2238 55%, #1a3d5c 100%)',
    'linear-gradient(120deg, #1a0d0d 55%, #3d1818 100%)',
    `linear-gradient(120deg, ${darkColor} 55%, #2d4a1a 100%)`,
    'linear-gradient(120deg, #1a0d2e 55%, #3d1860 100%)',
    'linear-gradient(120deg, #0d2a2a 55%, #1a5c5c 100%)',
  ];

  const buildSlideBackground = (s: { imageUrl?: string; bgColor?: string }, fallback: string): string => {
    if (s.imageUrl) {
      return `linear-gradient(120deg, rgba(26,18,8,0.78) 55%, rgba(61,46,24,0.50) 100%), url(${s.imageUrl}) center/cover`;
    }
    if (s.bgColor) {
      return `linear-gradient(135deg, ${s.bgColor} 0%, ${s.bgColor}99 100%)`;
    }
    return fallback;
  };

  const previewSlides = settings?.banner_slides;
  const slides = previewSlides && previewSlides.length > 0
    ? previewSlides.map((s, i) => ({
        tag: s.tag || 'Featured',
        title: s.title || heroTitle,
        copy: s.subtext || tagline,
        button: s.ctaLabel || 'Shop Now',
        link: s.ctaLink || '',
        background: buildSlideBackground(s, defaultSlideBackgrounds[i % defaultSlideBackgrounds.length]),
        visual: s.sideImageUrl || (i === 0 ? shop?.logo_url : ''),
      }))
    : [
        {
          tag: 'Featured Vendor',
          title: heroTitle,
          copy: tagline,
          button: 'Visit Store',
          link: '',
          background: defaultSlideBackgrounds[0],
          visual: shop?.logo_url,
        },
        {
          tag: 'Trust & Service',
          title: vendor.verified ? 'Verified Seller' : 'Local Business You Can Trust',
          copy: addressText || 'Reliable quality, authentic service, and a storefront designed to make buying feel easy.',
          button: 'See Contact Info',
          link: '',
          background: defaultSlideBackgrounds[1],
          visual: '',
        },
      ];

  const slideCount = slides.length;

  return (
    <div style={{ width: '100%', minHeight: '100vh', background: creamColor, color: '#1a1a1a', fontFamily: "'DM Sans', sans-serif", fontSize: 14, overflowX: 'hidden' }}>
      {settings?.custom_css ? <style>{settings.custom_css}</style> : null}
      <style>{`
        html,body,#root{background:${creamColor}}
        .vp-topbar{background:${darkColor};color:#e8d5b0;padding:8px 24px;display:flex;justify-content:space-between;align-items:center;font-size:11px;letter-spacing:0.08em}
        .vp-topbar span{opacity:0.82}
        .vp-header{background:white;border-bottom:1px solid ${lightColor};padding:16px 24px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:100}
        .vp-logo{display:flex;flex-direction:column}
        .vp-logo-name{font-family:'Playfair Display',serif;font-size:22px;color:${darkColor};letter-spacing:0.02em}
        .vp-logo-sub{font-size:10px;color:${accentColor};letter-spacing:0.18em;text-transform:uppercase;margin-top:1px}
        .vp-header-actions{display:flex;align-items:center;gap:16px}
        .vp-search{display:flex;align-items:center;background:${warmColor};border-radius:24px;padding:8px 16px;gap:8px;width:220px}
        .vp-search input{border:none;background:transparent;font-family:'DM Sans',sans-serif;font-size:13px;width:100%;outline:none;color:${darkColor}}
        .vp-search input::placeholder{color:${midColor}}
        .vp-icon-btn{width:36px;height:36px;border-radius:50%;background:${warmColor};border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;position:relative;color:${darkColor};font-size:14px}
        .vp-badge{position:absolute;top:-2px;right:-2px;background:${accentColor};color:white;border-radius:50%;width:16px;height:16px;font-size:9px;display:flex;align-items:center;justify-content:center;font-weight:500}
        .vp-nav{background:white;border-bottom:1px solid ${lightColor};padding:0 24px;display:flex;align-items:center;gap:0;overflow-x:auto}
        .vp-nav-item{padding:12px 16px;font-size:13px;color:${midColor};cursor:pointer;white-space:nowrap;transition:color 0.2s;font-weight:400}
        .vp-nav-item.active,.vp-nav-item:hover{color:${darkColor};font-weight:500}
        .vp-carousel{position:relative;overflow:hidden;height:340px;background:${darkColor}}
        .vp-slides{display:flex;transition:transform 0.55s cubic-bezier(0.25,0.46,0.45,0.94);height:100%}
        .vp-slide{min-width:100%;height:100%;display:flex;align-items:center;padding:0 60px;position:relative;overflow:hidden}
        .vp-slide-content{z-index:2;max-width:420px}
        .vp-slide-tag{font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:${accentColor};font-weight:500;margin-bottom:12px}
        .vp-slide-title{font-family:'Playfair Display',serif;font-size:36px;color:white;line-height:1.15;margin-bottom:12px}
        .vp-slide-sub{font-size:13px;color:rgba(255,255,255,0.65);line-height:1.6;margin-bottom:24px}
        .vp-slide-btn{display:inline-flex;align-items:center;justify-content:center;background:${accentColor};color:white;text-decoration:none;border:none;padding:11px 28px;border-radius:4px;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:500;cursor:pointer;letter-spacing:0.04em}
        .vp-slide-visual{position:absolute;right:72px;top:50%;transform:translateY(-50%);width:240px;height:240px;border-radius:50%;overflow:hidden;opacity:0.97;background:rgba(255,255,255,0.06);display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 4px rgba(255,255,255,0.12),0 8px 40px rgba(0,0,0,0.40)}
        .vp-slide-visual img{width:100%;height:100%;object-fit:cover;object-position:center top}
        .vp-slide-visual-fallback{width:240px;height:240px;display:flex;align-items:center;justify-content:center;color:${accentColor};font-family:'Playfair Display',serif;font-size:72px;border:1px solid rgba(255,255,255,0.12)}
        .vp-carousel-dots{position:absolute;bottom:18px;left:50%;transform:translateX(-50%);display:flex;gap:8px;z-index:10}
        .vp-dot{width:7px;height:7px;border-radius:50%;background:rgba(255,255,255,0.35);cursor:pointer;transition:all 0.2s}
        .vp-dot.active{background:${accentColor};width:22px;border-radius:4px}
        .vp-carousel-arrow{position:absolute;top:50%;transform:translateY(-50%);background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.2);color:white;width:38px;height:38px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:10;font-size:16px;transition:background 0.2s}
        .vp-carousel-arrow:hover{background:rgba(255,255,255,0.22)}
        .vp-arrow-left{left:16px}
        .vp-arrow-right{right:16px}
        .vp-main{max-width:1200px;margin:0 auto;padding:32px 24px}
        .vp-section-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;gap:16px}
        .vp-section-title{font-family:'Playfair Display',serif;font-size:24px;color:${darkColor}}
        .vp-see-all{font-size:12px;color:${accentColor};cursor:pointer;letter-spacing:0.06em;font-weight:500}
        .vp-category-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:12px;margin-bottom:40px}
        .vp-cat-card{background:white;border-radius:12px;padding:14px 10px;text-align:center;border:1px solid ${lightColor};transition:all 0.2s;display:flex;flex-direction:column;align-items:center;gap:8px}
        .vp-cat-card:hover{border-color:${accentColor};transform:translateY(-2px);box-shadow:0 6px 20px rgba(200,169,110,0.12)}
        .vp-cat-card--active{border-color:${accentColor};background:${accentColor}12;box-shadow:0 6px 20px rgba(200,169,110,0.18)}
        .vp-cat-thumb{width:56px;height:56px;border-radius:10px;object-fit:cover;background:${warmColor};flex-shrink:0}
        .vp-cat-thumb-placeholder{width:56px;height:56px;border-radius:10px;background:${warmColor};display:flex;align-items:center;justify-content:center;font-size:22px}
        .vp-cat-name{font-size:12px;color:${darkColor};font-weight:600;line-height:1.3}
        .vp-cat-count{font-size:10.5px;color:${midColor}}
        .vp-product-grid{display:grid;grid-template-columns:repeat(${productsPerRow},1fr);gap:18px;margin-bottom:40px}
        .vp-product-card{background:white;border-radius:14px;overflow:hidden;border:1px solid ${lightColor};transition:all 0.22s;cursor:pointer}
        .vp-product-card:hover{transform:translateY(-3px);box-shadow:0 10px 30px rgba(0,0,0,0.08)}
        .vp-product-img{height:180px;display:flex;align-items:center;justify-content:center;background:${warmColor};position:relative}
        .vp-product-img img{width:100%;height:100%;object-fit:cover}
        .vp-product-badge{position:absolute;top:10px;left:10px;background:${accentColor};color:white;font-size:10px;padding:3px 10px;border-radius:12px;font-weight:500;letter-spacing:0.04em}
        .vp-product-badge.new{background:#2d6a4f}
        .vp-product-info{padding:14px}
        .vp-product-name{font-size:13px;font-weight:500;color:${darkColor};margin-bottom:4px;line-height:1.4}
        .vp-product-desc{font-size:11px;color:${midColor};margin-bottom:10px;line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
        .vp-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:1000;display:flex;align-items:flex-end;justify-content:center;padding:0}
        @media(min-width:640px){.vp-modal-overlay{align-items:center;padding:24px}}
        .vp-modal{background:white;width:100%;max-width:860px;max-height:92vh;border-radius:20px 20px 0 0;overflow-y:auto;position:relative;animation:vpSlideUp 0.28s ease}
        @media(min-width:640px){.vp-modal{border-radius:20px}}
        @keyframes vpSlideUp{from{transform:translateY(60px);opacity:0}to{transform:translateY(0);opacity:1}}
        @keyframes vpSpin{to{transform:rotate(360deg)}}
        .vp-modal-close{position:absolute;top:14px;right:14px;width:32px;height:32px;border-radius:50%;background:${warmColor};border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:16px;color:${darkColor};z-index:10;transition:background 0.2s}
        .vp-modal-close:hover{background:${lightColor}}
        .vp-modal-body{display:grid;grid-template-columns:1fr;gap:0}
        @media(min-width:640px){.vp-modal-body{grid-template-columns:1fr 1fr}}
        .vp-modal-gallery{background:${warmColor};border-radius:20px 20px 0 0;overflow:hidden;min-height:280px;display:flex;flex-direction:column}
        @media(min-width:640px){.vp-modal-gallery{border-radius:20px 0 0 20px;min-height:400px}}
        .vp-modal-main-img{flex:1;display:flex;align-items:center;justify-content:center;overflow:hidden;min-height:220px}
        .vp-modal-main-img img{width:100%;height:100%;object-fit:cover}
        .vp-modal-thumbs{display:flex;gap:6px;padding:10px;overflow-x:auto;background:white;border-top:1px solid ${lightColor}}
        .vp-modal-thumb{width:52px;height:52px;border-radius:8px;object-fit:cover;cursor:pointer;border:2px solid transparent;flex-shrink:0;transition:border-color 0.15s}
        .vp-modal-thumb.active{border-color:${accentColor}}
        .vp-modal-details{padding:24px;display:flex;flex-direction:column;gap:12px}
        .vp-modal-cat{font-size:10.5px;color:${accentColor};font-weight:600;letter-spacing:0.12em;text-transform:uppercase}
        .vp-modal-name{font-family:'Playfair Display',serif;font-size:22px;color:${darkColor};line-height:1.25}
        .vp-modal-price{font-size:24px;font-weight:700;color:${darkColor}}
        .vp-modal-price-old{font-size:13px;color:${midColor};text-decoration:line-through;margin-left:8px}
        .vp-modal-badge{display:inline-block;background:${accentColor};color:white;font-size:10px;padding:2px 10px;border-radius:12px;font-weight:600;margin-left:8px}
        .vp-modal-desc{font-size:13px;color:${midColor};line-height:1.7}
        .vp-modal-meta{display:flex;flex-wrap:wrap;gap:8px}
        .vp-modal-tag{background:${warmColor};border:1px solid ${lightColor};border-radius:8px;padding:4px 10px;font-size:11px;color:${midColor}}
        .vp-modal-divider{border:none;border-top:1px solid ${lightColor};margin:0}
        .vp-product-footer{display:flex;align-items:center;justify-content:space-between;gap:10px}
        .vp-price{font-size:16px;font-weight:600;color:${darkColor}}
        .vp-price-old{font-size:11px;color:${midColor};text-decoration:line-through;margin-left:4px}
        .vp-like-btn{width:32px;height:32px;border-radius:50%;background:white;border:1.5px solid ${lightColor};display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all 0.2s;flex-shrink:0}
        .vp-like-btn:hover{border-color:${accentColor};transform:scale(1.12)}
        .vp-like-btn.liked{background:${accentColor};border-color:${accentColor}}
        .vp-banner-strip{background:${darkColor};padding:28px 24px;display:flex;align-items:center;justify-content:space-between;border-radius:14px;margin-bottom:40px;gap:16px}
        .vp-banner-text h3{font-family:'Playfair Display',serif;font-size:20px;color:white;margin-bottom:6px}
        .vp-banner-text p{font-size:12px;color:rgba(255,255,255,0.6)}
        .vp-banner-cta{display:inline-flex;align-items:center;justify-content:center;background:${accentColor};color:white;text-decoration:none;border:none;padding:11px 26px;border-radius:6px;font-size:13px;font-weight:500;cursor:pointer;font-family:'DM Sans',sans-serif}
        .vp-footer{background:${darkColor};color:rgba(255,255,255,0.6);padding:32px 24px;text-align:center;font-size:12px}
        .vp-footer-logo{font-family:'Playfair Display',serif;color:${accentColor};font-size:20px;margin-bottom:8px}
        .vp-rating{display:flex;align-items:center;gap:3px;margin-bottom:6px}
        .vp-stars{color:${accentColor};font-size:12px}
        .vp-rating-count{font-size:10px;color:${midColor}}
        .vp-empty-block{background:white;border:1px solid ${lightColor};border-radius:14px;padding:28px;color:${midColor};margin-bottom:40px}
        .vp-about{background:white;border:1px solid ${lightColor};border-radius:14px;padding:28px 32px;margin-bottom:40px;display:flex;gap:20px;align-items:flex-start;scroll-margin-top:120px}
        #vp-social{scroll-margin-top:120px}
        .vp-about-icon{font-size:32px;flex-shrink:0;margin-top:2px}
        .vp-about-title{font-family:'Playfair Display',serif;font-size:17px;color:${darkColor};margin-bottom:8px}
        .vp-about-text{font-size:13px;color:${midColor};line-height:1.7}
        .vp-social-section{background:${darkColor};padding:48px 24px 36px}
        .vp-social-inner{max-width:1200px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr 1fr;gap:40px;align-items:start}
        .vp-social-col-title{font-family:'Playfair Display',serif;font-size:15px;color:${accentColor};margin-bottom:14px;letter-spacing:0.04em}
        .vp-social-info-row{display:flex;align-items:flex-start;gap:10px;margin-bottom:10px;font-size:12.5px;color:rgba(255,255,255,0.72);line-height:1.5}
        .vp-social-info-row span:first-child{font-size:15px;opacity:0.7;flex-shrink:0;margin-top:1px}
        .vp-social-links{display:flex;flex-wrap:wrap;gap:10px}
        .vp-social-link{display:inline-flex;align-items:center;gap:7px;padding:8px 16px;border-radius:24px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.14);color:rgba(255,255,255,0.85);text-decoration:none;font-size:12px;font-weight:500;transition:background 0.2s}
        .vp-social-link:hover{background:rgba(255,255,255,0.16)}
        .vp-shipping-strip{background:${accentColor};color:white;text-align:center;padding:10px 24px;font-size:12.5px;font-weight:500;letter-spacing:0.04em}
        .vp-wa-btn{display:inline-flex;align-items:center;gap:8px;background:#25d366;color:white;text-decoration:none;padding:11px 22px;border-radius:8px;font-size:13px;font-weight:600;margin-bottom:12px}
        @media (max-width: 1100px){
          .vp-social-inner{grid-template-columns:1fr 1fr}
        }
        @media (max-width: 760px){
          .vp-social-inner{grid-template-columns:1fr}
        }
        @media (max-width: 1100px){
          .vp-category-grid{grid-template-columns:repeat(3,1fr)}
          .vp-product-grid{grid-template-columns:repeat(2,1fr)}
          .vp-slide{padding:0 24px}
          .vp-slide-visual{right:20px;width:180px;height:180px;border-radius:50%}
        }
        @media (max-width: 760px){
          .vp-topbar,.vp-header{padding-left:14px;padding-right:14px}
          .vp-topbar{flex-direction:column;gap:6px;text-align:center}
          .vp-header{flex-direction:column;gap:12px}
          .vp-search{width:100%}
          .vp-nav{padding:0 10px}
          .vp-main{padding:24px 14px}
          .vp-category-grid,.vp-product-grid{grid-template-columns:1fr}
          .vp-section-header,.vp-banner-strip{flex-direction:column;align-items:flex-start}
          .vp-carousel{height:auto}
          .vp-slide{padding:28px 16px 70px;min-height:360px}
          .vp-slide-title{font-size:30px}
          .vp-slide-visual{position:relative;right:auto;top:auto;transform:none;width:160px;height:160px;border-radius:50%;margin-top:22px}
        }
      `}</style>

      <div className="vp-topbar">
        <span>{tagline || 'Discover premium local products'}</span>
        <span>{workingDays}: {businessHours} | {supportLine}</span>
      </div>

      <header className="vp-header">
        <div className="vp-logo">
          <span className="vp-logo-name">{brandName}</span>
          <span className="vp-logo-sub">Vendor Storefront</span>
        </div>
        <div className="vp-search">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b5c45" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={searchRef}
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(''); searchRef.current?.focus(); }}
              style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#6b5c45', fontSize: 15, padding: 0, lineHeight: 1 }}
            >
              ✕
            </button>
          )}
        </div>
        <div className="vp-header-actions">
          <button className="vp-icon-btn">♡</button>
          <button className="vp-icon-btn">
            🛍
            <span className="vp-badge">{Math.min(activeProducts.length, 9)}</span>
          </button>
          <button className="vp-icon-btn">👤</button>
        </div>
      </header>

      <nav className="vp-nav">
        <div
          className={`vp-nav-item${activeCategory === null ? ' active' : ''}`}
          onClick={() => setActiveCategory(null)}
        >All</div>
        {categories.map((cat) => (
          <div
            key={cat.name}
            className={`vp-nav-item${activeCategory === cat.name ? ' active' : ''}`}
            onClick={() => setActiveCategory(cat.name)}
          >{cat.name}</div>
        ))}
        <div
          className="vp-nav-item"
          onClick={() => navigate(`/vendor/${vendorId}/products`)}
        >View All</div>
        {socialLinks.length > 0 && (
          <div className="vp-nav-item" onClick={() => scrollTo('vp-social')}>Social</div>
        )}
        <div className="vp-nav-item" onClick={() => scrollTo('vp-about')}>About</div>
      </nav>

      <div className="vp-carousel">
        <button className="vp-carousel-arrow vp-arrow-left" onClick={() => setCurrentSlide((prev) => (prev - 1 + slideCount) % slideCount)}>
          &#8592;
        </button>
        <div className="vp-slides" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
          {slides.map((slide, index) => (
            <div key={index} className="vp-slide" style={{ background: slide.background }}>
              <div className="vp-slide-content">
                <div className="vp-slide-tag">{slide.tag}</div>
                <div className="vp-slide-title">{slide.title}</div>
                <div className="vp-slide-sub">{slide.copy}</div>
                {slide.link ? (
                  <a href={slide.link} className="vp-slide-btn" target={slide.link.startsWith('http') ? '_blank' : '_self'} rel="noreferrer">
                    {slide.button}
                  </a>
                ) : (
                  <Link to={`/vendor/${vendor.id}`} className="vp-slide-btn">
                    {slide.button}
                  </Link>
                )}
              </div>
              <div className="vp-slide-visual">
                {slide.visual ? (
                  <img src={slide.visual} alt={slide.title} />
                ) : (
                  <div className="vp-slide-visual-fallback">{brandName.slice(0, 1).toUpperCase()}</div>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="vp-carousel-dots">
          {slides.map((_, index) => (
            <div key={index} className={`vp-dot ${currentSlide === index ? 'active' : ''}`} onClick={() => setCurrentSlide(index)} />
          ))}
        </div>
        <button className="vp-carousel-arrow vp-arrow-right" onClick={() => setCurrentSlide((prev) => (prev + 1) % slideCount)}>
          &#8594;
        </button>
      </div>

      <main className="vp-main">
        {categories.length > 0 && (
          <>
            <div className="vp-section-header">
              <h2 className="vp-section-title">Shop by Category</h2>
              <span className="vp-see-all" onClick={() => navigate(`/vendor/${vendorId}/products`)}>View All &rarr;</span>
            </div>
            <div className="vp-category-grid">
              {categories.map((cat) => (
                <div
                  key={cat.name}
                  className={`vp-cat-card${activeCategory === cat.name ? ' vp-cat-card--active' : ''}`}
                  onClick={() => {
                    setActiveCategory(cat.name);
                    setTimeout(() => scrollTo('vp-products-section'), 50);
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  {cat.image
                    ? <img src={cat.image} alt={cat.name} className="vp-cat-thumb" />
                    : <div className="vp-cat-thumb-placeholder">🛍</div>}
                  <div className="vp-cat-name">{cat.name}</div>
                  <div className="vp-cat-count">{cat.count} {cat.count === 1 ? 'product' : 'products'}</div>
                </div>
              ))}
            </div>
          </>
        )}

        <div id="vp-about" className="vp-about">
          <span className="vp-about-icon">🏪</span>
          <div style={{ flex: 1 }}>
            <div className="vp-about-title">About {brandName}</div>
            <div className="vp-about-text">
              {settings?.about_text || tagline || `${brandName} offers a curated selection of quality products delivered with care and passion.`}
            </div>
            <div style={{ display: 'flex', gap: 24, marginTop: 14, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 18, fontWeight: 700, color: '#1a1208' }}>{activeProducts.length}</span>
                <span style={{ fontSize: 11, color: '#6b5c45' }}>Products</span>
              </div>
              {averageRating > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: 18, fontWeight: 700, color: '#1a1208' }}>{averageRating.toFixed(1)} ★</span>
                  <span style={{ fontSize: 11, color: '#6b5c45' }}>Avg Rating</span>
                </div>
              )}
              {overallReviews > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: 18, fontWeight: 700, color: '#1a1208' }}>{overallReviews}</span>
                  <span style={{ fontSize: 11, color: '#6b5c45' }}>Reviews</span>
                </div>
              )}
              {vendor.verified && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: 18, fontWeight: 700, color: '#2d6a4f' }}>✓</span>
                  <span style={{ fontSize: 11, color: '#6b5c45' }}>Verified</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {isPaginatedView ? (
          /* ── Paginated "View All / Category" view ── */
          (() => {
            const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
            const pageProducts = filteredProducts.slice(
              (currentPage - 1) * PRODUCTS_PER_PAGE,
              currentPage * PRODUCTS_PER_PAGE
            );

            const goToPage = (p: number) => {
              setCurrentPage(p);
              scrollTo('vp-products-section');
            };

            // Build page number array with ellipsis: [1, '...', 4, 5, 6, '...', 10]
            const pageNums: (number | '...')[] = [];
            if (totalPages <= 7) {
              for (let i = 1; i <= totalPages; i++) pageNums.push(i);
            } else {
              pageNums.push(1);
              if (currentPage > 3) pageNums.push('...');
              for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pageNums.push(i);
              if (currentPage < totalPages - 2) pageNums.push('...');
              pageNums.push(totalPages);
            }

            return (
              <>
                <div id="vp-products-section" className="vp-section-header" style={{ scrollMarginTop: 120 }}>
                  <h2 className="vp-section-title">
                    {debouncedSearch.trim()
                      ? `Results for "${debouncedSearch}"`
                      : activeCategory || 'All Products'}
                    <span style={{ fontSize: 13, color: '#6b5c45', fontWeight: 400, marginLeft: 10 }}>
                      ({filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''})
                    </span>
                  </h2>
                  <span
                    className="vp-see-all"
                    onClick={() => { setViewAll(false); setActiveCategory(null); setSearchQuery(''); }}
                  >← Back</span>
                </div>

                {filteredProducts.length > 0 ? (
                  <>
                    <div className="vp-product-grid">
                      {pageProducts.map((product) => (
                        <article key={product.id} className="vp-product-card" onClick={() => openProduct(product)}>
                          <div className="vp-product-img">
                            {product.discount_percentage > 0 && <div className="vp-product-badge">Sale</div>}
                            {product.images[0]
                              ? <img src={product.images[0]} alt={product.name} />
                              : <ProductPlaceholder name={product.name} category={product.category_name} />}
                          </div>
                          <div className="vp-product-info">
                            {settings?.show_ratings !== false && (
                              <div className="vp-rating">
                                <span className="vp-stars">{'★'.repeat(Math.max(1, Math.round(product.rating || 5)))}</span>
                                <span className="vp-rating-count">({product.review_count || 24})</span>
                              </div>
                            )}
                            <div className="vp-product-name">{product.name}</div>
                            <div className="vp-product-desc">{product.description || `${product.category_name || 'Store'} product from ${brandName}`}</div>
                            <div className="vp-product-footer">
                              <div>
                                <span className="vp-price">₹{Math.round(product.discount_percentage > 0 ? product.discounted_price : product.price)}</span>
                                {product.discount_percentage > 0 && <span className="vp-price-old">₹{Math.round(product.price)}</span>}
                              </div>
                              <button
                                className={`vp-like-btn${liked.has(product.id) ? ' liked' : ''}`}
                                onClick={(e) => { e.stopPropagation(); toggleLike(product.id); }}
                                title={liked.has(product.id) ? 'Unlike' : 'Like'}
                              >
                                <svg width="15" height="15" viewBox="0 0 24 24" fill={liked.has(product.id) ? 'white' : 'none'} stroke={liked.has(product.id) ? 'white' : '#c8a96e'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                                </svg>
                              </button>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>

                    {/* ── Pagination controls ── */}
                    {totalPages > 1 && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '32px 0 24px', flexWrap: 'wrap' }}>
                        {/* Prev */}
                        <button
                          onClick={() => goToPage(currentPage - 1)}
                          disabled={currentPage === 1}
                          style={{
                            padding: '8px 14px', borderRadius: 6, border: '1px solid #ede8df',
                            background: currentPage === 1 ? '#f5f1ea' : 'white',
                            color: currentPage === 1 ? '#bbb' : accentColor,
                            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                            fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500,
                          }}
                        >
                          ‹ Prev
                        </button>

                        {/* Page numbers */}
                        {pageNums.map((p, i) =>
                          p === '...' ? (
                            <span key={`ellipsis-${i}`} style={{ color: '#bbb', fontSize: 13, padding: '0 4px' }}>…</span>
                          ) : (
                            <button
                              key={p}
                              onClick={() => goToPage(p as number)}
                              style={{
                                width: 36, height: 36, borderRadius: 6,
                                border: currentPage === p ? 'none' : '1px solid #ede8df',
                                background: currentPage === p ? accentColor : 'white',
                                color: currentPage === p ? 'white' : darkColor,
                                cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                                fontSize: 13, fontWeight: currentPage === p ? 600 : 400,
                              }}
                            >
                              {p}
                            </button>
                          )
                        )}

                        {/* Next */}
                        <button
                          onClick={() => goToPage(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          style={{
                            padding: '8px 14px', borderRadius: 6, border: '1px solid #ede8df',
                            background: currentPage === totalPages ? '#f5f1ea' : 'white',
                            color: currentPage === totalPages ? '#bbb' : accentColor,
                            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                            fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500,
                          }}
                        >
                          Next ›
                        </button>
                      </div>
                    )}

                    <div style={{ textAlign: 'center', fontSize: 12, color: '#6b5c45', paddingBottom: 32 }}>
                      Showing {(currentPage - 1) * PRODUCTS_PER_PAGE + 1}–{Math.min(currentPage * PRODUCTS_PER_PAGE, filteredProducts.length)} of {filteredProducts.length} products
                    </div>
                  </>
                ) : (
                  <div className="vp-empty-block">No products found{activeCategory ? ` in "${activeCategory}"` : ''}.</div>
                )}
              </>
            );
          })()
        ) : (
          /* ── Normal home view: Featured + Promo + Recently Added ── */
          <>
            <div className="vp-section-header">
              <h2 className="vp-section-title">Featured Products</h2>
              <span className="vp-see-all" onClick={() => navigate(`/vendor/${vendorId}/products`)}>See All &rarr;</span>
            </div>
            {featuredProducts.length > 0 ? (
              <div className="vp-product-grid">
                {featuredProducts.map((product, index) => (
                  <article key={product.id} className="vp-product-card" onClick={() => openProduct(product)}>
                    <div className="vp-product-img">
                      <div className={`vp-product-badge ${index === 1 ? 'new' : ''}`}>
                        {product.discount_percentage > 0 ? 'Sale' : index === 1 ? 'New' : 'Featured'}
                      </div>
                      {product.images[0]
                        ? <img src={product.images[0]} alt={product.name} />
                        : <ProductPlaceholder name={product.name} category={product.category_name} />}
                    </div>
                    <div className="vp-product-info">
                      {settings?.show_ratings !== false && (
                        <div className="vp-rating">
                          <span className="vp-stars">{'★'.repeat(Math.max(1, Math.round(product.rating || 5)))}</span>
                          <span className="vp-rating-count">({product.review_count || 24})</span>
                        </div>
                      )}
                      <div className="vp-product-name">{product.name}</div>
                      <div className="vp-product-desc">{product.description || `${product.category_name || 'Store'} highlight from ${brandName}`}</div>
                      <div className="vp-product-footer">
                        <div>
                          <span className="vp-price">₹{Math.round(product.discount_percentage > 0 ? product.discounted_price : product.price)}</span>
                          {product.discount_percentage > 0 && <span className="vp-price-old">₹{Math.round(product.price)}</span>}
                        </div>
                        <button
                          className={`vp-like-btn${liked.has(product.id) ? ' liked' : ''}`}
                          onClick={(e) => { e.stopPropagation(); toggleLike(product.id); }}
                          title={liked.has(product.id) ? 'Unlike' : 'Like'}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill={liked.has(product.id) ? 'white' : 'none'} stroke={liked.has(product.id) ? 'white' : '#c8a96e'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="vp-empty-block">Featured products will appear here once this vendor adds them.</div>
            )}

            <div className="vp-banner-strip">
              <div className="vp-banner-text">
                <h3>{settings?.promo_headline || (vendor.verified ? 'Verified Seller, Premium Experience' : 'Discover This Local Business')}</h3>
                <p>{settings?.promo_subtext || addressText || 'Trusted storefront with curated products and direct vendor contact.'}</p>
              </div>
              <a
                href={settings?.promo_cta_link || (settings?.whatsapp_number ? `https://wa.me/${String(settings.whatsapp_number).replace(/\D/g, '')}` : `mailto:${supportLine}`)}
                className="vp-banner-cta"
                target="_blank"
                rel="noreferrer"
              >
                {settings?.promo_cta_label || 'Contact Vendor'}
              </a>
            </div>

            <div className="vp-section-header">
              <h2 className="vp-section-title">Recently Added</h2>
              <span className="vp-see-all" onClick={() => navigate(`/vendor/${vendorId}/products`)}>See All &rarr;</span>
            </div>
            {recentProducts.length > 0 ? (
              <div className="vp-product-grid">
                {recentProducts.map((product, index) => (
                  <article key={product.id} className="vp-product-card" onClick={() => openProduct(product)}>
                    <div className="vp-product-img">
                      {index === 0 && <div className="vp-product-badge new">New</div>}
                      {product.images[0]
                        ? <img src={product.images[0]} alt={product.name} />
                        : <ProductPlaceholder name={product.name} category={product.category_name} />}
                    </div>
                    <div className="vp-product-info">
                      {settings?.show_ratings !== false && (
                        <div className="vp-rating">
                          <span className="vp-stars">{'★'.repeat(Math.max(1, Math.round(product.rating || 4)))}</span>
                          <span className="vp-rating-count">({product.review_count || 18})</span>
                        </div>
                      )}
                      <div className="vp-product-name">{product.name}</div>
                      <div className="vp-product-desc">{product.description || `Freshly added to the ${brandName} storefront.`}</div>
                      <div className="vp-product-footer">
                        <div>
                          <span className="vp-price">₹{Math.round(product.discount_percentage > 0 ? product.discounted_price : product.price)}</span>
                          {product.discount_percentage > 0 && <span className="vp-price-old">₹{Math.round(product.price)}</span>}
                        </div>
                        <button
                          className={`vp-like-btn${liked.has(product.id) ? ' liked' : ''}`}
                          onClick={(e) => { e.stopPropagation(); toggleLike(product.id); }}
                          title={liked.has(product.id) ? 'Unlike' : 'Like'}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill={liked.has(product.id) ? 'white' : 'none'} stroke={liked.has(product.id) ? 'white' : '#c8a96e'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="vp-empty-block">More recent products and services will show here as inventory grows.</div>
            )}
          </>
        )}
      </main>

      {settings?.shipping_message && (
        <div className="vp-shipping-strip">🚚 {settings.shipping_message}</div>
      )}

      <section id="vp-social" className="vp-social-section">
        <div className="vp-social-inner">
          {/* Store Info */}
          <div>
            <div className="vp-social-col-title">{brandName}</div>
            {addressText && (
              <div className="vp-social-info-row"><span>📍</span><span>{addressText}</span></div>
            )}
            {(shop?.contact_phone || vendor.business_phone) && (
              <div className="vp-social-info-row"><span>📞</span><span>{shop?.contact_phone || vendor.business_phone}</span></div>
            )}
            {(settings?.social_email || shop?.contact_email || vendor.business_email) && (
              <div className="vp-social-info-row"><span>✉️</span><span>{settings?.social_email || shop?.contact_email || vendor.business_email}</span></div>
            )}
            {(settings?.contact_hours || businessHours) && (
              <div className="vp-social-info-row"><span>🕐</span><span>{settings?.contact_hours || `${workingDays}: ${businessHours}`}</span></div>
            )}
          </div>

          {/* Social Links */}
          <div>
            <div className="vp-social-col-title">Follow Us</div>
            <div className="vp-social-links">
              {settings?.whatsapp_number && (
                <a href={`https://wa.me/${String(settings.whatsapp_number).replace(/\D/g, '')}`} className="vp-social-link" target="_blank" rel="noreferrer">
                  💬 WhatsApp
                </a>
              )}
              {settings?.instagram_url && (
                <a href={settings.instagram_url} className="vp-social-link" target="_blank" rel="noreferrer">
                  📸 Instagram
                </a>
              )}
              {settings?.facebook_url && (
                <a href={settings.facebook_url} className="vp-social-link" target="_blank" rel="noreferrer">
                  📘 Facebook
                </a>
              )}
              {settings?.twitter_url && (
                <a href={settings.twitter_url} className="vp-social-link" target="_blank" rel="noreferrer">
                  🐦 Twitter
                </a>
              )}
              {settings?.website_url && (
                <a href={settings.website_url} className="vp-social-link" target="_blank" rel="noreferrer">
                  🌐 Website
                </a>
              )}
              {!settings?.whatsapp_number && !settings?.instagram_url && !settings?.facebook_url && !settings?.twitter_url && !settings?.website_url && (
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>No social links added yet</span>
              )}
            </div>
          </div>

          {/* Contact CTA */}
          <div>
            <div className="vp-social-col-title">Get in Touch</div>
            {settings?.whatsapp_number ? (
              <a href={`https://wa.me/${String(settings.whatsapp_number).replace(/\D/g, '')}`} className="vp-wa-btn" target="_blank" rel="noreferrer">
                💬 Chat on WhatsApp
              </a>
            ) : (
              <a href={`mailto:${supportLine}`} className="vp-wa-btn" style={{ background: accentColor }} target="_blank" rel="noreferrer">
                ✉️ Send Email
              </a>
            )}
            {vendor.verified && (
              <div className="vp-social-info-row" style={{ marginTop: 6 }}><span>✅</span><span>Verified Seller</span></div>
            )}
            {vendor.gst_number && (
              <div className="vp-social-info-row"><span>🏷️</span><span>GST: {vendor.gst_number}</span></div>
            )}
          </div>
        </div>
      </section>

      <footer className="vp-footer">
        <div className="vp-footer-logo">{brandName}</div>
        <p>{tagline}</p>
        <p style={{ marginTop: 8, fontSize: 11, opacity: 0.5 }}>
          © 2026 {brandName}. All rights reserved.
        </p>
      </footer>

      {selectedProduct && (
        <div className="vp-modal-overlay" onClick={closeProduct}>
          <div className="vp-modal" onClick={(e) => e.stopPropagation()}>
            <button className="vp-modal-close" onClick={closeProduct}>✕</button>
            <div className="vp-modal-body">
              <div className="vp-modal-gallery">
                <div className="vp-modal-main-img">
                  {selectedProduct.images?.[modalImg] ? (
                    <img src={selectedProduct.images[modalImg]} alt={selectedProduct.name} />
                  ) : (
                    <ProductPlaceholder name={selectedProduct.name} category={selectedProduct.category_name} size="lg" />
                  )}
                </div>
                {selectedProduct.images?.length > 1 && (
                  <div className="vp-modal-thumbs">
                    {selectedProduct.images.map((img: string, i: number) => (
                      <img
                        key={i}
                        src={img}
                        alt=""
                        className={`vp-modal-thumb${modalImg === i ? ' active' : ''}`}
                        onClick={() => setModalImg(i)}
                      />
                    ))}
                  </div>
                )}
              </div>
              <div className="vp-modal-details">
                <div className="vp-modal-cat">{selectedProduct.category_name}</div>
                <div className="vp-modal-name">{selectedProduct.name}</div>
                <div>
                  <span className="vp-modal-price">
                    ₹{Math.round(selectedProduct.discount_percentage > 0 ? selectedProduct.discounted_price : selectedProduct.price)}
                  </span>
                  {selectedProduct.discount_percentage > 0 && (
                    <>
                      <span className="vp-modal-price-old">₹{Math.round(selectedProduct.price)}</span>
                      <span className="vp-modal-badge">{selectedProduct.discount_percentage}% off</span>
                    </>
                  )}
                </div>
                {settings?.show_ratings !== false && (
                  <div className="vp-rating">
                    <span className="vp-stars">{'★'.repeat(Math.max(1, Math.round(selectedProduct.rating || 5)))}</span>
                    <span className="vp-rating-count">({selectedProduct.review_count || 24} reviews)</span>
                  </div>
                )}
                <hr className="vp-modal-divider" />
                <div className="vp-modal-desc">{selectedProduct.description || 'No description available.'}</div>
                <div className="vp-modal-meta">
                  {selectedProduct.stock != null && (
                    <span className="vp-modal-tag">Stock: {selectedProduct.stock}</span>
                  )}
                  {selectedProduct.brand && (
                    <span className="vp-modal-tag">Brand: {selectedProduct.brand}</span>
                  )}
                  {selectedProduct.unit && (
                    <span className="vp-modal-tag">Unit: {selectedProduct.unit}</span>
                  )}
                </div>
                {selectedProduct.variants?.length > 0 && (
                  <>
                    <hr className="vp-modal-divider" />
                    <div>
                      <div style={{ fontSize: 11, color: midColor, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Variants</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {selectedProduct.variants.map((v: any) => (
                          <span key={v.id} className="vp-modal-tag">
                            {[v.size, v.color].filter(Boolean).join(' / ')}
                            {v.price ? ` — ₹${Math.round(v.price)}` : ''}
                          </span>
                        ))}
                      </div>
                    </div>
                  </>
                )}
                <hr className="vp-modal-divider" />
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button
                    className={`vp-like-btn${liked.has(selectedProduct.id) ? ' liked' : ''}`}
                    style={{ width: 40, height: 40 }}
                    onClick={() => toggleLike(selectedProduct.id)}
                    title={liked.has(selectedProduct.id) ? 'Unlike' : 'Like'}
                  >
                    <svg width="17" height="17" viewBox="0 0 24 24" fill={liked.has(selectedProduct.id) ? 'white' : 'none'} stroke={liked.has(selectedProduct.id) ? 'white' : '#c8a96e'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                  </button>
                  <span style={{ fontSize: 12, color: midColor }}>
                    {liked.has(selectedProduct.id) ? 'Saved to wishlist' : 'Save to wishlist'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicVendorPage;
