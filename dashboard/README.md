# Merchant Dashboard

Beautiful web dashboard for Solana tap-to-pay merchants.

## Features

✅ **Authentication**
- Email/password login & signup
- Magic link authentication
- LocalStorage-based session (in production, use real auth backend)

✅ **Dashboard Metrics**
- Total USDC volume (in SOL)
- USD equivalent value
- Completed & pending payment counts
- Circle account status & balance

✅ **Transactions Table**
- Payment ID, amount, status
- Transaction date & time
- Link to Solana Explorer for TX signatures
- Real-time status updates

✅ **Circle Integration**
- Modal to link Circle account
- Display current balance
- View account status

✅ **Data Export**
- Export transactions to CSV
- Includes all payment details

✅ **Responsive Design**
- Mobile-friendly layout
- Works on all screen sizes

## Setup

```bash
cd dashboard
npm install
npm start
```

Open `http://localhost:3000`

## Configuration

Update backend URL in `app.js`:
```javascript
const api = new DashboardAPI('http://localhost:3001');
```

## Authentication Flow

1. **Sign Up**: Enter store name, email, password
2. **Sign In**: Enter email and password
3. **Magic Link**: Enter email, receive instant access
4. Session stored in localStorage

*Note: In production, implement real backend authentication with secure token management.*

## Data Sources

- `GET /merchants/:id/payments` - Transaction list
- `GET /merchants/:id/dashboard/report` - Metrics & Circle data
- `POST /merchants/:id/circle/link` - Link Circle account

## Export Format

CSV with columns:
- Payment ID
- Amount (SOL)
- Status
- Date
- TX Signature

## Components

- **AuthManager** - Handle login/logout
- **DashboardAPI** - Backend API calls
- **DashboardController** - UI logic & interactions

All data is fetched client-side from backend endpoints.

## Testing

1. Sign up with any email/password
2. Dashboard shows test merchant payments
3. Click "Link Circle Account" to connect
4. Export CSV to download transactions
5. Refresh button updates all data
