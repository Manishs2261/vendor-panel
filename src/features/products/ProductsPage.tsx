import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import {
  fetchProducts, fetchCategories, deleteProduct, bulkDeleteProducts,
  bulkStatusUpdate, setFilter, setPage, selectId, selectAll, clearSelected,
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="product-img" style={{ background: 'var(--surface3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
            {row.images[0] ? <img src={row.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '📦'}
          </div>
          <div>
            <div className="product-name">{row.name}</div>
            <div className="product-sku">SKU: {row.sku}</div>
          </div>
        </div>
      ),
    },
    { key: 'category_name', label: 'Category', render: (v) => <span style={{ color: 'var(--text-muted)' }}>{v}</span> },
    {
      key: 'price', label: 'Price',
      render: (v, row) => (
        <div>
          <div>₹{v?.toLocaleString()}</div>
          {row.discount_percentage > 0 && (
            <div style={{ fontSize: 11, color: 'var(--green)' }}>-{row.discount_percentage}% off</div>
          )}
        </div>
      ),
    },
    { key: 'stock', label: 'Stock', render: (v) => <span style={{ color: v < 5 ? 'var(--red)' : 'var(--text)' }}>{v}</span> },
    { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
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
      {/* ── Header ── */}
      <div className="section-header">
        <div>
          <div className="section-title">Product Catalog</div>
          <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>{total} total products</div>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/products/new')}>
          ＋ Add Product
        </button>
      </div>

      <div className="card">
        {/* ── Filters ── */}
        <div className="filters-bar">
          <div className="filter-search">
            <span style={{ color: 'var(--text-dim)', fontSize: 14 }}>🔍</span>
            <input
              placeholder="Search products..."
              value={filters.search}
              onChange={(e) => dispatch(setFilter({ search: e.target.value }))}
            />
          </div>
          <select className="form-select" style={{ width: 140 }} value={filters.status} onChange={(e) => dispatch(setFilter({ status: e.target.value }))}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <select className="form-select" style={{ width: 160 }} value={filters.category_id} onChange={(e) => dispatch(setFilter({ category_id: e.target.value }))}>
            <option value="">All Categories</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
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

        {/* ── Table ── */}
        <DataTable<Product>
          columns={columns}
          data={items}
          loading={loading}
          rowKey="id"
          emptyText="No products found"
          emptyIcon="📦"
          selectedIds={selectedIds}
          onSelect={(id) => dispatch(selectId(id))}
          onSelectAll={() => dispatch(selectAll())}
          onRowClick={(row) => navigate(`/products/${row.id}/edit`)}
        />

        <Pagination page={page} pages={pages} total={total} limit={filters.limit} onChange={(p) => dispatch(setPage(p))} />
      </div>

      {/* ── Delete Confirm ── */}
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

      {/* ── Bulk Confirm ── */}
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
