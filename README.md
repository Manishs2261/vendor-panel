# LocalShop Vendor Panel

Production-ready React + TypeScript vendor dashboard for the LocalShop platform.

## Quick Start

```bash
cp .env.example .env
# Fill in your API URL and Firebase credentials
npm install
npm start
```

## Project Structure

```
src/
├── api/
│   ├── client.ts          # Axios instance + JWT auto-refresh interceptor
│   └── services.ts        # All API modules (auth, shop, product, analytics, payments, notifications)
├── app/
│   └── store.ts           # Redux store with all slices
├── components/
│   ├── common/
│   │   ├── index.tsx      # ProtectedRoute, StatusBadge, Pagination, Modal, ConfirmDialog, Spinner
│   │   └── DataTable.tsx  # Generic reusable data table with selection
│   └── layout/
│       └── AppLayout.tsx  # Sidebar + Header shell
├── features/
│   ├── auth/
│   │   ├── authSlice.ts   # Login, register, Google, OTP, token management
│   │   └── LoginPage.tsx  # Login/Register/OTP UI
│   ├── dashboard/
│   │   ├── dashboardSlice.ts
│   │   └── DashboardPage.tsx  # Stats, chart, completion card, recent products
│   ├── products/
│   │   ├── productSlice.ts    # Full CRUD + bulk actions + filters
│   │   ├── ProductsPage.tsx   # Table with filters, bulk actions, delete
│   │   └── ProductFormPage.tsx # Add/Edit form with image upload, variations, map
│   ├── analytics/
│   │   ├── analyticsSlice.ts
│   │   └── AnalyticsPage.tsx  # Views/Clicks chart, top products, top cities
│   ├── shop/
│   │   ├── shopSlice.ts
│   │   └── ShopPage.tsx       # Shop details, media upload, OTP verification
│   ├── payments/
│   │   ├── paymentSlice.ts
│   │   └── PaymentsPage.tsx   # Commission info, payout history
│   ├── notifications/
│   │   ├── notificationSlice.ts
│   │   └── NotificationsPage.tsx
│   └── slices.ts              # Analytics, Dashboard, Payment, Notification slices
├── hooks/
│   └── redux.ts           # Typed useAppDispatch + useAppSelector
├── styles/
│   └── global.css         # Full design system (CSS variables, components)
├── types/
│   └── index.ts           # All TypeScript interfaces
├── utils/
│   └── firebase.ts        # Firebase + Google Auth + FCM setup
├── App.tsx                # Router with protected routes
└── index.tsx              # Entry point
```

## Features

### Authentication
- Email/password login
- Google OAuth via Firebase
- Register + Email OTP verification
- JWT token with auto-refresh interceptor
- Persistent session via localStorage

### Dashboard
- Shop completion score with animated ring
- 5 stat cards with trends
- Weekly views area chart (Recharts)
- Quick actions panel
- Recent products table

### Product Management
- Full CRUD with image + video upload
- Drag & drop image upload
- Color variation system
- Tags input
- Category/subcategory select
- Bulk actions (activate/deactivate/delete)
- Multi-select with checkbox
- Advanced filters (search, status, category)
- Pagination

### Analytics
- Views & Clicks area chart
- Monthly growth bar chart
- Top 5 products by views
- Top cities pie chart
- Period selector (7d/30d/90d/1y)

### Shop Profile
- Tabbed UI (Details / Media / Location)
- Logo + Banner + Gallery upload
- Phone OTP verification flow
- Email OTP verification flow
- GST number, business type
- State + city + postal code

### Payments
- Commission rate display
- Total earned / paid / pending cards
- Razorpay payout history table

### Notifications
- FCM notification history
- Mark read / mark all read
- Type badges (ORDER/PAYMENT/PRODUCT/SYSTEM)

## API Endpoints Required

```
POST /auth/login/vendor
POST /auth/register/vendor
POST /auth/google/vendor
POST /auth/otp/email/send
POST /auth/otp/email/verify
POST /auth/otp/phone/send
POST /auth/otp/phone/verify
POST /auth/refresh
GET  /auth/me
GET  /vendor/dashboard
GET  /vendor/shop
POST /vendor/shop
PUT  /vendor/shop
POST /vendor/shop/logo
POST /vendor/shop/banner
POST /vendor/shop/gallery
GET  /vendor/products
POST /vendor/products
GET  /vendor/products/:id
PUT  /vendor/products/:id
DELETE /vendor/products/:id
POST /vendor/products/bulk-delete
POST /vendor/products/bulk-status
GET  /vendor/analytics
GET  /vendor/payouts
GET  /vendor/commission
GET  /vendor/notifications
PUT  /vendor/notifications/:id/read
PUT  /vendor/notifications/read-all
GET  /categories
```
