import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import shopReducer from '../features/shop/shopSlice';
import productReducer from '../features/products/productSlice';
import analyticsReducer from '../features/analytics/analyticsSlice';
import paymentReducer from '../features/payments/paymentSlice';
import notificationReducer from '../features/notifications/notificationSlice';
import dashboardReducer from '../features/dashboard/dashboardSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    shop: shopReducer,
    products: productReducer,
    analytics: analyticsReducer,
    payments: paymentReducer,
    notifications: notificationReducer,
    dashboard: dashboardReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
