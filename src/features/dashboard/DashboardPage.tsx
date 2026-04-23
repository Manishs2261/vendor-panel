import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { fetchDashboard } from './dashboardSlice';
import { StatusBadge } from '../../components/common';
import { vendorApi, shopApi, type VendorProfileResponse } from '../../api/services';

const DashboardPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { data } = useAppSelector((s) => s.dashboard);
  const vendor = useAppSelector((s) => s.auth.vendor);
  const [vendorProfile, setVendorProfile] = useState<VendorProfileResponse | null>(null);
  const [shop, setShop] = useState<any>(null);
  const stats = data || {
    total_products: 0,
    active_products: 0,
    inactive_products: 0,
    total_views: 0,
    total_orders: 0,
    pending_orders: 0,
    revenue: 0,
    completion_score: 0,
    recent_products: [],
  };
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
    { label: '5+ products added', done: stats.total_products >= 5 },
  ], [vendorProfile, shop, stats.total_products, vendor]);
  
  // Calculate score based on completion steps to match frontend calculation
  const score = Math.round((completionSteps.filter(step => step.done).length / completionSteps.length) * 100);
  const chartData = useMemo(
    () => (stats.recent_products || []).slice().reverse().map((p: any) => ({
      day: p.name.length > 10 ? `${p.name.slice(0, 10)}...` : p.name,
      views: p.click_count ?? 0,
    })),
    [stats.recent_products]
  );

  useEffect(() => {
    dispatch(fetchDashboard());
  }, [dispatch]);

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      try {
        const [profileResponse, shopResponse] = await Promise.all([
          vendorApi.me(),
          shopApi.getMyShop().catch(() => null) // Don't fail if shop doesn't exist
        ]);
        
        if (mounted) {
          setVendorProfile(profileResponse.data);
          setShop(shopResponse?.data || null);
        }
      } catch (err) {
        if (mounted) {
          setVendorProfile(null);
          setShop(null);
        }
      }
    };
    
    fetchData();
    
    return () => {
      mounted = false;
    };
  }, []);

  const circumference = 2 * Math.PI * 30;
  const dashOffset = circumference - (score / 100) * circumference;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--display)', fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>
          Good morning, {vendor?.name?.split(' ')[0] || 'Vendor'}
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
          Here&apos;s what&apos;s happening with your shop today.
        </p>
      </div>

      {vendorProfile && vendorProfile.status !== 'approved' && (
        <div className="approval-banner">
          <div>
            <div className="approval-banner-title">Vendor Approval Pending</div>
            <div className="approval-banner-text">
              You can continue adding and updating shop details. Admin approval is still pending, so approval-based actions may stay limited until your account is approved.
            </div>
          </div>
          <span className={`badge ${vendorProfile.status}`}>{vendorProfile.status}</span>
        </div>
      )}

      <div className="completion-card">
        <div className="completion-ring">
          <svg width="72" height="72" viewBox="0 0 72 72">
            <defs>
              <linearGradient id="grad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="var(--accent)" />
                <stop offset="100%" stopColor="var(--accent2)" />
              </linearGradient>
            </defs>
            <circle className="completion-ring-bg" cx="36" cy="36" r="30" />
            <circle
              className="completion-ring-fill"
              cx="36"
              cy="36"
              r="30"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
            />
          </svg>
          <div className="completion-pct">{score}%</div>
        </div>
        <div className="completion-info">
          <div className="completion-title">Shop Profile {score < 100 ? 'Incomplete' : 'Complete'}</div>
          <div className="completion-desc">Complete your profile to rank higher in search results</div>
          <div className="completion-steps">
            {completionSteps.map((step) => (
              <div key={step.label} className={`completion-step ${step.done ? 'done' : 'todo'}`}>
                <span>{step.done ? 'OK' : 'O'}</span>
                <span>{step.label}</span>
              </div>
            ))}
          </div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => navigate('/shop')}>
          Complete Profile
        </button>
      </div>

      <div className="stats-grid">
        {[
          { label: 'Total Products', value: stats.total_products, icon: 'P', color: 'indigo', trend: `${stats.recent_products.length} recent items`, up: true },
          { label: 'Active Products', value: stats.active_products, icon: 'A', color: 'green', trend: `${stats.total_products ? Math.round((stats.active_products / stats.total_products) * 100) : 0}% of total`, up: true },
          { label: 'Need Attention', value: stats.inactive_products, icon: 'I', color: 'yellow', trend: 'Inactive, pending, or rejected', up: false },
          { label: 'Total Views', value: stats.total_views.toLocaleString(), icon: 'V', color: 'cyan', trend: `${stats.pending_orders} pending orders`, up: true },
          { label: 'Revenue', value: `Rs ${Number(stats.revenue || 0).toLocaleString()}`, icon: 'R', color: 'purple', trend: `${stats.total_orders} total orders`, up: true },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <div className="stat-card-top">
              <div className={`stat-icon ${s.color}`}>{s.icon}</div>
              <span className={`stat-trend ${s.up ? 'up' : 'down'}`}>{s.trend}</span>
            </div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid-2-1">
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Recent Product Views</div>
              <div className="card-sub">Latest products and their current click counts</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="viewGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8 }} />
              <Area type="monotone" dataKey="views" stroke="var(--accent)" fill="url(#viewGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">Quick Actions</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { icon: '+', label: 'Add New Product', to: '/products/new' },
              { icon: 'A', label: 'View Analytics', to: '/analytics' },
              { icon: 'S', label: 'Edit Shop Profile', to: '/shop' },
              { icon: '🌐', label: 'View Public Storefront', to: `/vendor/${vendor?.id}` },
              { icon: 'M', label: 'Check Payments', to: '/payments' },
            ].map((action) => (
              <button
                key={action.label}
                className="btn btn-ghost"
                style={{ justifyContent: 'flex-start', gap: 10 }}
                onClick={() => navigate(action.to)}
              >
                <span style={{ fontSize: 18 }}>{action.icon}</span>
                {action.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-header">
          <div className="card-title">Recent Products</div>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/products')}>
            View All
          </button>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Status</th>
                <th>Clicks</th>
              </tr>
            </thead>
            <tbody>
              {stats.recent_products.map((p: any) => (
                <tr key={p.id} onClick={() => navigate(`/products/${p.id}/edit`)} style={{ cursor: 'pointer' }}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="product-img" style={{ background: 'var(--surface3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                        {p.images?.[0] ? <img src={p.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : 'P'}
                      </div>
                      <span className="product-name">{p.name}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>{p.category_name}</td>
                  <td>Rs {Number(p.price || 0).toLocaleString()}</td>
                  <td><StatusBadge status={p.status} /></td>
                  <td>{p.click_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
