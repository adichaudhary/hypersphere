# Frontend Setup Instructions

## How to Run the Frontend Locally

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or yarn package manager

### Steps

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Access the application:**
   - The frontend will be available at: `http://localhost:5173`
   - Open your browser and navigate to this URL
   - You'll see the merchant dashboard with the Analytics page

### Available Pages
- **Overview** - Dashboard overview with metrics
- **Analytics** - Merchant analysis page with charts and statistics
- **Payments** - Payment history and details
- **Balances** - Balance information by chain
- **Devices** - Device management
- **Settings** - Merchant settings

### Backend Connection
The frontend connects to the backend API. Make sure your backend is running on:
- Default: `http://localhost:3001`
- Or set `VITE_API_URL` environment variable to point to your backend

### Building for Production
```bash
npm run build
```

The built files will be in the `dist` directory.

