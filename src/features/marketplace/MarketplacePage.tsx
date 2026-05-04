import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { analyticsApi } from '../../api/services';

const MarketplacePage: React.FC = () => {
  const navigate = useNavigate();
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    analyticsApi.getMarketplaceSettings()
      .then(({ data }) => {
        if (data?.vendor_id) setVendorId(String(data.vendor_id));
      })
      .catch(() => {});
  }, []);

  // Re-push latest draft into the iframe via postMessage after it mounts
  useEffect(() => {
    if (!vendorId) return;
    const previewKey = `mp-preview-${vendorId}`;
    const raw = localStorage.getItem(previewKey);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      const id = window.setTimeout(() => {
        iframeRef.current?.contentWindow?.postMessage(
          { type: 'MP_PREVIEW_UPDATE', vendorId, settings: parsed.settings },
          window.location.origin,
        );
      }, 600);
      return () => window.clearTimeout(id);
    } catch { /* ignore */ }
  }, [vendorId, version]);

  const myUrl = vendorId
    ? `/vendor/${vendorId}?preview=mp-preview-${vendorId}`
    : null;

  const hasDraft = vendorId ? !!localStorage.getItem(`mp-preview-${vendorId}`) : false;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 12 }}>
      <div className="section-header">
        <div>
          <div className="section-title">My Storefront</div>
          <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>Live preview of your storefront</span>
            {hasDraft && (
              <span style={{ color: 'var(--yellow, #f59e0b)', fontWeight: 500 }}>
                · Showing draft ·{' '}
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', color: 'var(--yellow, #f59e0b)', fontSize: 12.5, cursor: 'pointer', padding: 0, fontWeight: 500, textDecoration: 'underline' }}
                  onClick={() => navigate('/marketplace/settings')}
                >
                  Publish changes
                </button>
              </span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setVersion((v) => v + 1)}
            title="Reload storefront preview"
          >
            ↺ Refresh
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/marketplace/settings')}>
            ⚙️ Storefront Editor
          </button>
          {vendorId && (
            <a
              href={`/vendor/${vendorId}`}
              target="_blank"
              rel="noreferrer"
              className="btn btn-ghost btn-sm"
            >
              Open live ↗
            </a>
          )}
        </div>
      </div>

      {myUrl ? (
        <iframe
          ref={iframeRef}
          key={`storefront-${version}`}
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
