import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { publicApi } from '../../api/services';

/* ── palette helpers ─────────────────────────────────────── */
const PH = [
  { bg: 'linear-gradient(145deg,#f5efe6,#ede2d0)', color: '#c8a96e' },
  { bg: 'linear-gradient(145deg,#e8f0e8,#cde8cd)', color: '#2d6a4f' },
  { bg: 'linear-gradient(145deg,#e8eef5,#ccdced)', color: '#1a3d5c' },
  { bg: 'linear-gradient(145deg,#f5e8e8,#f0d2d2)', color: '#8b3a3a' },
  { bg: 'linear-gradient(145deg,#f0eaf5,#e0d0ed)', color: '#6b3d8b' },
];
const ph  = (name: string) => PH[(name.charCodeAt(0) || 0) % PH.length];
const ini = (name: string) => name.trim().split(/\s+/).slice(0, 2).map(w => w[0] || '').join('').toUpperCase() || '?';

const Placeholder: React.FC<{ name: string; cat: string }> = ({ name, cat }) => {
  const p = ph(name);
  return (
    <div style={{ width: '100%', height: '100%', background: p.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
      <div style={{ width: 52, height: 52, borderRadius: '50%', background: `${p.color}1a`, border: `2px solid ${p.color}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Playfair Display',serif", fontSize: 20, color: p.color, fontWeight: 600 }}>
        {ini(name)}
      </div>
      <div style={{ fontSize: 9.5, color: p.color, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 500, opacity: 0.7 }}>{cat || 'Product'}</div>
    </div>
  );
};

/* ── shared shimmer ──────────────────────────────────────── */
const SHIMMER = 'linear-gradient(90deg,#ede8df 25%,#f5f1ea 50%,#ede8df 75%)';
const Sk: React.FC<{ w?: number | string; h: number; r?: number; style?: React.CSSProperties }> = ({ w = '100%', h, r = 6, style }) => (
  <div style={{ width: w, height: h, borderRadius: r, flexShrink: 0, background: SHIMMER, backgroundSize: '600px 100%', animation: 'skshimmer 1.4s infinite linear', ...style }} />
);

/* ── types ───────────────────────────────────────────────── */
interface Product {
  id: string; name: string; description: string;
  price: number; discount_percentage: number; discounted_price: number;
  category_name: string; images: string[]; status: string; stock: number;
  brand?: string; unit?: string; rating?: number; review_count?: number; variants?: any[];
}

const SORTS = [
  { value: 'newest',     label: 'Newest First' },
  { value: 'price_asc',  label: 'Price: Low → High' },
  { value: 'price_desc', label: 'Price: High → Low' },
  { value: 'rating',     label: 'Top Rated' },
];

const PAGE = 12;

/* ─────────────────────────────────────────────────────────── */
const VendorAllProductsPage: React.FC = () => {
  const { vendorId }    = useParams<{ vendorId: string }>();
  const [searchParams]  = useSearchParams();

  const [vendorData, setVendorData] = useState<any>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);

  const [search, setSearch]         = useState(searchParams.get('q') || '');
  const [activeCat, setActiveCat]   = useState<string | null>(searchParams.get('category'));
  const [sort, setSort]             = useState('newest');
  const [shown, setShown]           = useState(PAGE);
  const [liked, setLiked]           = useState<Set<string>>(new Set());
  const [modal, setModal]           = useState<any>(null);
  const [modalImg, setModalImg]     = useState(0);
  const sentinel                    = useRef<HTMLDivElement>(null);
  const searchInputRef              = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!vendorId) return;
    publicApi.getVendorPublicProfile(vendorId)
      .then(r => { setVendorData(r.data); setError(null); })
      .catch(e => setError(e.response?.data?.detail || 'Failed to load'))
      .finally(() => setLoading(false));
  }, [vendorId]);

  useEffect(() => { setShown(PAGE); }, [search, activeCat, sort]);

  // auto-focus search when redirected from home page (?focus=1)
  const shouldFocus = searchParams.get('focus') === '1';
  useEffect(() => {
    if (shouldFocus) searchInputRef.current?.focus();
  }, [shouldFocus]);

  // infinite scroll
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setShown(n => n + PAGE); }, { rootMargin: '300px' });
    obs.observe(el);
    return () => obs.disconnect();
  });

  const toggleLike = (id: string) => setLiked(p => { const s = new Set(p); s.has(id) ? s.delete(id) : s.add(id); return s; });
  const openModal  = (p: any) => { setModal(p); setModalImg(0); };
  const closeModal = () => setModal(null);

  const allActive: Product[] = useMemo(() =>
    (vendorData?.products || []).filter((p: Product) => p.status?.toLowerCase() === 'active'),
    [vendorData]
  );

  const cats = useMemo(() => [...new Set(allActive.map(p => p.category_name).filter(Boolean))], [allActive]);

  const filtered: Product[] = useMemo(() => {
    let list = activeCat ? allActive.filter(p => p.category_name === activeCat) : allActive;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q));
    }
    if (sort === 'price_asc')  return [...list].sort((a, b) => (a.discount_percentage > 0 ? a.discounted_price : a.price) - (b.discount_percentage > 0 ? b.discounted_price : b.price));
    if (sort === 'price_desc') return [...list].sort((a, b) => (b.discount_percentage > 0 ? b.discounted_price : b.price) - (a.discount_percentage > 0 ? a.discounted_price : a.price));
    if (sort === 'rating')     return [...list].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    return list;
  }, [allActive, activeCat, search, sort]);

  const visible  = filtered.slice(0, shown);
  const hasMore  = shown < filtered.length;
  const brand    = vendorData?.shop?.name || vendorData?.vendor?.business_name || 'Store';

  const A = '#c8a96e', D = '#1a1208', M = '#6b5c45', L = '#ede8df', W = '#f0ebe2';

  /* ── global styles ───────────────────────────────────────── */
  const css = `
    *,*::before,*::after{box-sizing:border-box}
    html,body,#root{margin:0;padding:0;min-height:100%;background:#faf8f5}
    @keyframes skshimmer{0%{background-position:-600px 0}100%{background-position:600px 0}}
    @keyframes spin{to{transform:rotate(360deg)}}
    @keyframes slideUp{from{transform:translateY(60px);opacity:0}to{transform:translateY(0);opacity:1}}
    .vap-root{width:100%;min-height:100vh;background:#faf8f5;font-family:'DM Sans',sans-serif;font-size:14px;color:#1a1a1a}
    .vap-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:18px}
    .vap-card{background:white;border-radius:14px;overflow:hidden;border:1px solid ${L};transition:transform 0.22s,box-shadow 0.22s;cursor:pointer}
    .vap-card:hover{transform:translateY(-3px);box-shadow:0 10px 30px rgba(0,0,0,0.08)}
    .vap-chip{padding:7px 16px;border-radius:20px;font-size:12px;font-weight:500;cursor:pointer;border:1.5px solid ${L};background:white;color:${M};white-space:nowrap;flex-shrink:0;transition:all 0.18s;font-family:'DM Sans',sans-serif}
    .vap-chip.on{background:${D};border-color:${D};color:white}
    .vap-chip:hover:not(.on){border-color:${A};color:${D}}
    .vap-like{width:32px;height:32px;border-radius:50%;background:white;border:1.5px solid ${L};display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all 0.2s;flex-shrink:0}
    .vap-like:hover{border-color:${A};transform:scale(1.1)}
    .vap-like.on{background:${A};border-color:${A}}
    .vap-select{border:1.5px solid ${L};border-radius:8px;padding:8px 12px;font-family:'DM Sans',sans-serif;font-size:12px;color:${D};background:white;outline:none;cursor:pointer;flex-shrink:0}
    .vap-select:focus{border-color:${A}}
    .vap-search{flex:1;min-width:0;display:flex;align-items:center;background:${W};border-radius:10px;padding:9px 14px;gap:8px}
    .vap-search input{border:none;background:transparent;font-family:'DM Sans',sans-serif;font-size:13px;width:100%;outline:none;color:${D}}
    .vap-social-section{background:${D};padding:48px 24px 36px}
    .vap-social-inner{max-width:1200px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr 1fr;gap:40px}
    .vap-social-col-title{font-family:'Playfair Display',serif;font-size:15px;color:${A};margin-bottom:14px;letter-spacing:0.04em}
    .vap-social-info-row{display:flex;align-items:flex-start;gap:10px;margin-bottom:10px;font-size:12.5px;color:rgba(255,255,255,0.72);line-height:1.5}
    .vap-social-info-row span:first-child{font-size:15px;opacity:0.7;flex-shrink:0;margin-top:1px}
    .vap-social-links{display:flex;flex-wrap:wrap;gap:10px}
    .vap-social-link{display:inline-flex;align-items:center;gap:7px;padding:8px 16px;border-radius:24px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.14);color:rgba(255,255,255,0.85);text-decoration:none;font-size:12px;font-weight:500}
    .vap-social-link:hover{background:rgba(255,255,255,0.16)}
    .vap-wa-btn{display:inline-flex;align-items:center;gap:8px;background:#25d366;color:white;text-decoration:none;padding:11px 22px;border-radius:8px;font-size:13px;font-weight:600;margin-bottom:12px}
    .vap-shipping-strip{background:${A};color:white;text-align:center;padding:10px 24px;font-size:12.5px;font-weight:500;letter-spacing:0.04em}
    .vap-footer{background:${D};color:rgba(255,255,255,0.6);padding:24px;text-align:center;font-size:12px;border-top:1px solid rgba(255,255,255,0.06)}
    .vap-footer-logo{font-family:'Playfair Display',serif;color:${A};font-size:20px;margin-bottom:8px}
    @media(max-width:900px){.vap-social-inner{grid-template-columns:1fr 1fr}}
    @media(max-width:580px){.vap-social-inner{grid-template-columns:1fr}}
    .vap-modal-bg{position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:1000;display:flex;align-items:flex-end;justify-content:center}
    .vap-modal{background:white;width:100%;max-width:860px;max-height:92vh;border-radius:20px 20px 0 0;overflow-y:auto;position:relative;animation:slideUp 0.28s ease}
    .vap-modal-body{display:grid;grid-template-columns:1fr}
    .vap-modal-gallery{background:${W};border-radius:20px 20px 0 0;min-height:260px;display:flex;flex-direction:column}
    .vap-modal-img{flex:1;display:flex;align-items:center;justify-content:center;overflow:hidden;min-height:220px}
    .vap-modal-img img{width:100%;height:100%;object-fit:cover}
    .vap-modal-thumbs{display:flex;gap:6px;padding:10px;overflow-x:auto;background:white;border-top:1px solid ${L}}
    .vap-modal-thumb{width:50px;height:50px;border-radius:8px;object-fit:cover;cursor:pointer;border:2px solid transparent;flex-shrink:0;transition:border-color 0.15s}
    .vap-modal-thumb.on{border-color:${A}}
    .vap-modal-info{padding:24px;display:flex;flex-direction:column;gap:12px;overflow-y:auto}
    .vap-tag{background:${W};border:1px solid ${L};border-radius:8px;padding:4px 10px;font-size:11px;color:${M}}
    .vap-hr{border:none;border-top:1px solid ${L};margin:0}
    @media(min-width:640px){
      .vap-modal-bg{align-items:center;padding:24px}
      .vap-modal{border-radius:20px}
      .vap-modal-body{grid-template-columns:1fr 1fr}
      .vap-modal-gallery{border-radius:20px 0 0 20px;min-height:400px}
    }
    @media(max-width:600px){
      .vap-toolbar{flex-direction:column;align-items:stretch !important}
      .vap-select{width:100%}
    }
  `;

  /* ── skeleton ────────────────────────────────────────────── */
  if (loading) return (
    <div className="vap-root">
      <style>{css}</style>
      {/* top bar skeleton */}
      <div style={{ background: D, height: 56, display: 'flex', alignItems: 'center', padding: '0 24px', gap: 14 }}>
        <Sk w={28} h={28} r={50} style={{ background: 'linear-gradient(90deg,#2d2318 25%,#3d3020 50%,#2d2318 75%)', backgroundSize: '600px 100%' }} />
        <Sk w={160} h={18} style={{ background: 'linear-gradient(90deg,#2d2318 25%,#3d3020 50%,#2d2318 75%)', backgroundSize: '600px 100%' }} />
      </div>
      {/* search/sort skeleton */}
      <div style={{ background: 'white', borderBottom: `1px solid ${L}`, padding: '12px 24px', display: 'flex', gap: 12 }}>
        <Sk h={38} r={10} />
        <Sk w={130} h={38} r={8} />
      </div>
      {/* chips skeleton */}
      <div style={{ background: 'white', borderBottom: `1px solid ${L}`, padding: '10px 24px', display: 'flex', gap: 8 }}>
        {[56, 80, 70, 90, 65, 75, 60].map((w, i) => <Sk key={i} w={w} h={32} r={20} />)}
      </div>
      {/* grid skeleton */}
      <div style={{ padding: '24px' }}>
        <div className="vap-grid">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} style={{ background: 'white', borderRadius: 14, overflow: 'hidden', border: `1px solid ${L}` }}>
              <Sk h={200} r={0} />
              <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Sk w="50%" h={10} />
                <Sk w="85%" h={14} />
                <Sk w="65%" h={11} />
                <Sk w="45%" h={11} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                  <Sk w={64} h={20} />
                  <Sk w={32} h={32} r={50} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (error) return (
    <div className="vap-root" style={{ display: 'grid', placeItems: 'center' }}>
      <style>{css}</style>
      <div style={{ textAlign: 'center', padding: 32 }}>
        <p style={{ color: M, marginBottom: 16 }}>{error}</p>
        <Link to={`/vendor/${vendorId}`} style={{ color: A }}>← Back to store</Link>
      </div>
    </div>
  );

  /* ── page ────────────────────────────────────────────────── */
  return (
    <div className="vap-root">
      <style>{css}</style>

      {/* sticky top bar */}
      <div style={{ background: D, height: 56, display: 'flex', alignItems: 'center', padding: '0 24px', gap: 14, position: 'sticky', top: 0, zIndex: 200 }}>
        <Link to={`/vendor/${vendorId}`} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.72)', textDecoration: 'none', fontSize: 13, flexShrink: 0, fontFamily: "'DM Sans',sans-serif" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          Back
        </Link>
        <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.18)' }} />
        <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 17, color: 'white', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{brand}</span>
        <span style={{ fontSize: 12, color: A, fontWeight: 600, flexShrink: 0 }}>{filtered.length} products</span>
      </div>

      {/* search + sort */}
      <div style={{ background: 'white', borderBottom: `1px solid ${L}`, padding: '12px 20px' }}>
        <div className="vap-toolbar" style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="vap-search">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={M} strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input ref={searchInputRef} value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products…" />
            {search && <button onClick={() => setSearch('')} style={{ border: 'none', background: 'none', cursor: 'pointer', color: M, fontSize: 15, padding: 0, lineHeight: 1 }}>✕</button>}
          </div>
          <select className="vap-select" value={sort} onChange={e => setSort(e.target.value)}>
            {SORTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {/* category chips */}
      {cats.length > 0 && (
        <div style={{ background: 'white', borderBottom: `1px solid ${L}`, padding: '10px 20px' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', gap: 8, overflowX: 'auto' }}>
            <button className={`vap-chip${!activeCat ? ' on' : ''}`} onClick={() => setActiveCat(null)}>All</button>
            {cats.map(c => <button key={c} className={`vap-chip${activeCat === c ? ' on' : ''}`} onClick={() => setActiveCat(c)}>{c}</button>)}
          </div>
        </div>
      )}

      {/* content */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 20px' }}>
        {filtered.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 12, color: M }}>
            <div style={{ fontSize: 52 }}>🔍</div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, color: D }}>No products found</div>
            <div style={{ fontSize: 13 }}>Try adjusting your search or category</div>
            {(search || activeCat) && (
              <button onClick={() => { setSearch(''); setActiveCat(null); }} style={{ marginTop: 8, padding: '10px 28px', borderRadius: 8, background: D, color: 'white', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", fontSize: 13 }}>
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="vap-grid" style={{ marginBottom: 24 }}>
              {visible.map(product => {
                const price   = product.discount_percentage > 0 ? product.discounted_price : product.price;
                const isLiked = liked.has(product.id);
                return (
                  <article key={product.id} className="vap-card" onClick={() => openModal(product)}>
                    <div style={{ height: 200, position: 'relative', overflow: 'hidden', background: W }}>
                      {product.discount_percentage > 0 && (
                        <div style={{ position: 'absolute', top: 10, left: 10, background: A, color: 'white', fontSize: 10, padding: '3px 10px', borderRadius: 12, fontWeight: 600, zIndex: 2 }}>
                          {product.discount_percentage}% OFF
                        </div>
                      )}
                      {product.images?.[0]
                        ? <img src={product.images[0]} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <Placeholder name={product.name} cat={product.category_name} />}
                    </div>
                    <div style={{ padding: '13px 13px 12px' }}>
                      <div style={{ fontSize: 10, color: A, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 3 }}>{product.category_name}</div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: D, lineHeight: 1.4, marginBottom: 4 }}>{product.name}</div>
                      {product.rating != null && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginBottom: 5 }}>
                          <span style={{ color: A, fontSize: 11 }}>{'★'.repeat(Math.max(1, Math.round(product.rating)))}</span>
                          <span style={{ fontSize: 10, color: M }}>({product.review_count || 0})</span>
                        </div>
                      )}
                      <div style={{ fontSize: 11, color: M, lineHeight: 1.5, marginBottom: 10, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {product.description || `${product.category_name} product`}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <span style={{ fontSize: 15, fontWeight: 700, color: D }}>₹{Math.round(price)}</span>
                          {product.discount_percentage > 0 && <span style={{ fontSize: 11, color: M, textDecoration: 'line-through', marginLeft: 5 }}>₹{Math.round(product.price)}</span>}
                        </div>
                        <button className={`vap-like${isLiked ? ' on' : ''}`} onClick={e => { e.stopPropagation(); toggleLike(product.id); }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill={isLiked ? 'white' : 'none'} stroke={isLiked ? 'white' : A} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {hasMore
              ? <div ref={sentinel} style={{ textAlign: 'center', padding: '24px 0', color: M, fontSize: 12 }}>
                  <span style={{ display: 'inline-block', width: 18, height: 18, border: `2px solid ${A}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite', verticalAlign: 'middle', marginRight: 8 }} />
                  Loading more…
                </div>
              : <div style={{ textAlign: 'center', padding: '16px 0 8px', color: M, fontSize: 12 }}>All {filtered.length} products shown</div>
            }
          </>
        )}
      </div>

      {/* ── footer ───────────────────────────────────────────── */}
      {(() => {
        const sf          = vendorData?.storefront || {};
        const soc         = sf?.social || {};
        const vendor      = vendorData?.vendor || {};
        const shop        = vendorData?.shop || {};
        const whatsapp    = soc?.whatsapp   ? String(soc.whatsapp).replace(/\D/g, '') : null;
        const instagram   = soc?.instagram  || null;
        const facebook    = soc?.facebook   || null;
        const twitter     = soc?.twitter    || null;
        const website     = soc?.website    || null;
        const shippingMsg = sf?.branding?.shippingMessage || null;
        const contactHrs  = sf?.branding?.contactHours || null;
        const email       = soc?.email || shop?.contact_email || vendor?.business_email || '';
        const phone       = shop?.contact_phone || vendor?.business_phone || '';
        const tagline     = sf?.branding?.tagline || shop?.description || '';
        const address     = [shop?.address, shop?.city, shop?.state, shop?.postal_code].filter(Boolean).join(', ');
        const days        = shop?.working_days?.length ? shop.working_days.join(' / ') : 'Mon-Sat';
        const hours       = shop?.opening_time && shop?.closing_time ? `${shop.opening_time} - ${shop.closing_time}` : '9am - 7pm';
        const noSocial    = !whatsapp && !instagram && !facebook && !twitter && !website;
        return (
          <>
            {shippingMsg && <div className="vap-shipping-strip">🚚 {shippingMsg}</div>}
            <section className="vap-social-section">
              <div className="vap-social-inner">
                {/* store info */}
                <div>
                  <div className="vap-social-col-title">{brand}</div>
                  {address && <div className="vap-social-info-row"><span>📍</span><span>{address}</span></div>}
                  {phone    && <div className="vap-social-info-row"><span>📞</span><span>{phone}</span></div>}
                  {email    && <div className="vap-social-info-row"><span>✉️</span><span>{email}</span></div>}
                  <div className="vap-social-info-row"><span>🕐</span><span>{contactHrs || `${days}: ${hours}`}</span></div>
                </div>
                {/* social links */}
                <div>
                  <div className="vap-social-col-title">Follow Us</div>
                  <div className="vap-social-links">
                    {whatsapp  && <a href={`https://wa.me/${whatsapp}`} className="vap-social-link" target="_blank" rel="noreferrer">💬 WhatsApp</a>}
                    {instagram && <a href={instagram} className="vap-social-link" target="_blank" rel="noreferrer">📸 Instagram</a>}
                    {facebook  && <a href={facebook}  className="vap-social-link" target="_blank" rel="noreferrer">📘 Facebook</a>}
                    {twitter   && <a href={twitter}   className="vap-social-link" target="_blank" rel="noreferrer">🐦 Twitter</a>}
                    {website   && <a href={website}   className="vap-social-link" target="_blank" rel="noreferrer">🌐 Website</a>}
                    {noSocial  && <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>No social links added yet</span>}
                  </div>
                </div>
                {/* get in touch */}
                <div>
                  <div className="vap-social-col-title">Get in Touch</div>
                  {whatsapp
                    ? <a href={`https://wa.me/${whatsapp}`} className="vap-wa-btn" target="_blank" rel="noreferrer">💬 Chat on WhatsApp</a>
                    : <a href={`mailto:${email}`} className="vap-wa-btn" style={{ background: A }} target="_blank" rel="noreferrer">✉️ Send Email</a>}
                  {vendor?.verified   && <div className="vap-social-info-row" style={{ marginTop: 6 }}><span>✅</span><span>Verified Seller</span></div>}
                  {vendor?.gst_number && <div className="vap-social-info-row"><span>🏷️</span><span>GST: {vendor.gst_number}</span></div>}
                </div>
              </div>
            </section>
            <footer className="vap-footer">
              <div className="vap-footer-logo">{brand}</div>
              {tagline && <p style={{ margin: '6px 0 0', color: 'rgba(255,255,255,0.5)' }}>{tagline}</p>}
              <p style={{ marginTop: 8, fontSize: 11, opacity: 0.4 }}>© 2026 {brand}. All rights reserved.</p>
            </footer>
          </>
        );
      })()}

      {/* modal */}
      {modal && (
        <div className="vap-modal-bg" onClick={closeModal}>
          <div className="vap-modal" onClick={e => e.stopPropagation()}>
            <button onClick={closeModal} style={{ position: 'absolute', top: 12, right: 12, width: 32, height: 32, borderRadius: '50%', background: W, border: 'none', cursor: 'pointer', fontSize: 16, color: D, zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            <div className="vap-modal-body">
              <div className="vap-modal-gallery">
                <div className="vap-modal-img">
                  {modal.images?.[modalImg]
                    ? <img src={modal.images[modalImg]} alt={modal.name} />
                    : <Placeholder name={modal.name} cat={modal.category_name} />}
                </div>
                {modal.images?.length > 1 && (
                  <div className="vap-modal-thumbs">
                    {modal.images.map((img: string, i: number) => (
                      <img key={i} src={img} alt="" className={`vap-modal-thumb${modalImg === i ? ' on' : ''}`} onClick={() => setModalImg(i)} />
                    ))}
                  </div>
                )}
              </div>
              <div className="vap-modal-info">
                <div style={{ fontSize: 10, color: A, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase' }}>{modal.category_name}</div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, color: D, lineHeight: 1.25 }}>{modal.name}</div>
                <div>
                  <span style={{ fontSize: 24, fontWeight: 700, color: D }}>₹{Math.round(modal.discount_percentage > 0 ? modal.discounted_price : modal.price)}</span>
                  {modal.discount_percentage > 0 && <>
                    <span style={{ fontSize: 13, color: M, textDecoration: 'line-through', marginLeft: 8 }}>₹{Math.round(modal.price)}</span>
                    <span style={{ display: 'inline-block', background: A, color: 'white', fontSize: 10, padding: '2px 10px', borderRadius: 12, fontWeight: 600, marginLeft: 8 }}>{modal.discount_percentage}% off</span>
                  </>}
                </div>
                {modal.rating != null && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <span style={{ color: A, fontSize: 12 }}>{'★'.repeat(Math.max(1, Math.round(modal.rating || 5)))}</span>
                    <span style={{ fontSize: 10, color: M }}>({modal.review_count || 0} reviews)</span>
                  </div>
                )}
                <hr className="vap-hr" />
                <div style={{ fontSize: 13, color: M, lineHeight: 1.7 }}>{modal.description || 'No description available.'}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {modal.stock != null && <span className="vap-tag">Stock: {modal.stock}</span>}
                  {modal.brand && <span className="vap-tag">Brand: {modal.brand}</span>}
                  {modal.unit  && <span className="vap-tag">Unit: {modal.unit}</span>}
                </div>
                {modal.variants?.length > 0 && <>
                  <hr className="vap-hr" />
                  <div style={{ fontSize: 11, color: M, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>Variants</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {modal.variants.map((v: any) => (
                      <span key={v.id} className="vap-tag">{[v.size, v.color].filter(Boolean).join(' / ')}{v.price ? ` — ₹${Math.round(v.price)}` : ''}</span>
                    ))}
                  </div>
                </>}
                <hr className="vap-hr" />
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button className={`vap-like${liked.has(modal.id) ? ' on' : ''}`} style={{ width: 40, height: 40 }} onClick={() => toggleLike(modal.id)}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill={liked.has(modal.id) ? 'white' : 'none'} stroke={liked.has(modal.id) ? 'white' : A} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                  </button>
                  <span style={{ fontSize: 12, color: M }}>{liked.has(modal.id) ? 'Saved to wishlist' : 'Save to wishlist'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorAllProductsPage;
