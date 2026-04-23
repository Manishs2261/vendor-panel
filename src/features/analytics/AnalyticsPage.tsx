import React, { useEffect } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { fetchAnalytics, setPeriod } from './analyticsSlice';

const CITY_COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#f97316'];

const PERIODS = [
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' },
  { value: '1y', label: '1 Year' },
] as const;

const EMPTY_ANALYTICS = {
  total_views: 0,
  total_clicks: 0,
  total_searches: 0,
  revenue_estimate: 0,
  growth_rate: 0,
  views_by_day: [],
  clicks_by_day: [],
  top_products: [],
  top_cities: [],
};

const AnalyticsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { data, period } = useAppSelector((s) => s.analytics);
  const analytics = data || EMPTY_ANALYTICS;

  useEffect(() => {
    dispatch(fetchAnalytics(period));
  }, [dispatch, period]);

  const tooltipStyle = {
    background: 'var(--surface2)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    fontFamily: 'var(--body)',
    fontSize: 12,
  };

  const areaData = analytics.views_by_day.map((point, index) => ({
    ...point,
    orders: analytics.clicks_by_day[index]?.value || 0,
  }));

  return (
    <div>
      <div className="section-header">
        <div>
          <div className="section-title">Shop Analytics</div>
          <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>
            Real product, order, and revenue insights from your current store data
          </div>
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

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        {[
          { label: 'Total Views', value: analytics.total_views.toLocaleString(), icon: 'V', color: 'cyan', trend: `${analytics.top_products.length} top products` },
          { label: 'Total Orders', value: analytics.total_clicks.toLocaleString(), icon: 'O', color: 'indigo', trend: 'Orders in selected period' },
          { label: 'Revenue', value: `Rs ${Number(analytics.revenue_estimate || 0).toLocaleString()}`, icon: 'R', color: 'green', trend: 'Paid order revenue' },
          { label: 'Activity Growth', value: `${analytics.growth_rate}%`, icon: 'G', color: 'purple', trend: 'vs previous period' },
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

      <div className="card mb-20">
        <div className="card-header">
          <div>
            <div className="card-title">Product View Trend</div>
            <div className="card-sub">Recent product activity for the selected period</div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={areaData}>
            <defs>
              <linearGradient id="vGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="oGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--accent2)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--accent2)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip contentStyle={tooltipStyle} />
            <Area type="monotone" dataKey="value" name="Views" stroke="var(--accent)" fill="url(#vGrad)" strokeWidth={2} />
            <Area type="monotone" dataKey="orders" name="Orders" stroke="var(--accent2)" fill="url(#oGrad)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid-2 mb-20">
        <div className="card">
          <div className="card-header">
            <div className="card-title">Top Products</div>
            <div className="card-sub">By current view count</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {analytics.top_products.length === 0 && (
              <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No product analytics available yet.</div>
            )}
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
                      <span>V {p.views}</span>
                      <span>O {p.clicks}</span>
                      <span>S {p.searches}</span>
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

        <div className="card">
          <div className="card-header">
            <div className="card-title">Customer Geography</div>
            <div className="card-sub">Available when location tracking data exists</div>
          </div>
          {analytics.top_cities.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={analytics.top_cities} dataKey="count" nameKey="city" cx="50%" cy="50%" outerRadius={80} stroke="none">
                    {analytics.top_cities.map((_, i) => (
                      <Cell key={i} fill={CITY_COLORS[i % CITY_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [v.toLocaleString(), 'Events']} />
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
            </>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: 13, minHeight: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              No city-level analytics available yet.
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Recent Product Views</div>
          <div className="card-sub">Current period view values by product activity date</div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={analytics.views_by_day} barSize={32}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip contentStyle={tooltipStyle} />
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
