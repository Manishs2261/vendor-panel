import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { createShop, fetchMyShop, updateShop, uploadLogo, uploadBanner, uploadGallery, deleteGalleryImage, uploadIdDocument } from './shopSlice';
import { vendorApi, shopApi, productApi, dashboardApi, type VendorProfileResponse } from '../../api/services';
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
  id_type: form.id_type || undefined,
  latitude: typeof form.latitude === 'number' && !Number.isNaN(form.latitude) ? form.latitude : undefined,
  longitude: typeof form.longitude === 'number' && !Number.isNaN(form.longitude) ? form.longitude : undefined,
  logo_url: undefined,
  banner_url: undefined,
  opening_time: undefined,
  closing_time: undefined,
  working_days: undefined,
  id_document_url: form.id_document_url || undefined,
});

const ShopPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { data: shop, loading, uploading } = useAppSelector((s) => s.shop);
  const [form, setForm] = useState<ShopForm>({
    name: '', description: '', address: '', city: '', state: '',
    postal_code: '', business_type: 'RETAIL', gst_number: '',
    contact_phone: '', contact_email: '', id_type: '',
    id_document_url: '',
  });
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'media' | 'location'>('details');
  const [phoneOtpStep, setPhoneOtpStep] = useState<'idle' | 'sent'>('idle');
  const [emailOtpStep, setEmailOtpStep] = useState<'idle' | 'sent'>('idle');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const [vendorProfile, setVendorProfile] = useState<VendorProfileResponse | null>(null);
  const [totalProducts, setTotalProducts] = useState(0);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const logoRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const docRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    dispatch(fetchMyShop());
    // Fetch vendor profile and dashboard stats for consistent completion calculation
    Promise.all([
      vendorApi.me().then(({ data }) => data).catch(() => null),
      dashboardApi.getOverview().then(({ data }) => data).catch(() => null)
    ]).then(([profile, dashboardData]) => {
      setVendorProfile(profile);
      setDashboardStats(dashboardData);
      setTotalProducts(dashboardData?.total_products || 0);
    }).catch(() => {
      setVendorProfile(null);
      setDashboardStats(null);
      setTotalProducts(0);
    });
  }, [dispatch]);

  useEffect(() => {
    if (shop) {
      setForm((f) => ({
        ...f,
        name: shop.name, description: shop.description, address: shop.address,
        city: shop.city, state: shop.state, postal_code: shop.postal_code,
        business_type: shop.business_type,
        contact_phone: shop.contact_phone, contact_email: shop.contact_email,
        latitude: shop.latitude, longitude: shop.longitude,
        id_type: shop.id_type || '',
        id_document_url: shop.id_document_url || '',
      }));
    }
  }, [shop]);

  useEffect(() => {
    if (vendorProfile) {
      setForm((f) => ({ ...f, gst_number: vendorProfile.gst_number || '' }));
    }
  }, [vendorProfile]);

  const set = (key: keyof ShopForm, value: any) => setForm((f: ShopForm) => ({ ...f, [key]: value }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.id_type) { toast.error('Please select an Identity Type'); return; }
    if (!form.id_document_url && !shop?.id_document_url) { toast.error('Please upload an Identity Document'); return; }
    if (!form.contact_phone) { toast.error('Phone number is required'); return; }
    if (!vendor?.is_phone_verified) { toast.error('Please verify your phone number'); return; }
    if (!form.contact_email) { toast.error('Email is required'); return; }
    if (!vendor?.is_email_verified) { toast.error('Please verify your email address'); return; }
    if (!form.address) { toast.error('Street address is required'); return; }
    if (!form.city) { toast.error('City is required'); return; }
    if (!form.postal_code) { toast.error('Postal code is required'); return; }
    if (!form.state) { toast.error('State is required'); return; }
    if (!shop?.logo_url) { toast.error('Shop logo / photo is required'); return; }
    if (!shop?.gallery || shop.gallery.length === 0) { toast.error('At least one gallery image is required'); return; }
    if (!form.latitude || !form.longitude) { toast.error('Please provide shop location (Latitude & Longitude)'); return; }
    setSaving(true);
    const payload = buildShopPayload(form) as any;
    const [result] = await Promise.all([
      shop ? dispatch(updateShop(payload)) : dispatch(createShop(payload)),
      form.gst_number !== undefined
        ? vendorApi.updateProfile({ gst_number: form.gst_number || undefined }).catch(() => null)
        : Promise.resolve(null),
    ]);
    setSaving(false);
    if (createShop.fulfilled.match(result) || updateShop.fulfilled.match(result)) {
      toast.success(shop ? 'Shop updated!' : 'Shop created!');
      setSaveSuccess(true);
      // Reset success message after 10 seconds
      setTimeout(() => setSaveSuccess(false), 10000);
    }
    else toast.error('Failed to update shop');
  };

  const handleVerifyNow = () => {
    toast.success('Shop verification request submitted! We will review your documents shortly.');
    // In a real app, you would dispatch a thunk to update the shop status to 'PENDING_VERIFICATION'
  };

  const handleLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => setLogoPreview(event.target?.result as string);
    reader.readAsDataURL(file);
    const result = await dispatch(uploadLogo(file));
    setLogoPreview(null);
    if (uploadLogo.fulfilled.match(result)) {
      await dispatch(fetchMyShop());
      toast.success('Logo uploaded!');
    } else {
      toast.error((result as any).payload as string || 'Logo upload failed');
    }
  };

  const handleBanner = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => setBannerPreview(event.target?.result as string);
    reader.readAsDataURL(file);
    const result = await dispatch(uploadBanner(file));
    setBannerPreview(null);
    if (uploadBanner.fulfilled.match(result)) {
      await dispatch(fetchMyShop());
      toast.success('Banner uploaded!');
    } else {
      toast.error((result as any).payload as string || 'Banner upload failed');
    }
  };

  const handleGallery = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => setGalleryPreviews(prev => [...prev, event.target?.result as string]);
      reader.readAsDataURL(file);
    });
    const result = await dispatch(uploadGallery(files));
    setGalleryPreviews([]);
    if (uploadGallery.fulfilled.match(result)) {
      await dispatch(fetchMyShop());
      toast.success('Gallery updated!');
    } else {
      toast.error((result as any).payload as string || 'Gallery upload failed');
    }
  };
  const handleDeleteGallery = async (url: string) => {
    const result = await dispatch(deleteGalleryImage(url));
    if (deleteGalleryImage.fulfilled.match(result)) {
      toast.success('Image removed');
    } else {
      toast.error((result as any).payload as string || 'Failed to remove image');
    }
  };

  const handleDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await dispatch(uploadIdDocument(file));
    if (uploadIdDocument.fulfilled.match(result)) {
      await dispatch(fetchMyShop());
      toast.success('Document uploaded!');
    } else {
      toast.error((result as any).payload as string || 'Document upload failed');
    }
  };

  const vendor = useAppSelector((s) => s.auth.vendor);
  
  const completionSteps = useMemo(() => [
    { label: 'Business name added', done: !!vendorProfile?.business_name },
    { label: 'Business email added', done: !!vendorProfile?.business_email },
    { label: 'Business phone added', done: !!vendorProfile?.business_phone },
    { label: 'GST or PAN added', done: !!vendorProfile?.gst_number },
    { label: 'Shop name added', done: !!shop?.name },
    { label: 'Shop logo added', done: !!shop?.logo_url },
    { label: 'Shop address added', done: !!shop?.address },
    { label: 'Email verified', done: vendor?.is_email_verified || false },
    { label: 'Phone verified', done: vendor?.is_phone_verified || false },
    { label: 'Identity document added', done: !!shop?.id_document_url },
    { label: '5+ products added', done: (dashboardStats?.total_products || 0) >= 5 },
  ], [vendorProfile, shop, dashboardStats, vendor]);

  const score = Math.round((completionSteps.filter(step => step.done).length / completionSteps.length) * 100);

  return (
    <form onSubmit={handleSave}>
      <div className="section-header">
        <div>
          <div className="section-title">Shop Profile</div>
          <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>Manage your shop details and media</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {shop && !shop.is_verified && (
            <button type="button" className={`btn ${saveSuccess ? 'btn-success' : 'btn-warning'}`} onClick={handleVerifyNow} style={{ boxShadow: saveSuccess ? '0 0 20px var(--green-bg)' : 'none' }}>
              {saveSuccess ? '✅ Profile Ready - Verify Now' : '✨ Verify Now'}
            </button>
          )}
          <button type="submit" className="btn btn-primary" disabled={saving || loading}>
            {saving ? <span className="spinner" /> : '💾 Save Changes'}
          </button>
        </div>
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
                <div className="form-group">
                  <label className="form-label">Identity Type <span style={{ color: 'var(--red)' }}>*</span></label>
                  <select className="form-select" value={form.id_type} onChange={(e) => set('id_type', e.target.value)}>
                    <option value="">Select Identity Type</option>
                    <option value="Aadhaar Card">Aadhaar Card</option>
                    <option value="PAN Card">PAN Card</option>
                    <option value="Passport">Passport</option>
                    <option value="Driving License">Driving License</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Upload Document <span style={{ color: 'var(--red)' }}>*</span></label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => docRef.current?.click()} disabled={uploading}>
                      {uploading ? <span className="spinner" /> : '📤 Choose File'}
                    </button>
                    <input ref={docRef} type="file" style={{ display: 'none' }} onChange={handleDocument} />
                    {shop?.id_document_url && (
                      <a href={shop.id_document_url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'underline' }}>
                        View Document
                      </a>
                    )}
                  </div>
                  <p className="form-hint">Upload a clear scan or photo of your {form.id_type || 'Identity Card'}</p>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="card">
              <div className="card-header"><div className="card-title">Address</div></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Street Address <span style={{ color: 'var(--red)' }}>*</span></label>
                  <input className="form-input" value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="Shop number, street, area" />
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">City <span style={{ color: 'var(--red)' }}>*</span></label>
                    <input className="form-input" value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="Bilaspur" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Postal Code <span style={{ color: 'var(--red)' }}>*</span></label>
                    <input className="form-input" value={form.postal_code} onChange={(e) => set('postal_code', e.target.value)} placeholder="495001" maxLength={6} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">State <span style={{ color: 'var(--red)' }}>*</span></label>
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
                  <label className="form-label">Phone Number <span style={{ color: 'var(--red)' }}>*</span></label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input className="form-input" value={form.contact_phone} onChange={(e) => set('contact_phone', e.target.value)} placeholder="+91 9876543210" />
                    <button type="button" className="btn btn-warning btn-sm" style={{ whiteSpace: 'nowrap' }} onClick={() => setPhoneOtpStep('sent')}>
                      {vendor?.is_phone_verified ? '✓ Verified' : 'Verify'}
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
                  <label className="form-label">Email <span style={{ color: 'var(--red)' }}>*</span></label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input className="form-input" type="email" value={form.contact_email} onChange={(e) => set('contact_email', e.target.value)} placeholder="shop@email.com" />
                    <button type="button" className="btn btn-warning btn-sm" style={{ whiteSpace: 'nowrap' }} onClick={() => setEmailOtpStep('sent')}>
                      {vendor?.is_email_verified ? '✓ Verified' : 'Verify'}
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
              <div className="card-header"><div className="card-title">Shop Logo / Photo <span style={{ color: 'var(--red)' }}>*</span></div></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                <div style={{ width: 80, height: 80, borderRadius: 'var(--radius)', background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1px solid var(--border)', fontSize: 32 }}>
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : shop?.logo_url ? (
                    <img src={shop.logo_url} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    '🏪'
                  )}
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
              <div
                style={{
                  height: 100,
                  backgroundImage: bannerPreview
                    ? `url('${bannerPreview}')`
                    : shop?.banner_url
                    ? `url('${shop.banner_url}')`
                    : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                  backgroundColor: 'var(--surface2)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 12,
                  fontSize: 28,
                  cursor: 'pointer',
                }}
                onClick={() => bannerRef.current?.click()}
              >
                {!bannerPreview && !shop?.banner_url && '🖼 Click to upload banner'}
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Recommended 1200×300px</p>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => bannerRef.current?.click()} disabled={uploading}>
                {uploading ? <span className="spinner" /> : '📤 Upload Banner'}
              </button>
              <input ref={bannerRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleBanner} />
            </div>
          </div>

          <div className="card">
            <div className="card-header"><div className="card-title">Shop Gallery <span style={{ color: 'var(--red)' }}>*</span></div><span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{(shop?.gallery?.length || 0)} / 10 images</span></div>
            <div className="image-grid">
              {/* Show existing gallery images */}
              {(shop?.gallery || []).map((url, i) => (
                <div key={`existing-${i}`} className="image-item" style={{ position: 'relative' }}>
                  <img src={url} alt={`Gallery ${i}`} />
                  <button
                    type="button"
                    onClick={() => handleDeleteGallery(url)}
                    style={{
                      position: 'absolute', top: 4, right: 4,
                      background: 'rgba(220,38,38,0.85)', color: 'white',
                      border: 'none', borderRadius: '50%',
                      width: 22, height: 22, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, fontWeight: 'bold', lineHeight: 1,
                    }}
                    title="Remove image"
                  >
                    ✕
                  </button>
                </div>
              ))}
              {/* Show preview images */}
              {galleryPreviews.map((preview, i) => (
                <div key={`preview-${i}`} className="image-item" style={{ opacity: 0.7, border: '2px dashed var(--accent)' }}>
                  <img src={preview} alt={`Preview ${i}`} />
                  <div style={{ position: 'absolute', top: 4, right: 4, background: 'var(--accent)', color: 'white', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 'bold' }}>
                    +
                  </div>
                </div>
              ))}
              {/* Add more button */}
              {(((shop?.gallery?.length || 0) + galleryPreviews.length) < 10) && (
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
              <label className="form-label">Latitude <span style={{ color: 'var(--red)' }}>*</span></label>
              <input className="form-input" type="number" step="any" value={form.latitude || ''} onChange={(e) => set('latitude', +e.target.value)} placeholder="21.2514" />
            </div>
            <div className="form-group">
              <label className="form-label">Longitude <span style={{ color: 'var(--red)' }}>*</span></label>
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
