import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { ConfirmDialog } from '../../components/common';
import { logout, setVendor } from '../auth/authSlice';
import { authApi } from '../../api/services';

type OtpStep = 'idle' | 'sending' | 'sent' | 'verifying';

const VerifyBadge: React.FC<{ verified: boolean }> = ({ verified }) => (
  <span style={{
    fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 10,
    background: verified ? 'var(--green-bg, #dcfce7)' : 'var(--yellow-bg, #fef9c3)',
    color: verified ? 'var(--green)' : 'var(--yellow, #92400e)',
  }}>
    {verified ? '✓ Verified' : '✗ Unverified'}
  </span>
);

const SettingsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const vendor = useAppSelector((s) => s.auth.vendor);

  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [saving, setSaving] = useState(false);

  const [emailOtp, setEmailOtp] = useState('');
  const [emailStep, setEmailStep] = useState<OtpStep>('idle');

  const [phoneOtp, setPhoneOtp] = useState('');
  const [phoneStep, setPhoneStep] = useState<OtpStep>('idle');

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
    setEmailStep('idle'); setEmailOtp('');
    setPhoneStep('idle'); setPhoneOtp('');
    setForm({ name: vendor?.name || '', email: vendor?.email || '', phone: vendor?.phone || '' });
  };

  const handleSaveProfile = async () => {
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      await authApi.updateProfile({ name: form.name, email: form.email || undefined, phone: form.phone || undefined });
      dispatch(setVendor({ ...vendor!, name: form.name, email: form.email, phone: form.phone }));
      setEditMode(false);
      setEmailStep('idle'); setEmailOtp('');
      setPhoneStep('idle'); setPhoneOtp('');
      toast.success('Profile updated successfully');
    } catch (err: any) {
      const msg = err?.response?.data?.detail;
      toast.error(typeof msg === 'string' ? msg : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSendEmailOtp = async () => {
    setEmailStep('sending');
    try {
      await authApi.sendEmailOtp();
      setEmailStep('sent');
      toast.success('OTP sent to your email');
    } catch (err: any) {
      const msg = err?.response?.data?.detail;
      toast.error(typeof msg === 'string' ? msg : 'Failed to send OTP');
      setEmailStep('idle');
    }
  };

  const handleVerifyEmail = async () => {
    if (!emailOtp.trim()) { toast.error('Enter the OTP'); return; }
    setEmailStep('verifying');
    try {
      await authApi.verifyEmailOtp(emailOtp.trim());
      dispatch(setVendor({ ...vendor!, is_email_verified: true }));
      setEmailStep('idle'); setEmailOtp('');
      toast.success('Email verified!');
    } catch (err: any) {
      const msg = err?.response?.data?.detail;
      toast.error(typeof msg === 'string' ? msg : 'Invalid OTP');
      setEmailStep('sent');
    }
  };

  const handleSendPhoneOtp = async () => {
    setPhoneStep('sending');
    try {
      await authApi.sendPhoneOtp();
      setPhoneStep('sent');
      toast.success('OTP sent to your phone');
    } catch (err: any) {
      const msg = err?.response?.data?.detail;
      toast.error(typeof msg === 'string' ? msg : 'Failed to send OTP');
      setPhoneStep('idle');
    }
  };

  const handleVerifyPhone = async () => {
    if (!phoneOtp.trim()) { toast.error('Enter the OTP'); return; }
    setPhoneStep('verifying');
    try {
      await authApi.verifyPhoneOtp(phoneOtp.trim());
      dispatch(setVendor({ ...vendor!, is_phone_verified: true }));
      setPhoneStep('idle'); setPhoneOtp('');
      toast.success('Phone verified!');
    } catch (err: any) {
      const msg = err?.response?.data?.detail;
      toast.error(typeof msg === 'string' ? msg : 'Invalid OTP');
      setPhoneStep('sent');
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

            {/* ── Email row ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <div className="settings-row" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                <span className="settings-label">Email</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  {editMode
                    ? <input className="form-input" style={{ maxWidth: 200 }} type="email" value={form.email} onChange={(e) => setF('email', e.target.value)} placeholder="your@email.com" />
                    : <span className="settings-value">{vendor?.email || '—'}</span>}
                  <VerifyBadge verified={!!vendor?.is_email_verified} />
                  {!vendor?.is_email_verified && (
                    <button type="button" className="btn btn-warning btn-sm" style={{ whiteSpace: 'nowrap' }}
                      disabled={emailStep === 'sending' || emailStep === 'verifying'}
                      onClick={handleSendEmailOtp}>
                      {emailStep === 'sending' ? <span className="spinner" /> : emailStep === 'sent' ? 'Resend OTP' : 'Verify'}
                    </button>
                  )}
                </div>
              </div>
              {emailStep === 'sent' || emailStep === 'verifying' ? (
                <div style={{ display: 'flex', gap: 8, paddingLeft: 0 }}>
                  <input className="form-input" style={{ maxWidth: 140 }} placeholder="Enter 6-digit OTP" maxLength={6}
                    value={emailOtp} onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, ''))} />
                  <button type="button" className="btn btn-success btn-sm" disabled={emailStep === 'verifying'} onClick={handleVerifyEmail}>
                    {emailStep === 'verifying' ? <span className="spinner" /> : 'Confirm'}
                  </button>
                </div>
              ) : null}
            </div>

            {/* ── Phone row ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <div className="settings-row" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                <span className="settings-label">Phone</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  {editMode
                    ? <input className="form-input" style={{ maxWidth: 200 }} type="tel" value={form.phone} onChange={(e) => setF('phone', e.target.value)} placeholder="10-digit mobile" />
                    : <span className="settings-value">{vendor?.phone || '—'}</span>}
                  <VerifyBadge verified={!!vendor?.is_phone_verified} />
                  {!vendor?.is_phone_verified && (
                    <button type="button" className="btn btn-warning btn-sm" style={{ whiteSpace: 'nowrap' }}
                      disabled={phoneStep === 'sending' || phoneStep === 'verifying'}
                      onClick={handleSendPhoneOtp}>
                      {phoneStep === 'sending' ? <span className="spinner" /> : phoneStep === 'sent' ? 'Resend OTP' : 'Verify'}
                    </button>
                  )}
                </div>
              </div>
              {phoneStep === 'sent' || phoneStep === 'verifying' ? (
                <div style={{ display: 'flex', gap: 8 }}>
                  <input className="form-input" style={{ maxWidth: 140 }} placeholder="Enter 6-digit OTP" maxLength={6}
                    value={phoneOtp} onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, ''))} />
                  <button type="button" className="btn btn-success btn-sm" disabled={phoneStep === 'verifying'} onClick={handleVerifyPhone}>
                    {phoneStep === 'verifying' ? <span className="spinner" /> : 'Confirm'}
                  </button>
                </div>
              ) : null}
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
                <input className="form-input" type={showPw ? 'text' : 'password'} value={pwForm.old_password}
                  onChange={(e) => setPw('old_password', e.target.value)} placeholder="Enter current password" autoComplete="current-password" />
              </div>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input className="form-input" type={showPw ? 'text' : 'password'} value={pwForm.new_password}
                  onChange={(e) => setPw('new_password', e.target.value)} placeholder="Minimum 6 characters" autoComplete="new-password" />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input className="form-input" type={showPw ? 'text' : 'password'} value={pwForm.confirm}
                  onChange={(e) => setPw('confirm', e.target.value)} placeholder="Repeat new password" autoComplete="new-password" />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--text-muted)', cursor: 'pointer', userSelect: 'none' }}>
                <input type="checkbox" checked={showPw} onChange={(e) => setShowPw(e.target.checked)} />
                Show passwords
              </label>
              <button type="button" className="btn btn-primary" onClick={handleChangePassword} disabled={pwSaving} aria-busy={pwSaving}>
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
