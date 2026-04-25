import React from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { logout } from '../../features/auth/authSlice';

const APP_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
const MARKETPLACE_URL = `${APP_BASE_URL}/marketplace`;
const MARKETPLACE_SETTINGS_URL = `${APP_BASE_URL}/settings/marketplace`;

const NAV = [
  {
    group: 'Main',
    items: [
      { to: '/dashboard', icon: 'D', label: 'Dashboard' },
      { to: '/products', icon: 'P', label: 'Products' },
      { to: '/analytics', icon: 'A', label: 'Analytics' },
      { to: MARKETPLACE_URL, icon: 'M', label: 'Marketplace', external: true },
    ],
  },
  {
    group: 'Account',
    items: [
      { to: '/shop', icon: 'S', label: 'Shop Profile' },
      { to: '/payments', icon: 'M', label: 'Payments' },
      { to: '/notifications', icon: 'N', label: 'Notifications', badge: 'unread' },
      { to: '/settings', icon: 'T', label: 'Settings' },
      { to: MARKETPLACE_SETTINGS_URL, icon: 'U', label: 'Marketplace Settings', external: 'session' },
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
  '/settings': { title: 'Settings', sub: 'Account access and session controls' },
};

const AppLayout: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const vendor = useAppSelector((s) => s.auth.vendor);
  const unreadCount = useAppSelector((s) => s.notifications?.unreadCount ?? 0);
  const pageInfo = PAGE_TITLES[location.pathname] || { title: 'Vendor Panel', sub: 'LocalShop' };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const buildExternalHref = (item: { to: string; external?: boolean | string }) => {
    if (item.external === 'session') {
      const token = localStorage.getItem('access_token');
      if (token) return `${item.to}?token=${encodeURIComponent(token)}`;
    }
    return item.to;
  };

  return (
    <div className="layout">
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
                item.external ? (
                  <a
                    key={item.label}
                    href={buildExternalHref(item)}
                    className="nav-link"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span className="nav-icon">{item.icon}</span>
                    <span>{item.label}</span>
                  </a>
                ) : (
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
                )
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
            <button className="logout-btn" onClick={handleLogout} title="Logout">
              X
            </button>
          </div>
        </div>
      </aside>

      <div className="main-area">
        <header className="header">
          <div className="header-left">
            <div className="page-title">{pageInfo.title}</div>
            <div className="page-sub">{pageInfo.sub}</div>
          </div>

          <div className="header-right">
            <div className="search-box">
              <span style={{ color: 'var(--text-dim)', fontSize: 14 }}>S</span>
              <input placeholder="Search products..." />
            </div>
            <button className="icon-btn" onClick={() => navigate('/notifications')}>
              N
              {unreadCount > 0 && <span className="notif-dot" />}
            </button>
            <button className="icon-btn" onClick={() => navigate('/settings')}>T</button>
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
