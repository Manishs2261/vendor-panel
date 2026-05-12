import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { productApi } from '../../api/services';
import type { Product } from '../../types';

const STATUS_COLOR: Record<string, string> = {
  approved: '#6c3fc5',
  pending: '#f0a500',
  rejected: '#e8303b',
  none: 'var(--text-dim)',
};

const STATUS_LABEL: Record<string, string> = {
  approved: '📢 Sponsored',
  pending: '⏳ Pending Review',
  rejected: '✕ Rejected',
  none: '—',
};

export default function PromotionsPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestingId, setRequestingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await productApi.list({ limit: 100 });
      setProducts(res.data?.items || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleRequest = async (id: string) => {
    setRequestingId(id);
    try {
      await productApi.requestSponsorship(id);
      toast.success('Sponsorship request submitted! Admin will review it.');
      await load();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Request failed');
    } finally {
      setRequestingId(null);
    }
  };

  const sponsored = products.filter(p => p.is_sponsored);
  const pending = products.filter(p => !p.is_sponsored && p.sponsor_request_status === 'pending');
  const rejected = products.filter(p => p.sponsor_request_status === 'rejected');
  const available = products.filter(p => !p.is_sponsored && p.sponsor_request_status !== 'pending' && p.sponsor_request_status !== 'rejected');

  return (
    <div>
      {/* Stats */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 28, flexWrap: 'wrap' }}>
        {[
          { label: 'Active Sponsors', value: sponsored.length, color: '#6c3fc5' },
          { label: 'Pending Approval', value: pending.length, color: '#f0a500' },
          { label: 'Rejected', value: rejected.length, color: '#e8303b' },
          { label: 'Can Request', value: available.length, color: 'var(--text-muted)' },
        ].map(s => (
          <div key={s.label} className="card" style={{ flex: 1, minWidth: 120, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Info banner */}
      <div style={{ background: 'rgba(108,63,197,0.08)', border: '1px solid rgba(108,63,197,0.25)', borderRadius: 10, padding: '14px 18px', marginBottom: 24, fontSize: 13, lineHeight: 1.7 }}>
        <strong style={{ color: '#6c3fc5' }}>📢 How Sponsorship Works</strong><br />
        Sponsored products appear with a subtle <strong>"Ad"</strong> badge on their card, feature in the <strong>"Featured Picks"</strong> homepage carousel, and are injected every 5 products in browsing pages. Request sponsorship below — admin reviews and approves.
      </div>

      {loading ? (
        <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading products…</div>
      ) : products.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
          No products yet. <button className="btn btn-primary btn-sm" style={{ marginLeft: 8 }} onClick={() => navigate('/products/new')}>Add a product</button>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 14 }}>
            All Products — Sponsor Status
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {products.map((p, idx) => {
              const status = p.sponsor_request_status || 'none';
              const isSponsored = p.is_sponsored;
              return (
                <div key={p.id} style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '12px 20px',
                  borderBottom: idx < products.length - 1 ? '1px solid var(--border)' : 'none',
                }}>
                  {/* Image */}
                  <div style={{ width: 44, height: 44, borderRadius: 8, background: 'var(--surface2)', overflow: 'hidden', flexShrink: 0 }}>
                    {p.images[0] && <img src={p.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>₹{Number(p.price).toLocaleString()} · {p.category_name || '—'}</div>
                  </div>

                  {/* Status badge */}
                  {(isSponsored || status !== 'none') && (
                    <span style={{
                      background: STATUS_COLOR[isSponsored ? 'approved' : status] + '22',
                      color: STATUS_COLOR[isSponsored ? 'approved' : status],
                      border: `1px solid ${STATUS_COLOR[isSponsored ? 'approved' : status]}55`,
                      borderRadius: 20, padding: '3px 12px', fontSize: 12, fontWeight: 600, flexShrink: 0,
                    }}>
                      {STATUS_LABEL[isSponsored ? 'approved' : status]}
                    </span>
                  )}

                  {/* Action */}
                  <div style={{ flexShrink: 0 }}>
                    {isSponsored ? (
                      <span style={{ fontSize: 12, color: 'var(--text-dim)', fontStyle: 'italic' }}>Active</span>
                    ) : status === 'pending' ? (
                      <span style={{ fontSize: 12, color: '#f0a500' }}>Awaiting admin</span>
                    ) : status === 'rejected' ? (
                      <button className="btn btn-ghost btn-xs" disabled={requestingId === p.id}
                        onClick={() => handleRequest(p.id)}>
                        {requestingId === p.id ? '…' : 'Re-request'}
                      </button>
                    ) : (
                      <button className="btn btn-primary btn-xs" disabled={requestingId === p.id}
                        onClick={() => handleRequest(p.id)}>
                        {requestingId === p.id ? '…' : '📢 Request Sponsorship'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
