import React, { useEffect } from 'react';
import { Star, MessageSquare, TrendingUp, Users } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { fetchReviews, fetchReviewStats, setFilter, setPage, resetFilters } from './reviewSlice';
import DataTable, { Column } from '../../components/common/DataTable';
import { Pagination } from '../../components/common';
import type { Review } from '../../types';

const StarRating: React.FC<{ value: number }> = ({ value }) => (
  <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
    {[1, 2, 3, 4, 5].map((n) => (
      <Star
        key={n}
        size={14}
        strokeWidth={1.5}
        style={{ color: n <= value ? 'var(--yellow)' : 'var(--border)', fill: n <= value ? 'var(--yellow)' : 'none' }}
      />
    ))}
  </div>
);

const RatingBar: React.FC<{ star: number; count: number; total: number }> = ({ star, count, total }) => {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13 }}>
      <span style={{ color: 'var(--text-muted)', width: 14, textAlign: 'right', fontWeight: 500 }}>{star}</span>
      <Star size={12} strokeWidth={1.5} style={{ color: 'var(--yellow)', fill: 'var(--yellow)', flexShrink: 0 }} />
      <div style={{ flex: 1, height: 8, background: 'var(--surface3)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: 'var(--yellow)', borderRadius: 99, transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)' }} />
      </div>
      <span style={{ color: 'var(--text-muted)', width: 32, textAlign: 'right' }}>{count}</span>
      <span style={{ color: 'var(--text-dim)', width: 40, fontSize: 11 }}>{pct}%</span>
    </div>
  );
};

const ShopReviewsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { items, stats, loading, total, page, pages, filters } = useAppSelector((s) => s.reviews);

  const formatDate = (value?: string) => {
    if (!value) return '—';
    return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value));
  };

  useEffect(() => {
    dispatch(fetchReviewStats());
  }, [dispatch]);

  useEffect(() => {
    // For Shop Reviews, we fetch all reviews (no specific product_id)
    dispatch(setFilter({ product_id: '' }));
    dispatch(fetchReviews());
  }, [dispatch, filters.search, filters.rating, page]);

  const columns: Column<Review>[] = [
    {
      key: 'reviewer_name',
      label: 'Customer',
      render: (v) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="vendor-avatar" style={{ width: 32, height: 32, fontSize: 13 }}>
            {String(v).charAt(0).toUpperCase()}
          </div>
          <span style={{ fontWeight: 500 }}>{v}</span>
        </div>
      ),
    },
    {
      key: 'rating',
      label: 'Rating',
      render: (v) => <StarRating value={v} />,
    },
    {
      key: 'comment',
      label: 'Feedback',
      render: (v, row) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {v ? (
            <span style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5 }}>{v}</span>
          ) : (
            <span style={{ color: 'var(--text-dim)', fontSize: 12, fontStyle: 'italic' }}>Rating only · no comment</span>
          )}
          <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 500 }}>
            on {row.product_name}
          </div>
        </div>
      ),
    },
    {
      key: 'created_at',
      label: 'Date',
      render: (v) => <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{formatDate(v)}</span>,
    },
  ];

  const avgRating = stats?.average_rating ?? 0;
  const totalReviews = stats?.total_reviews ?? 0;
  const breakdown = stats?.breakdown ?? {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-icon yellow">
              <Star size={20} />
            </div>
            <div className="stat-trend up">Overall</div>
          </div>
          <div className="stat-value">{avgRating > 0 ? avgRating.toFixed(1) : '—'}</div>
          <div className="stat-label">Shop Rating</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-icon indigo">
              <MessageSquare size={20} />
            </div>
          </div>
          <div className="stat-value">{totalReviews}</div>
          <div className="stat-label">Total Feedbacks</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-icon green">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="stat-value">{breakdown['5'] || 0}</div>
          <div className="stat-label">5-Star Reviews</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-icon purple">
              <Users size={20} />
            </div>
          </div>
          <div className="stat-value">{items.length}</div>
          <div className="stat-label">Active Reviewers</div>
        </div>
      </div>

      <div className="grid-2-1">
        {/* Main Reviews Table */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Recent Feedback</div>
            <div className="filter-search" style={{ width: 240, margin: 0 }}>
              <input
                placeholder="Filter by customer or product..."
                value={filters.search}
                onChange={(e) => dispatch(setFilter({ search: e.target.value }))}
              />
            </div>
          </div>

          <DataTable<Review>
            columns={columns}
            data={items}
            loading={loading}
            rowKey="id"
            emptyText="No shop reviews found"
            emptyIcon="⭐"
          />

          <Pagination
            page={page}
            pages={pages}
            total={total}
            limit={filters.limit}
            onChange={(p) => dispatch(setPage(p))}
          />
        </div>

        {/* Rating Breakdown Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card">
            <div className="card-header">
              <div className="card-title">Rating Breakdown</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[5, 4, 3, 2, 1].map((star) => (
                <RatingBar
                  key={star}
                  star={star}
                  count={breakdown[String(star)] ?? 0}
                  total={totalReviews}
                />
              ))}
            </div>
          </div>

          <div className="card" style={{ background: 'var(--accent-glow)', borderColor: 'var(--accent-light)', borderStyle: 'dashed' }}>
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>💡</div>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Improve your score</div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Responding to negative reviews promptly can increase your shop's trust score by up to 20%.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopReviewsPage;
