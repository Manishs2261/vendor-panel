import React, { useState, useEffect } from 'react';
import { analyticsApi, authApi } from '../../api/services';
import toast from 'react-hot-toast';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { fetchMeThunk } from '../auth/authSlice';

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
  const [error, setError] = useState<string | null>(null);
  
  // Get vendor data from Redux store
  const vendor = useAppSelector((state) => state.auth.vendor);
  const dispatch = useAppDispatch();
  const [checkedVendor, setCheckedVendor] = useState(false);

  // Check if vendor profile exists and try to fetch if not
  useEffect(() => {
    const checkVendorProfile = async () => {
      if (!vendor && !checkedVendor) {
        try {
          await dispatch(fetchMeThunk()).unwrap();
        } catch (error) {
          console.error('Failed to fetch vendor profile:', error);
        } finally {
          setCheckedVendor(true);
        }
      } else if (vendor) {
        setCheckedVendor(true);
      }
    };

    checkVendorProfile();
  }, [vendor, dispatch, checkedVendor]);

  // Load settings when vendor is available
  useEffect(() => {
    if (vendor) {
      loadSettings();
    }
  }, [vendor]);

  // Check if vendor profile exists
  if (!checkedVendor) {
    return (
      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '48px',
          border: '1px solid #ede8df',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid #f3f3f3',
            borderTopColor: '#c8a96e',
            borderRadius: '50%',
            margin: '0 auto 20px',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p style={{ color: '#6b5c45', fontSize: '16px' }}>
            Checking vendor profile...
          </p>
        </div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '48px',
          border: '1px solid #ede8df',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
          <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#1a1208', marginBottom: '12px' }}>
            Vendor Profile Required
          </h2>
          <p style={{ color: '#6b5c45', fontSize: '16px', marginBottom: '24px' }}>
            You need to complete your vendor registration to access marketplace settings.
          </p>
          <p style={{ color: '#6b5c45', fontSize: '14px' }}>
            Please contact support or complete your vendor profile setup.
          </p>
        </div>
      </div>
    );
  }

  async function loadSettings() {
    try {
      setLoading(true);
      const response = await analyticsApi.getMarketplaceSettings();
      setSettings(response.data);
      setError(null);
    } catch (error: any) {
      console.error('Load settings error:', error);
      const errorMessage = error.response?.data?.detail ||
                          error.response?.data?.message ||
                          error.message ||
                          'Failed to load settings';

      // Check if it's a vendor profile issue
      if (errorMessage.includes('Vendor') && errorMessage.includes('not found')) {
        toast.error('Your vendor profile is not set up yet. Please complete your registration or contact support.');
        setLoading(false);
        return;
      }

      toast.error(`Error loading settings: ${errorMessage}`);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  const saveSettings = async () => {
    try {
      setSaving(true);
      await analyticsApi.updateMarketplaceSettings(settings);
      toast.success('Marketplace settings saved successfully!');
    } catch (error: any) {
      console.error('Save settings error:', error);
      const errorMessage = error.response?.data?.detail ||
                          error.response?.data?.message ||
                          error.message ||
                          'Failed to save settings';
      toast.error(`Error saving settings: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  const previewStore = async () => {
    if (!vendor?.id) {
      toast.error('Vendor information not available. Please refresh the page.');
      return;
    }

    try {
      const previewKey = `marketplace-preview-${vendor.id}-${Date.now()}`;
      localStorage.setItem(
        previewKey,
        JSON.stringify({
          vendorId: String(vendor.id),
          settings,
          createdAt: Date.now(),
        })
      );

      const storeUrl = `${window.location.origin}/vendor/${vendor.id}?preview=${encodeURIComponent(previewKey)}`;
      window.open(storeUrl, '_blank');
      toast.success('Opening preview with your unsaved changes...');
    } catch (error: any) {
      console.error('Preview error:', error);
      const errorMessage = error.message || 'Failed to open store preview';
      toast.error(`Error: ${errorMessage}`);
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
        console.error('Reset settings error:', error);
        const errorMessage = error.response?.data?.detail ||
                            error.response?.data?.message ||
                            error.message ||
                            'Failed to reset settings';
        toast.error(`Error resetting settings: ${errorMessage}`);
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
      <div style={{
        marginBottom: '32px',
        background: 'linear-gradient(135deg, #c8a96e 0%, #d4b896 100%)',
        borderRadius: '12px',
        padding: '32px',
        boxShadow: '0 4px 12px rgba(200, 169, 110, 0.15)',
        border: '1px solid rgba(200, 169, 110, 0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            background: 'rgba(255, 255, 255, 0.3)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px'
          }}>
            ⚙️
          </div>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: '700', color: 'white', marginBottom: '4px' }}>
              Marketplace Settings
            </h1>
          </div>
        </div>
        <p style={{ color: 'rgba(255, 255, 255, 0.95)', fontSize: '16px', marginLeft: '64px' }}>
          Customize your vendor storefront appearance and functionality
        </p>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        background: 'white',
        borderRadius: '12px 12px 0 0',
        border: '1px solid #ede8df',
        borderBottom: 'none',
        marginBottom: '0',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
      }}>
        {[
          { id: 'appearance', label: 'Appearance' },
          { id: 'layout', label: 'Layout' },
          { id: 'social', label: 'Social Media' },
          { id: 'seo', label: 'SEO' },
          { id: 'advanced', label: 'Advanced' }
        ].map((tab, index) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              padding: '16px 20px',
              border: 'none',
              background: activeTab === tab.id ? 'rgba(200, 169, 110, 0.1)' : 'transparent',
              color: activeTab === tab.id ? '#c8a96e' : '#6b5c45',
              borderBottom: activeTab === tab.id ? '3px solid #c8a96e' : '3px solid transparent',
              cursor: 'pointer',
              fontSize: '15px',
              fontWeight: activeTab === tab.id ? '600' : '500',
              transition: 'all 0.3s',
              borderRight: index < 4 ? '1px solid #ede8df' : 'none',
              position: 'relative'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== tab.id) {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(200, 169, 110, 0.05)';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== tab.id) {
                (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
              }
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{
        background: 'white',
        borderRadius: '0 0 12px 12px',
        padding: '32px',
        border: '1px solid #ede8df',
        borderTop: '1px solid #ede8df',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
        marginBottom: '32px'
      }}>
        
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
            onClick={previewStore}
            disabled={saving}
            style={{
              padding: '10px 20px',
              border: '1px solid #c8a96e',
              background: 'white',
              color: '#c8a96e',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.6 : 1,
              transition: 'all 0.2s'
            }}
            title="Saves settings and opens your store preview"
          >
            👁️ Preview Store
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
              opacity: saving ? 0.8 : 1,
              transition: 'all 0.2s'
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
