import React, { useEffect, useState, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { createShop, fetchMyShop, updateShop, uploadLogo, uploadBanner, uploadGallery } from './shopSlice';
import type { ShopForm } from '../../types';
import toast from 'react-hot-toast';

const STATES = ['Chhattisgarh', 'Maharashtra', 'Madhya Pradesh', 'Uttar Pradesh', 'Delhi', 'Gujarat', 'Rajasthan', 'Karnataka', 'Tamil Nadu', 'West Bengal'];

const buildShopPayload = (form: ShopForm) => ({
  name: form.name,
  description: form.description || undefined,
  address: form.address || undefined,
  city: form.city || undefined,
  state: form.state || undefined,
  country: 'India',
  pincode: form.postal_code || undefined,
  latitude: typeof form.latitude === 'number' && !Number.isNaN(form.latitude) ? form.latitude : undefined,
  longitude: typeof form.longitude === 'number' && !Number.isNaN(form.longitude) ? form.longitude : undefined,
  logo_url: undefined,
  banner_url: undefined,
  opening_time: undefined,
  closing_time: undefined,
  working_days: undefined,
});

const ShopPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { data: shop, loading, uploading } = useAppSelector((s) => s.shop);
  const [form, setForm] = useState<ShopForm>({
    name: '', description: '', address: '', city: '', state: '',
    postal_code: '', business_type: 'RETAIL', gst_number: '',
    contact_phone: '', contact_email: '',
  });
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'media' | 'location'>('details');
  const [phoneOtpStep, setPhoneOtpStep] = useState<'idle' | 'sent'>('idle');
  const [emailOtpStep, setEmailOtpStep] = useState<'idle' | 'sent'>('idle');
  const logoRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    dispatch(fetchMyShop());
  }, [dispatch]);

  useEffect(() => {
    if (shop) {
      setForm({
        name: shop.name, description: shop.description, address: shop.address,
        city: shop.city, state: shop.state, postal_code: shop.postal_code,
        business_type: shop.business_type, gst_number: shop.gst_number || '',
        contact_phone: shop.contact_phone, contact_email: shop.contact_email,
        latitude: shop.latitude, longitude: shop.longitude,
      });
    }
  }, [shop]);

  const set = (key: keyof ShopForm, value: any) => setForm((f) => ({ ...f, [key]: value }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = buildShopPayload(form) as any;
    const result = shop
      ? await dispatch(updateShop(payload))
      : await dispatch(createShop(payload));
    setSaving(false);
    if (createShop.fulfilled.match(result) || updateShop.fulfilled.match(result)) {
      toast.success(shop ? 'Shop updated!' : 'Shop created!');
    }
    else toast.error('Failed to update shop');
  };

  const handleLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await dispatch(uploadLogo(file));
    if (uploadLogo.fulfilled.match(result)) toast.success('Logo uploaded!');
  };

  const handleBanner = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await dispatch(uploadBanner(file));
    if (uploadBanner.fulfilled.match(result)) toast.success('Banner uploaded!');
  };

  const handleGallery = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const result = await dispatch(uploadGallery(files));
    if (uploadGallery.fulfilled.match(result)) toast.success('Gallery updated!');
  };

  const completionSteps = shop ? [
    { label: 'Shop name', done: !!shop.name },
    { label: 'Description', done: !!shop.description },
    { label: 'Logo', done: !!shop.logo },
    { label: 'Banner', done: !!shop.banner },
    { label: 'Gallery', done: shop.gallery.length > 0 },
    { label: 'GST number', done: !!shop.gst_number },
    { label: 'Phone verified', done: !!shop.contact_phone },
    { label: 'Email verified', done: !!shop.contact_email },
  ] : [];

  const score = completionSteps.length > 0 ? Math.round((completionSteps.filter((s) => s.done).length / completionSteps.length) * 100) : 0;

  return (
    <form onSubmit={handleSave}>
      <div className="section-header">
        <div>
          <div className="section-title">Shop Profile</div>
          <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>Manage your shop details and media</div>
        </div>
        <button type="submit" className="btn btn-primary" disabled={saving || loading}>
          {saving ? <span className="spinner" /> : '💾 Save Changes'}
        </button>
      </div>

      {/* ── Completion ── */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 16, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 500 }}>Profile Completion</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: score >= 80 ? 'var(--green)' : score >= 50 ? 'var(--yellow)' : 'var(--red)' }}>{score}%</span>
          </div>
          <div className="progress-bar" style={{ height: 8 }}>
            <div className="progress-fill" style={{ width: `${score}%`, background: score >= 80 ? 'var(--green)' : score >= 50 ? 'var(--yellow)' : 'var(--accent)' }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {completionSteps.map((s) => (
            <span key={s.label} style={{ fontSize: 11.5, color: s.done ? 'var(--green)' : 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 3 }}>
              {s.done ? '✓' : '○'} {s.label}
            </span>
          ))}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 20, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: 4, width: 'fit-content' }}>
        {(['details', 'media', 'location'] as const).map((tab) => (
          <button key={tab} type="button" className={`btn btn-sm ${activeTab === tab ? 'btn-primary' : 'btn-ghost'}`} style={{ border: 'none', textTransform: 'capitalize' }} onClick={() => setActiveTab(tab)}>
            {tab === 'details' ? '📝 Details' : tab === 'media' ? '🖼 Media' : '📍 Location'}
          </button>
        ))}
      </div>

      {/* ── Details Tab ── */}
      {activeTab === 'details' && (
        <div className="grid-2" style={{ alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="card">
              <div className="card-header"><div className="card-title">Shop Information</div></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Shop Name <span style={{ color: 'var(--red)' }}>*</span></label>
                  <input className="form-input" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Your shop name" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-textarea" rows={4} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Tell customers about your shop..." />
                </div>
                <div className="form-group">
                  <label className="form-label">Business Type</label>
                  <select className="form-select" value={form.business_type} onChange={(e) => set('business_type', e.target.value as any)}>
                    <option value="RETAIL">Retail</option>
                    <option value="WHOLESALE">Wholesale</option>
                    <option value="BOTH">Both</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">GST Number</label>
                  <input className="form-input" value={form.gst_number} onChange={(e) => set('gst_number', e.target.value.toUpperCase())} placeholder="22AAAAA0000A1Z5" maxLength={15} />
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="card">
              <div className="card-header"><div className="card-title">Address</div></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Street Address</label>
                  <input className="form-input" value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="Shop number, street, area" />
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">City</label>
                    <input className="form-input" value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="Bilaspur" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Postal Code</label>
                    <input className="form-input" value={form.postal_code} onChange={(e) => set('postal_code', e.target.value)} placeholder="495001" maxLength={6} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">State</label>
                  <select className="form-select" value={form.state} onChange={(e) => set('state', e.target.value)}>
                    <option value="">Select state</option>
                    {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header"><div className="card-title">Contact Details</div></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input className="form-input" value={form.contact_phone} onChange={(e) => set('contact_phone', e.target.value)} placeholder="+91 9876543210" />
                    <button type="button" className="btn btn-warning btn-sm" style={{ whiteSpace: 'nowrap' }} onClick={() => setPhoneOtpStep('sent')}>
                      {shop?.contact_phone ? '✓ Verified' : 'Verify'}
                    </button>
                  </div>
                  {phoneOtpStep === 'sent' && (
                    <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                      <input className="form-input" placeholder="Enter OTP" maxLength={6} />
                      <button type="button" className="btn btn-success btn-sm">Confirm</button>
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input className="form-input" type="email" value={form.contact_email} onChange={(e) => set('contact_email', e.target.value)} placeholder="shop@email.com" />
                    <button type="button" className="btn btn-warning btn-sm" style={{ whiteSpace: 'nowrap' }} onClick={() => setEmailOtpStep('sent')}>
                      {shop?.contact_email ? '✓ Verified' : 'Verify'}
                    </button>
                  </div>
                  {emailOtpStep === 'sent' && (
                    <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                      <input className="form-input" placeholder="Enter OTP" maxLength={6} />
                      <button type="button" className="btn btn-success btn-sm">Confirm</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Media Tab ── */}
      {activeTab === 'media' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="grid-2" style={{ alignItems: 'start' }}>
            <div className="card">
              <div className="card-header"><div className="card-title">Shop Logo</div></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                <div style={{ width: 80, height: 80, borderRadius: 'var(--radius)', background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1px solid var(--border)', fontSize: 32 }}>
                  {shop?.logo ? <img src={shop.logo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🏪'}
                </div>
                <div>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>PNG, JPG · Recommended 200×200</p>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => logoRef.current?.click()} disabled={uploading}>
                    {uploading ? <span className="spinner" /> : '📤 Upload Logo'}
                  </button>
                </div>
              </div>
              <input ref={logoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogo} />
            </div>

            <div className="card">
              <div className="card-header"><div className="card-title">Shop Banner</div></div>
              <div style={{ height: 100, background: shop?.banner ? `url(${shop.banner}) center/cover` : 'var(--surface2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, fontSize: 28, cursor: 'pointer' }} onClick={() => bannerRef.current?.click()}>
                {!shop?.banner && '🖼 Click to upload banner'}
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Recommended 1200×300px</p>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => bannerRef.current?.click()} disabled={uploading}>
                {uploading ? <span className="spinner" /> : '📤 Upload Banner'}
              </button>
              <input ref={bannerRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleBanner} />
            </div>
          </div>

          <div className="card">
            <div className="card-header"><div className="card-title">Shop Gallery</div><span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{shop?.gallery.length || 0} / 10 images</span></div>
            <div className="image-grid">
              {shop?.gallery.map((url, i) => (
                <div key={i} className="image-item">
                  <img src={url} alt={`Gallery ${i}`} />
                </div>
              ))}
              {(shop?.gallery.length || 0) < 10 && (
                <div className="image-item add" onClick={() => galleryRef.current?.click()}>
                  <span style={{ fontSize: 24, color: 'var(--text-dim)' }}>＋</span>
                </div>
              )}
            </div>
            <input ref={galleryRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleGallery} />
          </div>
        </div>
      )}

      {/* ── Location Tab ── */}
      {activeTab === 'location' && (
        <div className="card">
          <div className="card-header"><div className="card-title">Google Map Location</div></div>
          <div style={{ height: 300, background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)', marginBottom: 20, color: 'var(--text-muted)' }}>
            🗺 Google Maps iframe — requires REACT_APP_GOOGLE_MAPS_API_KEY
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Latitude</label>
              <input className="form-input" type="number" step="any" value={form.latitude || ''} onChange={(e) => set('latitude', +e.target.value)} placeholder="21.2514" />
            </div>
            <div className="form-group">
              <label className="form-label">Longitude</label>
              <input className="form-input" type="number" step="any" value={form.longitude || ''} onChange={(e) => set('longitude', +e.target.value)} placeholder="81.6296" />
            </div>
          </div>
          <p className="form-hint" style={{ marginTop: 8 }}>📍 Precise location helps customers find your shop on the map and improves local search ranking</p>
        </div>
      )}
    </form>
  );
};

export default ShopPage;
