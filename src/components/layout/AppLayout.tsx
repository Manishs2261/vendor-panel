import React from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { logout } from '../../features/auth/authSlice';

const NAV = [
  {
    group: 'Main',
    items: [
      { to: '/dashboard', icon: '⊞', label: 'Dashboard' },
      { to: '/products', icon: '📦', label: 'Products' },
      { to: '/analytics', icon: '📈', label: 'Analytics' },
    ],
  },
  {
    group: 'Account',
    items: [
      { to: '/shop', icon: '🏪', label: 'Shop Profile' },
      { to: '/payments', icon: '💳', label: 'Payments' },
      { to: '/notifications', icon: '🔔', label: 'Notifications', badge: 'unread' },
    ],
  },
];

const PAGE_TITLES: Record<string, { title: string; sub: string }> = {
  '/dashboard': { title: 'Dashboard', sub: 'Overview of your shop performance' },
  '/products': { title: 'Products', sub: 'Manage your product catalog' },
  '/products/new': { title: 'Add Product', sub: 'Create a new product listing' },
  '/analytics': { title: 'Analytics', sub: 'Views, searches and trends' },
  '/shop': { title: 'Shop Profile', sub: 'Your shop details and gallery' },
  '/payments': { title: 'Payments', sub: 'Payouts and commission history' },
  '/notifications': { title: 'Notifications', sub: 'Push notification history' },
};

const AppLayout: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const vendor = useAppSelector((s) => s.auth.vendor);
  const unreadCount = useAppSelector((s) => s.notifications.unreadCount);
  const path = window.location.pathname;
  const pageInfo = PAGE_TITLES[path] || { title: 'Vendor Panel', sub: 'LocalShop' };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <div className="layout">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-mark">L</div>
          <div>
            <div className="logo-text">LocalShop</div>
            <div className="logo-badge">Vendor</div>
          </div>
        </div>
        <div className="sidebar-divider" />
        <nav className="sidebar-nav">
          {NAV.map((group) => (
            <div key={group.group} className="nav-group">
              <div className="nav-group-label">{group.group}</div>
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span>{item.label}</span>
                  {item.badge === 'unread' && unreadCount > 0 && (
                    <span className="nav-badge">{unreadCount}</span>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="vendor-card">
            <div className="vendor-avatar">
              {vendor?.name?.charAt(0).toUpperCase() || 'V'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="vendor-name">{vendor?.name || 'Vendor'}</div>
              <div className="vendor-email">{vendor?.email || ''}</div>
            </div>
            <button className="logout-btn" onClick={handleLogout} title="Logout">⏏</button>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="main-area">
        <header className="header">
          <div className="header-left">
            <div className="page-title">{pageInfo.title}</div>
            <div className="page-sub">{pageInfo.sub}</div>
          </div>
          <div className="header-right">
            <div className="search-box">
              <span style={{ color: 'var(--text-dim)', fontSize: 14 }}>🔍</span>
              <input placeholder="Search products..." />
            </div>
            <button className="icon-btn" onClick={() => navigate('/notifications')}>
              🔔
              {unreadCount > 0 && <span className="notif-dot" />}
            </button>
            <button className="icon-btn" onClick={() => navigate('/shop')}>⚙</button>
          </div>
        </header>

        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
