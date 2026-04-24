import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
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
}

const PublicVendorPage: React.FC = () => {
  const { vendorId } = useParams<{ vendorId: string }>();
  const location = useLocation();
  const [data, setData] = useState<PublicVendorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [marketplaceSettings, setMarketplaceSettings] = useState<MarketplaceSettings | null>(null);
  const [viewportWidth, setViewportWidth] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1280
  );

  const previewSettings = useMemo(() => {
    const previewKey = new URLSearchParams(location.search).get('preview');
    if (!previewKey) {
      return null;
    }

    try {
      const rawPreview = localStorage.getItem(previewKey);
      if (!rawPreview) {
        return null;
      }

      const parsedPreview = JSON.parse(rawPreview);
      if (String(parsedPreview.vendorId) !== String(vendorId)) {
        return null;
      }

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
    if (typeof window === 'undefined') {
      return;
    }

    const handleResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          fontSize: 18,
          color: '#666',
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        Loading storefront preview...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          fontSize: 18,
          color: '#666',
          textAlign: 'center',
          padding: 20,
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 16 }}>Store</div>
        <div style={{ marginBottom: 8 }}>Vendor Profile Not Found</div>
        <div style={{ fontSize: 14, marginBottom: 24 }}>{error}</div>
        <Link
          to="/"
          style={{
            padding: '12px 24px',
            background: '#007bff',
            color: 'white',
            textDecoration: 'none',
            borderRadius: 6,
            fontSize: 14,
          }}
        >
          Go to Homepage
        </Link>
      </div>
    );
  }

  const { vendor, shop, products } = data;
  const activeSettings = previewSettings || marketplaceSettings;
  const activeProducts = products
    .filter((product) => product.status === 'ACTIVE' || product.status === 'approved')
    .slice(0, activeSettings?.products_per_page || products.length);

  const pageBackground = activeSettings?.background_color || '#faf8f5';
  const accentColor = activeSettings?.primary_color || '#c8a96e';
  const surfaceColor = activeSettings?.secondary_color || '#ffffff';
  const showBanner = activeSettings?.show_banner !== false;
  const showVendorInfo = activeSettings?.show_vendor_info !== false;
  const showContactInfo = activeSettings?.show_contact_info !== false;
  const bannerTitle = activeSettings?.banner_text?.trim() || shop?.name || vendor.business_name;
  const bannerSubtitle = activeSettings?.banner_subtext?.trim() || shop?.description || '';
  const categoryItems = ['Storefront', 'Featured', 'Collections', 'Offers', 'About'];
  const isMobile = viewportWidth < 768;
  const isTablet = viewportWidth < 1024;
  const socialLinks = [
    { label: 'Facebook', value: activeSettings?.facebook_url },
    { label: 'Instagram', value: activeSettings?.instagram_url },
    { label: 'Twitter', value: activeSettings?.twitter_url },
    { label: 'WhatsApp', value: activeSettings?.whatsapp_number },
  ].filter((item) => item.value);

  return (
    <div
      style={{
        width: '100%',
        minHeight: '100vh',
        background: pageBackground,
        fontFamily: "'DM Sans', sans-serif",
        color: '#1a1208',
        overflowX: 'hidden',
      }}
    >
      {activeSettings?.custom_css ? <style>{activeSettings.custom_css}</style> : null}

      <div
        style={{
          background: '#1a1208',
          color: '#e8d5b0',
          padding: isMobile ? '8px 14px' : '8px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? '6px' : 0,
          fontSize: '11px',
          letterSpacing: '0.08em',
          textAlign: isMobile ? 'center' : 'left',
        }}
      >
        <span>{bannerSubtitle || 'Preview your storefront with marketplace styling.'}</span>
        <span>{showContactInfo && shop?.contact_email ? shop.contact_email : 'Vendor storefront preview'}</span>
      </div>

      <div
        style={{
          background: 'white',
          borderBottom: '1px solid #ede8df',
          padding: isMobile ? '14px' : '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? '12px' : '16px',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: '22px',
              color: '#1a1208',
              letterSpacing: '0.02em',
            }}
          >
            {shop?.name || vendor.business_name}
          </span>
          <span
            style={{
              fontSize: '10px',
              color: accentColor,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              marginTop: '1px',
            }}
          >
            Vendor Storefront
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: '#f0ebe2',
            borderRadius: '24px',
            padding: '8px 16px',
            gap: '8px',
            width: isMobile ? '100%' : isTablet ? '220px' : '260px',
            maxWidth: isMobile ? '100%' : '260px',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b5c45" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search this store..."
            style={{
              border: 'none',
              background: 'transparent',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '13px',
              width: '100%',
              outline: 'none',
              color: '#1a1208',
            }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', width: isMobile ? '100%' : 'auto', justifyContent: isMobile ? 'center' : 'flex-end' }}>
          {['♡', '🛍', '👤'].map((icon) => (
            <button
              key={icon}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: '#f0ebe2',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '15px',
              }}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>

      <div
        style={{
          background: 'white',
          borderBottom: '1px solid #ede8df',
          padding: isMobile ? '0 10px' : '0 24px',
          display: 'flex',
          alignItems: 'center',
          overflowX: 'auto',
        }}
      >
        {categoryItems.map((item, index) => (
          <div
            key={item}
            style={{
              padding: '12px 16px',
              fontSize: '13px',
              color: index === 0 ? '#1a1208' : '#6b5c45',
              borderBottom: index === 0 ? `2px solid ${accentColor}` : '2px solid transparent',
              whiteSpace: 'nowrap',
              fontWeight: index === 0 ? '500' : '400',
            }}
          >
            {item}
          </div>
        ))}
      </div>

      {showBanner && (
        <div style={{ position: 'relative', overflow: 'hidden', minHeight: isMobile ? 'auto' : '360px', background: '#1a1208' }}>
          <div
            style={{
              minHeight: isMobile ? 'auto' : '360px',
              display: 'flex',
              alignItems: 'center',
              padding: isMobile ? '28px 18px 24px' : isTablet ? '32px 28px' : '0 60px',
              position: 'relative',
              overflow: 'hidden',
              flexDirection: isTablet ? 'column' : 'row',
              justifyContent: isTablet ? 'flex-start' : 'center',
              gap: isTablet ? '24px' : 0,
              background: shop?.banner_url
                ? `linear-gradient(120deg, rgba(26,18,8,0.84) 38%, rgba(26,18,8,0.45) 100%), url(${shop.banner_url}) center/cover`
                : `linear-gradient(120deg, #1a1208 45%, ${accentColor} 130%)`,
            }}
          >
            <div style={{ zIndex: 2, maxWidth: isTablet ? '100%' : '460px', width: isTablet ? '100%' : 'auto' }}>
              <div
                style={{
                  fontSize: '10px',
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: accentColor,
                  fontWeight: '500',
                  marginBottom: '12px',
                }}
              >
                Welcome to
              </div>
              <div
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: isMobile ? '30px' : isTablet ? '36px' : '42px',
                  color: 'white',
                  lineHeight: '1.1',
                  marginBottom: '14px',
                }}
              >
                {bannerTitle}
              </div>
              <div
                style={{
                  fontSize: '14px',
                  color: 'rgba(255,255,255,0.74)',
                  lineHeight: '1.7',
                  marginBottom: '26px',
                }}
              >
                {bannerSubtitle || 'A polished storefront preview with your live branding, layout, and product choices.'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                <button
                  style={{
                    background: accentColor,
                    color: 'white',
                    border: 'none',
                    padding: '11px 28px',
                    borderRadius: '4px',
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '13px',
                    fontWeight: '500',
                    letterSpacing: '0.04em',
                  }}
                >
                  Shop This Store
                </button>
                <span style={{ color: 'rgba(255,255,255,0.72)', fontSize: '13px' }}>
                  {activeProducts.length} products available
                </span>
              </div>
            </div>

            <div
              style={{
                position: isTablet ? 'relative' : 'absolute',
                right: isTablet ? 'auto' : '80px',
                top: isTablet ? 'auto' : '50%',
                transform: isTablet ? 'none' : 'translateY(-50%)',
                width: isMobile ? '100%' : '260px',
                maxWidth: isTablet ? '100%' : '260px',
                minHeight: '220px',
                borderRadius: '22px',
                overflow: 'hidden',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.08)',
                padding: '22px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                backdropFilter: 'blur(8px)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                {shop?.logo_url ? (
                  <img
                    src={shop.logo_url}
                    alt={shop?.name || vendor.business_name}
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '18px',
                      objectFit: 'cover',
                      border: '2px solid rgba(255,255,255,0.45)',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '18px',
                      background: accentColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontFamily: "'Playfair Display', serif",
                      fontSize: '22px',
                    }}
                  >
                    {(shop?.name || vendor.business_name).slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div>
                  <div style={{ color: 'white', fontWeight: 600, fontSize: '17px' }}>
                    {shop?.name || vendor.business_name}
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '12px', marginTop: '4px' }}>
                    {vendor.verified ? 'Verified seller' : 'Growing local brand'}
                  </div>
                </div>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                  gap: '12px',
                  marginTop: '18px',
                }}
              >
                <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '14px', padding: '14px' }}>
                  <div style={{ color: accentColor, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    Products
                  </div>
                  <div style={{ color: 'white', fontSize: '24px', fontWeight: 700, marginTop: '6px' }}>
                    {activeProducts.length}
                  </div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '14px', padding: '14px' }}>
                  <div style={{ color: accentColor, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    Status
                  </div>
                  <div style={{ color: 'white', fontSize: '16px', fontWeight: 700, marginTop: '10px' }}>
                    {vendor.verified ? 'Live' : 'Preview'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: isMobile ? '24px 14px 40px' : '32px 24px 56px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            gap: '20px',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <h2
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: '28px',
                color: '#1a1208',
                margin: 0,
              }}
            >
              Featured Products
            </h2>
            <p style={{ margin: '8px 0 0', color: '#6b5c45', fontSize: '14px' }}>
              A storefront preview inspired by the marketplace showcase, with your own branding and content.
            </p>
          </div>
          <span
            style={{
              fontSize: '12px',
              color: accentColor,
              letterSpacing: '0.06em',
              fontWeight: '600',
              textTransform: 'uppercase',
            }}
          >
            {activeProducts.length} products visible
          </span>
        </div>

        {showVendorInfo && (
          <div style={{ display: 'grid', gridTemplateColumns: isTablet ? '1fr' : '1.5fr 1fr', gap: '24px', marginBottom: '28px' }}>
            <div style={{ background: surfaceColor, borderRadius: '18px', padding: '24px', border: '1px solid #ede8df' }}>
              <div
                style={{
                  fontSize: '11px',
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: accentColor,
                  marginBottom: '12px',
                }}
              >
                About This Store
              </div>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '28px', margin: '0 0 10px' }}>
                {shop?.name || vendor.business_name}
              </h3>
              <p style={{ margin: 0, color: '#6b5c45', lineHeight: '1.8', fontSize: '14px' }}>
                {shop?.description || bannerSubtitle || 'Use marketplace settings to personalize the message, colors, and presentation of your vendor storefront preview.'}
              </p>
            </div>
            <div style={{ background: surfaceColor, borderRadius: '18px', padding: '24px', border: '1px solid #ede8df' }}>
              <div
                style={{
                  fontSize: '11px',
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: accentColor,
                  marginBottom: '14px',
                }}
              >
                Store Details
              </div>
              <div style={{ display: 'grid', gap: '12px', color: '#6b5c45', fontSize: '14px' }}>
                <div><strong style={{ color: '#1a1208' }}>Business:</strong> {vendor.business_name}</div>
                {shop?.address ? <div><strong style={{ color: '#1a1208' }}>Address:</strong> {shop.address}, {shop.city}, {shop.state} {shop.postal_code}</div> : null}
                {showContactInfo && shop?.contact_phone ? <div><strong style={{ color: '#1a1208' }}>Phone:</strong> {shop.contact_phone}</div> : null}
                {showContactInfo && shop?.contact_email ? <div><strong style={{ color: '#1a1208' }}>Email:</strong> {shop.contact_email}</div> : null}
              </div>
            </div>
          </div>
        )}

        {activeProducts.length === 0 ? (
          <div style={{ background: surfaceColor, borderRadius: '18px', padding: '72px 24px', textAlign: 'center', border: '1px solid #ede8df' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>Box</div>
            <h3 style={{ margin: '0 0 8px', fontSize: '20px', color: '#1a1208' }}>No products in this preview yet</h3>
            <p style={{ margin: 0, color: '#6b5c45' }}>Add products or switch visibility settings to see the storefront fill out here.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, minmax(0, 1fr))' : 'repeat(3, minmax(0, 1fr))', gap: '24px' }}>
            {activeProducts.map((product) => (
              <div
                key={product.id}
                style={{
                  background: surfaceColor,
                  borderRadius: '16px',
                  overflow: 'hidden',
                  border: '1px solid #ede8df',
                  transition: 'all 0.22s',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div
                  style={{
                    height: '220px',
                    background: product.images[0]
                      ? `url(${product.images[0]}) center/cover`
                      : `linear-gradient(135deg, ${accentColor} 0%, #764ba2 100%)`,
                    position: 'relative',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: '16px',
                      right: '16px',
                      background: 'rgba(255,255,255,0.92)',
                      color: '#1a1208',
                      padding: '6px 10px',
                      borderRadius: '999px',
                      fontSize: '11px',
                      fontWeight: '600',
                    }}
                  >
                    {product.category_name || 'Featured'}
                  </div>
                  {!product.images[0] && (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '42px',
                        color: 'rgba(255,255,255,0.9)',
                      }}
                    >
                      Box
                    </div>
                  )}
                </div>
                <div style={{ padding: '18px' }}>
                  <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 600, color: '#1a1208' }}>
                    {product.name}
                  </h3>
                  <p style={{ margin: '0 0 14px', fontSize: '13px', color: '#6b5c45', lineHeight: '1.65', minHeight: '42px' }}>
                    {product.description || 'A beautiful product card preview matching the main marketplace presentation.'}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? '10px' : 0 }}>
                    <div>
                      {product.discount_percentage > 0 ? (
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '17px', color: '#dc3545', fontWeight: 700 }}>
                            Rs {product.discounted_price.toLocaleString()}
                          </span>
                          <span style={{ fontSize: '12px', color: '#999', textDecoration: 'line-through' }}>
                            Rs {product.price.toLocaleString()}
                          </span>
                        </div>
                      ) : (
                        <span style={{ fontSize: '17px', fontWeight: 700, color: accentColor }}>
                          Rs {product.price.toLocaleString()}
                        </span>
                      )}
                    </div>
                    <span
                      style={{
                        fontSize: '11px',
                        color: product.stock > 0 ? '#2e7d32' : '#a94442',
                        background: product.stock > 0 ? '#e6f4ea' : '#fdecea',
                        padding: '5px 8px',
                        borderRadius: '999px',
                        fontWeight: 600,
                      }}
                    >
                      {product.stock > 0 ? `In Stock ${product.stock}` : 'Sold Out'}
                    </span>
                  </div>
                  {product.discount_percentage > 0 && (
                    <div style={{ marginTop: '10px', fontSize: '12px', color: '#dc3545', fontWeight: 600 }}>
                      {product.discount_percentage}% OFF
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {(socialLinks.length > 0 || (shop?.gallery && shop.gallery.length > 0)) && (
          <div style={{ display: 'grid', gridTemplateColumns: isTablet ? '1fr' : '1fr 1fr', gap: '24px', marginTop: '32px' }}>
            <div style={{ background: surfaceColor, borderRadius: '18px', padding: '24px', border: '1px solid #ede8df' }}>
              <div
                style={{
                  fontSize: '11px',
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: accentColor,
                  marginBottom: '14px',
                }}
              >
                Social Presence
              </div>
              {socialLinks.length > 0 ? (
                <div style={{ display: 'grid', gap: '10px' }}>
                  {socialLinks.map((item) => (
                    <div key={item.label} style={{ fontSize: '14px', color: '#6b5c45' }}>
                      <strong style={{ color: '#1a1208' }}>{item.label}:</strong> {item.value}
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ margin: 0, color: '#6b5c45', fontSize: '14px' }}>Add social links in marketplace settings to preview them here.</p>
              )}
            </div>

            <div style={{ background: surfaceColor, borderRadius: '18px', padding: '24px', border: '1px solid #ede8df' }}>
              <div
                style={{
                  fontSize: '11px',
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: accentColor,
                  marginBottom: '14px',
                }}
              >
                Gallery Preview
              </div>
              {shop?.gallery && shop.gallery.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '10px' }}>
                  {shop.gallery.slice(0, 3).map((imageUrl, index) => (
                    <img
                      key={index}
                      src={imageUrl}
                      alt={`Gallery image ${index + 1}`}
                      style={{ width: '100%', height: '110px', objectFit: 'cover', borderRadius: '12px' }}
                    />
                  ))}
                </div>
              ) : (
                <p style={{ margin: 0, color: '#6b5c45', fontSize: '14px' }}>Upload gallery images to make the storefront feel more alive.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicVendorPage;
