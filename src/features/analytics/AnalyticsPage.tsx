import React, { useEffect } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { fetchAnalytics, setPeriod } from './analyticsSlice';

const MOCK_ANALYTICS = {
  total_views: 24850, total_clicks: 8420, total_searches: 3180, revenue_estimate: 0, growth_rate: 18.3,
  views_by_day: [
    { date: 'Jan', value: 1200 }, { date: 'Feb', value: 1800 }, { date: 'Mar', value: 1400 },
    { date: 'Apr', value: 2200 }, { date: 'May', value: 2800 }, { date: 'Jun', value: 3100 },
    { date: 'Jul', value: 3400 },
  ],
  clicks_by_day: [
    { date: 'Jan', value: 420 }, { date: 'Feb', value: 680 }, { date: 'Mar', value: 540 },
    { date: 'Apr', value: 820 }, { date: 'May', value: 960 }, { date: 'Jun', value: 1100 },
    { date: 'Jul', value: 1240 },
  ],
  top_products: [
    { product_id: '1', name: 'Classic Silk Saree', views: 1842, clicks: 320, searches: 98 },
    { product_id: '2', name: 'Cotton Kurta Set', views: 1210, clicks: 245, searches: 67 },
    { product_id: '3', name: 'Gold Bangles', views: 980, clicks: 180, searches: 54 },
    { product_id: '4', name: 'Embroidered Dupatta', views: 820, clicks: 142, searches: 43 },
    { product_id: '5', name: 'Silk Lehenga', views: 740, clicks: 130, searches: 38 },
  ],
  top_cities: [
    { city: 'Bilaspur', count: 4200, percentage: 38 },
    { city: 'Raipur', count: 2800, percentage: 25 },
    { city: 'Bhilai', count: 1950, percentage: 18 },
    { city: 'Korba', count: 1100, percentage: 10 },
    { city: 'Others', count: 990, percentage: 9 },
  ],
};

const CITY_COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#f97316'];

const PERIODS = [
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' },
  { value: '1y', label: '1 Year' },
] as const;

const AnalyticsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { data, loading, period } = useAppSelector((s) => s.analytics);
  const analytics = data || MOCK_ANALYTICS;

  useEffect(() => { dispatch(fetchAnalytics(period)); }, [dispatch, period]);

  const TooltipStyle = { background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, fontFamily: 'var(--body)', fontSize: 12 };

  return (
    <div>
      <div className="section-header">
        <div>
          <div className="section-title">Shop Analytics</div>
          <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>Track your performance and growth</div>
        </div>
        <div style={{ display: 'flex', gap: 4, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: 4 }}>
          {PERIODS.map((p) => (
            <button
              key={p.value}
              className={`btn btn-sm ${period === p.value ? 'btn-primary' : 'btn-ghost'}`}
              style={{ border: 'none' }}
              onClick={() => dispatch(setPeriod(p.value))}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        {[
          { label: 'Total Views', value: analytics.total_views.toLocaleString(), icon: '👁', color: 'cyan', trend: `+${analytics.growth_rate}%` },
          { label: 'Total Clicks', value: analytics.total_clicks.toLocaleString(), icon: '👆', color: 'indigo', trend: `${((analytics.total_clicks / analytics.total_views) * 100).toFixed(1)}% CTR` },
          { label: 'Search Hits', value: analytics.total_searches.toLocaleString(), icon: '🔍', color: 'green', trend: '+12.4%' },
          { label: 'Growth Rate', value: `${analytics.growth_rate}%`, icon: '📈', color: 'purple', trend: 'vs prev period' },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <div className="stat-card-top">
              <div className={`stat-icon ${s.color}`}>{s.icon}</div>
              <span className="stat-trend up">{s.trend}</span>
            </div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Views Chart ── */}
      <div className="card mb-20">
        <div className="card-header">
          <div><div className="card-title">Views & Clicks Trend</div><div className="card-sub">How many people discovered your products</div></div>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={analytics.views_by_day.map((d, i) => ({ ...d, clicks: analytics.clicks_by_day[i]?.value || 0 }))}>
            <defs>
              <linearGradient id="vGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="cGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--accent2)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--accent2)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip contentStyle={TooltipStyle} />
            <Area type="monotone" dataKey="value" name="Views" stroke="var(--accent)" fill="url(#vGrad)" strokeWidth={2} />
            <Area type="monotone" dataKey="clicks" name="Clicks" stroke="var(--accent2)" fill="url(#cGrad)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid-2 mb-20">
        {/* ── Top Products ── */}
        <div className="card">
          <div className="card-header"><div className="card-title">Top Products</div><div className="card-sub">By view count</div></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {analytics.top_products.map((p, i) => {
              const max = analytics.top_products[0]?.views || 1;
              const pct = (p.views / max) * 100;
              return (
                <div key={p.product_id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: 'var(--text-dim)', fontSize: 11, fontWeight: 700, width: 16 }}>#{i + 1}</span>
                      <span style={{ fontSize: 13.5 }}>{p.name}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--text-muted)' }}>
                      <span>👁 {p.views}</span>
                      <span>👆 {p.clicks}</span>
                      <span>🔍 {p.searches}</span>
                    </div>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${pct}%`, background: CITY_COLORS[i % CITY_COLORS.length] }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Top Cities ── */}
        <div className="card">
          <div className="card-header"><div className="card-title">Top Cities</div><div className="card-sub">Where your customers are</div></div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={analytics.top_cities} dataKey="count" nameKey="city" cx="50%" cy="50%" outerRadius={80} stroke="none">
                {analytics.top_cities.map((_, i) => (
                  <Cell key={i} fill={CITY_COLORS[i % CITY_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={TooltipStyle} formatter={(v: number) => [v.toLocaleString(), 'Searches']} />
              <Legend formatter={(v) => <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
            {analytics.top_cities.map((c, i) => (
              <div key={c.city} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: CITY_COLORS[i], flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 13 }}>{c.city}</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.count.toLocaleString()}</span>
                <span style={{ fontSize: 11, color: 'var(--text-dim)', width: 35, textAlign: 'right' }}>{c.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Growth Bar Chart ── */}
      <div className="card">
        <div className="card-header"><div className="card-title">Monthly Growth</div><div className="card-sub">Month-over-month view comparison</div></div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={analytics.views_by_day} barSize={32}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip contentStyle={TooltipStyle} />
            <Bar dataKey="value" name="Views" radius={[6, 6, 0, 0]}>
              {analytics.views_by_day.map((_, i) => (
                <Cell key={i} fill={i === analytics.views_by_day.length - 1 ? 'var(--accent)' : 'var(--surface3)'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AnalyticsPage;
