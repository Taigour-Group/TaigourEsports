<<<<<<< HEAD
﻿import React, { useState, useEffect } from 'react';
=======
import React, { useState, useEffect } from 'react';
>>>>>>> 4d66377e1ff24fddce9d174c2e58bdacb49bae89
import ErrorBox from './ErrorBox.jsx';
import { balanceService } from '../services/balanceService';
import { MEMBERSHIP_BENEFITS, MEMBERSHIP_TIERS, RECHARGE_PACKAGES, ADMIN_WHATSAPP, REQUEST_TYPES, REQUEST_STATUS } from '../constants/balanceConstants';
import { useAuth } from '../context/AuthContext';

const PlayerBalance = () => {
  const { user, profile } = useAuth();
  const [playerBalance, setPlayerBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('balance');
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [showMembershipModal, setShowMembershipModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [selectedMembership, setSelectedMembership] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [catalogMemberships, setCatalogMemberships] = useState(MEMBERSHIP_BENEFITS);
  const [catalogRechargePackages, setCatalogRechargePackages] = useState(RECHARGE_PACKAGES);
  const [transferForm, setTransferForm] = useState({ to_player_id: '', amount: '' });
  const [transferLoading, setTransferLoading] = useState(false);
  const [errorBox, setErrorBox] = useState(null);
  const [successBox, setSuccessBox] = useState(null);
  const [requestInfo, setRequestInfo] = useState({
    whatsapp_number: '',
    payment_method: 'esewa',
    payment_account_number: '',
    payment_account_owner: '',
    players_id: profile?.player_id || ''
  });

  useEffect(() => {
    setCatalogMemberships(MEMBERSHIP_BENEFITS);
    setCatalogRechargePackages(RECHARGE_PACKAGES);
  }, []);

  useEffect(() => {
    if (user) {
      fetchBalance();
    }
  }, [user]);

  useEffect(() => {
    // Pre-fill WhatsApp from profile contact if available (best effort)
    if (profile?.contact_info && !requestInfo.whatsapp_number) {
      setRequestInfo(prev => ({ ...prev, whatsapp_number: profile.contact_info }));
    }
  }, [profile]);

  const fetchBalance = async (manual = false) => {
    if (!user) return;
    if (manual) setRefreshing(true);
    else setLoading(true);
    try {
      const { data, error } = await balanceService.getPlayerBalance(user.id);
      if (!error && data) {
        setPlayerBalance(data);
      }
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    } finally {
      if (manual) setRefreshing(false);
      else setLoading(false);
    }
  };

  const fetchHistory = async () => {
    if (!user) return;
    setHistoryLoading(true);
    try {
      const { data, error } = await balanceService.getTransactionHistory(user.id, 30);
      if (!error) setHistory(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to fetch history:', e);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'history') fetchHistory();
  }, [activeTab]);

  const handleRechargeClick = (pkg) => {
    setSelectedPackage(pkg);
    setShowRechargeModal(true);
  };

  const submitRechargeRequest = async () => {
    if (!selectedPackage || !user) return;
    if (!requestInfo.whatsapp_number || !requestInfo.payment_account_number || !requestInfo.payment_account_owner || !requestInfo.players_id) {
      setErrorBox('Please enter WhatsApp number, payment account number, and owner name.');
      return;
    }
    
    try {
      const response = await fetch('/api/purchase-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          user_email: user.email,
          user_name: user.user_metadata?.full_name || 'Player',
          type: REQUEST_TYPES.RECHARGE,
          // Backend expects amount (total credited) + package_amount/bonus_amount
          amount: selectedPackage.amount + selectedPackage.bonus,
          package_amount: selectedPackage.amount,
          bonus_amount: selectedPackage.bonus,
          cost: selectedPackage.cost,
          description: `Recharge request for ◈${selectedPackage.amount} + ◈${selectedPackage.bonus} bonus`,
          whatsapp_number: requestInfo.whatsapp_number,
          payment_method: requestInfo.payment_method,
          payment_account_number: requestInfo.payment_account_number,
          payment_account_owner: requestInfo.payment_account_owner,
          players_id: requestInfo.players_id
        })
      });

      if (!response.ok) throw new Error('Failed to submit request');

      setSuccessBox('Request submitted! Please contact us on WhatsApp to confirm payment. Our admin will verify and add your balance shortly.');
      setShowRechargeModal(false);
      setSelectedPackage(null);
    } catch (error) {
      console.error('Error:', error);
      setErrorBox('Failed to submit request. Please try again.');
    }
  };

  const submitMembershipRequest = async () => {
    if (!selectedMembership || !user) return;
    if (!requestInfo.whatsapp_number || !requestInfo.payment_account_number || !requestInfo.payment_account_owner || !requestInfo.players_id) {
      setErrorBox('Please enter WhatsApp number, payment account number, and owner name.');
      return;
    }

    try {
      const response = await fetch('/api/purchase-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          user_email: user.email,
          user_name: user.user_metadata?.full_name || 'Player',
          type: REQUEST_TYPES.MEMBERSHIP,
          tier: selectedMembership,
          amount: MEMBERSHIP_BENEFITS[selectedMembership].price,
          duration_days: 30,
          description: `Membership request for ${MEMBERSHIP_BENEFITS[selectedMembership].name} (◈${MEMBERSHIP_BENEFITS[selectedMembership].price})`,
          whatsapp_number: requestInfo.whatsapp_number,
          payment_method: requestInfo.payment_method,
          payment_account_number: requestInfo.payment_account_number,
          payment_account_owner: requestInfo.payment_account_owner,
          players_id: requestInfo.players_id
        })
      });

      if (!response.ok) throw new Error('Failed to submit request');

      setSuccessBox(`Request submitted! Please contact us on WhatsApp to confirm payment. Our admin will verify and activate ${MEMBERSHIP_BENEFITS[selectedMembership].name} for you shortly.`);
      setShowMembershipModal(false);
      setSelectedMembership(null);
    } catch (error) {
      console.error('Error:', error);
      setErrorBox('Failed to submit request. Please try again.');
    }
  };

  const openWhatsAppChat = () => {
    const message = encodeURIComponent(
      `Hi! I'm interested in purchasing recharge/membership packages. Please assist me.`
    );
    window.open(`https://wa.me/${ADMIN_WHATSAPP.number.replace('+', '')}?text=${message}`, '_blank');
  };

  const getMembershipExpiry = () => {
    if (!playerBalance?.membership_expires_at) return null;
    const date = new Date(playerBalance.membership_expires_at);
    return date.toLocaleDateString();
  };

  const submitTransfer = async () => {
    if (!user) return;
    const fromPlayerId = profile?.player_id;
    const toPlayerId = (transferForm.to_player_id || '').trim();
    const amt = Number(transferForm.amount);

    if (!fromPlayerId) {
      setErrorBox('Your Player ID is missing. Please update your profile first.');
      return;
    }
    if (!toPlayerId) {
      setErrorBox('Receiver Player ID is required.');
      return;
    }
    if (!Number.isFinite(amt) || amt <= 0) {
      setErrorBox('Enter a valid amount.');
      return;
    }

    setTransferLoading(true);
    try {
      const response = await fetch('/api/wallet/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from_player_id: fromPlayerId,
          to_player_id: toPlayerId,
          amount: amt,
          request_id: `${fromPlayerId}:${toPlayerId}:${Date.now()}`,
          description: 'Player transfer'
        })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Transfer failed');

      setSuccessBox('Transfer successful!');
      setTransferForm({ to_player_id: '', amount: '' });
      await fetchBalance();
      if (activeTab === 'history') await fetchHistory();
    } catch (e) {
      console.error(e);
      setErrorBox(e.message || 'Transfer failed');
    } finally {
      setTransferLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4 md:p-8">
        <i className="fa-solid fa-spinner fa-spin text-primary text-2xl mr-3"></i>
        <span className="text-gray-400">Loading balance...</span>
      </div>
    );
  }

  return (
<<<<<<< HEAD
    <div className="space-y-4">
=======
    <div className="space-y-6">
>>>>>>> 4d66377e1ff24fddce9d174c2e58bdacb49bae89
      {errorBox && (
        <ErrorBox message={errorBox} onClose={() => setErrorBox(null)} type="error" />
      )}
      {successBox && (
        <ErrorBox message={successBox} onClose={() => setSuccessBox(null)} type="success" />
      )}
<<<<<<< HEAD

      
        <div className="mb-4 flex flex-col gap-3 border-b border-cyann pb-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="font-space text-xl font-black uppercase tracking-[0.12em] text-white">Wallet &amp; Membership</h2>
            <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-slate-400">Manage your balance, membership and recharge options.</p>
          </div>
          <div className="min-w-[180px] rounded-lg border border-cyann bg-[#061521] p-2 text-left md:text-right">
            <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">Membership status</div>
            <div className={`inline-flex items-center justify-center bg-[#061925] px-3 text-base font-bold md:text-lg ${playerBalance?.membership_tier === 'none' ? 'text-gray-400' : 'text-yellow-400'}`}>
              {catalogMemberships[playerBalance?.membership_tier]?.name || 'Free Player'}
            </div>
            {playerBalance?.membership_expires_at && playerBalance?.membership_tier !== 'none' && (
              <div className="text-xs text-slate-500">Expires: {getMembershipExpiry()}</div>
=======
      {/* Main Balance Card */}
      <div className="bg-gradient-to-br from-primary/20 to-pink/10 border border-primary/30 rounded-2xl p-3 md:p-5">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-gray-400 text-[12px] md:text-sm uppercase md:tracking-widest tracking-[0.4px]">Available Balance</h3>
            <div className="flex flex-row center text-[16px] md:text-4xl font-orbitron font-black text-primary">
              ◈ {playerBalance?.balance?.toLocaleString() || '0'} TGC
          <button
            onClick={() => fetchBalance(true)}
            disabled={refreshing || loading}
            className={`text-white ml-1 md:ml-3 rounded-lg transition-all text-[15px] md:text-sm ${refreshing || loading ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            <i className={`fa-solid fa-sync mr-2 ${refreshing ? 'animate-spin' : ''}`}></i>
          </button>
          </div>
            
          </div>
          <div className="text-right">
            <div className="text-gray-400 text-[12px] md:text-sm uppercase md:tracking-widest tracking-[0.4px]">Membership Status</div>
            <div className={`text-lg font-bold ${
              playerBalance?.membership_tier === 'none' 
                ? 'text-gray-400' 
                : 'text-yellow-400'
            }`}>
              {catalogMemberships[playerBalance?.membership_tier]?.name || 'Free Player'}
            </div>
            {playerBalance?.membership_expires_at && playerBalance?.membership_tier !== 'none' && (
              <div className="text-xs text-gray-500 mt-1">
                Expires: {getMembershipExpiry()}
              </div>
>>>>>>> 4d66377e1ff24fddce9d174c2e58bdacb49bae89
            )}
          </div>
        </div>

<<<<<<< HEAD
        <div className="mb-4 rounded-lg border border-cyann bg-[#071925] p-4 md:p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-[9px] font-bold uppercase tracking-[0.22em] text-slate-400">Available balance</div>
              <div className="mt-2 flex items-center gap-3">
                <div className="font-orbitron text-2xl font-black text-[#2ce9ff] md:text-4xl">◈ {playerBalance?.balance?.toLocaleString() || '0'}</div>
                <span className="font-space text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">TGC</span>
                <button
                  type="button"
                  onClick={() => fetchBalance(true)}
                  disabled={refreshing || loading}
                  className={`rounded-lg text-sm text-white transition-all ${refreshing || loading ? 'cursor-not-allowed opacity-60' : 'hover:text-cyan'}`}
                  aria-label="Refresh balance"
                >
                  <i className={`fa-solid fa-rotate ${refreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => setShowRechargeModal(true)}
                className="rounded-md bg-cyan-400 px-4 bg-cyan py-2 font-space text-[10px] font-black uppercase tracking-[0.18em] text-[#041018] transition-all hover:bg-white"
              >
                <i className="fa-solid fa-wallet mr-2" />Recharge Account
              </button>
              <button
                type="button"
                onClick={() => setShowMembershipModal(true)}
                className="rounded-md border border-cyann bg-cyan-400/5 px-4 py-2 font-space text-[10px] font-black uppercase tracking-[0.18em] text-white transition-all hover:border-cyann hover:text-cyan"
              >
                <i className="fa-solid fa-crown mr-2" />Get Membership
              </button>
            </div>
          </div>
        </div>

        <div className="no-scrollbar mb-4 flex overflow-x-auto border-b border-cyann">
          {[
            { key: 'balance', label: 'Recharge', icon: 'fa-money-bill' },
            { key: 'membership', label: 'Membership', icon: 'fa-crown' },
            { key: 'stats', label: 'Stats', icon: 'fa-chart-pie' },
            { key: 'transfer', label: 'Transfer', icon: 'fa-paper-plane' },
            { key: 'history', label: 'History', icon: 'fa-clock-rotate-left' },
            { key: 'store', label: 'Store', icon: 'fa-store' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`shrink-0 border-b-2 px-3 py-3 text-[9px] font-bold uppercase tracking-[0.18em] transition-colors md:px-4 md:text-[10px] ${
                activeTab === tab.key
                  ? 'border-cyann text-cyan'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <i className={`fa-solid ${tab.icon} mr-2`} />{tab.label}
            </button>
          ))}
        </div>

        <div className="min-h-[100px]">
          {activeTab === 'balance' && (
            <div className="space-y-4">
              <div className="pt-1">
                <h4 className="font-space text-lg font-black uppercase tracking-[0.12em] text-white">Recharge packages</h4>
                <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-slate-400">Choose a package that fits your needs.</p>
              </div>

              <div className="grid grid-cols-2 gap-3 min-[480px]:grid-cols-3 xl:grid-cols-3">
                {catalogRechargePackages.map((pkg, idx) => (
                  <div
                    key={idx}
                    className="group relative cursor-pointer rounded-lg border border-cyann bg-[#06111a] p-3 transition-all hover:border-cyann hover:shadow-[0_0_20px_rgba(59,217,242,0.08)]"
                    onClick={() => handleRechargeClick(pkg)}
                  >
                    {idx === 1 && (
                      <span className="absolute right-2 top-2 rounded-sm border border-cyann bg-cyan px-2 py-1 font-space text-[8px] font-black uppercase tracking-[0.12em] text-[#041018]">
                        Popular
                      </span>
                    )}
                    <div className="mb-2 text-xl text-cyan transition-transform group-hover:scale-105">
                      <i className={`fa-solid ${pkg.icon}`} />
                    </div>
                    <div className="mb-1 text-[9px] font-bold uppercase tracking-[0.22em] text-slate-400">Package</div>
                    <div className="font-space text-xl font-black text-white md:text-2xl">◈ {pkg.amount} TGC</div>
                    <div className="my-2 text-[10px] font-bold text-cyan">
                      <i className="fa-solid fa-gift mr-2" />+◈ {pkg.bonus} Bonus
                    </div>
                    <div className="rounded-sm bg-[#081a26] px-2 py-2 text-[10px] text-slate-300">
                      Total Cost: <span className="font-bold text-yellow-400">रु {pkg.cost}</span>
                    </div>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleRechargeClick(pkg);
                      }}
                      className="mt-3 flex w-full items-center justify-center gap-2 rounded-md border border-cyann px-3 py-2 font-space text-[9px] font-black uppercase tracking-[0.18em] text-cyan transition-all hover:bg-cyan-400 hover:text-[#041018]"
                    >
                      <i className="fa-solid fa-bolt" />Recharge Now
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'membership' && (
            <div className="space-y-3 pt-1">
              <h4 className="font-space text-lg font-black uppercase tracking-[0.12em] text-white">Membership plans</h4>
              <div className="space-y-3">
                {Object.entries(catalogMemberships).map(([key, benefit]) => (
                  <div
                    key={key}
                    className={`cursor-pointer rounded-lg border p-4 transition-all ${
                      playerBalance?.membership_tier === key
                        ? 'border-cyan-400/60 bg-cyan-400/5'
                        : 'border-cyan-400/15 bg-[#06111a] hover:border-cyan-400/40'
                    }`}
                    onClick={() => {
                      if (playerBalance?.membership_tier !== key) {
                        setSelectedMembership(key);
                        setShowMembershipModal(true);
                      }
                    }}
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <h5 className="font-space text-xl font-black uppercase text-white">{benefit.name}</h5>
                        <div className="mt-1 text-sm font-bold text-cyan">à¤°à¥ {benefit.price}</div>
                      </div>
                      {playerBalance?.membership_tier === key && (
                        <div className="rounded-md border border-cyan-400/60 bg-cyan-400/10 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-cyan">
                          Active
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 text-sm text-slate-300">
                      {benefit.benefits.map((b, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <i className="fa-solid fa-star mt-1 text-yellow-400" />
                          <span>{b}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              <div className="rounded-lg border border-cyan-400/15 bg-[#06111a] p-4">
                <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500">Total Spent</div>
                <div className="mt-2 font-orbitron text-2xl font-black text-pink">◈ {playerBalance?.total_spent?.toLocaleString() || '0'}</div>
              </div>
              <div className="rounded-lg border border-white/10 bg-[#06111a] p-4">
                <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500">Member Since</div>
                <div className="mt-2 text-sm font-bold text-white">
                  {playerBalance?.created_at ? new Date(playerBalance.created_at).toLocaleDateString() : 'â€”'}
                </div>
              </div>
              <div className="rounded-lg border border-white/10 bg-[#06111a] p-4">
                <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500">Account Status</div>
                <div className="mt-2 text-sm font-bold text-green-400">
                  <i className="fa-solid fa-circle-check mr-1" />Active
                </div>
              </div>
            </div>
          )}

          {activeTab === 'transfer' && (
            <div className="space-y-4 pt-1">
              <div className="rounded-xl border border-cyan-400/10 bg-[#06111a] p-4">
                <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">Send balance to another player</div>
                <div className="mt-2 text-sm font-bold text-white">
                  Sender Wallet ID: <span className="font-mono text-cyan">{profile?.player_id || 'N/A'}</span>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">Receiver Player ID</label>
                    <input
                      value={transferForm.to_player_id}
                      onChange={(e) => setTransferForm({ ...transferForm, to_player_id: e.target.value })}
                      placeholder="PLAYER_XXXX_XXXX"
                      className="mt-1 w-full rounded-lg border border-cyan-400/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">Amount (◈)</label>
                    <input
                      value={transferForm.amount}
                      onChange={(e) => setTransferForm({ ...transferForm, amount: e.target.value })}
                      placeholder="100"
                      type="number"
                      min="1"
                      className="mt-1 w-full rounded-lg border border-cyan-400/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  disabled={transferLoading}
                  onClick={submitTransfer}
                  className="mt-4 w-full rounded-lg bg-cyan-400 px-4 py-3 font-space text-[10px] font-black uppercase tracking-[0.18em] text-[#041018] transition-all hover:bg-white disabled:opacity-60"
                >
                  {transferLoading ? 'Transferring...' : 'Send Transfer'}
                </button>
                <div className="mt-2 text-[11px] text-slate-500">Tip: Double-check the receiver Player ID. Transfers are final.</div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-3 pt-1">
              {historyLoading ? (
                <div className="flex items-center gap-2 text-slate-400"><i className="fa-solid fa-spinner fa-spin" />Loading history...</div>
              ) : history.length === 0 ? (
                <div className="text-sm text-slate-500">No transactions yet.</div>
              ) : (
                <div className="space-y-2">
                  {history.map((tx) => {
                    const amount = Number(tx.amount || 0);
                    const isOut = amount < 0;
                    return (
                      <div key={tx.tx_id || tx.created_at} className="flex items-center justify-between rounded-lg border border-white/10 bg-[#06111a] p-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-bold text-white">
                            {(tx.type || '').toUpperCase().replaceAll('_', ' ')}
                          </div>
                          <div className="truncate text-xs text-slate-500">
                            {tx.description || 'â€”'} â€¢ {tx.created_at ? new Date(tx.created_at).toLocaleString() : ''}
                          </div>
                        </div>
                        <div className={`font-orbitron font-black ${isOut ? 'text-pink-400' : 'text-cyan-400'}`}>
                          {isOut ? '-' : '+'}◈ {Math.abs(amount).toLocaleString()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'store' && (
            <div className="flex min-h-[180px] items-center justify-center p-8 text-center">
              <div>
                <i className="fa-solid fa-store text-4xl text-slate-500" />
                <div className="mt-4 font-space text-xl font-black uppercase text-white">Store Coming Soon!</div>
                <div className="mt-2 text-sm text-slate-400">Exciting items and offers will be available here soon. Stay tuned!</div>
              </div>
            </div>
          )}
        </div>
    
=======
        {/* Quick Action Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4">
          <button
            onClick={() => setShowRechargeModal(true)}
            className="px-3 py-2 md:px-4 md:py-3 bg-primary text-dark rounded-lg font-bold hover:bg-primary/80 transition-all text-[13px] md:text-sm"
          >
            <i className="fa-solid fa-wallet mr-2"></i>Recharge Account
          </button>
          <button
            onClick={() => setShowMembershipModal(true)}
            className="px-3 py-2 md:px-4 md:py-3 bg-pink text-white rounded-lg font-bold hover:bg-pink/80 transition-all text-[13px] md:text-sm"
          >
            <i className="fa-solid fa-crown mr-2"></i>Get Membership
          </button>
          <button
            onClick={() => setActiveTab('transfer')}
            className="px-3 py-2 md:px-4 md:py-3 bg-white/5 text-white rounded-lg font-bold hover:bg-white/10 transition-all text-[13px] md:text-sm hidden md:block"
          >
            <i className="fa-solid fa-paper-plane mr-2"></i>Transfer
          </button>
          
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 overflow-x-auto">
        <button
          onClick={() => setActiveTab('balance')}
          className={`px-3 py-2 font-bold text-[12px] md:text-sm uppercase tracking-widest border-b-2 transition-colors ${
            activeTab === 'balance'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <i className="fa-solid fa-money-bill mr-2"></i>Balance
        </button>
        <button
          onClick={() => setActiveTab('membership')}
          className={`px-3 py-2 font-bold text-[12px] md:text-sm uppercase tracking-widest border-b-2 transition-colors ${
            activeTab === 'membership'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <i className="fa-solid fa-crown mr-2"></i>Membership
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`px-3 py-2 font-bold text-[12px] md:text-sm uppercase tracking-widest border-b-2 transition-colors ${
            activeTab === 'stats'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <i className="fa-solid fa-chart-pie mr-2"></i>Stats
        </button>

        <button
          onClick={() => setActiveTab('transfer')}
          className={`px-3 py-2 font-bold text-[12px] md:text-sm uppercase tracking-widest border-b-2 transition-colors ${
            activeTab === 'transfer'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <i className="fa-solid fa-paper-plane mr-2"></i>Transfer
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`px-3 py-2 font-bold text-[12px] md:text-sm uppercase tracking-widest border-b-2 transition-colors ${
            activeTab === 'history'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <i className="fa-solid fa-clock-rotate-left mr-2"></i>History
        </button>

        <button
          onClick={() => setActiveTab('store')}
          className={`px-3 py-2 font-bold text-[12px] md:text-sm uppercase tracking-widest border-b-2 transition-colors ${
            activeTab === 'store'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <i className="fa-solid fa-store mr-2"></i>Store
        </button>
      </div>

      {/* Tab Content */}
      <div className="min-h-[100px]">
        {/* Balance Tab */}
        {activeTab === 'balance' && (
          <div className="space-y-4">
            <h4 className="text-lg font-orbitron font-black text-white uppercase tracking-widest mb-4">
              Recharge Packages
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {catalogRechargePackages.map((pkg, idx) => (
                <div
                  key={idx}
                  className="bg-bg-card border border-white/10 rounded-lg p-4 hover:border-primary/50 transition-all cursor-pointer group"
                  onClick={() => handleRechargeClick(pkg)}
                >
                  <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">
                    <i className={`fa-solid ${pkg.icon}`}></i>
                  </div>
                  <div className="text-gray-400 text-xs uppercase tracking-widest mb-2">Package</div>
                  <div className="text-[15px] md:text-2xl font-orbitron font-black text-white">
                    ◈ {pkg.amount} TGC
                  </div>
                  <div className="text-primary font-bold text-[13px] md:text-xs mb-3">
                    <i className="fa-solid fa-gift mr-2"></i>+◈ {pkg.bonus} Bonus
                  </div>
                  <div className="text-xs text-gray-400 bg-white/5 p-2 rounded">
                    Total Cost: <span className="text-yellow-400 font-bold">रु {pkg.cost}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Membership Tab */}
        {activeTab === 'membership' && (
          <div className="space-y-4">
            <h4 className="text-lg font-orbitron font-black text-white uppercase tracking-widest mb-4">
              Membership Plans
            </h4>
            <div className="space-y-3">
              {Object.entries(catalogMemberships).map(([key, benefit]) => (
                <div
                  key={key}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    playerBalance?.membership_tier === key
                      ? 'bg-primary/10 border-primary'
                      : 'bg-bg-card border-white/10 hover:border-primary/50'
                  }`}
                  onClick={() => {
                    if (playerBalance?.membership_tier !== key) {
                      setSelectedMembership(key);
                      setShowMembershipModal(true);
                    }
                  }}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h5 className="font-bold text-white text-lg">{benefit.name}</h5>
                      <div className="text-primary font-bold">रु {benefit.price}</div>
                    </div>
                    {playerBalance?.membership_tier === key && (
                      <div className="px-3 py-1 bg-primary text-dark text-xs font-bold rounded">
                        <i className="fa-solid fa-check mr-1"></i>Active
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-gray-400">
                    {benefit.benefits.map((b, idx) => (
                      <div key={idx} className="mb-1">
                        <i className="fa-solid fa-star text-yellow-500 mr-2"></i>{b}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-bg-card border border-white/10 rounded-lg p-4">
              <div className="text-gray-500 text-xs uppercase tracking-widest mb-2">Total Spent</div>
              <div className="text-2xl font-orbitron font-black text-pink">
                ◈ {playerBalance?.total_spent?.toLocaleString() || '0'}
              </div>
            </div>
            <div className="bg-bg-card border border-white/10 rounded-lg p-4">
              <div className="text-gray-500 text-xs uppercase tracking-widest mb-2">Member Since</div>
              <div className="text-sm text-white font-bold">
                {new Date(playerBalance?.created_at).toLocaleDateString()} 
              </div>
            </div>
            <div className="bg-bg-card border border-white/10 rounded-lg p-4">
              <div className="text-gray-500 text-xs uppercase tracking-widest mb-2">Account Status</div>
              <div className="text-green-400 font-bold">
                <i className="fa-solid fa-circle-check mr-1"></i>Active
              </div>
            </div>
          </div>
        )}

        {/* Transfer Tab */}
        {activeTab === 'transfer' && (
          <div className="space-y-4">
            <div className="bg-bg-card border border-white/10 rounded-xl p-4">
              <div className="text-gray-400 text-xs uppercase tracking-widest mb-1">Send balance to another player</div>
              <div className="text-white font-bold text-sm mb-4">
                Sender Wallet ID: <span className="font-mono text-primary">{profile?.player_id || 'N/A'}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-500 text-xs uppercase tracking-widest">Receiver Player ID</label>
                  <input
                    value={transferForm.to_player_id}
                    onChange={(e) => setTransferForm({ ...transferForm, to_player_id: e.target.value })}
                    placeholder="PLAYER_XXXX_XXXX"
                    className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-primary font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="text-gray-500 text-xs uppercase tracking-widest">Amount (◈)</label>
                  <input
                    value={transferForm.amount}
                    onChange={(e) => setTransferForm({ ...transferForm, amount: e.target.value })}
                    placeholder="100"
                    type="number"
                    min="1"
                    className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-primary text-sm"
                  />
                </div>
              </div>

              <button
                disabled={transferLoading}
                onClick={submitTransfer}
                className="mt-4 w-full px-4 py-3 bg-primary text-dark rounded-lg font-bold hover:bg-primary/80 transition-all disabled:opacity-60"
              >
                {transferLoading ? 'Transferring...' : 'Send Transfer'}
              </button>
              <div className="text-[11px] text-gray-500 mt-2">
                Tip: Double-check the receiver Player ID. Transfers are final.
              </div>
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-3">
            {historyLoading ? (
              <div className="flex items-center gap-2 text-gray-400">
                <i className="fa-solid fa-spinner fa-spin"></i> Loading history...
              </div>
            ) : history.length === 0 ? (
              <div className="text-gray-500 text-sm">No transactions yet.</div>
            ) : (
              <div className="space-y-2">
                {history.map((tx) => {
                  const amount = Number(tx.amount || 0);
                  const isOut = amount < 0;
                  return (
                    <div key={tx.tx_id || tx.created_at} className="bg-bg-card border border-white/10 rounded-lg p-3 flex items-center justify-between">
                      <div className="min-w-0">
                        <div className="text-white font-bold text-sm truncate">
                          {(tx.type || '').toUpperCase().replaceAll('_', ' ')}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {tx.description || '—'} • {tx.created_at ? new Date(tx.created_at).toLocaleString() : ''}
                        </div>
                      </div>
                      <div className={`font-orbitron font-black ${isOut ? 'text-pink' : 'text-tertiary'}`}>
                        {isOut ? '-' : '+'}◈ {Math.abs(amount).toLocaleString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/*Store Tab*/}
      {activeTab === 'store' && (
        <div className="flex items-center justify-center p-10">
          <div className="text-gray-400 text-center">
            <i className="fa-solid fa-store text-4xl mb-4"></i>
            <div className="text-lg font-bold">Store Coming Soon!</div>
            <div className="text-sm mt-1">Exciting items and offers will be available here soon. Stay tuned!</div>
          </div>
        </div>
      )}

>>>>>>> 4d66377e1ff24fddce9d174c2e58bdacb49bae89

      {/* Recharge Modal */}
      {showRechargeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
<<<<<<< HEAD
          <div className="bg-bg-card border border-cyan-400/15 rounded-2xl p-6 max-w-md w-full">
=======
          <div className="bg-bg-card border border-white/10 rounded-2xl p-6 max-w-md w-full">
>>>>>>> 4d66377e1ff24fddce9d174c2e58bdacb49bae89
            <h3 className="text-xl font-orbitron font-black text-white mb-2">
              <i className="fa-brands fa-whatsapp text-green-400 mr-2"></i>Recharge Account
            </h3>
            <p className="text-gray-400 text-sm mb-4">Please contact us via WhatsApp to complete your purchase</p>
            
            {selectedPackage && (
<<<<<<< HEAD
              <div className="space-y-4 mb-6 p-4 bg-white/5 rounded-lg border border-cyan-400/10">
=======
              <div className="space-y-4 mb-6 p-4 bg-white/5 rounded-lg">
>>>>>>> 4d66377e1ff24fddce9d174c2e58bdacb49bae89
                <div className="flex justify-between">
                  <span className="text-gray-400">Package amount:</span>
                  <span className="font-bold text-white">◈ {selectedPackage.amount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Bonus:</span>
                  <span className="font-bold text-primary">+◈ {selectedPackage.bonus}</span>
                </div>
<<<<<<< HEAD
                <div className="border-t border-cyan-400/10 pt-4 flex justify-between">
=======
                <div className="border-t border-white/10 pt-4 flex justify-between">
>>>>>>> 4d66377e1ff24fddce9d174c2e58bdacb49bae89
                  <span className="font-bold text-white">Total:</span>
                  <span className="font-orbitron font-black text-yellow-400 text-lg">
                    ◈ {selectedPackage.amount + selectedPackage.bonus}
                  </span>
                </div>
              </div>
            )}

            {/* Payment details (required) */}
            <div className="space-y-3 mb-4">
              <div>
                <label className="text-gray-500 text-xs uppercase tracking-widest">WhatsApp Number</label>
                <input
                  value={requestInfo.whatsapp_number}
                  onChange={(e) => setRequestInfo(prev => ({ ...prev, whatsapp_number: e.target.value }))}
                  placeholder="+97798XXXXXXXX"
<<<<<<< HEAD
                  className="w-full mt-1 bg-white/5 border border-cyan-400/10 rounded-lg px-3 py-2 text-white outline-none focus:border-primary text-sm"
=======
                  className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-primary text-sm"
>>>>>>> 4d66377e1ff24fddce9d174c2e58bdacb49bae89
                />
              </div>
              <div>
                <label className="text-gray-500 text-xs uppercase tracking-widest">Payment Method</label>
                <select
                  value={requestInfo.payment_method}
                  onChange={(e) => setRequestInfo(prev => ({ ...prev, payment_method: e.target.value }))}
<<<<<<< HEAD
                  className="w-full mt-1 bg-white/5 border border-cyan-400/10 rounded-lg px-3 py-2 text-white outline-none focus:border-primary text-sm"
=======
                  className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-primary text-sm"
>>>>>>> 4d66377e1ff24fddce9d174c2e58bdacb49bae89
                >
                  <option value="esewa" className="bg-black text-white">eSewa</option>
                  <option value="khalti" className="bg-black text-white">Khalti</option>
                  <option value="bank" className="bg-black text-white">Bank</option>
                </select>
              </div>
              <div>
                <label className="text-gray-500 text-xs uppercase tracking-widest">Account Number</label>
                <input
                  value={requestInfo.payment_account_number}
                  onChange={(e) => setRequestInfo(prev => ({ ...prev, payment_account_number: e.target.value }))}
                  placeholder="98XXXXXXXX / 01-XXXXXX / etc"
<<<<<<< HEAD
                  className="w-full mt-1 bg-white/5 border border-cyan-400/10 rounded-lg px-3 py-2 text-white outline-none focus:border-primary text-sm"
=======
                  className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-primary text-sm"
>>>>>>> 4d66377e1ff24fddce9d174c2e58bdacb49bae89
                />
              </div>
              <div>
                <label className="text-gray-500 text-xs uppercase tracking-widest">Account Owner Name</label>
                <input
                  value={requestInfo.payment_account_owner}
                  onChange={(e) => setRequestInfo(prev => ({ ...prev, payment_account_owner: e.target.value }))}
                  placeholder="Owner full name"
<<<<<<< HEAD
                  className="w-full mt-1 bg-white/5 border border-cyan-400/10 rounded-lg px-3 py-2 text-white outline-none focus:border-primary text-sm"
=======
                  className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-primary text-sm"
>>>>>>> 4d66377e1ff24fddce9d174c2e58bdacb49bae89
                />
              </div>
            </div>

            {/* WhatsApp Contact Info */}
<<<<<<< HEAD
            <div className="bg-green-400/10 border border-green-400/20 rounded-lg p-4 mb-4">
=======
            <div className="bg-green-400/10 border border-green-400/30 rounded-lg p-4 mb-4">
>>>>>>> 4d66377e1ff24fddce9d174c2e58bdacb49bae89
              <div className="text-sm text-white mb-2">
                <i className="fa-solid fa-phone mr-2 text-green-400"></i>
                <span className="font-bold">{ADMIN_WHATSAPP.displayNumber}</span>
              </div>
              <p className="text-xs text-gray-400">Click below to start WhatsApp chat</p>
            </div>

            <div className="flex gap-3 flex-col">
              <button
                onClick={openWhatsAppChat}
                className="w-full px-4 py-3 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600 transition-all flex items-center justify-center gap-2"
              >
                <i className="fa-brands fa-whatsapp text-lg"></i>
                Contact on WhatsApp
              </button>
              <button
                onClick={submitRechargeRequest}
                className="w-full px-4 py-2 bg-primary text-dark rounded font-bold hover:bg-primary/80"
              >
                Submit Request
              </button>
              <button
                onClick={() => {
                  setShowRechargeModal(false);
                  setSelectedPackage(null);
                }}
                className="w-full px-4 py-2 bg-white/5 text-white rounded font-bold hover:bg-white/10"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Membership Modal */}
      {showMembershipModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
<<<<<<< HEAD
          <div className="bg-bg-card border border-cyan-400/15 rounded-2xl p-6 max-w-md w-full">
=======
          <div className="bg-bg-card border border-white/10 rounded-2xl p-6 max-w-md w-full">
>>>>>>> 4d66377e1ff24fddce9d174c2e58bdacb49bae89
            <h3 className="text-xl font-orbitron font-black text-white mb-2">
              <i className="fa-brands fa-whatsapp text-green-400 mr-2"></i>Get Membership
            </h3>
            <p className="text-gray-400 text-sm mb-4">Please contact us via WhatsApp to complete your purchase</p>

            {selectedMembership && (
<<<<<<< HEAD
              <div className="space-y-4 mb-6 p-4 bg-white/5 rounded-lg border border-cyan-400/10">
=======
              <div className="space-y-4 mb-6 p-4 bg-white/5 rounded-lg">
>>>>>>> 4d66377e1ff24fddce9d174c2e58bdacb49bae89
                <div className="text-lg font-bold text-white">
                  {catalogMemberships[selectedMembership]?.name || 'Membership'}
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Price:</span>
                  <span className="font-orbitron font-black text-primary">
                    ◈ {catalogMemberships[selectedMembership]?.price || 0}
                  </span>
                </div>
                <div className="border-t border-white/10 pt-4">
                  <div className="text-sm font-bold text-gray-300 mb-2">Benefits:</div>
                  {(catalogMemberships[selectedMembership]?.benefits || []).map((b, idx) => (
                    <div key={idx} className="text-sm text-gray-400 mb-1">
                      <i className="fa-solid fa-check text-primary mr-2"></i>{b}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Payment details (required) */}
            <div className="space-y-3 mb-4">
              <div>
                <label className="text-gray-500 text-xs uppercase tracking-widest">WhatsApp Number</label>
                <input
                  value={requestInfo.whatsapp_number}
                  onChange={(e) => setRequestInfo(prev => ({ ...prev, whatsapp_number: e.target.value }))}
                  placeholder="+97798XXXXXXXX"
<<<<<<< HEAD
                  className="w-full mt-1 bg-white/5 border border-cyan-400/10 rounded-lg px-3 py-2 text-white outline-none focus:border-primary text-sm"
=======
                  className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-primary text-sm"
>>>>>>> 4d66377e1ff24fddce9d174c2e58bdacb49bae89
                />
              </div>
              <div>
                <label className="text-gray-500 text-xs uppercase tracking-widest">Payment Method</label>
                <select
                  value={requestInfo.payment_method}
                  onChange={(e) => setRequestInfo(prev => ({ ...prev, payment_method: e.target.value }))}
<<<<<<< HEAD
                  className="w-full mt-1 bg-white/5 border border-cyan-400/10 rounded-lg px-3 py-2 text-white outline-none focus:border-primary text-sm"
=======
                  className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-primary text-sm"
>>>>>>> 4d66377e1ff24fddce9d174c2e58bdacb49bae89
                >
                  <option value="esewa">eSewa</option>
                  <option value="khalti">Khalti</option>
                  <option value="bank">Bank</option>
                </select>
              </div>
              <div>
                <label className="text-gray-500 text-xs uppercase tracking-widest">Account Number</label>
                <input
                  value={requestInfo.payment_account_number}
                  onChange={(e) => setRequestInfo(prev => ({ ...prev, payment_account_number: e.target.value }))}
                  placeholder="98XXXXXXXX / 01-XXXXXX / etc"
<<<<<<< HEAD
                  className="w-full mt-1 bg-white/5 border border-cyan-400/10 rounded-lg px-3 py-2 text-white outline-none focus:border-primary text-sm"
=======
                  className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-primary text-sm"
>>>>>>> 4d66377e1ff24fddce9d174c2e58bdacb49bae89
                />
              </div>
              <div>
                <label className="text-gray-500 text-xs uppercase tracking-widest">Account Owner Name</label>
                <input
                  value={requestInfo.payment_account_owner}
                  onChange={(e) => setRequestInfo(prev => ({ ...prev, payment_account_owner: e.target.value }))}
                  placeholder="Owner full name"
<<<<<<< HEAD
                  className="w-full mt-1 bg-white/5 border border-cyan-400/10 rounded-lg px-3 py-2 text-white outline-none focus:border-primary text-sm"
=======
                  className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-primary text-sm"
>>>>>>> 4d66377e1ff24fddce9d174c2e58bdacb49bae89
                />
              </div>
            </div>

            {/* WhatsApp Contact Info */}
<<<<<<< HEAD
            <div className="bg-green-400/10 border border-green-400/20 rounded-lg p-4 mb-4">
=======
            <div className="bg-green-400/10 border border-green-400/30 rounded-lg p-4 mb-4">
>>>>>>> 4d66377e1ff24fddce9d174c2e58bdacb49bae89
              <div className="text-sm text-white mb-2">
                <i className="fa-solid fa-phone mr-2 text-green-400"></i>
                <span className="font-bold">{ADMIN_WHATSAPP.displayNumber}</span>
              </div>
              <p className="text-xs text-gray-400">Click below to start WhatsApp chat</p>
            </div>

            <div className="flex gap-3 flex-col">
              <button
                onClick={openWhatsAppChat}
                className="w-full px-4 py-3 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600 transition-all flex items-center justify-center gap-2"
              >
                <i className="fa-brands fa-whatsapp text-lg"></i>
                Contact on WhatsApp
              </button>
              <button
                onClick={submitMembershipRequest}
                className="w-full px-4 py-2 bg-primary text-dark rounded font-bold hover:bg-primary/80"
              >
                Submit Request
              </button>
              <button
                onClick={() => {
                  setShowMembershipModal(false);
                  setSelectedMembership(null);
                }}
                className="w-full px-4 py-2 bg-white/5 text-white rounded font-bold hover:bg-white/10"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerBalance;
<<<<<<< HEAD

=======
>>>>>>> 4d66377e1ff24fddce9d174c2e58bdacb49bae89
