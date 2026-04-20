import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { ConfirmDialog } from '../../components/common';
import { logout } from '../auth/authSlice';

const SettingsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const vendor = useAppSelector((s) => s.auth.vendor);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <>
      <div className="section-header">
        <div>
          <div className="section-title">Settings</div>
          <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>
            Manage your account access and session
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Account</div>
              <div className="card-sub">Basic details for your vendor session</div>
            </div>
          </div>

          <div className="settings-list">
            <div className="settings-row">
              <span className="settings-label">Name</span>
              <span className="settings-value">{vendor?.name || 'Vendor'}</span>
            </div>
            <div className="settings-row">
              <span className="settings-label">Email</span>
              <span className="settings-value">{vendor?.email || 'Not available'}</span>
            </div>
            <div className="settings-row">
              <span className="settings-label">Phone</span>
              <span className="settings-value">{vendor?.phone || 'Not available'}</span>
            </div>
            <div className="settings-row">
              <span className="settings-label">Role</span>
              <span className="settings-value">{vendor?.role || 'VENDOR'}</span>
            </div>
          </div>
        </div>

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
