import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { ConfirmDialog } from '../../components/common';
import { logout, setVendor } from '../auth/authSlice';
import { authApi } from '../../api/services';

const SettingsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const vendor = useAppSelector((s) => s.auth.vendor);

  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [saving, setSaving] = useState(false);

  const [pwForm, setPwForm] = useState({ old_password: '', new_password: '', confirm: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (vendor) {
      setForm({ name: vendor.name || '', email: vendor.email || '', phone: vendor.phone || '' });
    }
  }, [vendor]);

  const handleCancelEdit = () => {
    setEditMode(false);
    setForm({ name: vendor?.name || '', email: vendor?.email || '', phone: vendor?.phone || '' });
  };

  const handleSaveProfile = async () => {
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      await authApi.updateProfile({ name: form.name, email: form.email || undefined, phone: form.phone || undefined });
      dispatch(setVendor({ ...vendor!, name: form.name, email: form.email, phone: form.phone }));
      setEditMode(false);
      toast.success('Profile updated successfully');
    } catch (err: any) {
      const msg = err?.response?.data?.detail;
      toast.error(typeof msg === 'string' ? msg : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!pwForm.old_password || !pwForm.new_password) {
      toast.error('Please fill all password fields'); return;
    }
    if (pwForm.new_password !== pwForm.confirm) {
      toast.error('New passwords do not match'); return;
    }
    if (pwForm.new_password.length < 6) {
      toast.error('Password must be at least 6 characters'); return;
    }
    setPwSaving(true);
    try {
      await authApi.changePassword(pwForm.old_password, pwForm.new_password);
      setPwForm({ old_password: '', new_password: '', confirm: '' });
      toast.success('Password changed successfully');
    } catch (err: any) {
      const msg = err?.response?.data?.detail;
      toast.error(typeof msg === 'string' ? msg : 'Incorrect current password');
    } finally {
      setPwSaving(false);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const setF = (key: keyof typeof form, value: string) => setForm((f) => ({ ...f, [key]: value }));
  const setPw = (key: keyof typeof pwForm, value: string) => setPwForm((f) => ({ ...f, [key]: value }));

  return (
    <>
      <div className="section-header">
        <div>
          <div className="section-title">Settings</div>
          <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>
            Manage your account and session
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        {/* ── Personal Details ── */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Personal Details</div>
              <div className="card-sub">Your name, email and contact number</div>
            </div>
            {!editMode ? (
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditMode(true)}>
                Edit
              </button>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" className="btn btn-ghost btn-sm" onClick={handleCancelEdit} disabled={saving}>
                  Cancel
                </button>
                <button type="button" className="btn btn-primary btn-sm" onClick={handleSaveProfile} disabled={saving} aria-busy={saving}>
                  {saving ? <><span className="spinner" />&nbsp;Saving…</> : 'Save Changes'}
                </button>
              </div>
            )}
          </div>

          <div className="settings-list">
            <div className="settings-row">
              <span className="settings-label">Name</span>
              {editMode
                ? <input className="form-input" style={{ maxWidth: 220 }} value={form.name} onChange={(e) => setF('name', e.target.value)} placeholder="Full name" />
                : <span className="settings-value">{vendor?.name || '—'}</span>}
            </div>
            <div className="settings-row">
              <span className="settings-label">Email</span>
              {editMode
                ? <input className="form-input" style={{ maxWidth: 220 }} type="email" value={form.email} onChange={(e) => setF('email', e.target.value)} placeholder="your@email.com" />
                : <span className="settings-value">{vendor?.email || '—'}</span>}
            </div>
            <div className="settings-row">
              <span className="settings-label">Phone</span>
              {editMode
                ? <input className="form-input" style={{ maxWidth: 220 }} type="tel" value={form.phone} onChange={(e) => setF('phone', e.target.value)} placeholder="10-digit mobile" />
                : <span className="settings-value">{vendor?.phone || '—'}</span>}
            </div>
            <div className="settings-row">
              <span className="settings-label">Role</span>
              <span className="settings-value">{vendor?.role || 'VENDOR'}</span>
            </div>
          </div>
        </div>

        {/* ── Right column ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Change Password */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Change Password</div>
                <div className="card-sub">Update your login password</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <input
                  className="form-input"
                  type={showPw ? 'text' : 'password'}
                  value={pwForm.old_password}
                  onChange={(e) => setPw('old_password', e.target.value)}
                  placeholder="Enter current password"
                  autoComplete="current-password"
                />
              </div>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input
                  className="form-input"
                  type={showPw ? 'text' : 'password'}
                  value={pwForm.new_password}
                  onChange={(e) => setPw('new_password', e.target.value)}
                  placeholder="Minimum 6 characters"
                  autoComplete="new-password"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input
                  className="form-input"
                  type={showPw ? 'text' : 'password'}
                  value={pwForm.confirm}
                  onChange={(e) => setPw('confirm', e.target.value)}
                  placeholder="Repeat new password"
                  autoComplete="new-password"
                />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--text-muted)', cursor: 'pointer', userSelect: 'none' }}>
                <input type="checkbox" checked={showPw} onChange={(e) => setShowPw(e.target.checked)} />
                Show passwords
              </label>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleChangePassword}
                disabled={pwSaving}
                aria-busy={pwSaving}
              >
                {pwSaving ? <><span className="spinner" />&nbsp;Changing…</> : 'Change Password'}
              </button>
            </div>
          </div>

          {/* Session / Logout */}
          <div className="card settings-danger-card">
            <div className="card-header">
              <div>
                <div className="card-title">Session</div>
                <div className="card-sub">Sign out from this device</div>
              </div>
            </div>
            <div className="settings-danger-copy">
              Logging out will clear your current vendor session and send you back to the login page.
            </div>
            <button type="button" className="btn btn-danger" onClick={() => setConfirmOpen(true)}>
              Logout
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleLogout}
        title="Logout"
        message="Are you sure you want to logout from the vendor panel?"
        confirmLabel="Logout"
        danger
      />
    </>
  );
};

export default SettingsPage;
