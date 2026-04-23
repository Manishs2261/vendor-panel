import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { publicApi } from '../../api/services';
import toast from 'react-hot-toast';

interface VendorShowcaseData {
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
}

interface ShowcaseResponse {
  vendors: VendorShowcaseData[];
  total_vendors: number;
}

const ShowcasePage: React.FC = () => {
  const [data, setData] = useState<ShowcaseResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const fetchShowcaseData = async () => {
      try {
        setLoading(true);
        const response = await publicApi.getVendorsShowcase();
        setData(response.data);
        setError(null);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to load showcase');
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchShowcaseData();
  }, []);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        fontSize: 18,
        color: '#666',
        flexDirection: 'column',
        gap: 16
      }}>
        <div style={{ fontSize: 48 }}>🏪</div>
        <div>Loading marketplace...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        fontSize: 18,
        color: '#666',
        textAlign: 'center',
        padding: 20
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🏪</div>
        <div style={{ marginBottom: 8 }}>Marketplace Unavailable</div>
        <div style={{ fontSize: 14, marginBottom: 24, color: '#999' }}>{error}</div>
        <button 
          onClick={() => window.location.reload()}
          style={{ 
            padding: '12px 24px',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            fontSize: 14,
            cursor: 'pointer'
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#faf8f5', fontFamily: "'DM Sans', sans-serif" }}>
      {/* Top Bar */}
      <div style={{ background: '#1a1208', color: '#e8d5b0', padding: '8px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', letterSpacing: '0.08em' }}>
        <span>Free shipping on orders above ₹999</span>
        <span>Mon–Sat: 9am – 7pm | support@localshop.in</span>
      </div>

      {/* Header */}
      <div style={{ background: 'white', borderBottom: '1px solid #ede8df', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px', color: '#1a1208', letterSpacing: '0.02em' }}>LocalShop</span>
          <span style={{ fontSize: '10px', color: '#c8a96e', letterSpacing: '0.18em', textTransform: 'uppercase', marginTop: '1px' }}>Vendor Marketplace</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', background: '#f0ebe2', borderRadius: '24px', padding: '8px 16px', gap: '8px', width: '220px' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b5c45" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input type="text" placeholder="Search vendors or products..." style={{ border: 'none', background: 'transparent', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', width: '100%', outline: 'none', color: '#1a1208' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#f0ebe2', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1a1208" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </button>
          <button style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#f0ebe2', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1a1208" strokeWidth="2">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
            <span style={{ position: 'absolute', top: '-2px', right: '-2px', background: '#c8a96e', color: 'white', borderRadius: '50%', width: '16px', height: '16px', fontSize: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '500' }}>0</span>
          </button>
          <button style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#f0ebe2', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1a1208" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div style={{ background: 'white', borderBottom: '1px solid #ede8df', padding: '0 24px', display: 'flex', alignItems: 'center', gap: '0', overflowX: 'auto' }}>
        {['All Vendors', 'Food & Dining', 'Fashion', 'Electronics', 'Home & Garden', 'Health & Beauty', 'Books & Stationery', 'Sports', 'Gaming', 'Services'].map((item, index) => (
          <div
            key={item}
            style={{
              padding: '12px 16px',
              fontSize: '13px',
              color: index === 0 ? '#1a1208' : '#6b5c45',
              cursor: 'pointer',
              borderBottom: index === 0 ? '2px solid #c8a96e' : '2px solid transparent',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s',
              fontWeight: index === 0 ? '500' : '400'
            }}
            onMouseEnter={(e) => {
              if (index !== 0) {
                e.currentTarget.style.color = '#1a1208';
                e.currentTarget.style.borderBottomColor = '#c8a96e';
                e.currentTarget.style.fontWeight = '500';
              }
            }}
            onMouseLeave={(e) => {
              if (index !== 0) {
                e.currentTarget.style.color = '#6b5c45';
                e.currentTarget.style.borderBottomColor = 'transparent';
                e.currentTarget.style.fontWeight = '400';
              }
            }}
          >
            {item}
          </div>
        ))}
      </div>

      {/* Carousel */}
      <div style={{ position: 'relative', overflow: 'hidden', height: '340px', background: '#1a1208' }}>
        <div style={{ display: 'flex', transition: 'transform 0.55s cubic-bezier(0.25,0.46,0.45,0.94)', height: '100%', transform: `translateX(-${currentSlide * 100}%)` }}>
          <div style={{ minWidth: '100%', height: '100%', display: 'flex', alignItems: 'center', padding: '0 60px', position: 'relative', overflow: 'hidden', background: 'linear-gradient(120deg, #1a1208 55%, #3d2e18 100%)' }}>
            <div style={{ zIndex: 2, maxWidth: '380px' }}>
              <div style={{ fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#c8a96e', fontWeight: '500', marginBottom: '12px' }}>Welcome to</div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '36px', color: 'white', lineHeight: '1.15', marginBottom: '12px' }}>LocalShop Marketplace</div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.65)', lineHeight: '1.6', marginBottom: '24px' }}>Discover amazing products from local vendors in your area. Support local businesses while finding unique items you won't find anywhere else.</div>
              <button style={{ background: '#c8a96e', color: 'white', border: 'none', padding: '11px 28px', borderRadius: '4px', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: '500', cursor: 'pointer', letterSpacing: '0.04em' }}>Explore Vendors</button>
            </div>
            <div style={{ position: 'absolute', right: '80px', top: '50%', transform: 'translateY(-50%)', width: '220px', height: '220px', borderRadius: '16px', overflow: 'hidden', opacity: '0.9' }}>
              <svg viewBox="0 0 220 220" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
                <rect width="220" height="220" fill="#2d2010"/>
                <circle cx="110" cy="110" r="60" fill="none" stroke="#c8a96e" strokeWidth="2" opacity="0.8"/>
                <circle cx="110" cy="110" r="40" fill="none" stroke="#c8a96e" strokeWidth="1.5" opacity="0.6"/>
                <circle cx="110" cy="110" r="20" fill="#c8a96e" opacity="0.4"/>
                <path d="M90 110 L110 90 L130 110 L110 130Z" fill="#c8a96e" opacity="0.9"/>
                <circle cx="70" cy="110" r="8" fill="#e8c88a" opacity="0.7"/>
                <circle cx="150" cy="110" r="8" fill="#e8c88a" opacity="0.7"/>
                <circle cx="110" cy="70" r="8" fill="#e8c88a" opacity="0.7"/>
                <circle cx="110" cy="150" r="8" fill="#e8c88a" opacity="0.7"/>
              </svg>
            </div>
          </div>
          <div style={{ minWidth: '100%', height: '100%', display: 'flex', alignItems: 'center', padding: '0 60px', position: 'relative', overflow: 'hidden', background: 'linear-gradient(120deg, #0d2238 55%, #1a3d5c 100%)' }}>
            <div style={{ zIndex: 2, maxWidth: '380px' }}>
              <div style={{ fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#c8a96e', fontWeight: '500', marginBottom: '12px' }}>Support Local</div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '36px', color: 'white', lineHeight: '1.15', marginBottom: '12px' }}>Connect with Your Community</div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.65)', lineHeight: '1.6', marginBottom: '24px' }}>Every purchase supports a local business owner. Build relationships with vendors who care about your community as much as you do.</div>
              <button style={{ background: '#c8a96e', color: 'white', border: 'none', padding: '11px 28px', borderRadius: '4px', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: '500', cursor: 'pointer', letterSpacing: '0.04em' }}>Find Vendors</button>
            </div>
          </div>
          <div style={{ minWidth: '100%', height: '100%', display: 'flex', alignItems: 'center', padding: '0 60px', position: 'relative', overflow: 'hidden', background: 'linear-gradient(120deg, #1a0d0d 55%, #3d1818 100%)' }}>
            <div style={{ zIndex: 2, maxWidth: '380px' }}>
              <div style={{ fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#c8a96e', fontWeight: '500', marginBottom: '12px' }}>Quality Products</div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '36px', color: 'white', lineHeight: '1.15', marginBottom: '12px' }}>Handpicked Local Treasures</div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.65)', lineHeight: '1.6', marginBottom: '24px' }}>From handmade crafts to fresh produce, discover the quality and care that local vendors put into every product they create.</div>
              <button style={{ background: '#c8a96e', color: 'white', border: 'none', padding: '11px 28px', borderRadius: '4px', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: '500', cursor: 'pointer', letterSpacing: '0.04em' }}>Shop Now</button>
            </div>
          </div>
        </div>
        <div style={{ position: 'absolute', bottom: '18px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '8px', zIndex: 10 }}>
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              style={{
                width: currentSlide === index ? '22px' : '7px',
                height: '7px',
                borderRadius: currentSlide === index ? '4px' : '50%',
                background: currentSlide === index ? '#c8a96e' : 'rgba(255,255,255,0.35)',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onClick={() => setCurrentSlide(index)}
            />
          ))}
        </div>
        <button style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', width: '38px', height: '38px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, fontSize: '16px', transition: 'background 0.2s', left: '16px' }} onClick={() => setCurrentSlide((currentSlide - 1 + 3) % 3)}>‹</button>
        <button style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', width: '38px', height: '38px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, fontSize: '16px', transition: 'background 0.2s', right: '16px' }} onClick={() => setCurrentSlide((currentSlide + 1) % 3)}>›</button>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
        {/* Section Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '24px', color: '#1a1208' }}>Featured Vendors</h2>
          <span style={{ fontSize: '12px', color: '#c8a96e', cursor: 'pointer', letterSpacing: '0.06em', fontWeight: '500' }}>View All →</span>
        </div>
        
        {/* Loading State */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6b5c45' }}>
            <div style={{ width: '40px', height: '40px', border: '3px solid #ede8df', borderTopColor: '#c8a96e', borderRadius: '50%', margin: '0 auto 20px', animation: 'spin 1s linear infinite' }}></div>
            <p>Loading amazing local vendors...</p>
          </div>
        )}
        
        {/* Error State */}
        {error && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#dc3545' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
            <h3>Oops! Something went wrong</h3>
            <p>We couldn't load the vendors. Please try again later.</p>
            <button style={{ background: '#c8a96e', color: 'white', border: 'none', padding: '11px 28px', borderRadius: '4px', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: '500', cursor: 'pointer', letterSpacing: '0.04em', marginTop: '16px' }} onClick={() => window.location.reload()}>Try Again</button>
          </div>
        )}
        
        {/* Vendors Grid */}
        {!loading && !error && data && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
            {data.vendors.length === 0 ? (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px 20px', color: '#6b5c45' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏪</div>
                <h3 style={{ marginBottom: '8px', color: '#1a1208' }}>No vendors available</h3>
                <p>Check back later for amazing local vendors!</p>
              </div>
            ) : (
              data.vendors.map((vendor) => (
                <div
                  key={vendor.vendor_id}
                  style={{
                    background: 'white',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    border: '1px solid #ede8df',
                    transition: 'all 0.22s',
                    cursor: 'pointer'
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
                  {/* Banner */}
                  <div style={{
                    height: '200px',
                    background: vendor.banner_url ? `url(${vendor.banner_url}) center/cover` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    position: 'relative'
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: '16px',
                      right: '16px',
                      width: '60px',
                      height: '60px',
                      borderRadius: '12px',
                      background: vendor.logo_url ? `url(${vendor.logo_url}) center/cover` : 'linear-gradient(135deg, #c8a96e 0%, #e8c88a 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '24px',
                      border: '3px solid white',
                      boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
                    }}>
                      {!vendor.logo_url && '🏪'}
                    </div>
                  </div>
                  
                  {/* Vendor Info */}
                  <div style={{ padding: '24px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1a1208', marginBottom: '8px' }}>{vendor.business_name}</h3>
                    <p style={{ fontSize: '13px', color: '#6b5c45', marginBottom: '16px', lineHeight: '1.5' }}>{vendor.description || 'Discover amazing products from this local vendor'}</p>
                    
                    {/* Stats */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                      <div style={{ fontSize: '12px', color: '#6b5c45' }}><strong>{vendor.total_products}</strong> Products</div>
                      <div style={{ fontSize: '12px', color: '#6b5c45' }}><strong>4.5</strong> Rating</div>
                    </div>
                    
                    {/* Contact */}
                    <div style={{ fontSize: '12px', color: '#6b5c45', marginBottom: '16px' }}>
                      {vendor.address && <div style={{ marginBottom: '4px' }}>📍 {vendor.address}</div>}
                      {vendor.contact_phone && <div style={{ marginBottom: '4px' }}>📞 {vendor.contact_phone}</div>}
                      {vendor.contact_email && <div>📧 {vendor.contact_email}</div>}
                    </div>
                    
                    {/* Footer */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: vendor.verified ? '#28a745' : '#6b5c45', fontWeight: '500' }}>
                        {vendor.verified ? '✓ Verified Vendor' : '⏳ Pending Verification'}
                      </div>
                      <Link
                        to={`/vendor/${vendor.vendor_id}`}
                        style={{
                          background: '#c8a96e',
                          color: 'white',
                          textDecoration: 'none',
                          padding: '8px 20px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: '500',
                          cursor: 'pointer',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#b8945c';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#c8a96e';
                        }}
                      >
                        Visit Store →
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ background: '#1a1208', color: 'rgba(255,255,255,0.6)', padding: '32px 24px', textAlign: 'center', fontSize: '12px' }}>
        <div style={{ fontFamily: "'Playfair Display', serif", color: '#c8a96e', fontSize: '20px', marginBottom: '8px' }}>LocalShop</div>
        <p>Connecting communities through local commerce</p>
        <p style={{ marginTop: '8px', fontSize: '11px', opacity: '0.5' }}>© 2026 LocalShop. All rights reserved.</p>
      </div>

      {/* Add CSS animations */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ShowcasePage;
