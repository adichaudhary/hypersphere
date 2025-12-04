// Auth manager
class AuthManager {
  constructor() {
    this.currentUser = this.loadUser();
  }

  loadUser() {
    const user = localStorage.getItem('tap_user');
    return user ? JSON.parse(user) : null;
  }

  saveUser(user) {
    localStorage.setItem('tap_user', JSON.stringify(user));
    this.currentUser = user;
  }

  logout() {
    localStorage.removeItem('tap_user');
    this.currentUser = null;
  }

  isAuthenticated() {
    return this.currentUser !== null;
  }

  getCurrentMerchantId() {
    return this.currentUser?.merchantId;
  }

  getCurrentEmail() {
    return this.currentUser?.email;
  }
}

// API client
class DashboardAPI {
  constructor(backendUrl) {
    this.backendUrl = backendUrl;
  }

  async getMerchantPayments(merchantId) {
    const response = await fetch(`${this.backendUrl}/merchants/${merchantId}/payments`);
    if (!response.ok) throw new Error('Failed to fetch payments');
    return response.json();
  }

  async getMerchantReport(merchantId) {
    const response = await fetch(`${this.backendUrl}/merchants/${merchantId}/dashboard/report`);
    if (!response.ok) throw new Error('Failed to fetch report');
    return response.json();
  }

  async linkToCircle(merchantId, name, email) {
    const response = await fetch(`${this.backendUrl}/merchants/${merchantId}/circle/link`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email }),
    });
    if (!response.ok) throw new Error('Failed to link Circle account');
    return response.json();
  }
}

// Global instances
const auth = new AuthManager();
const api = new DashboardAPI('http://localhost:3001');

// UI Controller
class DashboardController {
  constructor() {
    this.setupEventListeners();
    this.initializePage();
  }

  setupEventListeners() {
    // Auth forms
    document.getElementById('loginBtn')?.addEventListener('click', () => this.handleLogin());
    document.getElementById('signupBtn')?.addEventListener('click', () => this.handleSignup());
    document.getElementById('magicLinkBtn')?.addEventListener('click', () => this.handleMagicLink());
    document.getElementById('logoutBtn')?.addEventListener('click', () => this.handleLogout());

    // Dashboard actions
    document.getElementById('refreshBtn')?.addEventListener('click', () => this.refreshData());
    document.getElementById('linkCircleBtn')?.addEventListener('click', () => this.showCircleModal());
    document.getElementById('exportCsvBtn')?.addEventListener('click', () => this.exportCSV());
    document.getElementById('circleConfirmBtn')?.addEventListener('click', () => this.confirmCircleLink());
    document.getElementById('closCircleModalBtn')?.addEventListener('click', () => this.closeCircleModal());
  }

  initializePage() {
    if (auth.isAuthenticated()) {
      this.showDashboard();
      this.loadData();
    } else {
      this.showAuthPage();
    }
  }

  handleLogin() {
    const email = document.getElementById('loginEmail')?.value;
    const password = document.getElementById('loginPassword')?.value;

    if (!email || !password) {
      this.showError('Please fill in all fields');
      return;
    }

    // Simplified auth - in production use real backend auth
    const merchantId = this.generateMerchantId(email);
    auth.saveUser({ email, merchantId, authType: 'password' });
    this.showDashboard();
    this.loadData();
  }

  handleSignup() {
    const email = document.getElementById('signupEmail')?.value;
    const password = document.getElementById('signupPassword')?.value;
    const storeName = document.getElementById('storeName')?.value;

    if (!email || !password || !storeName) {
      this.showError('Please fill in all fields');
      return;
    }

    const merchantId = this.generateMerchantId(email);
    auth.saveUser({ 
      email, 
      merchantId, 
      storeName, 
      authType: 'password',
      createdAt: new Date().toISOString() 
    });
    this.showDashboard();
    this.loadData();
  }

  handleMagicLink() {
    const email = document.getElementById('magicLinkEmail')?.value;

    if (!email) {
      this.showError('Please enter your email');
      return;
    }

    // Simplified - in production send actual magic link
    const merchantId = this.generateMerchantId(email);
    auth.saveUser({ 
      email, 
      merchantId, 
      authType: 'magic_link',
      createdAt: new Date().toISOString() 
    });

    this.showSuccess('Magic link sent to ' + email);
    setTimeout(() => {
      this.showDashboard();
      this.loadData();
    }, 1500);
  }

  handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
      auth.logout();
      this.showAuthPage();
    }
  }

  async loadData() {
    const merchantId = auth.getCurrentMerchantId();
    if (!merchantId) return;

    try {
      document.getElementById('loadingContainer').style.display = 'block';
      document.getElementById('dashboardContent').style.display = 'none';

      const [payments, report] = await Promise.all([
        api.getMerchantPayments(merchantId),
        api.getMerchantReport(merchantId).catch(() => null), // Fallback if no Circle
      ]);

      this.displayData(payments, report);
      document.getElementById('loadingContainer').style.display = 'none';
      document.getElementById('dashboardContent').style.display = 'block';
    } catch (error) {
      this.showError(error.message);
      document.getElementById('loadingContainer').style.display = 'none';
    }
  }

  displayData(payments, report) {
    // User info
    document.getElementById('userEmail').textContent = auth.getCurrentEmail();
    document.getElementById('merchantId').textContent = auth.getCurrentMerchantId();

    // Metrics
    const totalPayments = payments.total_count || 0;
    const paidPayments = (payments.payments || []).filter(p => p.status === 'paid');
    const totalVolume = paidPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalVolumeSOL = totalVolume / 1_000_000;
    const totalVolumeUSD = totalVolumeSOL * 180; // $180 per SOL

    document.getElementById('totalVolume').textContent = totalVolumeSOL.toFixed(4);
    document.getElementById('usdEquivalent').textContent = totalVolumeUSD.toFixed(2);
    document.getElementById('transactionCount').textContent = paidPayments.length;
    document.getElementById('pendingCount').textContent = 
      (payments.payments || []).filter(p => p.status === 'pending').length;

    // Circle status
    if (report?.linked) {
      document.getElementById('circleStatus').textContent = '✅ Linked';
      document.getElementById('linkCircleBtn').textContent = '⚙️ Manage Circle';
      document.getElementById('circleBalance').textContent = '$' + (report.currentBalance || 0).toFixed(2);
      document.getElementById('circleInfo').style.display = 'block';
    } else {
      document.getElementById('circleStatus').textContent = '⭕ Not Linked';
      document.getElementById('linkCircleBtn').textContent = '🔗 Link Circle Account';
      document.getElementById('circleInfo').style.display = 'none';
    }

    // Payments table
    this.displayPaymentsTable(payments.payments || []);
  }

  displayPaymentsTable(payments) {
    const tbody = document.getElementById('paymentsTableBody');
    
    if (payments.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #999; padding: 20px;">No transactions yet</td></tr>';
      return;
    }

    tbody.innerHTML = payments
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 50)
      .map((payment, i) => `
        <tr>
          <td><code style="font-size: 11px;">${payment.id.substring(0, 12)}...</code></td>
          <td>◎ ${(payment.amount / 1_000_000).toFixed(4)}</td>
          <td>
            <span class="status-badge ${payment.status}">
              ${payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
            </span>
          </td>
          <td>${new Date(payment.created_at).toLocaleDateString()} ${new Date(payment.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
          <td>
            ${payment.tx_signature ? 
              `<a href="https://explorer.solana.com/tx/${payment.tx_signature}?cluster=devnet" target="_blank" style="color: #667eea; text-decoration: none; font-size: 11px;">View</a>` : 
              '-'
            }
          </td>
        </tr>
      `).join('');
  }

  showCircleModal() {
    document.getElementById('circleModal').style.display = 'flex';
    document.getElementById('circleEmail').value = auth.getCurrentEmail();
  }

  closeCircleModal() {
    document.getElementById('circleModal').style.display = 'none';
  }

  async confirmCircleLink() {
    const storeName = document.getElementById('circleStoreName').value;
    const email = document.getElementById('circleEmail').value;
    const merchantId = auth.getCurrentMerchantId();

    if (!storeName || !email) {
      this.showError('Please fill in all fields');
      return;
    }

    try {
      document.getElementById('circleConfirmBtn').disabled = true;
      await api.linkToCircle(merchantId, storeName, email);
      this.showSuccess('Circle account linked successfully!');
      this.closeCircleModal();
      this.loadData();
    } catch (error) {
      this.showError('Failed to link Circle: ' + error.message);
    } finally {
      document.getElementById('circleConfirmBtn').disabled = false;
    }
  }

  refreshData() {
    document.getElementById('refreshBtn').disabled = true;
    this.loadData();
    setTimeout(() => {
      document.getElementById('refreshBtn').disabled = false;
    }, 1000);
  }

  exportCSV() {
    const tbody = document.getElementById('paymentsTableBody');
    const rows = Array.from(tbody.querySelectorAll('tr'));

    if (rows.length === 0) {
      this.showError('No transactions to export');
      return;
    }

    let csv = 'Payment ID,Amount (SOL),Status,Date,TX Signature\n';
    rows.forEach(row => {
      const cells = row.querySelectorAll('td');
      if (cells.length === 5) {
        const id = cells[0].textContent.trim();
        const amount = cells[1].textContent.trim();
        const status = cells[2].textContent.trim();
        const date = cells[3].textContent.trim();
        const tx = cells[4].textContent.trim();
        csv += `"${id}","${amount}","${status}","${date}","${tx}"\n`;
      }
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    this.showSuccess('CSV exported successfully');
  }

  showAuthPage() {
    document.getElementById('authContainer').style.display = 'flex';
    document.getElementById('dashboardContainer').style.display = 'none';
  }

  showDashboard() {
    document.getElementById('authContainer').style.display = 'none';
    document.getElementById('dashboardContainer').style.display = 'flex';
  }

  showError(message) {
    const alert = document.createElement('div');
    alert.className = 'alert alert-error';
    alert.textContent = message;
    document.body.appendChild(alert);
    setTimeout(() => alert.remove(), 4000);
  }

  showSuccess(message) {
    const alert = document.createElement('div');
    alert.className = 'alert alert-success';
    alert.textContent = message;
    document.body.appendChild(alert);
    setTimeout(() => alert.remove(), 3000);
  }

  generateMerchantId(email) {
    return 'merchant-' + email.split('@')[0] + '-' + Math.random().toString(36).substr(2, 9);
  }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
  new DashboardController();
});
