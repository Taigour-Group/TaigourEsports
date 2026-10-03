import React, { useState, useEffect } from 'react';
import ErrorBox from './ErrorBox.jsx';
import TgcCoin from './TgcCoin.jsx';
import { balanceService } from '../services/balanceService';
import { MEMBERSHIP_BENEFITS, MEMBERSHIP_TIERS, RECHARGE_PACKAGES, ADMIN_WHATSAPP, REQUEST_TYPES, REQUEST_STATUS } from '../constants/balanceConstants';
import { useAuth } from '../context/AuthContext';

const MEMBERSHIP_BADGE_IMAGE = 'https://res.cloudinary.com/dkoirxf41/image/upload/v1791026411/Golden_Crown_Gaming_Badge-removebg-preview_wt4krc.png';

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
    if (user?.id) {
      fetchBalance();
    }
  }, [user?.id]);

  useEffect(() => {
    // Pre-fill WhatsApp from profile contact if available (best effort)
    if (profile?.contact_info && !requestInfo.whatsapp_number) {
      setRequestInfo(prev => ({ ...prev, whatsapp_number: profile.contact_info }));
    }
  }, [profile]);

  const fetchBalance = async (manual = false, forceRefresh = manual) => {
    if (!user?.id) return;
    if (manual) setRefreshing(true);
    else if (!playerBalance) setLoading(true);
    try {
      const { data, error } = await balanceService.getPlayerBalance(user.id, { refresh: forceRefresh });
      if (!error && data) {
        setPlayerBalance(data);
      }
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    } finally {
      if (manual) setRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleBalanceUpdate = (event) => {
      if (event.detail?.userId === user?.id) {
        setPlayerBalance(event.detail.data);
      }
    };
    window.addEventListener('player-balance-updated', handleBalanceUpdate);
    return () => window.removeEventListener('player-balance-updated', handleBalanceUpdate);
  }, [user?.id]);

  const fetchHistory = async (manual = false) => {
    if (!user) return;
    setHistoryLoading(true);
    try {
      const { data, error } = await balanceService.getTransactionHistory(user.id, 30, { refresh: manual });
      if (!error) setHistory(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to fetch history:', e);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'history') fetchHistory();
  }, [activeTab, user?.id]);

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
          description: `Recharge request for ${selectedPackage.amount} TGC + ${selectedPackage.bonus} TGC bonus`,
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
          description: `Membership request for ${MEMBERSHIP_BENEFITS[selectedMembership].name} (${MEMBERSHIP_BENEFITS[selectedMembership].price} TGC)`,
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
      await fetchBalance(false, true);
      if (activeTab === 'history') await fetchHistory(true);
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
    <div className="space-y-4">
      {errorBox && (
        <ErrorBox message={errorBox} onClose={() => setErrorBox(null)} type="error" />
      )}
      {successBox && (
        <ErrorBox message={successBox} onClose={() => setSuccessBox(null)} type="success" />
      )}

      
        <div className="mb-4 flex flex-col gap-3 border-b border-cyann pb-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="font-space text-xl font-black uppercase tracking-[0.12em] text-white">Wallet &amp; Membership</h2>
            <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-slate-400">Manage your balance, membership and recharge options.</p>
          </div>
          <div className="min-w-[180px] rounded-lg border border-cyann bg-[#061521] p-2 text-left md:text-right">
            <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">Membership status</div>
            <div className={`inline-flex items-center justify-center gap-2 rounded-md bg-[#061925] px-3 py-1.5 text-base font-bold md:text-lg ${playerBalance?.membership_tier === 'none' ? 'text-gray-400' : 'text-yellow-400'}`}>
              <img
                src={MEMBERSHIP_BADGE_IMAGE}
                alt="Membership badge"
                className="h-5 w-5 object-contain drop-shadow-[0_0_10px_rgba(250,204,21,0.7)] md:h-6 md:w-6"
              />
              <span>{catalogMemberships[playerBalance?.membership_tier]?.name || 'Free Player'}</span>
            </div>
            {playerBalance?.membership_expires_at && playerBalance?.membership_tier !== 'none' && (
              <div className="text-xs text-slate-500">Expires: {getMembershipExpiry()}</div>
            )}
          </div>
        </div>

        <div className="mb-4 rounded-lg border border-cyann bg-[#071925] p-4 md:p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-[9px] font-bold uppercase tracking-[0.22em] text-slate-400">Available balance</div>
              <div className="mt-2 flex items-center gap-3">
                <div className="flex items-center gap-2 font-orbitron text-2xl font-black text-[#2ce9ff] md:text-4xl">
                  <TgcCoin className="h-6 w-6 md:h-8 md:w-8" />
                  <span>{playerBalance?.balance?.toLocaleString() || '0'}</span>
                </div>
                <span className="font-space text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">TGC</span>
                <button
                  type="button"
                  onClick={() => {
                    fetchBalance(true);
                    if (activeTab === 'history') fetchHistory(true);
                  }}
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
                className="inline-flex items-center justify-center gap-2 rounded-md border border-cyann bg-cyan-400/5 px-4 py-2 font-space text-[10px] font-black uppercase tracking-[0.18em] text-white transition-all hover:border-cyann hover:text-cyan"
              >
                <img src={MEMBERSHIP_BADGE_IMAGE} alt="Membership" className="h-4 w-4 object-contain" />
                <span>Get Membership</span>
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

              <div className="grid grid-cols-2 gap-3 min-[480px]:grid-cols-4 xl:grid-cols-5">
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
                    <div className="flex items-center gap-2 font-space text-xl font-black text-white md:text-2xl">
                      <TgcCoin className="h-5 w-5 md:h-6 md:w-6" />
                      <span>{pkg.amount} TGC</span>
                    </div>
                    <div className="my-2 flex items-center gap-1 text-[10px] font-bold text-cyan">
                      <i className="fa-solid fa-gift mr-1" />
                      <TgcCoin className="h-3.5 w-3.5" />
                      <span>+{pkg.bonus} Bonus</span>
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
            <div className="space-y-4 pt-1">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div>
                  <h4 className="font-space text-lg font-black uppercase tracking-[0.12em] text-white">Membership plans</h4>
                  <p className="mt-1 text-xs text-slate-400">Choose a plan to see its details and request an upgrade.</p>
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Prices in TGC</span>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {Object.entries(catalogMemberships).map(([key, benefit]) => {
                  const isActive = playerBalance?.membership_tier === key;
                  const planBenefits = Array.isArray(benefit.benefits) ? benefit.benefits : [];
                  const isFreePlan = Number(benefit.price) === 0;

                  return (
                    <button
                      key={key}
                      type="button"
                      disabled={isActive}
                      onClick={() => {
                        setSelectedMembership(key);
                        setShowMembershipModal(true);
                      }}
                      className={`group flex h-full flex-col rounded-xl border p-4 text-left transition-colors ${
                        isActive
                          ? 'border-cyan-400/50 bg-cyan-400/[0.06]'
                          : 'border-white/10 bg-[#071621] hover:border-cyan-400/40 hover:bg-[#091c29]'
                      }`}
                    >
                      <div className="flex w-full items-start justify-between gap-3">
                        <div className="min-w-0">
                          {benefit.isPopular && (
                            <span className="mb-2 inline-flex rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-300">
                              Popular
                            </span>
                          )}
                          <h5 className="font-space text-base font-black uppercase leading-tight text-white">{benefit.name}</h5>
                        </div>
                        {isActive && (
                          <span className="shrink-0 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-cyan-300">
                            Current
                          </span>
                        )}
                      </div>

                      <div className="mt-3 flex items-baseline gap-1.5">
                        <span className="text-xl font-orbitron font-black text-cyan-300">{Number(benefit.price || 0).toLocaleString()}</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">TGC</span>
                      </div>

                      <div className="my-3 h-px w-full bg-white/10" />

                      <div className="flex-1 space-y-2">
                        {planBenefits.length > 0 ? planBenefits.map((item, idx) => (
                          <div key={`${key}-benefit-${idx}`} className="flex items-start gap-2 text-xs leading-relaxed text-slate-300">
                            <i className="fa-solid fa-check mt-0.5 text-[10px] text-cyan-400" />
                            <span>{item}</span>
                          </div>
                        )) : (
                          <p className="text-xs text-slate-500">Plan details coming soon.</p>
                        )}
                      </div>

                      <span className={`mt-4 inline-flex w-full items-center justify-center rounded-md px-3 py-2 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                        isActive
                          ? 'bg-white text-slate-800'
                          : isFreePlan
                            ? 'border border-white/10 text-slate-300 group-hover:border-cyan-400/40 group-hover:text-white'
                            : 'bg-cyan-400 text-cyan-300 group-hover:bg-cyan group-hover:text-slate-900'
                      }`}>
                        {isActive ? 'Current plan' : isFreePlan ? 'Free plan' : 'Select plan'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              <div className="rounded-lg border border-cyan-400/15 bg-[#06111a] p-4">
                <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500">Total Spent</div>
                <div className="mt-2 flex items-center gap-2 font-orbitron text-2xl font-black text-pink">
                  <TgcCoin className="h-5 w-5 md:h-6 md:w-6" />
                  <span>{playerBalance?.total_spent?.toLocaleString() || '0'}</span>
                </div>
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
                    <label className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">Amount (TGC)</label>
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
                          {isOut ? '-' : '+'}
                          <TgcCoin className="ml-1 mr-1 inline h-3.5 w-3.5 align-middle" />
                          {Math.abs(amount).toLocaleString()}
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
    

      {/* Recharge Modal */}
      {showRechargeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-bg-card border border-cyan-400/15 rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-orbitron font-black text-white mb-2">
              <i className="fa-brands fa-whatsapp text-green-400 mr-2"></i>Recharge Account
            </h3>
            <p className="text-gray-400 text-sm mb-4">Please contact us via WhatsApp to complete your purchase</p>
            
            {selectedPackage && (
              <div className="space-y-4 mb-6 p-4 bg-white/5 rounded-lg border border-cyan-400/10">
                <div className="flex justify-between">
                  <span className="text-gray-400">Package amount:</span>
                  <span className="flex items-center gap-1.5 font-bold text-white">
                    <TgcCoin className="h-4 w-4" />
                    <span>{selectedPackage.amount}</span>
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Bonus:</span>
                  <span className="flex items-center gap-1.5 font-bold text-primary">
                    <TgcCoin className="h-4 w-4" />
                    <span>+{selectedPackage.bonus}</span>
                  </span>
                </div>
                <div className="border-t border-cyan-400/10 pt-4 flex justify-between">
                  <span className="font-bold text-white">Total:</span>
                  <span className="flex items-center gap-1.5 font-orbitron font-black text-yellow-400 text-lg">
                    <TgcCoin className="h-5 w-5" />
                    <span>{selectedPackage.amount + selectedPackage.bonus}</span>
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
                  className="w-full mt-1 bg-white/5 border border-cyan-400/10 rounded-lg px-3 py-2 text-white outline-none focus:border-primary text-sm"
                />
              </div>
              <div>
                <label className="text-gray-500 text-xs uppercase tracking-widest">Payment Method</label>
                <select
                  value={requestInfo.payment_method}
                  onChange={(e) => setRequestInfo(prev => ({ ...prev, payment_method: e.target.value }))}
                  className="w-full mt-1 bg-white/5 border border-cyan-400/10 rounded-lg px-3 py-2 text-white outline-none focus:border-primary text-sm"
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
                  className="w-full mt-1 bg-white/5 border border-cyan-400/10 rounded-lg px-3 py-2 text-white outline-none focus:border-primary text-sm"
                />
              </div>
              <div>
                <label className="text-gray-500 text-xs uppercase tracking-widest">Account Owner Name</label>
                <input
                  value={requestInfo.payment_account_owner}
                  onChange={(e) => setRequestInfo(prev => ({ ...prev, payment_account_owner: e.target.value }))}
                  placeholder="Owner full name"
                  className="w-full mt-1 bg-white/5 border border-cyan-400/10 rounded-lg px-3 py-2 text-white outline-none focus:border-primary text-sm"
                />
              </div>
            </div>

            {/* WhatsApp Contact Info */}
            <div className="bg-green-400/10 border border-green-400/20 rounded-lg p-4 mb-4">
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
        <div className="fixed inset-0 z-[200] flex items-center justify-center overflow-y-auto bg-black/75 p-3 backdrop-blur-sm sm:p-5">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="membership-modal-title"
            className="my-auto flex max-h-[calc(100dvh-1.5rem)] w-full max-w-xl flex-col overflow-hidden rounded-xl border border-cyan-400/20 bg-[#081925] shadow-[0_16px_48px_rgba(0,0,0,0.5)] sm:max-h-[calc(100dvh-2.5rem)]"
          >
            <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-3">
              <div className="flex items-center gap-2.5">
                <img src={MEMBERSHIP_BADGE_IMAGE} alt="" className="h-7 w-7 object-contain" />
                <div>
                  <h3 id="membership-modal-title" className="font-orbitron text-base font-bold text-white">Get Membership</h3>
                  <p className="mt-0.5 text-[11px] text-slate-400">Review your plan and payment details.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowMembershipModal(false);
                  setSelectedMembership(null);
                }}
                aria-label="Close membership form"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-sm text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 custom-scrollbar">
              <div className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">Selected plan</p>
                  <p className="mt-0.5 truncate font-orbitron text-sm font-bold text-white">
                    {catalogMemberships[selectedMembership]?.name || 'Membership'}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5 font-orbitron text-sm font-bold text-cyan-300">
                  <TgcCoin className="h-4 w-4" />
                  <span>{catalogMemberships[selectedMembership]?.price || 0} TGC</span>
                </div>
              </div>

              <div>
                <div className="mb-2.5 flex items-center justify-between">
                  <h4 className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-300">Payment details</h4>
                  <span className="text-[9px] text-slate-500">All fields required</span>
                </div>
                <div className="grid gap-x-3 gap-y-2.5 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-medium text-slate-400">WhatsApp number</label>
                    <input
                      value={requestInfo.whatsapp_number}
                      onChange={(e) => setRequestInfo(prev => ({ ...prev, whatsapp_number: e.target.value }))}
                      placeholder="+97798XXXXXXXX"
                      className="mt-1 w-full rounded-md border border-white/10 bg-[#0d2230] px-3 py-2 text-xs text-white outline-none transition-colors placeholder:text-slate-500 focus:border-cyan-400/60"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-400">Payment method</label>
                    <select
                      value={requestInfo.payment_method}
                      onChange={(e) => setRequestInfo(prev => ({ ...prev, payment_method: e.target.value }))}
                      className="mt-1 w-full rounded-md border border-white/10 bg-[#0d2230] px-3 py-2 text-xs text-white outline-none transition-colors focus:border-cyan-400/60"
                    >
                      <option value="esewa" className="bg-black text-white">eSewa</option>
                      <option value="khalti" className="bg-black text-white">Khalti</option>
                      <option value="bank" className="bg-black text-white">Bank</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-400">Account number</label>
                    <input
                      value={requestInfo.payment_account_number}
                      onChange={(e) => setRequestInfo(prev => ({ ...prev, payment_account_number: e.target.value }))}
                      placeholder="Your payment account number"
                      className="mt-1 w-full rounded-md border border-white/10 bg-[#0d2230] px-3 py-2 text-xs text-white outline-none transition-colors placeholder:text-slate-500 focus:border-cyan-400/60"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-medium text-slate-400">Account owner name</label>
                    <input
                      value={requestInfo.payment_account_owner}
                      onChange={(e) => setRequestInfo(prev => ({ ...prev, payment_account_owner: e.target.value }))}
                      placeholder="Name registered to the account"
                      className="mt-1 w-full rounded-md border border-white/10 bg-[#0d2230] px-3 py-2 text-xs text-white outline-none transition-colors placeholder:text-slate-500 focus:border-cyan-400/60"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2.5 rounded-lg border border-emerald-400/15 bg-emerald-400/[0.06] px-3 py-2.5">
                <i className="fa-brands fa-whatsapp mt-0.5 text-xs text-emerald-400"></i>
                <p className="text-[11px] leading-relaxed text-slate-300">
                  Need help? Contact us on WhatsApp at <span className="font-semibold text-white">{ADMIN_WHATSAPP.displayNumber}</span> to confirm your payment.
                </p>
              </div>
            </div>

            <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-white/10 bg-[#071621] px-4 py-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowMembershipModal(false);
                  setSelectedMembership(null);
                }}
                className="rounded-md border border-white/10 px-3.5 py-2 text-xs font-semibold text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={openWhatsAppChat}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-green-600 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-green-500"
              >
                <i className="fa-brands fa-whatsapp"></i>
                WhatsApp
              </button>
              <button
                type="button"
                onClick={submitMembershipRequest}
                className="rounded-md bg-cyan-400 px-4 py-2 text-xs font-bold text-[#041018] transition-colors hover:bg-cyan-300"
              >
                Submit request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerBalance;
