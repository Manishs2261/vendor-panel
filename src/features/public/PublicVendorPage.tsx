import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { publicApi } from '../../api/services';

interface MarketplaceSettings {
  theme?: string;
  primary_color?: string;
  secondary_color?: string;
  background_color?: string;
  banner_text?: string;
  banner_subtext?: string;
  show_banner?: boolean;
  show_vendor_info?: boolean;
  show_contact_info?: boolean;
  show_ratings?: boolean;
  products_per_page?: number;
  custom_css?: string;
  facebook_url?: string;
  instagram_url?: string;
  twitter_url?: string;
  whatsapp_number?: string;
  enable_reviews?: boolean;
  enable_wishlist?: boolean;
  enable_sharing?: boolean;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
}

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
  const [data, setData] = useState<PublicVendorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [marketplaceSettings, setMarketplaceSettings] = useState<MarketplaceSettings | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  const previewSettings = useMemo(() => {
    const previewKey = new URLSearchParams(location.search).get('preview');
    if (!previewKey) return null;

    try {
      const rawPreview = localStorage.getItem(previewKey);
      if (!rawPreview) return null;
      const parsedPreview = JSON.parse(rawPreview);
      if (String(parsedPreview.vendorId) !== String(vendorId)) return null;
      return parsedPreview.settings as MarketplaceSettings;
    } catch (previewError) {
      console.error('Failed to read preview settings:', previewError);
      return null;
    }
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
          setMarketplaceSettings(settingsResponse.data);
        } catch (settingsError) {
          console.error('Failed to load marketplace settings:', settingsError);
          setMarketplaceSettings(null);
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

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 3);
    }, 4000);

    return () => window.clearInterval(timer);
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', fontFamily: "'DM Sans', sans-serif", color: '#6b5c45' }}>
        Loading storefront...
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
  const activeProducts = products
    .filter((product) => product.status === 'ACTIVE' || product.status === 'approved')
    .slice(0, settings?.products_per_page || products.length || 8);
  const featuredProducts = activeProducts.slice(0, 4);
  const recentProducts = activeProducts.slice(4, 8).length > 0 ? activeProducts.slice(4, 8) : activeProducts.slice(0, 4);
  const categories = Array.from(new Set(activeProducts.map((product) => product.category_name).filter(Boolean))).slice(0, 10);
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

  const slides = [
    {
      tag: 'Featured Vendor',
      title: heroTitle,
      copy: tagline,
      button: 'Visit Store',
      background: shop?.banner_url
        ? `linear-gradient(120deg, rgba(26,18,8,0.78) 55%, rgba(61,46,24,0.62) 100%), url(${shop.banner_url}) center/cover`
        : `linear-gradient(120deg, ${darkColor} 55%, ${accentColor} 180%)`,
      visual: shop?.logo_url,
    },
    {
      tag: 'Trust & Service',
      title: vendor.verified ? 'Verified Seller' : 'Local Business You Can Trust',
      copy: addressText || 'Reliable quality, authentic service, and a storefront designed to make buying feel easy.',
      button: 'See Contact Info',
      background: 'linear-gradient(120deg, #0d2238 55%, #1a3d5c 100%)',
      visual: '',
    },
    {
      tag: 'Shop Highlights',
      title: `${featuredProducts.length || activeProducts.length} curated products`,
      copy: `Rated ${averageRating.toFixed(1)} by customers with ${overallReviews || 24} review mentions across this storefront.`,
      button: 'Explore Products',
      background: 'linear-gradient(120deg, #1a0d0d 55%, #3d1818 100%)',
      visual: featuredProducts[0]?.images?.[0] || '',
    },
  ];

  return (
    <div style={{ width: '100%', minHeight: '100vh', background: creamColor, color: '#1a1a1a', fontFamily: "'DM Sans', sans-serif", fontSize: 14, overflowX: 'hidden' }}>
      {settings?.custom_css ? <style>{settings.custom_css}</style> : null}
      <style>{`
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
        .vp-nav-item{padding:12px 16px;font-size:13px;color:${midColor};cursor:pointer;border-bottom:2px solid transparent;white-space:nowrap;transition:all 0.2s;font-weight:400}
        .vp-nav-item.active,.vp-nav-item:hover{color:${darkColor};border-bottom-color:${accentColor};font-weight:500}
        .vp-carousel{position:relative;overflow:hidden;height:340px;background:${darkColor}}
        .vp-slides{display:flex;transition:transform 0.55s cubic-bezier(0.25,0.46,0.45,0.94);height:100%}
        .vp-slide{min-width:100%;height:100%;display:flex;align-items:center;padding:0 60px;position:relative;overflow:hidden}
        .vp-slide-content{z-index:2;max-width:420px}
        .vp-slide-tag{font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:${accentColor};font-weight:500;margin-bottom:12px}
        .vp-slide-title{font-family:'Playfair Display',serif;font-size:36px;color:white;line-height:1.15;margin-bottom:12px}
        .vp-slide-sub{font-size:13px;color:rgba(255,255,255,0.65);line-height:1.6;margin-bottom:24px}
        .vp-slide-btn{display:inline-flex;align-items:center;justify-content:center;background:${accentColor};color:white;text-decoration:none;border:none;padding:11px 28px;border-radius:4px;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:500;cursor:pointer;letter-spacing:0.04em}
        .vp-slide-visual{position:absolute;right:80px;top:50%;transform:translateY(-50%);width:220px;height:220px;border-radius:16px;overflow:hidden;opacity:0.92;background:rgba(255,255,255,0.06);display:flex;align-items:center;justify-content:center}
        .vp-slide-visual img{width:100%;height:100%;object-fit:cover}
        .vp-slide-visual-fallback{width:220px;height:220px;display:flex;align-items:center;justify-content:center;color:${accentColor};font-family:'Playfair Display',serif;font-size:56px;border:1px solid rgba(255,255,255,0.12)}
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
        .vp-cat-card{background:white;border-radius:12px;padding:20px 12px;text-align:center;border:1px solid ${lightColor};transition:all 0.2s}
        .vp-cat-card:hover{border-color:${accentColor};transform:translateY(-2px);box-shadow:0 6px 20px rgba(200,169,110,0.12)}
        .vp-cat-icon{font-size:28px;margin-bottom:10px;display:block}
        .vp-cat-name{font-size:12px;color:${midColor};font-weight:500}
        .vp-product-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:18px;margin-bottom:40px}
        .vp-product-card{background:white;border-radius:14px;overflow:hidden;border:1px solid ${lightColor};transition:all 0.22s;cursor:pointer}
        .vp-product-card:hover{transform:translateY(-3px);box-shadow:0 10px 30px rgba(0,0,0,0.08)}
        .vp-product-img{height:180px;display:flex;align-items:center;justify-content:center;background:${warmColor};position:relative}
        .vp-product-img img{width:100%;height:100%;object-fit:cover}
        .vp-product-badge{position:absolute;top:10px;left:10px;background:${accentColor};color:white;font-size:10px;padding:3px 10px;border-radius:12px;font-weight:500;letter-spacing:0.04em}
        .vp-product-badge.new{background:#2d6a4f}
        .vp-product-info{padding:14px}
        .vp-product-name{font-size:13px;font-weight:500;color:${darkColor};margin-bottom:4px;line-height:1.4}
        .vp-product-desc{font-size:11px;color:${midColor};margin-bottom:10px;line-height:1.5}
        .vp-product-footer{display:flex;align-items:center;justify-content:space-between;gap:10px}
        .vp-price{font-size:16px;font-weight:600;color:${darkColor}}
        .vp-price-old{font-size:11px;color:${midColor};text-decoration:line-through;margin-left:4px}
        .vp-add-btn{background:${darkColor};color:white;border:none;padding:7px 14px;border-radius:8px;font-size:11px;font-weight:500;cursor:pointer;transition:background 0.2s}
        .vp-add-btn:hover{background:${accentColor}}
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
        @media (max-width: 1100px){
          .vp-category-grid{grid-template-columns:repeat(3,1fr)}
          .vp-product-grid{grid-template-columns:repeat(2,1fr)}
          .vp-slide{padding:0 24px}
          .vp-slide-visual{right:24px;width:180px;height:180px}
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
          .vp-slide-visual{position:relative;right:auto;top:auto;transform:none;width:100%;max-width:220px;height:220px;margin-top:22px}
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
          <input type="text" placeholder="Search products..." />
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
        <div className="vp-nav-item active">All</div>
        {categories.map((category) => (
          <div key={category} className="vp-nav-item">{category}</div>
        ))}
        {socialLinks.length > 0 && <div className="vp-nav-item">Social</div>}
        <div className="vp-nav-item">About</div>
      </nav>

      <div className="vp-carousel">
        <button className="vp-carousel-arrow vp-arrow-left" onClick={() => setCurrentSlide((prev) => (prev + 2) % 3)}>
          &#8592;
        </button>
        <div className="vp-slides" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
          {slides.map((slide, index) => (
            <div key={index} className="vp-slide" style={{ background: slide.background }}>
              <div className="vp-slide-content">
                <div className="vp-slide-tag">{slide.tag}</div>
                <div className="vp-slide-title">{slide.title}</div>
                <div className="vp-slide-sub">{slide.copy}</div>
                <Link to={`/vendor/${vendor.id}`} className="vp-slide-btn">
                  {slide.button}
                </Link>
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
          {[0, 1, 2].map((index) => (
            <div key={index} className={`vp-dot ${currentSlide === index ? 'active' : ''}`} onClick={() => setCurrentSlide(index)} />
          ))}
        </div>
        <button className="vp-carousel-arrow vp-arrow-right" onClick={() => setCurrentSlide((prev) => (prev + 1) % 3)}>
          &#8594;
        </button>
      </div>

      <main className="vp-main">
        <div className="vp-section-header">
          <h2 className="vp-section-title">Shop by Category</h2>
          <span className="vp-see-all">View All &rarr;</span>
        </div>
        <div className="vp-category-grid">
          {(categories.length > 0 ? categories : ['Featured', 'Popular', 'Seasonal', 'New']).slice(0, 6).map((category, index) => (
            <div key={category} className="vp-cat-card">
              <span className="vp-cat-icon">{['🧵', '🏺', '💍', '🌿', '🪔', '👜'][index % 6]}</span>
              <div className="vp-cat-name">{category}</div>
            </div>
          ))}
        </div>

        <div className="vp-section-header">
          <h2 className="vp-section-title">Featured Products</h2>
          <span className="vp-see-all">See All &rarr;</span>
        </div>
        {featuredProducts.length > 0 ? (
          <div className="vp-product-grid">
            {featuredProducts.map((product, index) => (
              <article key={product.id} className="vp-product-card">
                <div className="vp-product-img">
                  <div className={`vp-product-badge ${index === 1 ? 'new' : ''}`}>
                    {product.discount_percentage > 0 ? 'Sale' : index === 1 ? 'New' : 'Featured'}
                  </div>
                  {product.images[0] ? (
                    <img src={product.images[0]} alt={product.name} />
                  ) : (
                    <div style={{ fontSize: 56, color: accentColor, fontFamily: "'Playfair Display', serif" }}>
                      {product.name.slice(0, 1).toUpperCase()}
                    </div>
                  )}
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
                    <button className="vp-add-btn">+ Add</button>
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
            <h3>{vendor.verified ? 'Verified Seller, Premium Experience' : 'Discover This Local Business'}</h3>
            <p>{addressText || 'Trusted storefront with curated products and direct vendor contact.'}</p>
          </div>
          <a
            href={settings?.whatsapp_number ? `https://wa.me/${String(settings.whatsapp_number).replace(/\D/g, '')}` : `mailto:${supportLine}`}
            className="vp-banner-cta"
            target="_blank"
            rel="noreferrer"
          >
            Contact Vendor
          </a>
        </div>

        <div className="vp-section-header">
          <h2 className="vp-section-title">Recently Added</h2>
          <span className="vp-see-all">See All &rarr;</span>
        </div>
        {recentProducts.length > 0 ? (
          <div className="vp-product-grid">
            {recentProducts.map((product, index) => (
              <article key={product.id} className="vp-product-card">
                <div className="vp-product-img">
                  {index === 0 && <div className="vp-product-badge new">New</div>}
                  {product.images[0] ? (
                    <img src={product.images[0]} alt={product.name} />
                  ) : (
                    <div style={{ fontSize: 56, color: accentColor, fontFamily: "'Playfair Display', serif" }}>
                      {product.name.slice(0, 1).toUpperCase()}
                    </div>
                  )}
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
                    <button className="vp-add-btn">+ Add</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="vp-empty-block">More recent products and services will show here as inventory grows.</div>
        )}
      </main>

      <footer className="vp-footer">
        <div className="vp-footer-logo">{brandName}</div>
        <p>{tagline}</p>
        <p style={{ marginTop: 8, fontSize: 11, opacity: 0.5 }}>
          © 2026 {brandName}. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default PublicVendorPage;
