import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { analyticsApi } from '../../api/services';

const MarketplacePage: React.FC = () => {
  const navigate = useNavigate();
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeError, setIframeError] = useState(false);
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
    if (!vendorId || !iframeLoaded) return;
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
      }, 300);
      return () => window.clearTimeout(id);
    } catch { /* ignore */ }
  }, [vendorId, version, iframeLoaded]);

  const myUrl = vendorId
    ? `/vendor/${vendorId}?preview=mp-preview-${vendorId}`
    : null;

  const hasDraft = vendorId ? !!localStorage.getItem(`mp-preview-${vendorId}`) : false;

  const handleRefresh = () => {
    setIframeLoaded(false);
    setIframeError(false);
    setVersion((v) => v + 1);
  };

  const handleIframeLoad = () => {
    // Check if the iframe landed on an error page (chrome-error, about:blank after failure)
    try {
      const url = iframeRef.current?.contentWindow?.location?.href ?? '';
      if (url.startsWith('chrome-error') || url === 'about:blank') {
        setIframeError(true);
        setIframeLoaded(false);
        return;
      }
    } catch {
      // cross-origin read — means it loaded a different origin, treat as success
    }
    setIframeLoaded(true);
    setIframeError(false);
  };

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
            onClick={handleRefresh}
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
        <div style={{ flex: 1, position: 'relative', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', minHeight: 'calc(100vh - 200px)' }}>
          {/* Loading overlay */}
          {!iframeLoaded && !iframeError && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, background: 'var(--bg, #f9fafb)', zIndex: 1 }}>
              <div style={{ width: 28, height: 28, border: '3px solid var(--border)', borderTopColor: 'var(--primary, #2563eb)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading storefront preview…</span>
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
          )}

          {/* Error fallback */}
          {iframeError && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, background: 'var(--bg, #f9fafb)', zIndex: 1, padding: 24, textAlign: 'center' }}>
              <div style={{ fontSize: 36 }}>⚠️</div>
              <div style={{ fontWeight: 600, color: 'var(--text)' }}>Storefront preview unavailable</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 340 }}>
                Make sure your backend server is running, then try refreshing.
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <button className="btn btn-primary btn-sm" onClick={handleRefresh}>
                  ↺ Retry
                </button>
                <a href={`/vendor/${vendorId}`} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">
                  Open live ↗
                </a>
              </div>
            </div>
          )}

          <iframe
            ref={iframeRef}
            key={`storefront-${version}`}
            src={myUrl}
            title="My Storefront"
            onLoad={handleIframeLoad}
            style={{ width: '100%', height: '100%', border: 'none', display: iframeError ? 'none' : 'block' }}
          />
        </div>
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
