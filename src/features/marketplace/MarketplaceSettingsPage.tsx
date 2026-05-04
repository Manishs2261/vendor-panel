import React, { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { analyticsApi, shopApi } from '../../api/services';

type Tab = 'branding' | 'banner' | 'social' | 'layout';

const getNestedValue = (obj: any, path: string[]): any =>
  path.reduce((o, k) => o?.[k], obj);

const setNestedValue = (obj: any, path: string[], value: any): any => {
  if (path.length === 1) return { ...obj, [path[0]]: value };
  return { ...obj, [path[0]]: setNestedValue(obj[path[0]] || {}, path.slice(1), value) };
};

const draftToFlat = (draft: any) => ({
  primary_color: draft?.theme?.accentColor,
  secondary_color: draft?.theme?.primaryColor,
  background_color: draft?.theme?.backgroundColor,
  banner_text: draft?.banner?.slides?.[0]?.title || draft?.branding?.storeName,
  banner_subtext: draft?.branding?.tagline,
  banner_slides: draft?.banner?.slides || [],
  show_banner: true,
  show_ratings: true,
  show_vendor_info: true,
  show_contact_info: true,
  facebook_url: draft?.social?.facebook,
  instagram_url: draft?.social?.instagram,
  twitter_url: draft?.social?.twitter,
  whatsapp_number: draft?.social?.whatsapp,
  website_url: draft?.social?.website,
  social_email: draft?.social?.email,
  shipping_message: draft?.branding?.shippingMessage,
  contact_hours: draft?.branding?.contactHours,
  about_text: draft?.about?.text,
  promo_headline: draft?.promo?.headline,
  promo_subtext: draft?.promo?.subtext,
  promo_cta_label: draft?.promo?.ctaLabel,
  promo_cta_link: draft?.promo?.ctaLink,
  products_per_page: (draft?.layout?.productsPerRow || 4) * 6,
  products_per_row: draft?.layout?.productsPerRow || 4,
  meta_title: draft?.seo?.metaTitle,
  meta_description: draft?.seo?.metaDescription,
});

const ColorField: React.FC<{ label: string; value: string; onChange: (v: string) => void }> = ({ label, value, onChange }) => (
  <div className="form-group">
    <label className="form-label">{label}</label>
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <input type="color" value={value || '#000000'} onChange={(e) => onChange(e.target.value)}
        style={{ width: 38, height: 34, border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer', padding: 2, background: 'none' }} />
      <input className="form-input" value={value || ''} onChange={(e) => onChange(e.target.value)} style={{ flex: 1, fontFamily: 'monospace', fontSize: 12 }} />
    </div>
  </div>
);

const uploadSlideImage = async (file: File): Promise<string | null> => {
  try {
    const { data } = await shopApi.uploadGallery([file]);
    return data.urls?.[0] || null;
  } catch {
    toast.error('Image upload failed');
    return null;
  }
};

const ImageUploadField: React.FC<{
  label: string;
  value: string;
  hint?: string;
  aspectHint?: string;
  onChange: (url: string) => void;
}> = ({ label, value, hint, aspectHint, onChange }) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const url = await uploadSlideImage(file);
    if (url) onChange(url);
    setUploading(false);
    e.target.value = '';
  };

  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      {value && (
        <div style={{ position: 'relative', width: '100%', height: 72, borderRadius: 6, overflow: 'hidden', border: '1px solid var(--border)', marginBottom: 6 }}>
          <img src={value} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <button type="button" onClick={() => onChange('')}
            style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.65)', color: '#fff', border: 'none', borderRadius: 4, padding: '1px 7px', fontSize: 11, cursor: 'pointer' }}>
            ✕
          </button>
          {aspectHint && (
            <div style={{ position: 'absolute', bottom: 4, left: 6, background: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: 9, padding: '1px 5px', borderRadius: 3 }}>
              {aspectHint}
            </div>
          )}
        </div>
      )}
      <div style={{ display: 'flex', gap: 6 }}>
        <input className="form-input" value={value} style={{ flex: 1, fontSize: 11 }}
          onChange={(e) => onChange(e.target.value)} placeholder="Paste URL or upload ↑" />
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
        <button type="button" className="btn btn-ghost btn-sm" style={{ flexShrink: 0, fontSize: 11 }}
          onClick={() => fileRef.current?.click()} disabled={uploading}>
          {uploading ? '…' : '↑ Upload'}
        </button>
      </div>
      {hint && <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 3 }}>{hint}</div>}
    </div>
  );
};

const MarketplaceSettingsPage: React.FC = () => {
  const [editorData, setEditorData] = useState<any>(null);
  const [draft, setDraft] = useState<any>({});
  const [activeTab, setActiveTab] = useState<Tab>('branding');
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [previewVersion, setPreviewVersion] = useState(0);
  const [loading, setLoading] = useState(true);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const vendorId = editorData?.vendor_id;
  const previewKey = vendorId ? `mp-preview-${vendorId}` : null;
  const previewUrl = vendorId ? `/vendor/${vendorId}?preview=${previewKey}` : null;

  useEffect(() => {
    analyticsApi.getMarketplaceSettings()
      .then(({ data }) => {
        if (data) {
          setEditorData(data);
          setDraft(data.draft || {});
        }
      })
      .catch(() => toast.error('Failed to load marketplace settings'))
      .finally(() => setLoading(false));
  }, []);

  // Keep localStorage in sync and broadcast live updates to all preview iframes
  // (Editor's own preview iframe via postMessage, Marketplace iframe via BroadcastChannel)
  useEffect(() => {
    if (!previewKey || !vendorId) return;
    const payload = { vendorId: String(vendorId), settings: draftToFlat(draft) };
    localStorage.setItem(previewKey, JSON.stringify(payload));

    // Direct postMessage to the Editor's embedded preview iframe
    iframeRef.current?.contentWindow?.postMessage(
      { type: 'MP_PREVIEW_UPDATE', ...payload },
      window.location.origin,
    );

    // BroadcastChannel so the Marketplace "My Storefront" iframe also gets live updates
    try {
      const bc = new BroadcastChannel('mp_preview');
      bc.postMessage({ type: 'MP_PREVIEW_UPDATE', ...payload });
      bc.close();
    } catch { /* not supported */ }
  }, [draft, previewKey, vendorId]);

  const setField = (path: string[], value: any) =>
    setDraft((d: any) => setNestedValue(d, path, value));

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      const { data } = await analyticsApi.updateMarketplaceSettings(draft);
      const saved = data.settings || data;
      setEditorData(saved);
      // Sync draft state from server so slidesCount and other normalised fields stay consistent
      if (saved?.draft) setDraft(saved.draft);
      toast.success('Draft saved');
    } catch {
      toast.error('Failed to save draft');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    try {
      // Always persist current editor state before publishing so the DB is up to date
      await analyticsApi.updateMarketplaceSettings(draft);
      await analyticsApi.publishMarketplaceSettings();
      const { data } = await analyticsApi.getMarketplaceSettings();
      setEditorData(data);
      // Sync draft state so returning to the editor shows exactly what was published
      if (data?.draft) setDraft(data.draft);
      setPreviewVersion((v) => v + 1);
      toast.success('Storefront published!');
    } catch {
      toast.error('Failed to publish');
    } finally {
      setPublishing(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Reset all settings to default?')) return;
    try {
      const { data } = await analyticsApi.resetMarketplaceSettings();
      const fresh = data.settings || data;
      if (fresh?.draft) {
        setEditorData(fresh);
        setDraft(fresh.draft);
      }
      setPreviewVersion((v) => v + 1);
      toast.success('Reset to defaults');
    } catch {
      toast.error('Failed to reset');
    }
  };

  const updateSlide = (i: number, key: string, value: string) => {
    const slides = [...(draft?.banner?.slides || [{}])];
    while (slides.length <= i) slides.push({});
    slides[i] = { ...slides[i], [key]: value };
    setField(['banner', 'slides'], slides);
  };

  const addSlide = () => {
    const slides = [...(draft?.banner?.slides || [{}])];
    if (slides.length >= 6) return;
    slides.push({ tag: '', title: '', subtext: '', ctaLabel: 'Shop Now', ctaLink: '#', imageUrl: '' });
    setDraft((d: any) => ({ ...d, banner: { ...(d?.banner || {}), slides, slidesCount: slides.length } }));
  };

  const removeSlide = (i: number) => {
    const slides = (draft?.banner?.slides || []).filter((_: any, idx: number) => idx !== i);
    const next = slides.length > 0 ? slides : [{}];
    setDraft((d: any) => ({ ...d, banner: { ...(d?.banner || {}), slides: next, slidesCount: next.length } }));
  };

  if (loading) {
    return <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Loading settings…</div>;
  }

  const accent = draft?.theme?.accentColor || '#c8a96e';
  const dark = draft?.theme?.primaryColor || '#1a1208';
  const bg = draft?.theme?.backgroundColor || '#faf8f5';
  const isLive = editorData?.status === 'live';
  const hasChanges = editorData?.has_unpublished_changes;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
      {/* Header */}
      <div className="section-header">
        <div>
          <div className="section-title">Marketplace Settings</div>
          <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2, display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontWeight: 600, color: isLive ? 'var(--green)' : 'var(--yellow)' }}>
              {isLive ? '● Live' : '● Draft'}
            </span>
            {hasChanges && <span style={{ color: 'var(--yellow)' }}>· Unpublished changes</span>}
            {editorData?.published_at && (
              <span>· Last published {new Date(editorData.published_at).toLocaleDateString()}</span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={handleReset}>Reset</button>
          <button className="btn btn-ghost btn-sm" onClick={() => setPreviewVersion((v) => v + 1)}>↺ Refresh Preview</button>
          <button className="btn btn-ghost btn-sm" onClick={handleSaveDraft} disabled={saving}>
            {saving ? <span className="spinner" /> : '💾 Save Draft'}
          </button>
          <button className="btn btn-primary btn-sm" onClick={handlePublish} disabled={publishing}>
            {publishing ? <span className="spinner" /> : '🚀 Publish'}
          </button>
        </div>
      </div>

      {/* Editor + Preview */}
      <div style={{ display: 'flex', gap: 16, flex: 1, minHeight: 0 }}>

        {/* ── Left: Editor ── */}
        <div style={{ width: 320, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Tabs */}
          <div style={{ display: 'flex', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: 3, gap: 2 }}>
            {(['branding', 'banner', 'social', 'layout'] as Tab[]).map((tab) => (
              <button key={tab} type="button"
                className={`btn btn-sm ${activeTab === tab ? 'btn-primary' : 'btn-ghost'}`}
                style={{ flex: 1, border: 'none', textTransform: 'capitalize', fontSize: 11.5, padding: '4px 0' }}
                onClick={() => setActiveTab(tab)}>
                {tab === 'branding' ? '🎨' : tab === 'banner' ? '🖼' : tab === 'social' ? '📱' : '⚙️'} {tab}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="card" style={{ flex: 1, overflowY: 'auto', padding: 16 }}>

            {activeTab === 'branding' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="card-title">Branding & Theme</div>
                <ColorField label="Accent Color" value={accent} onChange={(v) => setField(['theme', 'accentColor'], v)} />
                <ColorField label="Header / Dark Color" value={dark} onChange={(v) => setField(['theme', 'primaryColor'], v)} />
                <ColorField label="Background Color" value={bg} onChange={(v) => setField(['theme', 'backgroundColor'], v)} />
              </div>
            )}

            {activeTab === 'banner' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div className="card-title" style={{ margin: 0 }}>Hero Banner Slides</div>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: 11 }}
                    onClick={addSlide}
                    disabled={(draft?.banner?.slides?.length || 1) >= 6}
                  >
                    + Add Slide
                  </button>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {draft?.banner?.slides?.length || 1} slide{(draft?.banner?.slides?.length || 1) !== 1 ? 's' : ''} · max 6
                </div>
                {(draft?.banner?.slides?.length ? draft.banner.slides : [{}]).map((slide: any, i: number) => (
                  <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        Slide {i + 1}
                      </div>
                      {(draft?.banner?.slides?.length || 1) > 1 && (
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          style={{ fontSize: 10, padding: '2px 8px', color: 'var(--red, #e53e3e)' }}
                          onClick={() => removeSlide(i)}
                        >
                          ✕ Remove
                        </button>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div className="form-group">
                        <label className="form-label">Tag Label</label>
                        <input className="form-input" value={slide?.tag || ''}
                          onChange={(e) => updateSlide(i, 'tag', e.target.value)} placeholder="e.g. New Arrivals" />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Headline</label>
                        <input className="form-input" value={slide?.title || ''}
                          onChange={(e) => updateSlide(i, 'title', e.target.value)} placeholder="Slide headline" />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Subtext</label>
                        <textarea className="form-textarea" rows={2} value={slide?.subtext || ''}
                          onChange={(e) => updateSlide(i, 'subtext', e.target.value)} placeholder="Supporting text" />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Button Label</label>
                        <input className="form-input" value={slide?.ctaLabel || ''}
                          onChange={(e) => updateSlide(i, 'ctaLabel', e.target.value)} placeholder="e.g. Shop Now" />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Button Link (URL)</label>
                        <input className="form-input" value={slide?.ctaLink || ''}
                          onChange={(e) => updateSlide(i, 'ctaLink', e.target.value)}
                          placeholder="https://example.com or #featured-products" />
                        <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 3 }}>
                          Use a full URL or an anchor like <code style={{ fontSize: 10 }}>#section-id</code>
                        </div>
                      </div>
                      <ImageUploadField
                        label="Background Image"
                        value={slide?.imageUrl || ''}
                        hint="Wide/landscape image (16:9). Overrides background color."
                        aspectHint="16:9 recommended"
                        onChange={(v) => updateSlide(i, 'imageUrl', v)}
                      />
                      <ColorField
                        label="Background Color"
                        value={slide?.bgColor || '#1a1208'}
                        onChange={(v) => updateSlide(i, 'bgColor', v)}
                      />
                      <ImageUploadField
                        label="Side Image (Portrait)"
                        value={slide?.sideImageUrl || ''}
                        hint="Person or product photo shown on the right (3:4 portrait)."
                        aspectHint="3:4 portrait"
                        onChange={(v) => updateSlide(i, 'sideImageUrl', v)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'social' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="card-title">Social & Contact</div>
                {([
                  { label: 'WhatsApp Number', path: ['social', 'whatsapp'], placeholder: '+91 9876543210' },
                  { label: 'Instagram URL', path: ['social', 'instagram'], placeholder: 'https://instagram.com/yourshop' },
                  { label: 'Facebook URL', path: ['social', 'facebook'], placeholder: 'https://facebook.com/yourpage' },
                  { label: 'Website URL', path: ['social', 'website'], placeholder: 'https://yourshop.com' },
                  { label: 'Contact Email', path: ['social', 'email'], placeholder: 'contact@yourshop.com' },
                  { label: 'Shipping Message', path: ['branding', 'shippingMessage'], placeholder: 'Free shipping on orders above ₹999' },
                  { label: 'Business Hours', path: ['branding', 'contactHours'], placeholder: 'Mon-Sat: 9am - 7pm' },
                ] as { label: string; path: string[]; placeholder: string }[]).map(({ label, path, placeholder }) => (
                  <div className="form-group" key={label}>
                    <label className="form-label">{label}</label>
                    <input className="form-input" value={getNestedValue(draft, path) || ''}
                      onChange={(e) => setField(path, e.target.value)} placeholder={placeholder} />
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'layout' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="card-title">Layout & SEO</div>
                <div className="form-group">
                  <label className="form-label">Products Per Row</label>
                  <select className="form-select" value={draft?.layout?.productsPerRow || 4}
                    onChange={(e) => setField(['layout', 'productsPerRow'], Number(e.target.value))}>
                    <option value={2}>2 columns</option>
                    <option value={3}>3 columns</option>
                    <option value={4}>4 columns</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">About Text</label>
                  <textarea className="form-textarea" rows={3} value={draft?.about?.text || ''}
                    onChange={(e) => setField(['about', 'text'], e.target.value)} placeholder="Tell your customers about your store…" />
                </div>
                <div className="form-group">
                  <label className="form-label">Promo Headline</label>
                  <input className="form-input" value={draft?.promo?.headline || ''}
                    onChange={(e) => setField(['promo', 'headline'], e.target.value)} placeholder="e.g. Refer a friend, earn ₹200" />
                </div>
                <div className="form-group">
                  <label className="form-label">Promo Subtext</label>
                  <input className="form-input" value={draft?.promo?.subtext || ''}
                    onChange={(e) => setField(['promo', 'subtext'], e.target.value)} placeholder="Supporting promo copy" />
                </div>
                <div className="form-group">
                  <label className="form-label">SEO Page Title</label>
                  <input className="form-input" value={draft?.seo?.metaTitle || ''}
                    onChange={(e) => setField(['seo', 'metaTitle'], e.target.value)} placeholder="Page title for search engines" />
                </div>
                <div className="form-group">
                  <label className="form-label">SEO Description</label>
                  <textarea className="form-textarea" rows={2} value={draft?.seo?.metaDescription || ''}
                    onChange={(e) => setField(['seo', 'metaDescription'], e.target.value)} placeholder="Short description for search results" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Right: Preview ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>
              Preview <span style={{ opacity: 0.6 }}>(edits sync automatically · click ↺ to reload)</span>
            </span>
            {vendorId && (
              <a href={`/vendor/${vendorId}`} target="_blank" rel="noreferrer"
                className="btn btn-ghost btn-sm" style={{ fontSize: 11 }}>
                Open live ↗
              </a>
            )}
          </div>
          {previewUrl ? (
            <iframe
              ref={iframeRef}
              key={`preview-${previewVersion}`}
              src={previewUrl}
              title="Storefront Preview"
              style={{ flex: 1, width: '100%', border: '1px solid var(--border)', borderRadius: 'var(--radius)', minHeight: 'calc(100vh - 220px)' }}
            />
          ) : (
            <div style={{ flex: 1, border: '1px solid var(--border)', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)', minHeight: 400 }}>
              Preview will appear here after settings load
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MarketplaceSettingsPage;
