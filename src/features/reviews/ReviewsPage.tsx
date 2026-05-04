import React, { useEffect } from 'react';
import { Star } from 'lucide-react';
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
        size={13}
        strokeWidth={1.5}
        style={{ color: n <= value ? 'var(--yellow, #f59e0b)' : 'var(--border)', fill: n <= value ? 'var(--yellow, #f59e0b)' : 'none' }}
      />
    ))}
    <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 4 }}>{value.toFixed(1)}</span>
  </div>
);

const RatingBar: React.FC<{ star: number; count: number; total: number }> = ({ star, count, total }) => {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
      <span style={{ color: 'var(--text-muted)', width: 14, textAlign: 'right' }}>{star}</span>
      <Star size={11} strokeWidth={1.5} style={{ color: 'var(--yellow, #f59e0b)', fill: 'var(--yellow, #f59e0b)', flexShrink: 0 }} />
      <div style={{ flex: 1, height: 6, background: 'var(--surface3)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: 'var(--yellow, #f59e0b)', borderRadius: 99, transition: 'width 0.4s' }} />
      </div>
      <span style={{ color: 'var(--text-muted)', width: 28, textAlign: 'right' }}>{count}</span>
    </div>
  );
};

const ReviewsPage: React.FC = () => {
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
    dispatch(fetchReviews());
  }, [dispatch, filters, page]);

  const columns: Column<Review>[] = [
    {
      key: 'product_name',
      label: 'Product',
      render: (_, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <div style={{ width: 38, height: 38, borderRadius: 8, background: 'var(--surface3)', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {row.product_image
              ? <img src={row.product_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>No img</span>}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 500, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 200 }}>
              {row.product_name}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{row.product_id.slice(0, 8)}…</div>
          </div>
        </div>
      ),
    },
    {
      key: 'reviewer_name',
      label: 'Reviewer',
      render: (v) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--surface3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', flexShrink: 0 }}>
            {String(v).charAt(0).toUpperCase()}
          </div>
          <span style={{ fontSize: 13 }}>{v}</span>
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
      label: 'Review',
      render: (v) => v
        ? <span style={{ fontSize: 13, color: 'var(--text)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', maxWidth: 320 }}>{v}</span>
        : <span style={{ color: 'var(--text-dim)', fontSize: 12, fontStyle: 'italic' }}>No comment</span>,
    },
    {
      key: 'created_at',
      label: 'Date',
      render: (v) => <span style={{ color: 'var(--text-muted)', fontSize: 12.5 }}>{formatDate(v)}</span>,
    },
  ];

  const avgRating = stats?.average_rating ?? 0;
  const totalReviews = stats?.total_reviews ?? 0;
  const breakdown = stats?.breakdown ?? {};

  return (
    <div>
      {/* Header */}
      <div className="section-header">
        <div>
          <div className="section-title">Product Reviews</div>
          <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>{total} total reviews</div>
        </div>
      </div>

      {/* Stats cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 16, marginBottom: 20 }}>
        {/* Average score card */}
        <div className="card" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <div style={{ fontSize: 48, fontWeight: 700, lineHeight: 1, color: 'var(--text)' }}>
            {avgRating > 0 ? avgRating.toFixed(1) : '—'}
          </div>
          <StarRating value={Math.round(avgRating)} />
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{totalReviews} reviews</div>
        </div>

        {/* Breakdown bars */}
        <div className="card" style={{ padding: '18px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 8 }}>
          {[5, 4, 3, 2, 1].map((star) => (
            <RatingBar key={star} star={star} count={breakdown[String(star)] ?? 0} total={totalReviews} />
          ))}
        </div>
      </div>

      {/* Filters + table */}
      <div className="card">
        <div className="filters-bar" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="filter-search">
            <span style={{ color: 'var(--text-dim)', fontSize: 14 }}>Search</span>
            <input
              placeholder="Search product name or reviewer..."
              value={filters.search}
              onChange={(e) => dispatch(setFilter({ search: e.target.value }))}
            />
          </div>

          <select
            className="form-select"
            style={{ width: 140 }}
            value={filters.rating}
            onChange={(e) => dispatch(setFilter({ rating: e.target.value }))}
          >
            <option value="">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>

          <button className="btn btn-ghost btn-sm" onClick={() => dispatch(resetFilters())}>
            Clear Filters
          </button>
        </div>

        <DataTable<Review>
          columns={columns}
          data={items}
          loading={loading}
          rowKey="id"
          emptyText="No reviews yet"
          emptyIcon="⭐"
        />

        <Pagination page={page} pages={pages} total={total} limit={filters.limit} onChange={(p) => dispatch(setPage(p))} />
      </div>
    </div>
  );
};

export default ReviewsPage;
