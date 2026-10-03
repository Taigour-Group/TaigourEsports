import { adminFetch } from './adminAuth';

class BalanceService {
  constructor() {
    this.playerBalanceCache = new Map();
    this.playerBalanceRequests = new Map();
    this.transactionHistoryCache = new Map();
    this.transactionHistoryRequests = new Map();
  }

  // Get player balance and membership info
  async getPlayerBalance(userId, { refresh = false } = {}) {
    if (!userId) return { error: new Error('A user ID is required to fetch balance') };

    if (!refresh && this.playerBalanceCache.has(userId)) {
      return { data: this.playerBalanceCache.get(userId) };
    }

    if (!refresh && this.playerBalanceRequests.has(userId)) {
      return this.playerBalanceRequests.get(userId);
    }

    const request = this.fetchPlayerBalance(userId, refresh);
    if (!refresh) this.playerBalanceRequests.set(userId, request);

    try {
      return await request;
    } finally {
      if (this.playerBalanceRequests.get(userId) === request) {
        this.playerBalanceRequests.delete(userId);
      }
    }
  }

  async fetchPlayerBalance(userId, refresh) {
    try {
      const response = await fetch(`/api/balance/${userId}`, {
        cache: refresh ? 'no-store' : 'no-cache'
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to fetch balance');
      this.playerBalanceCache.set(userId, result);
      window.dispatchEvent(new CustomEvent('player-balance-updated', {
        detail: { userId, data: result }
      }));
      return { data: result };
    } catch (error) {
      console.error('Error in getPlayerBalance:', error);
      return { error };
    }
  }

  invalidatePlayerBalance(userId) {
    if (userId) this.playerBalanceCache.delete(userId);
  }

  // Get transaction history
  async getTransactionHistory(userId, limit = 50, { refresh = false } = {}) {
    const cacheKey = `${userId}:${limit}`;
    if (!refresh && this.transactionHistoryCache.has(cacheKey)) {
      return { data: this.transactionHistoryCache.get(cacheKey) };
    }

    if (!refresh && this.transactionHistoryRequests.has(cacheKey)) {
      return this.transactionHistoryRequests.get(cacheKey);
    }

    const request = this.fetchTransactionHistory(userId, limit, cacheKey, refresh);
    if (!refresh) this.transactionHistoryRequests.set(cacheKey, request);

    try {
      return await request;
    } finally {
      if (this.transactionHistoryRequests.get(cacheKey) === request) {
        this.transactionHistoryRequests.delete(cacheKey);
      }
    }
  }

  async fetchTransactionHistory(userId, limit, cacheKey, refresh) {
    try {
      const response = await fetch(`/api/transactions/${userId}?limit=${limit}`, {
        cache: refresh ? 'no-store' : 'no-cache'
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to fetch transactions');
      const data = result || [];
      this.transactionHistoryCache.set(cacheKey, data);
      return { data };
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return { error };
    }
  }

  // Admin: Get all wallets + profiles + memberships
  async getAllPlayerBalances(limit = 100, offset = 0) {
    try {
      const response = await adminFetch(`/api/admin/wallets?limit=${limit}&offset=${offset}`);
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Failed to fetch admin wallets');

      const rows = (result?.data || []).map(r => ({
        user_id: r.user_id,
        balance: Number(r.available_balance || 0),
        locked_balance: Number(r.locked_balance || 0),
        status: r.status || 'active',
        membership_tier: r.membership_tier || 'none',
        membership_expires_at: r.membership_expires_at || null,
        total_spent: Number(r.total_spent || 0),
        created_at: r.created_at,
        profiles: r.profiles || {}
      }));

      return { data: rows };
    } catch (error) {
      console.error('Error fetching all balances:', error);
      return { error };
    }
  }

  // Admin: Update player balance directly via secure backend API
  async adminUpdateBalance(userId, newBalance, reason = 'Admin adjustment') {
    try {
      const response = await adminFetch(`/api/admin/player/${userId}/balance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newBalance, reason })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Failed to update balance');
      this.invalidatePlayerBalance(userId);
      return { data: result.data };
    } catch (error) {
      console.error('Error in adminUpdateBalance:', error);
      return { error };
    }
  }

  // Admin: Update membership via secure backend API
  async adminUpdateMembership(userId, membershipTier, durationDays = 30) {
    try {
      const response = await adminFetch(`/api/admin/player/${userId}/membership`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ membershipTier, durationDays })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Failed to update membership');
      this.invalidatePlayerBalance(userId);
      return { data: result.data };
    } catch (error) {
      console.error('Error in adminUpdateMembership:', error);
      return { error };
    }
  }

  // Admin: Update player profile stats via secure backend API
  async adminUpdatePlayerStats(userId, profileUpdates) {
    try {
      const response = await adminFetch(`/api/admin/player/${userId}/stats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileUpdates)
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Failed to update stats');
      return { data: result.data };
    } catch (error) {
      console.error('Error in adminUpdatePlayerStats:', error);
      return { error };
    }
  }

  // Fetch membership tiers and recharge packages from the backend catalog endpoint
  async getCatalog() {
    try {
      const response = await fetch('/api/catalog');
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.error || `Failed to fetch catalog (${response.status})`);
      if (!result) throw new Error('Invalid catalog response');
      return { data: result };
    } catch (error) {
      console.error('Error fetching catalog:', error);
      return { error };
    }
  }
}

export const balanceService = new BalanceService();
