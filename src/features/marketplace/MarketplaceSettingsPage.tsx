import React, { useState, useEffect } from 'react';
import { analyticsApi } from '../../api/services';
import toast from 'react-hot-toast';
import { useAppSelector } from '../../hooks/redux';

interface MarketplaceSettings {
  id?: number;
  theme: string;
  primary_color: string;
  secondary_color: string;
  background_color: string;
  banner_text: string;
  banner_subtext: string;
  show_banner: boolean;
  show_vendor_info: boolean;
  show_contact_info: boolean;
  show_ratings: boolean;
  products_per_page: number;
  custom_css?: string;
  facebook_url?: string;
  instagram_url?: string;
  twitter_url?: string;
  whatsapp_number?: string;
  enable_reviews: boolean;
  enable_wishlist: boolean;
  enable_sharing: boolean;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  created_at?: string;
  updated_at?: string;
}

const MarketplaceSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<MarketplaceSettings>({
    theme: 'default',
    primary_color: '#c8a96e',
    secondary_color: '#1a1208',
    background_color: '#faf8f5',
    banner_text: 'Welcome to Our Store',
    banner_subtext: 'Discover amazing products',
    show_banner: true,
    show_vendor_info: true,
    show_contact_info: true,
    show_ratings: true,
    products_per_page: 12,
    custom_css: '',
    facebook_url: '',
    instagram_url: '',
    twitter_url: '',
    whatsapp_number: '',
    enable_reviews: true,
    enable_wishlist: true,
    enable_sharing: true,
    meta_title: '',
    meta_description: '',
    meta_keywords: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('appearance');
  
  // Get vendor data from Redux store
  const vendor = useAppSelector((state) => state.auth.vendor);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await analyticsApi.getMarketplaceSettings();
      if (response.data) {
        setSettings(response.data);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      await analyticsApi.updateMarketplaceSettings(settings);
      toast.success('Marketplace settings saved successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const resetSettings = async () => {
    if (confirm('Are you sure you want to reset all settings to default values?')) {
      try {
        setSaving(true);
        const response = await analyticsApi.resetMarketplaceSettings();
        if (response.data.settings) {
          setSettings(response.data.settings);
          toast.success('Settings reset to default successfully!');
        }
      } catch (error: any) {
        toast.error(error.response?.data?.detail || 'Failed to reset settings');
      } finally {
        setSaving(false);
      }
    }
  };

  const handleInputChange = (field: keyof MarketplaceSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid #f3f3f3',
            borderTopColor: '#c8a96e',
            borderRadius: '50%',
            margin: '0 auto 20px',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p>Loading marketplace settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#1a1208', marginBottom: '8px' }}>
          Marketplace Settings
        </h1>
        <p style={{ color: '#6b5c45', fontSize: '16px' }}>
          Customize your vendor storefront appearance and functionality
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #ede8df', marginBottom: '32px' }}>
        {[
          { id: 'appearance', label: 'Appearance' },
          { id: 'layout', label: 'Layout' },
          { id: 'social', label: 'Social Media' },
          { id: 'seo', label: 'SEO' },
          { id: 'advanced', label: 'Advanced' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '12px 24px',
              border: 'none',
              background: 'transparent',
              color: activeTab === tab.id ? '#1a1208' : '#6b5c45',
              borderBottom: activeTab === tab.id ? '2px solid #c8a96e' : '2px solid transparent',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: activeTab === tab.id ? '600' : '400',
              transition: 'all 0.2s'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ background: 'white', borderRadius: '12px', padding: '32px', border: '1px solid #ede8df' }}>
        
        {/* Appearance Tab */}
        {activeTab === 'appearance' && (
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#1a1208', marginBottom: '24px' }}>
              Store Appearance
            </h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
              {/* Theme Selection */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#1a1208' }}>
                  Theme
                </label>
                <select
                  value={settings.theme}
                  onChange={(e) => handleInputChange('theme', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #ede8df',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                >
                  <option value="default">Default</option>
                  <option value="modern">Modern</option>
                  <option value="classic">Classic</option>
                  <option value="minimal">Minimal</option>
                  <option value="colorful">Colorful</option>
                </select>
              </div>

              {/* Primary Color */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#1a1208' }}>
                  Primary Color
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="color"
                    value={settings.primary_color}
                    onChange={(e) => handleInputChange('primary_color', e.target.value)}
                    style={{
                      width: '50px',
                      height: '40px',
                      border: '1px solid #ede8df',
                      borderRadius: '8px',
                      cursor: 'pointer'
                    }}
                  />
                  <input
                    type="text"
                    value={settings.primary_color}
                    onChange={(e) => handleInputChange('primary_color', e.target.value)}
                    style={{
                      flex: 1,
                      padding: '10px 12px',
                      border: '1px solid #ede8df',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>

              {/* Secondary Color */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#1a1208' }}>
                  Secondary Color
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="color"
                    value={settings.secondary_color}
                    onChange={(e) => handleInputChange('secondary_color', e.target.value)}
                    style={{
                      width: '50px',
                      height: '40px',
                      border: '1px solid #ede8df',
                      borderRadius: '8px',
                      cursor: 'pointer'
                    }}
                  />
                  <input
                    type="text"
                    value={settings.secondary_color}
                    onChange={(e) => handleInputChange('secondary_color', e.target.value)}
                    style={{
                      flex: 1,
                      padding: '10px 12px',
                      border: '1px solid #ede8df',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>

              {/* Background Color */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#1a1208' }}>
                  Background Color
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="color"
                    value={settings.background_color}
                    onChange={(e) => handleInputChange('background_color', e.target.value)}
                    style={{
                      width: '50px',
                      height: '40px',
                      border: '1px solid #ede8df',
                      borderRadius: '8px',
                      cursor: 'pointer'
                    }}
                  />
                  <input
                    type="text"
                    value={settings.background_color}
                    onChange={(e) => handleInputChange('background_color', e.target.value)}
                    style={{
                      flex: 1,
                      padding: '10px 12px',
                      border: '1px solid #ede8df',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Banner Settings */}
            <div style={{ marginTop: '32px', paddingTop: '32px', borderTop: '1px solid #ede8df' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1a1208', marginBottom: '16px' }}>
                Banner Settings
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#1a1208' }}>
                    Banner Text
                  </label>
                  <input
                    type="text"
                    value={settings.banner_text}
                    onChange={(e) => handleInputChange('banner_text', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #ede8df',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#1a1208' }}>
                    Banner Subtext
                  </label>
                  <input
                    type="text"
                    value={settings.banner_subtext}
                    onChange={(e) => handleInputChange('banner_subtext', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #ede8df',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>

              <div style={{ marginTop: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={settings.show_banner}
                    onChange={(e) => handleInputChange('show_banner', e.target.checked)}
                    style={{ width: '18px', height: '18px' }}
                  />
                  <span style={{ fontWeight: '500', color: '#1a1208' }}>Show Banner</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Layout Tab */}
        {activeTab === 'layout' && (
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#1a1208', marginBottom: '24px' }}>
              Layout Options
            </h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#1a1208' }}>
                  Products Per Page
                </label>
                <select
                  value={settings.products_per_page}
                  onChange={(e) => handleInputChange('products_per_page', parseInt(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #ede8df',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                >
                  <option value={6}>6</option>
                  <option value={12}>12</option>
                  <option value={18}>18</option>
                  <option value={24}>24</option>
                  <option value={36}>36</option>
                </select>
              </div>
            </div>

            <div style={{ marginTop: '32px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1a1208', marginBottom: '16px' }}>
                Display Options
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { key: 'show_vendor_info', label: 'Show Vendor Information' },
                  { key: 'show_contact_info', label: 'Show Contact Information' },
                  { key: 'show_ratings', label: 'Show Product Ratings' },
                  { key: 'enable_reviews', label: 'Enable Customer Reviews' },
                  { key: 'enable_wishlist', label: 'Enable Wishlist' },
                  { key: 'enable_sharing', label: 'Enable Social Sharing' }
                ].map(option => (
                  <label key={option.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={settings[option.key as keyof MarketplaceSettings] as boolean}
                      onChange={(e) => handleInputChange(option.key as keyof MarketplaceSettings, e.target.checked)}
                      style={{ width: '18px', height: '18px' }}
                    />
                    <span style={{ fontWeight: '500', color: '#1a1208' }}>{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Social Media Tab */}
        {activeTab === 'social' && (
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#1a1208', marginBottom: '24px' }}>
              Social Media Links
            </h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#1a1208' }}>
                  Facebook URL
                </label>
                <input
                  type="url"
                  value={settings.facebook_url || ''}
                  onChange={(e) => handleInputChange('facebook_url', e.target.value)}
                  placeholder="https://facebook.com/yourstore"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #ede8df',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#1a1208' }}>
                  Instagram URL
                </label>
                <input
                  type="url"
                  value={settings.instagram_url || ''}
                  onChange={(e) => handleInputChange('instagram_url', e.target.value)}
                  placeholder="https://instagram.com/yourstore"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #ede8df',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#1a1208' }}>
                  Twitter URL
                </label>
                <input
                  type="url"
                  value={settings.twitter_url || ''}
                  onChange={(e) => handleInputChange('twitter_url', e.target.value)}
                  placeholder="https://twitter.com/yourstore"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #ede8df',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#1a1208' }}>
                  WhatsApp Number
                </label>
                <input
                  type="tel"
                  value={settings.whatsapp_number || ''}
                  onChange={(e) => handleInputChange('whatsapp_number', e.target.value)}
                  placeholder="+1234567890"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #ede8df',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* SEO Tab */}
        {activeTab === 'seo' && (
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#1a1208', marginBottom: '24px' }}>
              SEO Settings
            </h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#1a1208' }}>
                  Meta Title
                </label>
                <input
                  type="text"
                  value={settings.meta_title || ''}
                  onChange={(e) => handleInputChange('meta_title', e.target.value)}
                  placeholder="Your Store Name - Best Products Online"
                  maxLength={60}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #ede8df',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
                <div style={{ fontSize: '12px', color: '#6b5c45', marginTop: '4px' }}>
                  {settings.meta_title?.length || 0}/60 characters
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#1a1208' }}>
                  Meta Description
                </label>
                <textarea
                  value={settings.meta_description || ''}
                  onChange={(e) => handleInputChange('meta_description', e.target.value)}
                  placeholder="Discover amazing products from our store. Quality items at great prices."
                  maxLength={160}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #ede8df',
                    borderRadius: '8px',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                />
                <div style={{ fontSize: '12px', color: '#6b5c45', marginTop: '4px' }}>
                  {settings.meta_description?.length || 0}/160 characters
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#1a1208' }}>
                  Meta Keywords
                </label>
                <input
                  type="text"
                  value={settings.meta_keywords || ''}
                  onChange={(e) => handleInputChange('meta_keywords', e.target.value)}
                  placeholder="products, store, online shopping, best deals"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #ede8df',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
                <div style={{ fontSize: '12px', color: '#6b5c45', marginTop: '4px' }}>
                  Separate keywords with commas
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Advanced Tab */}
        {activeTab === 'advanced' && (
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#1a1208', marginBottom: '24px' }}>
              Advanced Settings
            </h2>
            
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#1a1208' }}>
                Custom CSS
              </label>
              <textarea
                value={settings.custom_css || ''}
                onChange={(e) => handleInputChange('custom_css', e.target.value)}
                placeholder="/* Add your custom CSS here */"
                rows={10}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ede8df',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontFamily: 'monospace',
                  resize: 'vertical'
                }}
              />
              <div style={{ fontSize: '12px', color: '#6b5c45', marginTop: '4px' }}>
                Add custom CSS to further customize your store appearance
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '32px' }}>
        <div>
          <button
            onClick={resetSettings}
            disabled={saving}
            style={{
              padding: '10px 20px',
              border: '1px solid #dc3545',
              background: 'white',
              color: '#dc3545',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.6 : 1
            }}
          >
            Reset to Default
          </button>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => vendor && window.open(`/vendor/${vendor.id}`, '_blank')}
            style={{
              padding: '10px 20px',
              border: '1px solid #c8a96e',
              background: 'white',
              color: '#c8a96e',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Preview Store
          </button>
          
          <button
            onClick={saveSettings}
            disabled={saving}
            style={{
              padding: '10px 24px',
              border: 'none',
              background: saving ? '#ccc' : '#c8a96e',
              color: 'white',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.8 : 1
            }}
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default MarketplaceSettingsPage;
