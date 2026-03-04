import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAppSelector } from '../../hooks/redux';

// ─── Protected Route ─────────────────────────────────────────────────────────
export const ProtectedRoute: React.FC = () => {
  const { vendor } = useAppSelector((s) => s.auth);
  const token = localStorage.getItem('access_token');
  if (!token && !vendor) return <Navigate to="/login" replace />;
  return <Outlet />;
};

// ─── Status Badge ─────────────────────────────────────────────────────────────
interface BadgeProps { status: string; }
export const StatusBadge: React.FC<BadgeProps> = ({ status }) => (
  <span className={`badge ${status.toLowerCase()}`}>
    {status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}
  </span>
);

// ─── Pagination ────────────────────────────────────────────────────────────────
interface PaginationProps {
  page: number; pages: number; total: number; limit: number;
  onChange: (page: number) => void;
}
export const Pagination: React.FC<PaginationProps> = ({ page, pages, total, limit, onChange }) => {
  const from = Math.min((page - 1) * limit + 1, total);
  const to = Math.min(page * limit, total);

  const getPageNums = () => {
    if (pages <= 5) return Array.from({ length: pages }, (_, i) => i + 1);
    if (page <= 3) return [1, 2, 3, 4, 5];
    if (page >= pages - 2) return [pages - 4, pages - 3, pages - 2, pages - 1, pages];
    return [page - 2, page - 1, page, page + 1, page + 2];
  };

  if (pages <= 1) return null;

  return (
    <div className="pagination">
      <span className="pagination-info">Showing {from}–{to} of {total}</span>
      <div style={{ display: 'flex', gap: 4 }}>
        <button className="page-btn" disabled={page === 1} onClick={() => onChange(page - 1)}>‹</button>
        {getPageNums().map((n) => (
          <button key={n} className={`page-btn ${n === page ? 'active' : ''}`} onClick={() => onChange(n)}>{n}</button>
        ))}
        <button className="page-btn" disabled={page === pages} onClick={() => onChange(page + 1)}>›</button>
      </div>
    </div>
  );
};

// ─── Spinner ──────────────────────────────────────────────────────────────────
export const Spinner: React.FC<{ size?: 'sm' | 'lg' }> = ({ size }) => (
  <div className={`spinner ${size === 'lg' ? 'spinner-lg' : ''}`} />
);

// ─── Modal ────────────────────────────────────────────────────────────────────
interface ModalProps {
  open: boolean; onClose: () => void;
  title: string; children: React.ReactNode;
  size?: 'md' | 'lg' | 'xl'; footer?: React.ReactNode;
}
export const Modal: React.FC<ModalProps> = ({ open, onClose, title, children, size = 'md', footer }) => {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal ${size === 'lg' ? 'modal-lg' : size === 'xl' ? 'modal-xl' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">
          <span>{title}</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        {children}
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
};

// ─── Confirm Dialog ───────────────────────────────────────────────────────────
interface ConfirmProps {
  open: boolean; onClose: () => void; onConfirm: () => void;
  title: string; message: string; confirmLabel?: string; danger?: boolean; loading?: boolean;
}
export const ConfirmDialog: React.FC<ConfirmProps> = ({
  open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', danger, loading,
}) => (
  <Modal open={open} onClose={onClose} title={title}>
    <p style={{ color: 'var(--text-muted)', fontSize: 13.5, lineHeight: 1.6 }}>{message}</p>
    <div className="modal-footer">
      <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
      <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm} disabled={loading}>
        {loading ? <span className="spinner" /> : confirmLabel}
      </button>
    </div>
  </Modal>
);
