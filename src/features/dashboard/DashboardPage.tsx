import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { fetchDashboard } from './dashboardSlice';
import { StatusBadge } from '../../components/common';

// Mock data for charts
const CHART_DATA = [
  { day: 'Mon', views: 120 }, { day: 'Tue', views: 210 }, { day: 'Wed', views: 180 },
  { day: 'Thu', views: 340 }, { day: 'Fri', views: 290 }, { day: 'Sat', views: 420 },
  { day: 'Sun', views: 380 },
];

const MOCK = {
  total_products: 48, active_products: 42, inactive_products: 6,
  total_views: 8420, growth_rate: 12.4, completion_score: 78,
  recent_products: [
    { id: '1', name: 'Classic Silk Saree', category_name: 'Clothing', price: 2499, status: 'ACTIVE', click_count: 142, images: [] },
    { id: '2', name: 'Cotton Kurta Set', category_name: 'Clothing', price: 899, status: 'ACTIVE', click_count: 98, images: [] },
    { id: '3', name: 'Gold Bangles', category_name: 'Jewellery', price: 5999, status: 'PENDING', click_count: 67, images: [] },
    { id: '4', name: 'Embroidered Dupatta', category_name: 'Accessories', price: 349, status: 'INACTIVE', click_count: 23, images: [] },
  ],
};

const COMPLETION_STEPS = [
  { label: 'Shop created', done: true },
  { label: 'Logo uploaded', done: true },
  { label: 'Banner added', done: true },
  { label: 'GST verified', done: false },
  { label: '5+ products', done: true },
  { label: 'Phone verified', done: false },
];

const DashboardPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { data, loading } = useAppSelector((s) => s.dashboard);
  const vendor = useAppSelector((s) => s.auth.vendor);
  const stats = data || MOCK;
  const score = stats.completion_score;

  useEffect(() => { dispatch(fetchDashboard()); }, [dispatch]);

  const circumference = 2 * Math.PI * 30;
  const dashOffset = circumference - (score / 100) * circumference;

  return (
    <div>
      {/* ── Welcome ── */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--display)', fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>
          Good morning, {vendor?.name?.split(' ')[0] || 'Vendor'} 👋
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
          Here's what's happening with your shop today.
        </p>
      </div>

      {/* ── Completion Card ── */}
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
              cx="36" cy="36" r="30"
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
            {COMPLETION_STEPS.map((step) => (
              <div key={step.label} className={`completion-step ${step.done ? 'done' : 'todo'}`}>
                <span>{step.done ? '✓' : '○'}</span>
                <span>{step.label}</span>
              </div>
            ))}
          </div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => navigate('/shop')}>
          Complete Profile
        </button>
      </div>

      {/* ── Stats ── */}
      <div className="stats-grid">
        {[
          { label: 'Total Products', value: stats.total_products, icon: '📦', color: 'indigo', trend: '+3 this week', up: true },
          { label: 'Active Products', value: stats.active_products, icon: '✅', color: 'green', trend: '87.5% of total', up: true },
          { label: 'Inactive', value: stats.inactive_products, icon: '⏸', color: 'yellow', trend: 'Need attention', up: false },
          { label: 'Total Views', value: stats.total_views.toLocaleString(), icon: '👁', color: 'cyan', trend: `+${stats.growth_rate}%`, up: true },
          { label: 'Growth Rate', value: `${stats.growth_rate}%`, icon: '📈', color: 'purple', trend: 'vs last month', up: true },
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

      {/* ── Chart + Recent Products ── */}
      <div className="grid-2-1">
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Views This Week</div>
              <div className="card-sub">Daily product views trend</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={CHART_DATA}>
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
              { icon: '➕', label: 'Add New Product', to: '/products/new', color: 'var(--accent)' },
              { icon: '📊', label: 'View Analytics', to: '/analytics', color: 'var(--accent2)' },
              { icon: '🏪', label: 'Edit Shop Profile', to: '/shop', color: 'var(--green)' },
              { icon: '💳', label: 'Check Payments', to: '/payments', color: 'var(--yellow)' },
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

      {/* ── Recent Products ── */}
      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-header">
          <div className="card-title">Recent Products</div>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/products')}>
            View All →
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
              {MOCK.recent_products.map((p) => (
                <tr key={p.id} onClick={() => navigate(`/products/${p.id}/edit`)} style={{ cursor: 'pointer' }}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="product-img" style={{ background: 'var(--surface3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>📦</div>
                      <span className="product-name">{p.name}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>{p.category_name}</td>
                  <td>₹{p.price.toLocaleString()}</td>
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
