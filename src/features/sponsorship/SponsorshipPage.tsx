import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import {
  fetchAvailablePlans, fetchMyRequests, applyForSponsorship, cancelSponsorship,
  type SponsorshipPlan, type VendorSponsorshipRequest,
} from './sponsorshipSlice';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  pending:   { bg: '#fef3c7', color: '#92400e' },
  active:    { bg: '#d1fae5', color: '#065f46' },
  rejected:  { bg: '#fee2e2', color: '#991b1b' },
  expired:   { bg: '#f3f4f6', color: '#374151' },
  paused:    { bg: '#ffedd5', color: '#9a3412' },
  cancelled: { bg: '#f3f4f6', color: '#374151' },
};

const STATUS_STEPS = ['Applied', 'Reviewed', 'Active', 'Ended'];
const STATUS_STEP_IDX: Record<string, number> = {
  pending: 1, approved: 1, active: 2, paused: 2, rejected: 1, expired: 3, cancelled: 0,
};

function StatusBadge({ status }: { status: string }) {
  const c = STATUS_COLORS[status] || { bg: '#f3f4f6', color: '#374151' };
  return (
    <span style={{ background: c.bg, color: c.color, borderRadius: 20, padding: '3px 12px', fontSize: 12, fontWeight: 700, textTransform: 'capitalize' }}>
      {status}
    </span>
  );
}

function Chip({ label, color = '#6366f1' }: { label: string; color?: string }) {
  return (
    <span style={{
      display: 'inline-block', padding: '2px 10px', borderRadius: 20,
      fontSize: 11, fontWeight: 600, marginRight: 4, marginBottom: 4,
      background: color + '18', color,
    }}>{label}</span>
  );
}

function StatusTimeline({ status }: { status: string }) {
  const current = STATUS_STEP_IDX[status] ?? 0;
  const isRejected = status === 'rejected' || status === 'cancelled';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginTop: 10 }}>
      {STATUS_STEPS.map((step, i) => {
        const done = i <= current && !isRejected;
        const isCurrent = i === current;
        const failed = isRejected && i === 1;
        return (
          <React.Fragment key={step}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 56 }}>
              <div style={{
                width: 20, height: 20, borderRadius: '50%',
                background: failed ? '#ef4444' : done ? '#10b981' : 'var(--border)',
                border: isCurrent && !failed ? '3px solid #10b981' : '2px solid transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {done && !isCurrent && <span style={{ color: '#fff', fontSize: 11 }}>✓</span>}
                {failed && <span style={{ color: '#fff', fontSize: 11 }}>✕</span>}
              </div>
              <div style={{ fontSize: 10, color: done ? '#065f46' : 'var(--text-muted)', marginTop: 3, whiteSpace: 'nowrap', fontWeight: isCurrent ? 700 : 400 }}>
                {failed && i === 1 ? (status === 'rejected' ? 'Rejected' : 'Cancelled') : step}
              </div>
            </div>
            {i < STATUS_STEPS.length - 1 && (
              <div style={{ flex: 1, height: 2, background: i < current && !isRejected ? '#10b981' : 'var(--border)', marginBottom: 14, minWidth: 16 }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── Apply Form ──────────────────────────────────────────────────────────────

function ApplyForm({
  plan, onClose, onSubmit, loading,
}: {
  plan: SponsorshipPlan;
  onClose: () => void;
  onSubmit: (data: { plan_id: number; target_categories: number[]; target_locations: string[]; target_keywords: string[] }) => void;
  loading: boolean;
}) {
  const [catInput, setCatInput] = useState('');
  const [locInput, setLocInput] = useState('');
  const [kwInput, setKwInput] = useState('');

  const parse = (val: string) => val.split(',').map(s => s.trim()).filter(Boolean);
  const parseInts = (val: string) => val.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));

  const inputStyle: React.CSSProperties = {
    display: 'block', width: '100%', marginTop: 6, padding: '8px 12px',
    border: '1px solid var(--border)', borderRadius: 8,
    background: 'var(--surface)', color: 'var(--text)', boxSizing: 'border-box',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
      <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 16, padding: 28, minWidth: 400, maxWidth: 500 }}>
        <h3 style={{ marginBottom: 4 }}>Apply for <em>{plan.name}</em></h3>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
          ₹{plan.price} · {plan.duration_days} days · Up to {plan.max_categories} categories, {plan.max_locations} locations
        </p>

        <label style={{ display: 'block', marginBottom: 14 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Target Category IDs <small style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(comma-separated, max {plan.max_categories})</small></span>
          <input style={inputStyle} placeholder="e.g. 1, 5, 12" value={catInput} onChange={e => setCatInput(e.target.value)} />
        </label>
        <label style={{ display: 'block', marginBottom: 14 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Target Cities / Pincodes <small style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(comma-separated, max {plan.max_locations})</small></span>
          <input style={inputStyle} placeholder="e.g. Mumbai, Pune, 400001" value={locInput} onChange={e => setLocInput(e.target.value)} />
        </label>
        <label style={{ display: 'block', marginBottom: 20 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Target Keywords <small style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(comma-separated)</small></span>
          <input style={inputStyle} placeholder="e.g. mobile, electronics, repair" value={kwInput} onChange={e => setKwInput(e.target.value)} />
        </label>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', cursor: 'pointer' }}>Cancel</button>
          <button disabled={loading}
            onClick={() => onSubmit({ plan_id: plan.id, target_categories: parseInts(catInput), target_locations: parse(locInput), target_keywords: parse(kwInput) })}
            style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: 'var(--primary, #6366f1)', color: '#fff', cursor: 'pointer', fontWeight: 700 }}>
            {loading ? 'Submitting...' : 'Submit Application'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Active Sponsorship Banner (A1) ──────────────────────────────────────────

function ActiveBanner({ req }: { req: VendorSponsorshipRequest }) {
  const now = Date.now();
  const end = req.end_date ? new Date(req.end_date).getTime() : now;
  const start = req.start_date ? new Date(req.start_date).getTime() : now;
  const totalMs = end - start;
  const elapsedMs = now - start;
  const daysLeft = Math.max(0, Math.ceil((end - now) / 86400000));
  const totalDays = req.plan?.duration_days || Math.ceil(totalMs / 86400000);
  const progress = totalMs > 0 ? Math.min(100, (elapsedMs / totalMs) * 100) : 0;
  const ctr = req.view_count > 0 ? ((req.click_count / req.view_count) * 100).toFixed(1) : '0.0';

  const locs: string[] = req.target_locations || [];
  const kws: string[] = req.target_keywords || [];

  return (
    <div style={{ background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)', border: '1px solid #6ee7b7', borderRadius: 16, padding: '22px 24px', marginBottom: 28 }}>
      {/* Row 1: title + remaining badge */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 11, color: '#065f46', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Active Sponsorship</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#064e3b', marginTop: 4 }}>{req.plan?.name || `Plan #${req.plan_id}`}</div>
          <div style={{ fontSize: 12, color: '#065f46', marginTop: 2 }}>
            {req.start_date ? new Date(req.start_date).toLocaleDateString() : ''} → {req.end_date ? new Date(req.end_date).toLocaleDateString() : ''}
          </div>
        </div>
        <div style={{ background: daysLeft <= 3 ? '#fef3c7' : '#fff', border: `1px solid ${daysLeft <= 3 ? '#fcd34d' : '#6ee7b7'}`, borderRadius: 10, padding: '8px 14px', textAlign: 'center', minWidth: 70 }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: daysLeft <= 3 ? '#92400e' : '#064e3b' }}>{daysLeft}</div>
          <div style={{ fontSize: 11, color: daysLeft <= 3 ? '#92400e' : '#065f46', fontWeight: 600 }}>days left</div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ background: 'rgba(255,255,255,0.5)', borderRadius: 6, height: 6, marginBottom: 18, overflow: 'hidden' }}>
        <div style={{ width: `${progress}%`, height: '100%', background: '#10b981', borderRadius: 6, transition: 'width 0.3s' }} />
      </div>

      {/* Row 2: 4 stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'Views', value: req.view_count.toLocaleString(), icon: '👁' },
          { label: 'Clicks', value: req.click_count.toLocaleString(), icon: '🖱' },
          { label: 'CTR', value: `${ctr}%`, icon: '📈' },
          { label: 'Duration', value: `${totalDays}d`, icon: '📅' },
        ].map(({ label, value, icon }) => (
          <div key={label} style={{ background: 'rgba(255,255,255,0.6)', borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
            <div style={{ fontSize: 16, marginBottom: 2 }}>{icon}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#064e3b' }}>{value}</div>
            <div style={{ fontSize: 11, color: '#065f46' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Row 3: target chips */}
      {(locs.length > 0 || kws.length > 0) && (
        <div style={{ borderTop: '1px solid rgba(6,95,70,0.2)', paddingTop: 12 }}>
          {locs.length > 0 && (
            <div style={{ marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: '#065f46', fontWeight: 700, marginRight: 6 }}>📍 Locations:</span>
              {locs.map(l => <Chip key={l} label={l} color="#065f46" />)}
            </div>
          )}
          {kws.length > 0 && (
            <div>
              <span style={{ fontSize: 11, color: '#065f46', fontWeight: 700, marginRight: 6 }}>🔍 Keywords:</span>
              {kws.map(k => <Chip key={k} label={k} color="#6366f1" />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Plan Card (A2) ──────────────────────────────────────────────────────────

function PlanCard({
  plan, plans, hasPendingOrActive, onApply,
}: {
  plan: SponsorshipPlan;
  plans: SponsorshipPlan[];
  hasPendingOrActive: boolean;
  onApply: (p: SponsorshipPlan) => void;
}) {
  const maxPriority = Math.max(...plans.map(p => p.priority));
  const isMostPopular = plan.priority === maxPriority;
  const pricePerDay = plan.duration_days > 0 ? plan.price / plan.duration_days : Infinity;
  const minPPD = Math.min(...plans.map(p => p.duration_days > 0 ? p.price / p.duration_days : Infinity));
  const isBestValue = Math.abs(pricePerDay - minPPD) < 0.01;

  const features = [
    { label: 'Homepage carousel', ok: true },
    { label: 'Search result priority', ok: true },
    { label: `Location targeting (${plan.max_locations} cities)`, ok: plan.max_locations > 0 },
    { label: `Category targeting (${plan.max_categories} categories)`, ok: plan.max_categories > 0 },
    { label: `Priority level ${plan.priority}`, ok: true },
  ];

  return (
    <div style={{
      background: 'var(--surface2)', border: isMostPopular ? '2px solid #6366f1' : '1px solid var(--border)',
      borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column', gap: 0,
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Badges */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 10, minHeight: 22 }}>
        {isMostPopular && (
          <span style={{ background: '#6366f1', color: '#fff', fontSize: 10, fontWeight: 800, borderRadius: 20, padding: '2px 10px', letterSpacing: 0.5 }}>
            ⭐ MOST POPULAR
          </span>
        )}
        {isBestValue && (
          <span style={{ background: '#10b981', color: '#fff', fontSize: 10, fontWeight: 800, borderRadius: 20, padding: '2px 10px', letterSpacing: 0.5 }}>
            💰 BEST VALUE
          </span>
        )}
      </div>

      <div style={{ fontSize: 18, fontWeight: 800 }}>{plan.name}</div>
      {plan.description && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, marginBottom: 8 }}>{plan.description}</div>}

      <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--primary, #6366f1)', marginTop: 4 }}>₹{plan.price}</div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>
        {plan.duration_days} days · ₹{pricePerDay.toFixed(0)}/day
      </div>

      {/* Feature checklist */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
        {features.map(f => (
          <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
            <span style={{ color: f.ok ? '#10b981' : '#d1d5db', fontWeight: 700, fontSize: 14 }}>{f.ok ? '✓' : '✗'}</span>
            <span style={{ color: f.ok ? 'var(--text)' : 'var(--text-muted)' }}>{f.label}</span>
          </div>
        ))}
      </div>

      <button
        disabled={hasPendingOrActive}
        onClick={() => onApply(plan)}
        style={{
          marginTop: 'auto', padding: '10px 0', borderRadius: 10, border: 'none',
          background: hasPendingOrActive ? 'var(--border)' : isMostPopular ? '#6366f1' : 'var(--primary, #6366f1)',
          color: hasPendingOrActive ? 'var(--text-muted)' : '#fff',
          fontWeight: 700, cursor: hasPendingOrActive ? 'not-allowed' : 'pointer', fontSize: 14,
        }}>
        {hasPendingOrActive ? 'Already Applied' : 'Apply Now'}
      </button>
    </div>
  );
}

// ─── Application Row (A3) ────────────────────────────────────────────────────

function ApplicationRow({ req, onCancel }: { req: VendorSponsorshipRequest; onCancel: (id: number) => void }) {
  const locs: string[] = req.target_locations || [];
  const kws: string[] = req.target_keywords || [];
  const cats: number[] = req.target_categories || [];

  const start = req.start_date ? new Date(req.start_date) : null;
  const end = req.end_date ? new Date(req.end_date) : null;
  const planDays = req.plan?.duration_days || 0;
  const elapsed = start && end ? Math.min(planDays, Math.ceil((Math.min(Date.now(), end.getTime()) - start.getTime()) / 86400000)) : null;

  const ctr = req.view_count > 0 ? ((req.click_count / req.view_count) * 100).toFixed(1) : '0.0';

  return (
    <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 14, padding: '18px 20px' }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>{req.plan?.name || `Plan #${req.plan_id}`}</span>
          <StatusBadge status={req.status} />
        </div>
        {req.status === 'pending' && (
          <button onClick={() => onCancel(req.id)}
            style={{ padding: '4px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 12 }}>
            Cancel
          </button>
        )}
      </div>

      {/* Status timeline */}
      <StatusTimeline status={req.status} />

      {/* Date + duration info */}
      <div style={{ display: 'flex', gap: 20, marginTop: 12, flexWrap: 'wrap' }}>
        {start && end && (
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            📅 {start.toLocaleDateString()} – {end.toLocaleDateString()}
          </div>
        )}
        {elapsed !== null && planDays > 0 && (
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            ⏱ {elapsed} of {planDays} days elapsed
          </div>
        )}
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          Applied {new Date(req.created_at).toLocaleDateString()}
        </div>
      </div>

      {/* Stats row — show for active, paused, expired */}
      {(req.status === 'active' || req.status === 'paused' || req.status === 'expired') && (
        <div style={{ display: 'flex', gap: 20, marginTop: 12, padding: '10px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
          {[
            { label: 'Views', value: req.view_count },
            { label: 'Clicks', value: req.click_count },
            { label: 'CTR', value: `${ctr}%` },
          ].map(({ label, value }) => (
            <div key={label} style={{ textAlign: 'center', minWidth: 60 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: req.status === 'expired' ? 'var(--text-muted)' : 'var(--text)' }}>{value}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Admin notes */}
      {req.admin_notes && (
        <div style={{ marginTop: 10, fontSize: 12, color: req.status === 'rejected' ? '#ef4444' : 'var(--text-muted)', background: req.status === 'rejected' ? '#fee2e240' : 'transparent', borderRadius: 6, padding: req.status === 'rejected' ? '6px 10px' : 0 }}>
          💬 {req.admin_notes}
        </div>
      )}

      {/* Target chips */}
      {(cats.length > 0 || locs.length > 0 || kws.length > 0) && (
        <div style={{ marginTop: 10 }}>
          {cats.length > 0 && (
            <div style={{ marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, marginRight: 4 }}>Categories:</span>
              {cats.map(c => <Chip key={c} label={`#${c}`} color="#8b5cf6" />)}
            </div>
          )}
          {locs.length > 0 && (
            <div style={{ marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, marginRight: 4 }}>📍 Locations:</span>
              {locs.map(l => <Chip key={l} label={l} color="#0891b2" />)}
            </div>
          )}
          {kws.length > 0 && (
            <div>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, marginRight: 4 }}>🔍 Keywords:</span>
              {kws.map(k => <Chip key={k} label={k} color="#6366f1" />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SponsorshipPage() {
  const dispatch = useAppDispatch();
  const { plans, myRequests, loading, applyLoading } = useAppSelector(s => s.sponsorship);
  const [applyPlan, setApplyPlan] = useState<SponsorshipPlan | null>(null);

  useEffect(() => {
    dispatch(fetchAvailablePlans());
    dispatch(fetchMyRequests());
  }, [dispatch]);

  const activeRequest = myRequests.find(r => r.status === 'active' || r.status === 'paused');
  const pendingRequest = myRequests.find(r => r.status === 'pending');
  const hasPendingOrActive = !!(activeRequest || pendingRequest);

  const handleApply = async (data: Parameters<typeof applyForSponsorship>[0]) => {
    const result = await dispatch(applyForSponsorship(data));
    if (applyForSponsorship.fulfilled.match(result)) {
      setApplyPlan(null);
      toast.success('Application submitted! Awaiting admin approval.');
    } else {
      toast.error((result.payload as string) || 'Failed to apply');
    }
  };

  const handleCancel = async (id: number) => {
    const result = await dispatch(cancelSponsorship(id));
    if (cancelSponsorship.fulfilled.match(result)) {
      toast.success('Request cancelled');
    } else {
      toast.error('Failed to cancel');
    }
  };

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>

      {/* A1 — Active sponsorship rich banner */}
      {activeRequest && <ActiveBanner req={activeRequest} />}

      {/* Pending notice */}
      {pendingRequest && !activeRequest && (
        <div style={{ background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 14, padding: '16px 24px', marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 700, color: '#92400e' }}>Application Under Review</div>
            <div style={{ fontSize: 13, color: '#92400e', marginTop: 2 }}>Your sponsorship request is pending admin approval.</div>
          </div>
          <button onClick={() => handleCancel(pendingRequest.id)}
            style={{ padding: '6px 16px', borderRadius: 8, border: '1px solid #d97706', background: 'transparent', color: '#92400e', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
            Cancel Request
          </button>
        </div>
      )}

      {/* A2 — Plans with feature checklist */}
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Sponsorship Plans</h2>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 18 }}>
        Choose a plan to boost your shop's visibility across the marketplace.
      </p>
      {loading && plans.length === 0 && <div style={{ color: 'var(--text-muted)' }}>Loading plans…</div>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16, marginBottom: 40 }}>
        {plans.map(plan => (
          <PlanCard key={plan.id} plan={plan} plans={plans} hasPendingOrActive={hasPendingOrActive} onApply={setApplyPlan} />
        ))}
        {!loading && plans.length === 0 && (
          <div style={{ color: 'var(--text-muted)', gridColumn: '1/-1' }}>No sponsorship plans available yet.</div>
        )}
      </div>

      {/* A3 — Application history with timeline + chips */}
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>My Applications</h2>
      {myRequests.length === 0 && !loading && (
        <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>No applications yet. Apply for a plan above to get started.</div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {myRequests.map(req => (
          <ApplicationRow key={req.id} req={req} onCancel={handleCancel} />
        ))}
      </div>

      {applyPlan && (
        <ApplyForm plan={applyPlan} onClose={() => setApplyPlan(null)} onSubmit={handleApply} loading={applyLoading} />
      )}
    </div>
  );
}
