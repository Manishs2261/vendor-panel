import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { createProduct, updateProduct, fetchCategories, setSelected } from './productSlice';
import { productApi } from '../../api/services';
import type { ProductForm, ColorVariation } from '../../types';
import toast from 'react-hot-toast';

const COLORS = ['Red', 'Blue', 'Green', 'Black', 'White', 'Yellow', 'Pink', 'Purple', 'Orange', 'Grey'];
const COLOR_HEX: Record<string, string> = {
  Red: '#ef4444', Blue: '#3b82f6', Green: '#10b981', Black: '#111', White: '#f5f5f5',
  Yellow: '#f59e0b', Pink: '#ec4899', Purple: '#a855f7', Orange: '#f97316', Grey: '#6b7280',
};

const defaultForm: ProductForm = {
  name: '', description: '', price: 0, discount_percentage: 0,
  category_id: '', subcategory_id: '', brand: '', tags: [],
  sku: '', stock: 0, variations: [], status: 'ACTIVE',
};

const ProductFormPage: React.FC = () => {
  const { id } = useParams();
  const isEdit = !!id;
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { categories, loading, selected } = useAppSelector((s) => s.products);

  const [form, setForm] = useState<ProductForm>(defaultForm);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [video, setVideo] = useState<File | null>(null);
  const [tagInput, setTagInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [dragging, setDragging] = useState(false);
  const imageRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  useEffect(() => {
    if (isEdit && id) {
      productApi.get(id).then(({ data }) => {
        dispatch(setSelected(data));
        setForm({
          name: data.name, description: data.description, price: data.price,
          discount_percentage: data.discount_percentage, category_id: data.category_id,
          subcategory_id: data.subcategory_id || '', brand: data.brand || '',
          tags: Array.isArray(data.tags) ? data.tags : [], stock: data.stock,
          latitude: data.latitude, longitude: data.longitude,
          variations: data.variations || [], status: (String(data.status || 'ACTIVE').toUpperCase() as 'ACTIVE' | 'INACTIVE'),
        });
        setImagePreviews(data.images);
      });
    }
  }, [id, isEdit, dispatch]);

  const set = (key: keyof ProductForm, value: any) => setForm((f) => ({ ...f, [key]: value }));

  const handleImages = (files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files).slice(0, 10 - images.length);
    setImages((prev) => [...prev, ...arr]);
    arr.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => setImagePreviews((prev) => [...prev, e.target?.result as string]);
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
    setImagePreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const addTag = () => {
    if (tagInput.trim() && !(form.tags || []).includes(tagInput.trim())) {
      set('tags', [...(form.tags || []), tagInput.trim()]);
    }
    setTagInput('');
  };

  const removeTag = (t: string) => set('tags', (form.tags || []).filter((tag) => tag !== t));

  const addVariation = (color: string) => {
    if ((form.variations || []).find((v) => v.color === color)) return;
    set('variations', [...(form.variations || []), { color, hex: COLOR_HEX[color] || '#888', stock: 0, images: [] }]);
  };

  const updateVariation = (idx: number, key: keyof ColorVariation, value: any) => {
    const next = [...(form.variations || [])];
    next[idx] = { ...next[idx], [key]: value };
    set('variations', next);
  };

  const removeVariation = (idx: number) => set('variations', (form.variations || []).filter((_, i) => i !== idx));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.category_id) {
      toast.error('Please fill all required fields'); return;
    }
    setSubmitting(true);
    try {
      let result;
      if (isEdit && id) {
        result = await dispatch(updateProduct({ id, form, newImages: images, video: video || undefined }));
      } else {
        result = await dispatch(createProduct({ form, images, video: video || undefined }));
      }
      if (createProduct.fulfilled.match(result) || updateProduct.fulfilled.match(result)) {
        toast.success(isEdit ? 'Product updated!' : 'Product created!');
        navigate('/products');
      } else {
        toast.error((result as any).error?.message || 'Failed to save product');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const parentCategories = (categories || []).filter((c) => !c.parent_id);
  const subCategories = (categories || []).filter((c) => c.parent_id === form.category_id);
  const discountedPrice = form.price * (1 - form.discount_percentage / 100);

  return (
    <form onSubmit={handleSubmit}>
      <div className="section-header">
        <div>
          <div className="section-title">{isEdit ? 'Edit Product' : 'Add New Product'}</div>
          <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>
            {isEdit ? 'Update product details and media' : 'Fill details to list your product'}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" className="btn btn-ghost" onClick={() => navigate('/products')} disabled={submitting}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting || loading} aria-busy={submitting}>
              {submitting ? <>
                <span className="spinner" />
                <span>{isEdit ? 'Saving Changes...' : 'Saving Product...'}</span>
              </> : isEdit ? 'Save Changes' : 'Publish Product'}
            </button>
          </div>
          {submitting && (
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {isEdit ? 'Please wait while we save your product updates.' : 'Please wait while we upload product details and images.'}
            </div>
          )}
        </div>
      </div>

      <div className="grid-2-1" style={{ alignItems: 'start' }}>
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Basic Info */}
          <div className="card">
            <div className="card-header"><div className="card-title">Basic Information</div></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Product Name <span>*</span></label>
                <input className="form-input" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Premium Silk Saree" required />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-textarea" rows={4} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Describe your product in detail..." />
              </div>
              <div className="form-group">
                <label className="form-label">Brand</label>
                <input className="form-input" value={form.brand} onChange={(e) => set('brand', e.target.value)} placeholder="Brand name" />
              </div>
              <div className="form-group">
                <label className="form-label">Tags</label>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                  {(form.tags || []).map((t) => (
                    <span key={t} className="tag">{t}<span className="tag-remove" onClick={() => removeTag(t)}>x</span></span>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input className="form-input" value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder="Add tag..." onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }} />
                  <button type="button" className="btn btn-ghost btn-sm" onClick={addTag}>Add</button>
                </div>
              </div>
            </div>
          </div>

          {/* Media */}
          <div className="card">
            <div className="card-header"><div className="card-title">Media</div></div>
            <div
              className={`dropzone ${dragging ? 'drag' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => { e.preventDefault(); setDragging(false); handleImages(e.dataTransfer.files); }}
              onClick={() => imageRef.current?.click()}
            >
              <div className="dropzone-icon">Upload</div>
              <div className="dropzone-text">Drop images here or click to upload</div>
              <div className="dropzone-sub">PNG, JPG, WebP - Max 10 images - 5MB each</div>
            </div>
            <input ref={imageRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={(e) => handleImages(e.target.files)} />
            {submitting && (
              <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: 'var(--text-muted)' }}>
                <span className="spinner" />
                <span>Uploading product media and saving your product. Please wait...</span>
              </div>
            )}
            {imagePreviews.length > 0 && (
              <div className="image-grid" style={{ marginTop: 14 }}>
                {imagePreviews.map((src, i) => (
                  <div key={i} className="image-item">
                    <img src={src} alt="" />
                    <button type="button" className="image-remove" onClick={() => removeImage(i)}>x</button>
                  </div>
                ))}
              </div>
            )}
            <div style={{ marginTop: 16 }}>
              <label className="form-label">Product Video (optional)</label>
              <div className="dropzone" style={{ padding: 16 }} onClick={() => videoRef.current?.click()}>
                <div className="dropzone-text">{video ? video.name : 'Upload product video'}</div>
                <div className="dropzone-sub">MP4, MOV - Max 100MB</div>
              </div>
              <input ref={videoRef} type="file" accept="video/*" style={{ display: 'none' }} onChange={(e) => setVideo(e.target.files?.[0] || null)} />
            </div>
          </div>

          {/* Color Variations */}
          <div className="card">
            <div className="card-header"><div className="card-title">Color Variations</div><span style={{ fontSize: 12, color: 'var(--text-muted)' }}>For clothing/accessories</span></div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
              {COLORS.map((color) => (
                <div
                  key={color}
                  className={`color-swatch ${(form.variations || []).find((v) => v.color === color) ? 'selected' : ''}`}
                  style={{ background: COLOR_HEX[color] }}
                  onClick={() => addVariation(color)}
                  title={color}
                />
              ))}
            </div>
            {(form.variations || []).length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(form.variations || []).map((v, i) => (
                  <div key={v.color} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--surface2)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: v.hex, border: '2px solid rgba(255,255,255,0.2)', flexShrink: 0 }} />
                    <span style={{ fontSize: 13, flex: 1 }}>{v.color}</span>
                    <input className="form-input" type="number" style={{ width: 80 }} placeholder="Stock" value={v.stock} onChange={(e) => updateVariation(i, 'stock', +e.target.value)} />
                    <button type="button" className="btn btn-danger btn-xs" onClick={() => removeVariation(i)}>x</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Pricing */}
          <div className="card">
            <div className="card-header"><div className="card-title">Pricing & Stock</div></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Price (INR) <span>*</span></label>
                <input className="form-input" type="number" min="0" value={form.price || ''} onChange={(e) => set('price', +e.target.value)} placeholder="0.00" required />
              </div>
              <div className="form-group">
                <label className="form-label">Discount (%)</label>
                <input className="form-input" type="number" min="0" max="90" value={form.discount_percentage || ''} onChange={(e) => set('discount_percentage', +e.target.value)} placeholder="0" />
              </div>
              {form.discount_percentage > 0 && form.price > 0 && (
                <div style={{ background: 'var(--green-bg)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: 13 }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: 11.5 }}>Final price after discount</div>
                  <div style={{ color: 'var(--green)', fontFamily: 'var(--display)', fontSize: 22, fontWeight: 700 }}>INR {discountedPrice.toFixed(0)}</div>
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Stock Quantity</label>
                <input className="form-input" type="number" min="0" value={form.stock || ''} onChange={(e) => set('stock', +e.target.value)} placeholder="0" />
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-select" value={form.status} onChange={(e) => set('status', e.target.value as 'ACTIVE' | 'INACTIVE')}>
                  <option value="ACTIVE">Active - visible in search</option>
                  <option value="INACTIVE">Inactive - hidden</option>
                </select>
              </div>
            </div>
          </div>

          {/* Category */}
          <div className="card">
            <div className="card-header"><div className="card-title">Category</div></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Category <span>*</span></label>
                <select className="form-select" value={form.category_id} onChange={(e) => { set('category_id', e.target.value); set('subcategory_id', ''); }} required>
                  <option value="">Select category</option>
                  {parentCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              {subCategories.length > 0 && (
                <div className="form-group">
                  <label className="form-label">Subcategory</label>
                  <select className="form-select" value={form.subcategory_id} onChange={(e) => set('subcategory_id', e.target.value)}>
                    <option value="">Select subcategory</option>
                    {subCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Map Location */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Product Location</div>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Optional</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Latitude</label>
                <input className="form-input" type="number" step="any" value={form.latitude || ''} onChange={(e) => set('latitude', +e.target.value)} placeholder="21.2514" />
              </div>
              <div className="form-group">
                <label className="form-label">Longitude</label>
                <input className="form-input" type="number" step="any" value={form.longitude || ''} onChange={(e) => set('longitude', +e.target.value)} placeholder="81.6296" />
              </div>
              <div style={{ background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13, border: '1px solid var(--border)' }}>
                Map picker - integrate Google Maps API
              </div>
              <p className="form-hint">Set precise location for hyperlocal search visibility</p>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};

export default ProductFormPage;







