import React, { useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Bell, Settings, LogOut, HelpCircle } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { logout } from '../../features/auth/authSlice';
import { fetchMyShop } from '../../features/shop/shopSlice';
import ThemeToggle from '../common/ThemeToggle';

const NAV = [
  {
    group: 'Main',
    items: [
      { to: '/dashboard', icon: 'D', label: 'Dashboard' },
      { to: '/products', icon: 'P', label: 'Products' },
      { to: '/analytics', icon: 'A', label: 'Analytics' },
      { to: '/marketplace', icon: 'M', label: 'Marketplace' },
      { to: '/promotions', icon: '📢', label: 'Promotions' },
      { to: '/sponsorships', icon: '⭐', label: 'Sponsorship' },
    ],
  },
  {
    group: 'Feedback',
    items: [
      { to: '/reviews/shop', icon: 'S', label: 'Shop Reviews' },
      { to: '/reviews', icon: 'R', label: 'Product Reviews' },
      { to: '/help', icon: 'H', label: 'Help & Feedback' },
    ],
  },
  {
    group: 'Account',
    items: [
      { to: '/shop', icon: 'S', label: 'Shop Profile' },
      { to: '/marketplace/settings', icon: 'U', label: 'Storefront Editor' },
      { to: '/payments', icon: 'M', label: 'Payments' },
      { to: '/notifications', icon: 'N', label: 'Notifications', badge: 'unread' },
      { to: '/settings', icon: 'T', label: 'Settings' },
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
  '/marketplace': { title: 'My Storefront', sub: 'Preview and manage your live storefront' },
  '/marketplace/settings': { title: 'Storefront Editor', sub: 'Customize, preview and publish your store' },
  '/reviews': { title: 'Product Reviews', sub: 'Customer feedback across your product catalog' },
  '/reviews/shop': { title: 'Shop Reviews', sub: 'General feedback about your shop and service' },
  '/help': { title: 'Help & Feedback', sub: 'Report issues and share suggestions with our team' },
  '/promotions': { title: 'Promotions', sub: 'Sponsor your products to boost visibility' },
  '/sponsorships': { title: 'Sponsorship', sub: 'Apply for vendor sponsorship to boost your shop visibility' },
};

const AppLayout: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const vendor = useAppSelector((s) => s.auth.vendor);
  const shopLogo = useAppSelector((s) => s.shop?.data?.logo_url);
  const unreadCount = useAppSelector((s) => s.notifications?.unreadCount ?? 0);
  const pageInfo = PAGE_TITLES[location.pathname] || { title: 'Vendor Panel', sub: 'LocalShop' };

  useEffect(() => { dispatch(fetchMyShop()); }, [dispatch]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
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
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                  <span className="nav-icon">
                    {item.to === '/help'
                      ? <HelpCircle size={15} strokeWidth={1.8} />
                      : item.icon}
                  </span>
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
            <div className="vendor-avatar" style={{ overflow: 'hidden', padding: 0 }}>
              {shopLogo
                ? <img src={shopLogo} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : vendor?.name?.charAt(0).toUpperCase() || 'V'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="vendor-name">{vendor?.name || 'Vendor'}</div>
              <div className="vendor-email">{vendor?.email || ''}</div>
            </div>
            <button className="logout-btn" onClick={handleLogout} title="Logout">
              <LogOut size={15} strokeWidth={1.8} />
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
            <ThemeToggle />
            <button className="icon-btn" onClick={() => navigate('/notifications')} title="Notifications">
              <Bell size={17} strokeWidth={1.8} />
              {unreadCount > 0 && <span className="notif-dot" />}
            </button>
            <button className="icon-btn" onClick={() => navigate('/settings')} title="Settings">
              <Settings size={17} strokeWidth={1.8} />
            </button>
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
