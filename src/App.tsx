import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { store } from './app/store';
import { fetchMeThunk } from './features/auth/authSlice';
import { ProtectedRoute } from './components/common';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './features/auth/LoginPage';
import ProductsPage from './features/products/ProductsPage';
import ProductFormPage from './features/products/ProductFormPage';
import ShopPage from './features/shop/ShopPage';
import { PaymentsPage } from './features/payments/PaymentsPage';
import NotificationsPage from './features/notifications/NotificationsPage';
import SettingsPage from './features/settings/SettingsPage';
import MarketplacePage from './features/marketplace/MarketplacePage';
import MarketplaceSettingsPage from './features/marketplace/MarketplaceSettingsPage';
import PublicVendorPage from './features/public/PublicVendorPage';
import VendorAllProductsPage from './features/public/VendorAllProductsPage';
import AnalyticsPage from './features/analytics/AnalyticsPage';
import ReviewsPage from './features/reviews/ReviewsPage';
import HelpFeedbackPage from './features/help/HelpFeedbackPage';
import { useAppDispatch } from './hooks/redux';
import './styles/global.css';

// Init: fetch current vendor session on app load
const AppInit: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useAppDispatch();
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) dispatch(fetchMeThunk());
  }, [dispatch]);
  return <>{children}</>;
};

const App: React.FC = () => (
  <Provider store={store}>
    <BrowserRouter>
      <AppInit>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/vendor/:vendorId" element={<PublicVendorPage />} />
          <Route path="/vendor/:vendorId/products" element={<VendorAllProductsPage />} />

          {/* Protected */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<AnalyticsPage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/products/new" element={<ProductFormPage />} />
              <Route path="/products/:id/edit" element={<ProductFormPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/shop" element={<ShopPage />} />
              <Route path="/payments" element={<PaymentsPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/marketplace" element={<MarketplacePage />} />
              <Route path="/marketplace/settings" element={<MarketplaceSettingsPage />} />
              <Route path="/reviews" element={<ReviewsPage />} />
              <Route path="/help" element={<HelpFeedbackPage />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>

        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'var(--surface2)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              fontFamily: 'var(--body)',
              fontSize: '13.5px',
              borderRadius: '10px',
            },
            success: { iconTheme: { primary: 'var(--green)', secondary: '#fff' } },
            error: { iconTheme: { primary: 'var(--red)', secondary: '#fff' } },
          }}
        />
      </AppInit>
    </BrowserRouter>
  </Provider>
);

export default App;
