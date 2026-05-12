import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import shopReducer from '../features/shop/shopSlice';
import productReducer from '../features/products/productSlice';
import analyticsReducer from '../features/analytics/analyticsSlice';
import paymentReducer from '../features/payments/paymentSlice';
import notificationReducer from '../features/notifications/notificationSlice';
import dashboardReducer from '../features/dashboard/dashboardSlice';
import reviewReducer from '../features/reviews/reviewSlice';
import helpReducer from '../features/help/helpSlice';
import sponsorshipReducer from '../features/sponsorship/sponsorshipSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    shop: shopReducer,
    products: productReducer,
    analytics: analyticsReducer,
    payments: paymentReducer,
    notifications: notificationReducer,
    dashboard: dashboardReducer,
    reviews: reviewReducer,
    help: helpReducer,
    sponsorship: sponsorshipReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
