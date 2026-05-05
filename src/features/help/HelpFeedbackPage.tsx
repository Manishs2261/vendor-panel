import React, { useEffect, useState } from 'react';
import { MessageSquare, Bug, Lightbulb, HelpCircle, ChevronDown, ChevronUp, Send, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { fetchFeedbackList, submitFeedback, setFilter, setPage, resetFilters } from './helpSlice';
import { Pagination } from '../../components/common';
import type { Feedback } from '../../types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TYPE_META: Record<Feedback['type'], { label: string; icon: React.ReactNode; color: string }> = {
  feedback:        { label: 'Feedback',        icon: <MessageSquare size={13} strokeWidth={1.8} />, color: 'var(--indigo, #6366f1)' },
  bug_report:      { label: 'Bug Report',      icon: <Bug           size={13} strokeWidth={1.8} />, color: 'var(--red, #ef4444)' },
  feature_request: { label: 'Feature Request', icon: <Lightbulb     size={13} strokeWidth={1.8} />, color: 'var(--yellow, #f59e0b)' },
  general:         { label: 'General',         icon: <HelpCircle    size={13} strokeWidth={1.8} />, color: 'var(--text-muted)' },
};

const STATUS_META: Record<Feedback['status'], { label: string; bg: string; color: string }> = {
  open:        { label: 'Open',        bg: 'rgba(99,102,241,0.12)',  color: 'var(--indigo, #6366f1)' },
  in_progress: { label: 'In Progress', bg: 'rgba(245,158,11,0.12)',  color: 'var(--yellow, #f59e0b)' },
  resolved:    { label: 'Resolved',    bg: 'rgba(34,197,94,0.12)',   color: 'var(--green, #22c55e)' },
  closed:      { label: 'Closed',      bg: 'rgba(113,113,122,0.12)', color: 'var(--text-dim)' },
};

const PRIORITY_META: Record<Feedback['priority'], { label: string; color: string }> = {
  low:    { label: 'Low',    color: 'var(--text-dim)' },
  medium: { label: 'Medium', color: 'var(--yellow, #f59e0b)' },
  high:   { label: 'High',   color: 'var(--red, #ef4444)' },
};

const Badge: React.FC<{ bg: string; color: string; children: React.ReactNode }> = ({ bg, color, children }) => (
  <span style={{ background: bg, color, fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
    {children}
  </span>
);

const formatDate = (v?: string) => {
  if (!v) return '—';
  return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(v));
};

// ─── Expandable Row ───────────────────────────────────────────────────────────

const FeedbackRow: React.FC<{ item: Feedback }> = ({ item }) => {
  const [open, setOpen] = useState(false);
  const type = TYPE_META[item.type];
  const status = STATUS_META[item.status];
  const priority = PRIORITY_META[item.priority];

  return (
    <>
      <tr
        style={{ cursor: 'pointer', borderBottom: open ? 'none' : '1px solid var(--border)' }}
        onClick={() => setOpen(!open)}
      >
        <td style={{ padding: '12px 16px', width: 40 }}>
          <span style={{ color: type.color, display: 'flex' }}>{type.icon}</span>
        </td>
        <td style={{ padding: '12px 8px' }}>
          <div style={{ fontWeight: 500, fontSize: 13 }}>{item.subject}</div>
          <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>{type.label}</div>
        </td>
        <td style={{ padding: '12px 8px' }}>
          <Badge bg={status.bg} color={status.color}>{status.label}</Badge>
        </td>
        <td style={{ padding: '12px 8px' }}>
          <span style={{ fontSize: 12, color: priority.color, fontWeight: 500 }}>{priority.label}</span>
        </td>
        <td style={{ padding: '12px 8px', fontSize: 12, color: 'var(--text-muted)' }}>
          {formatDate(item.created_at)}
        </td>
        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
          {item.admin_response && (
            <span style={{ fontSize: 11, background: 'rgba(34,197,94,0.1)', color: 'var(--green, #22c55e)', padding: '2px 7px', borderRadius: 99, marginRight: 8 }}>
              Replied
            </span>
          )}
          {open ? <ChevronUp size={14} strokeWidth={2} style={{ color: 'var(--text-dim)' }} /> : <ChevronDown size={14} strokeWidth={2} style={{ color: 'var(--text-dim)' }} />}
        </td>
      </tr>

      {open && (
        <tr>
          <td colSpan={6} style={{ padding: '0 16px 16px 56px', background: 'var(--surface2)' }}>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, paddingTop: 8 }}>
              {item.description}
            </div>
            {item.admin_response && (
              <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(34,197,94,0.06)', borderLeft: '3px solid var(--green, #22c55e)', borderRadius: '0 8px 8px 0' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--green, #22c55e)', marginBottom: 4 }}>
                  Support Response · {formatDate(item.admin_response_at)}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6 }}>{item.admin_response}</div>
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
};

// ─── Submit Form ──────────────────────────────────────────────────────────────

const EMPTY_FORM = { type: 'general' as Feedback['type'], subject: '', description: '', priority: 'medium' as Feedback['priority'] };

const SubmitForm: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const dispatch = useAppDispatch();
  const submitting = useAppSelector((s) => s.help.submitting);
  const [form, setForm] = useState(EMPTY_FORM);

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.description.trim()) {
      toast.error('Subject and description are required');
      return;
    }
    try {
      await dispatch(submitFeedback(form)).unwrap();
      toast.success('Feedback submitted successfully');
      onClose();
    } catch (err: any) {
      toast.error(typeof err === 'string' ? err : 'Failed to submit feedback');
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, width: '100%', maxWidth: 520, padding: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>Submit Feedback</div>
            <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>Report an issue or share a suggestion</div>
          </div>
          <button className="icon-btn" onClick={onClose}><X size={16} strokeWidth={2} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Type */}
          <div>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 500 }}>Type</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              {(Object.keys(TYPE_META) as Feedback['type'][]).map((t) => {
                const meta = TYPE_META[t];
                const active = form.type === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => set('type', t)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 13,
                      border: `1px solid ${active ? meta.color : 'var(--border)'}`,
                      background: active ? `${meta.color}18` : 'var(--surface2)',
                      color: active ? meta.color : 'var(--text-muted)',
                      fontWeight: active ? 600 : 400, transition: 'all 0.15s',
                    }}
                  >
                    <span style={{ color: meta.color }}>{meta.icon}</span>
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Priority */}
          <div>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 500 }}>Priority</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {(Object.keys(PRIORITY_META) as Feedback['priority'][]).map((p) => {
                const meta = PRIORITY_META[p];
                const active = form.priority === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => set('priority', p)}
                    style={{
                      flex: 1, padding: '7px 0', borderRadius: 8, cursor: 'pointer', fontSize: 12.5,
                      border: `1px solid ${active ? meta.color : 'var(--border)'}`,
                      background: active ? `${meta.color}18` : 'var(--surface2)',
                      color: active ? meta.color : 'var(--text-muted)',
                      fontWeight: active ? 600 : 400, transition: 'all 0.15s',
                    }}
                  >
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Subject */}
          <div>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 500 }}>Subject</label>
            <input
              className="form-input"
              placeholder="Brief description of the issue or suggestion"
              value={form.subject}
              onChange={(e) => set('subject', e.target.value)}
              maxLength={300}
              style={{ width: '100%' }}
            />
          </div>

          {/* Description */}
          <div>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 500 }}>Description</label>
            <textarea
              className="form-input"
              placeholder="Describe in detail. For bugs, include steps to reproduce..."
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              rows={5}
              style={{ width: '100%', resize: 'vertical', minHeight: 100 }}
            />
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <Send size={14} strokeWidth={2} />
              {submitting ? 'Sending…' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

const HelpFeedbackPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { items, total, page, pages, loading, filters } = useAppSelector((s) => s.help);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    dispatch(fetchFeedbackList());
  }, [dispatch, filters, page]);

  return (
    <div>
      {showForm && <SubmitForm onClose={() => setShowForm(false)} />}

      {/* Header */}
      <div className="section-header">
        <div>
          <div className="section-title">Help &amp; Feedback</div>
          <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>
            Report issues, request features, or share feedback with our team
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <Plus size={14} strokeWidth={2.5} />
          New Feedback
        </button>
      </div>

      {/* Info cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {(Object.keys(TYPE_META) as Feedback['type'][]).map((t) => {
          const meta = TYPE_META[t];
          const count = items.filter((i) => i.type === t).length;
          return (
            <div
              key={t}
              className="card"
              style={{ padding: '16px 18px', cursor: 'pointer', border: filters.type === t ? `1px solid ${meta.color}` : '1px solid var(--border)' }}
              onClick={() => dispatch(setFilter({ type: filters.type === t ? '' : t }))}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ color: meta.color }}>{React.cloneElement(meta.icon as React.ReactElement, { size: 15 })}</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{meta.label}</span>
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>{count}</div>
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Filters */}
        <div className="filters-bar" style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
          <select
            className="form-select"
            style={{ width: 160 }}
            value={filters.type}
            onChange={(e) => dispatch(setFilter({ type: e.target.value }))}
          >
            <option value="">All Types</option>
            <option value="feedback">Feedback</option>
            <option value="bug_report">Bug Report</option>
            <option value="feature_request">Feature Request</option>
            <option value="general">General</option>
          </select>

          <select
            className="form-select"
            style={{ width: 160 }}
            value={filters.status}
            onChange={(e) => dispatch(setFilter({ status: e.target.value }))}
          >
            <option value="">All Statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>

          <button className="btn btn-ghost btn-sm" onClick={() => dispatch(resetFilters())}>
            Clear
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--text-dim)', fontSize: 14 }}>Loading…</div>
        ) : items.length === 0 ? (
          <div style={{ padding: '60px 0', textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>💬</div>
            <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 6 }}>No feedback submitted yet</div>
            <div style={{ fontSize: 12.5, color: 'var(--text-dim)' }}>Click "New Feedback" to report an issue or share a suggestion</div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '10px 16px', width: 40 }} />
                <th style={{ padding: '10px 8px', textAlign: 'left', fontSize: 11.5, color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Subject</th>
                <th style={{ padding: '10px 8px', textAlign: 'left', fontSize: 11.5, color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                <th style={{ padding: '10px 8px', textAlign: 'left', fontSize: 11.5, color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Priority</th>
                <th style={{ padding: '10px 8px', textAlign: 'left', fontSize: 11.5, color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Submitted</th>
                <th style={{ padding: '10px 16px', width: 90 }} />
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <FeedbackRow key={item.id} item={item} />
              ))}
            </tbody>
          </table>
        )}

        {pages > 1 && (
          <div style={{ padding: '0 16px', borderTop: '1px solid var(--border)' }}>
            <Pagination page={page} pages={pages} total={total} limit={filters.limit} onChange={(p) => dispatch(setPage(p))} />
          </div>
        )}
      </div>
    </div>
  );
};

export default HelpFeedbackPage;
