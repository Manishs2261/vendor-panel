import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import {
  fetchProducts, fetchCategories, deleteProduct, bulkDeleteProducts,
  bulkStatusUpdate, setFilter, setPage, selectId, selectAll, clearSelected, resetFilters,
} from './productSlice';
import DataTable, { Column } from '../../components/common/DataTable';
import { StatusBadge, Pagination, ConfirmDialog } from '../../components/common';
import type { Product } from '../../types';
import toast from 'react-hot-toast';

const ProductsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { items, loading, total, page, pages, selectedIds, filters, categories } = useAppSelector((s) => s.products);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [bulkAction, setBulkAction] = useState('');
  const [confirmBulk, setConfirmBulk] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const formatDateTime = (value?: string) => {
    if (!value) return 'Never';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Invalid date';
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  useEffect(() => {
    dispatch(fetchProducts());
    dispatch(fetchCategories());
  }, [dispatch, filters]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const result = await dispatch(deleteProduct(deleteTarget));
    setDeleting(false);
    if (deleteProduct.fulfilled.match(result)) {
      toast.success('Product deleted');
      setDeleteTarget(null);
    } else {
      toast.error('Delete failed');
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedIds.length === 0) return;
    if (bulkAction === 'delete') {
      const result = await dispatch(bulkDeleteProducts(selectedIds));
      if (bulkDeleteProducts.fulfilled.match(result)) toast.success(`${selectedIds.length} products deleted`);
    } else if (bulkAction === 'activate') {
      await dispatch(bulkStatusUpdate({ ids: selectedIds, status: 'ACTIVE' }));
      toast.success('Products activated');
    } else if (bulkAction === 'deactivate') {
      await dispatch(bulkStatusUpdate({ ids: selectedIds, status: 'INACTIVE' }));
      toast.success('Products deactivated');
    }
    setConfirmBulk(false);
    setBulkAction('');
    dispatch(clearSelected());
  };

  const columns: Column<Product>[] = [
    {
      key: 'name', label: 'Product',
      render: (_, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <div className="product-img product-img-placeholder" style={{ background: 'var(--surface3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {row.images[0] ? <img src={row.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span>No image</span>}
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="product-name">{row.name}</div>
          </div>
        </div>
      ),
    },
    { key: 'category_name', label: 'Category', render: (v) => <span style={{ color: 'var(--text-muted)' }}>{v}</span> },
    {
      key: 'price', label: 'Price',
      render: (v, row) => (
        <div>
          <div>INR {v?.toLocaleString()}</div>
          {row.discount_percentage > 0 && (
            <div style={{ fontSize: 11, color: 'var(--green)' }}>-{row.discount_percentage}% off</div>
          )}
        </div>
      ),
    },
    { key: 'stock', label: 'Stock', render: (v) => <span style={{ color: v < 5 ? 'var(--red)' : 'var(--text)' }}>{v}</span> },
    { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
    {
      key: 'updated_at', label: 'Last Updated',
      render: (v, row) => (
        <div style={{ color: 'var(--text-muted)', fontSize: 12.5, lineHeight: 1.35 }}>
          {formatDateTime(v || row.created_at)}
        </div>
      ),
    },
    { key: 'click_count', label: 'Clicks', render: (v) => <span style={{ color: 'var(--text-muted)' }}>{v ?? 0}</span> },
    { key: 'search_count', label: 'Searches', render: (v) => <span style={{ color: 'var(--text-muted)' }}>{v ?? 0}</span> },
    {
      key: 'id', label: 'Actions',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn btn-ghost btn-xs" onClick={(e) => { e.stopPropagation(); navigate(`/products/${row.id}/edit`); }}>Edit</button>
          <button className="btn btn-danger btn-xs" onClick={(e) => { e.stopPropagation(); setDeleteTarget(row.id); }}>Delete</button>
        </div>
      ),
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="section-header">
        <div>
          <div className="section-title">Product Catalog</div>
          <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>{total} total products</div>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/products/new')}>
          Add Product
        </button>
      </div>

      <div className="card">
        {/* Filters */}
        <div className="filters-bar" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="filter-search">
            <span style={{ color: 'var(--text-dim)', fontSize: 14 }}>Search</span>
            <input
              placeholder="Search name, brand, description, tags..."
              value={filters.search}
              onChange={(e) => dispatch(setFilter({ search: e.target.value }))}
            />
          </div>
          <select className="form-select" style={{ width: 140 }} value={filters.status} onChange={(e) => dispatch(setFilter({ status: e.target.value }))}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
          <select className="form-select" style={{ width: 160 }} value={filters.category_id} onChange={(e) => dispatch(setFilter({ category_id: e.target.value }))}>
            <option value="">All Categories</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select className="form-select" style={{ width: 160 }} value={filters.stock_filter} onChange={(e) => dispatch(setFilter({ stock_filter: e.target.value }))}>
            <option value="">All Stock</option>
            <option value="in_stock">In Stock</option>
            <option value="low_stock">Low Stock</option>
            <option value="out_of_stock">Out Of Stock</option>
            <option value="overstock">Overstock</option>
          </select>
          <select className="form-select" style={{ width: 170 }} value={filters.sort_by} onChange={(e) => dispatch(setFilter({ sort_by: e.target.value }))}>
            <option value="recent">Recently Updated</option>
            <option value="newest">Newest Created</option>
            <option value="oldest">Oldest Created</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="stock_asc">Stock: Low to High</option>
            <option value="stock_desc">Stock: High to Low</option>
            <option value="name_asc">Name: A to Z</option>
            <option value="name_desc">Name: Z to A</option>
          </select>
          <label className="btn btn-ghost btn-sm" style={{ gap: 8, display: 'inline-flex', alignItems: 'center' }}>
            <input
              type="checkbox"
              checked={filters.discount_only}
              onChange={(e) => dispatch(setFilter({ discount_only: e.target.checked }))}
            />
            Discount Only
          </label>
          <button className="btn btn-ghost btn-sm" onClick={() => dispatch(resetFilters())}>
            Clear Filters
          </button>
        </div>

        <div className="filters-bar" style={{ flexWrap: 'wrap', alignItems: 'center', paddingTop: 0 }}>
          <input
            className="form-input"
            style={{ width: 120 }}
            type="number"
            min="0"
            placeholder="Min Price"
            value={filters.min_price}
            onChange={(e) => dispatch(setFilter({ min_price: e.target.value }))}
          />
          <input
            className="form-input"
            style={{ width: 120 }}
            type="number"
            min="0"
            placeholder="Max Price"
            value={filters.max_price}
            onChange={(e) => dispatch(setFilter({ max_price: e.target.value }))}
          />
          <input
            className="form-input"
            style={{ width: 120 }}
            type="number"
            min="0"
            placeholder="Min Stock"
            value={filters.stock_min}
            onChange={(e) => dispatch(setFilter({ stock_min: e.target.value }))}
          />
          <input
            className="form-input"
            style={{ width: 120 }}
            type="number"
            min="0"
            placeholder="Max Stock"
            value={filters.stock_max}
            onChange={(e) => dispatch(setFilter({ stock_max: e.target.value }))}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Created</span>
            <input
              className="form-input"
              style={{ width: 150 }}
              type="date"
              value={filters.created_from}
              onChange={(e) => dispatch(setFilter({ created_from: e.target.value }))}
            />
            <input
              className="form-input"
              style={{ width: 150 }}
              type="date"
              value={filters.created_to}
              onChange={(e) => dispatch(setFilter({ created_to: e.target.value }))}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Updated</span>
            <input
              className="form-input"
              style={{ width: 150 }}
              type="date"
              value={filters.updated_from}
              onChange={(e) => dispatch(setFilter({ updated_from: e.target.value }))}
            />
            <input
              className="form-input"
              style={{ width: 150 }}
              type="date"
              value={filters.updated_to}
              onChange={(e) => dispatch(setFilter({ updated_to: e.target.value }))}
            />
          </div>
          {selectedIds.length > 0 && (
            <>
              <select className="form-select" style={{ width: 160 }} value={bulkAction} onChange={(e) => setBulkAction(e.target.value)}>
                <option value="">Bulk Actions</option>
                <option value="activate">Activate</option>
                <option value="deactivate">Deactivate</option>
                <option value="delete">Delete</option>
              </select>
              <button
                className="btn btn-warning btn-sm"
                onClick={() => { if (bulkAction) setConfirmBulk(true); }}
                disabled={!bulkAction}
              >
                Apply ({selectedIds.length})
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => dispatch(clearSelected())}>Clear</button>
            </>
          )}
        </div>

        {/* â”€â”€ Table â”€â”€ */}
        <DataTable<Product>
          columns={columns}
          data={items}
          loading={loading}
          rowKey="id"
          emptyText="No products found"
          emptyIcon="ðŸ“¦"
          selectedIds={selectedIds}
          onSelect={(id) => dispatch(selectId(id))}
          onSelectAll={() => dispatch(selectAll())}
          onRowClick={(row) => navigate(`/products/${row.id}/edit`)}
        />

        <Pagination page={page} pages={pages} total={total} limit={filters.limit} onChange={(p) => dispatch(setPage(p))} />
      </div>

      {/* â”€â”€ Delete Confirm â”€â”€ */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Product"
        message="This product will be soft-deleted and hidden from search results. You can restore it later."
        confirmLabel="Delete"
        danger
        loading={deleting}
      />

      {/* â”€â”€ Bulk Confirm â”€â”€ */}
      <ConfirmDialog
        open={confirmBulk}
        onClose={() => setConfirmBulk(false)}
        onConfirm={handleBulkAction}
        title={`Bulk ${bulkAction}`}
        message={`Apply "${bulkAction}" to ${selectedIds.length} selected products?`}
        confirmLabel="Confirm"
        danger={bulkAction === 'delete'}
      />
    </div>
  );
};

export default ProductsPage;


