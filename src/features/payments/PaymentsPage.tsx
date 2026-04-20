import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { fetchPayouts, fetchCommission } from './paymentSlice';
import { StatusBadge, Pagination } from '../../components/common';
import type { Payout } from '../../types';

const MOCK_PAYOUTS: Payout[] = [
  { id: '1', shop_id: 's1', amount: 12500, commission: 625, net_amount: 11875, status: 'COMPLETED', utr_number: 'UTR001234', created_at: '2025-01-15', processed_at: '2025-01-17' },
  { id: '2', shop_id: 's1', amount: 8200, commission: 410, net_amount: 7790, status: 'PROCESSING', created_at: '2025-02-01' },
  { id: '3', shop_id: 's1', amount: 15800, commission: 790, net_amount: 15010, status: 'PENDING', created_at: '2025-02-10' },
  { id: '4', shop_id: 's1', amount: 6400, commission: 320, net_amount: 6080, status: 'FAILED', created_at: '2024-12-20' },
];

export const PaymentsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const paymentsState = useAppSelector((s) => s.payments);
  const items = paymentsState?.items ?? [];
  const loading = paymentsState?.loading ?? false;
  const commission = paymentsState?.commission ?? null;
  const payouts = items.length > 0 ? items : MOCK_PAYOUTS;

  useEffect(() => {
    dispatch(fetchPayouts({}));
    dispatch(fetchCommission());
  }, [dispatch]);

  const commissionRate = commission?.rate ?? 5;
  const totalEarned = commission?.total_earned ?? 42900;
  const totalPaid = commission?.total_paid ?? 34700;
  const pending = commission?.pending_amount ?? 8200;

  return (
    <div>
      <div className="section-header">
        <div><div className="section-title">Payments & Payouts</div><div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>Commission and payout history via Razorpay</div></div>
      </div>

      {/* Commission Cards */}
      <div className="stats-grid">
        {[
          { label: 'Commission Rate', value: `${commissionRate}%`, icon: '💹', color: 'indigo' },
          { label: 'Total Earned', value: `₹${totalEarned.toLocaleString()}`, icon: '💰', color: 'green' },
          { label: 'Total Paid Out', value: `₹${totalPaid.toLocaleString()}`, icon: '✅', color: 'cyan' },
          { label: 'Pending Payout', value: `₹${pending.toLocaleString()}`, icon: '⏳', color: 'yellow' },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <div className="stat-card-top"><div className={`stat-icon ${s.color}`}>{s.icon}</div></div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Payout History</div>
          <button className="btn btn-primary btn-sm">Request Payout</button>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Payout ID</th>
                <th>Amount</th>
                <th>Commission ({commissionRate}%)</th>
                <th>Net Amount</th>
                <th>Status</th>
                <th>UTR Number</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {payouts.map((p) => (
                <tr key={p.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)' }}>#{p.id}</td>
                  <td>₹{p.amount.toLocaleString()}</td>
                  <td style={{ color: 'var(--red)' }}>-₹{p.commission.toLocaleString()}</td>
                  <td style={{ fontWeight: 600 }}>₹{p.net_amount.toLocaleString()}</td>
                  <td><StatusBadge status={p.status} /></td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.utr_number || '—'}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(p.created_at).toLocaleDateString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ─── Notifications Page ───────────────────────────────────────────────────────
import { fetchNotifications, markRead, markAllRead } from '../notifications/notificationSlice';
import type { Notification } from '../../types';

const MOCK_NOTIFS: Notification[] = [
  { id: '1', title: 'Product Approved', body: 'Your product "Classic Silk Saree" has been approved and is now live!', type: 'PRODUCT', is_read: false, created_at: new Date().toISOString() },
  { id: '2', title: 'Payout Processed', body: 'Your payout of ₹11,875 has been transferred to your account. UTR: UTR001234', type: 'PAYMENT', is_read: false, created_at: new Date(Date.now() - 3600000).toISOString() },
  { id: '3', title: 'New Feature Available', body: 'You can now add video to your product listings for better engagement.', type: 'SYSTEM', is_read: true, created_at: new Date(Date.now() - 86400000).toISOString() },
  { id: '4', title: 'Profile Incomplete', body: 'Complete your shop profile to rank higher in local search results.', type: 'SYSTEM', is_read: true, created_at: new Date(Date.now() - 2 * 86400000).toISOString() },
];

const NOTIF_ICONS: Record<string, string> = {
  ORDER: '🛒', PAYMENT: '💳', PRODUCT: '📦', SYSTEM: '🔔', PROMOTION: '🎉',
};

export const NotificationsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const notifState = useAppSelector((s) => s.notifications);
  const items = notifState?.items ?? [];
  const loading = notifState?.loading ?? false;
  const unreadCount = notifState?.unreadCount ?? 0;
  const notifs = items.length > 0 ? items : MOCK_NOTIFS;

  useEffect(() => { dispatch(fetchNotifications({})); }, [dispatch]);

  const handleMarkRead = (id: string) => dispatch(markRead(id));
  const handleMarkAllRead = () => dispatch(markAllRead());

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  return (
    <div>
      <div className="section-header">
        <div>
          <div className="section-title">Notifications</div>
          <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>
            {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
          </div>
        </div>
        {unreadCount > 0 && (
          <button className="btn btn-ghost btn-sm" onClick={handleMarkAllRead}>Mark all as read</button>
        )}
      </div>

      <div className="card">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {notifs.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">🔔</div>
              <div className="empty-text">No notifications yet</div>
            </div>
          )}
          {notifs.map((n) => (
            <div
              key={n.id}
              onClick={() => !n.is_read && handleMarkRead(n.id)}
              style={{
                display: 'flex', gap: 14, padding: '14px 16px', borderRadius: 'var(--radius-sm)',
                background: n.is_read ? 'transparent' : 'var(--accent-glow)',
                cursor: n.is_read ? 'default' : 'pointer',
                border: '1px solid', borderColor: n.is_read ? 'transparent' : 'rgba(99,102,241,0.15)',
                transition: 'background 0.15s',
              }}
            >
              <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-sm)', background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                {NOTIF_ICONS[n.type] || '🔔'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ fontWeight: n.is_read ? 400 : 600, fontSize: 14, color: 'var(--text)' }}>{n.title}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>{timeAgo(n.created_at)}</div>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3, lineHeight: 1.5 }}>{n.body}</div>
                <div style={{ marginTop: 6, display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 10.5, background: 'var(--surface3)', padding: '2px 8px', borderRadius: 99, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{n.type}</span>
                  {!n.is_read && <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block' }} />}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
