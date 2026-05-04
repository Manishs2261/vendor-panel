import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { analyticsApi } from '../../api/services';

const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

const MarketplacePage: React.FC = () => {
  const navigate = useNavigate();
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [view, setView] = useState<'all' | 'mine'>('all');

  useEffect(() => {
    analyticsApi.getMarketplaceSettings()
      .then(({ data }) => {
        if (data?.vendor_id) setVendorId(String(data.vendor_id));
      })
      .catch(() => {});
  }, []);

  const allUrl = `${BASE_URL}/marketplace`;
  const myUrl = vendorId ? `/vendor/${vendorId}` : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 12 }}>
      {/* Header */}
      <div className="section-header">
        <div>
          <div className="section-title">Marketplace</div>
          <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>
            Browse all vendors or view your own storefront
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/marketplace/settings')}>
            ⚙️ Customize My Store
          </button>
          <a
            href={view === 'all' ? allUrl : (myUrl || allUrl)}
            target="_blank"
            rel="noreferrer"
            className="btn btn-ghost btn-sm"
          >
            Open in new tab ↗
          </a>
        </div>
      </div>

      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: 2, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: 3, width: 'fit-content' }}>
        <button
          type="button"
          className={`btn btn-sm ${view === 'all' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ border: 'none' }}
          onClick={() => setView('all')}
        >
          🏬 All Vendors
        </button>
        <button
          type="button"
          className={`btn btn-sm ${view === 'mine' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ border: 'none' }}
          onClick={() => setView('mine')}
        >
          🏪 My Storefront
        </button>
      </div>

      {/* Iframe */}
      {view === 'all' ? (
        <iframe
          key="all"
          src={allUrl}
          title="Marketplace"
          style={{ flex: 1, width: '100%', border: '1px solid var(--border)', borderRadius: 'var(--radius)', minHeight: 'calc(100vh - 200px)' }}
        />
      ) : myUrl ? (
        <iframe
          key="mine"
          src={myUrl}
          title="My Storefront"
          style={{ flex: 1, width: '100%', border: '1px solid var(--border)', borderRadius: 'var(--radius)', minHeight: 'calc(100vh - 200px)' }}
        />
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
          <div style={{ fontSize: 36 }}>🏪</div>
          <div style={{ fontWeight: 500 }}>Your storefront is not set up yet</div>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/marketplace/settings')}>
            Go to Storefront Editor
          </button>
        </div>
      )}
    </div>
  );
};

export default MarketplacePage;
