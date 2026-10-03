import React, { useState, useEffect, useMemo } from 'react';
import { adminFetch } from '../services/adminAuth';
import { balanceService } from '../services/balanceService';
import { MEMBERSHIP_BENEFITS, MEMBERSHIP_TIERS } from '../constants/balanceConstants';

const PlayerStatsAdmin = ({ registrations }) => {
  const [playerStats, setPlayerStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [tempBalance, setTempBalance] = useState('');
  const [tempDescription, setTempDescription] = useState('');
  const [tempMembership, setTempMembership] = useState('none');
  const [tempDuration, setTempDuration] = useState('30');
   
  // New profile edit fields
  const [tempProfile, setTempProfile] = useState({
    full_name: '',
    age: '',
    contact_info: '',
    game_uid: '',
    promo_code: '',
    rank: 'Unranked',
    combat_score: 0,
    total_kills: 0,
    achievements: []
  });

  const [sortBy, setSortBy] = useState('created_at');
  const [page, setPage] = useState(0);
  const [pageSize] = useState(10);
  const [ledgerWalletId, setLedgerWalletId] = useState(null);
  const [ledgerRows, setLedgerRows] = useState([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [catalogMemberships, setCatalogMemberships] = useState(MEMBERSHIP_BENEFITS);

  useEffect(() => {
    setCatalogMemberships(MEMBERSHIP_BENEFITS);
  }, []);

  // Fetch player statistics
  useEffect(() => {
    fetchPlayerStats();
  }, [page]);

  const fetchPlayerStats = async () => {
    setLoading(true);
    try {
      const { data, error } = await balanceService.getAllPlayerBalances(pageSize, page * pageSize);
      if (!error && data) {
        setPlayerStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch player stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const openLedger = async (walletId) => {
    if (!walletId) return;
    setLedgerWalletId(walletId);
    setLedgerLoading(true);
    try {
      const response = await adminFetch(`/api/admin/ledger/${encodeURIComponent(walletId)}?limit=50`);
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to fetch ledger');
      setLedgerRows(result.data || []);
    } catch (e) {
      console.error(e);
      alert(e.message || 'Failed to fetch ledger');
    } finally {
      setLedgerLoading(false);
    }
  };

  // Filter and sort players
  const filteredPlayers = useMemo(() => {
    const searchLower = (searchTerm || '').toString().toLowerCase().trim();

    let result = playerStats.filter((player) => {
      const playerProfile = player?.profiles || {};
      const username = (playerProfile?.full_name || '').toString().toLowerCase();
      const playerId = (playerProfile?.player_id || '').toString().toLowerCase();
      const userId = (player?.user_id || '').toString().toLowerCase();

      return (
        username.includes(searchLower) ||
        playerId.includes(searchLower) ||
        userId.includes(searchLower)
      );
    });

    // Sort
    result.sort((a, b) => {
      const aBalance = Number(a?.balance ?? 0);
      const bBalance = Number(b?.balance ?? 0);
      const aSpent = Number(a?.total_spent ?? 0);
      const bSpent = Number(b?.total_spent ?? 0);

      switch (sortBy) {
        case 'balance':
          return bBalance - aBalance;
        case 'spent':
          return bSpent - aSpent;
        case 'created_at':
        default: {
          const aDate = a?.created_at ? new Date(a.created_at).getTime() : 0;
          const bDate = b?.created_at ? new Date(b.created_at).getTime() : 0;
          return bDate - aDate;
        }
      }
    });

    return result;
  }, [playerStats, searchTerm, sortBy]);

  const pageSummary = useMemo(() => playerStats.reduce((totals, player) => ({
    balance: totals.balance + Number(player.balance || 0),
    spent: totals.spent + Number(player.total_spent || 0)
  }), { balance: 0, spent: 0 }), [playerStats]);

  // Start editing player
  const startEdit = (player) => {
    setEditingPlayer(player);
    setTempBalance(player.balance.toString());
    setTempMembership(player.membership_tier);
    setTempDuration('30');
    
    // Load profile fields
    const p = player.profiles || {};
    setTempProfile({
      full_name: p.full_name || '',
      age: p.age || '',
      contact_info: p.contact_info || '',
      game_uid: p.game_uid || '',
      promo_code: p.promo_code || '',
      rank: p.rank || 'Unranked',
      combat_score: p.combat_score || 0,
      total_kills: p.total_kills || 0,
      achievements: Array.isArray(p.achievements) ? p.achievements : []
    });
  };

  // Save player changes
  const savePlayerChanges = async () => {
    if (!editingPlayer) return;

    try {
      // Update balance
      const newBalance = parseInt(tempBalance) || 0;
      if (newBalance !== editingPlayer.balance) {
        await balanceService.adminUpdateBalance(editingPlayer.user_id, newBalance, 'Admin adjustment: ' + tempDescription);
      }

      // Update membership
      if (tempMembership !== editingPlayer.membership_tier) {
        await balanceService.adminUpdateMembership(editingPlayer.user_id, tempMembership, parseInt(tempDuration));
      }

      // Update profile stats & achievements
      await balanceService.adminUpdatePlayerStats(editingPlayer.user_id, {
        full_name: tempProfile.full_name,
        age: parseInt(tempProfile.age) || null,
        contact_info: tempProfile.contact_info,
        game_uid: tempProfile.game_uid,
        promo_code: tempProfile.promo_code,
        rank: tempProfile.rank,
        combat_score: parseInt(tempProfile.combat_score) || 0,
        total_kills: parseInt(tempProfile.total_kills) || 0,
        achievements: tempProfile.achievements
      });

      // Refresh data
      await fetchPlayerStats();
      setEditingPlayer(null);
      alert('Player stats updated successfully!');
    } catch (error) {
      console.error('Error saving player changes:', error);
      alert('Failed to update player stats');
    }
  };

  const handleAchievementToggle = (achievementId) => {
    setTempProfile(prev => {
      const current = prev.achievements;
      if (current.includes(achievementId)) {
        return { ...prev, achievements: current.filter(a => a !== achievementId) };
      } else {
        return { ...prev, achievements: [...current, achievementId] };
      }
    });
  };

  const getMembershipColor = (tier) => {
    const colors = {
      none: 'text-gray-400',
      bronze: 'text-amber-500',
      silver: 'text-slate-400',
      gold: 'text-yellow-500',
      platinum: 'text-cyan-400'
    };
    return colors[tier] || 'text-gray-400';
  };

  const getMembershipBadgeColor = (tier) => {
    const colors = {
      none: 'bg-gray-900 border-gray-700',
      bronze: 'bg-amber-900/30 border-amber-700',
      silver: 'bg-slate-900/30 border-slate-700',
      gold: 'bg-yellow-900/30 border-yellow-700',
      platinum: 'bg-cyan-900/30 border-cyann'
    };
    return colors[tier] || 'bg-gray-900 border-gray-700';
  };

  return (
    <section className="space-y-4 md:space-y-5">
      <div className="overflow-hidden rounded-xl border border-cyan bg-[#061321] shadow-[0_16px_45px_rgba(0,0,0,0.22)]">
        <div className="flex flex-col gap-4 border-b border-cyan-950/80 px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
          <h2 className="flex items-center gap-3 font-orbitron text-lg font-black uppercase tracking-[0.08em] text-slate-100 sm:text-xl">
            <i className="fa-solid fa-chart-line text-cyan-400"></i>
            <span>Player <span className="text-cyan-400">Statistics</span></span>
          </h2>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              onClick={fetchPlayerStats}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-700 bg-slate-900/80 px-3.5 py-2 text-xs font-bold text-slate-200 transition-colors hover:border-cyan-700 hover:text-white disabled:cursor-wait disabled:opacity-50"
            >
              <i className={`fa-solid fa-rotate-right ${loading ? 'animate-spin' : ''}`}></i>
              Refresh Data
            </button>
            <label className="flex min-w-0 items-center gap-2 rounded-md border border-slate-700 bg-slate-950/50 px-3 py-2 text-slate-500 focus-within:border-cyan-500 sm:w-56">
              <i className="fa-solid fa-magnifying-glass text-xs"></i>
              <input
                type="search"
                placeholder="Search username or ID..."
                aria-label="Search players by username or ID"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="min-w-0 flex-1 bg-transparent text-xs text-white outline-none placeholder:text-slate-500"
              />
            </label>
            <select
              aria-label="Sort players"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-md border border-slate-700 bg-[#091827] px-3 py-2 text-xs text-slate-200 outline-none focus:border-cyan-500"
            >
              <option value="created_at">Sort by: Newest</option>
              <option value="balance">Sort by: Balance (High)</option>
              <option value="spent">Sort by: Total Spent</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-3 sm:p-4">
          {[
            { label: 'Players on this page', value: playerStats.length.toLocaleString(), icon: 'fa-users', accent: 'text-cyan-300' },
            { label: 'Total Balance', value: `◈ ${pageSummary.balance.toLocaleString()}`, icon: 'fa-wallet', accent: 'text-cyan-300' },
            { label: 'Total Spent', value: `◈ ${pageSummary.spent.toLocaleString()}`, icon: 'fa-coins', accent: 'text-slate-100' }
          ].map((stat) => (
            <div key={stat.label} className="relative flex min-h-[76px] items-center justify-between overflow-hidden rounded-lg border border-cyann bg-[#091a2c] px-4 py-3 before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:bg-cyan-400">
              <div>
                <div className="mb-1 text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">{stat.label}</div>
                <div className={`font-orbitron text-xl font-black ${stat.accent}`}>{stat.value}</div>
              </div>
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-cyann bg-cyan-400/10 text-cyan-300">
                <i className={`fa-solid ${stat.icon}`}></i>
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-cyan bg-[#061321] shadow-[0_16px_45px_rgba(0,0,0,0.22)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left">
            <thead className="border-b border-cyann bg-[#0a1a2a]">
              <tr>
                <th className="w-12 px-3 py-3 text-center text-[9px] font-orbitron font-black uppercase tracking-widest text-slate-400">#</th>
                <th className="px-3 py-3 text-[9px] font-orbitron font-black uppercase tracking-widest text-slate-400">Player</th>
                <th className="px-3 py-3 text-right text-[9px] font-orbitron font-black uppercase tracking-widest text-slate-400">Balance</th>
                <th className="px-3 py-3 text-right text-[9px] font-orbitron font-black uppercase tracking-widest text-slate-400">Spent</th>
                <th className="px-3 py-3 text-center text-[9px] font-orbitron font-black uppercase tracking-widest text-slate-400">Status</th>
                <th className="px-3 py-3 text-center text-[9px] font-orbitron font-black uppercase tracking-widest text-slate-400">Ledger</th>
                <th className="px-3 py-3 text-center text-[9px] font-orbitron font-black uppercase tracking-widest text-slate-400">Edit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cyann">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-400">
                    <i className="fa-solid fa-spinner fa-spin mr-2 text-cyan-400"></i>Loading players...
                  </td>
                </tr>
              ) : filteredPlayers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-400">No players found.</td>
                </tr>
              ) : (
                filteredPlayers.map((player, index) => {
                  const name = player.profiles?.full_name || 'Unnamed player';
                  const playerId = player.profiles?.player_id || player.user_id || '';
                  const membership = catalogMemberships[player.membership_tier]?.name || 'None';
                  const status = String(player.status || 'active');
                  const initials = name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'P';

                  return (
                    <tr key={player.user_id || player.profiles?.player_id} className="transition-colors hover:bg-cyan-400/[0.035]">
                      <td className="px-3 py-2.5 text-center text-xs font-semibold text-slate-400">{page * pageSize + index + 1}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex min-w-0 items-center gap-2.5">
                          {player.profiles?.avatar_url ? (
                            <img src={player.profiles.avatar_url} alt="" className="h-8 w-8 shrink-0 rounded-full border border-cyan-700/70 object-cover" />
                          ) : (
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-cyan-700/70 bg-cyan-400/10 font-orbitron text-[10px] font-bold text-cyan-300">{initials}</span>
                          )}
                          <div className="min-w-0">
                            <div className="truncate text-xs font-bold text-slate-100">{name}</div>
                            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[9px] text-slate-500">
                              <span>ID: {playerId}</span>
                              <span>UID: {(player.user_id || '').slice(0, 8)}</span>
                              <span className={`${getMembershipColor(player.membership_tier)} font-bold`}>{membership}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-right font-orbitron text-xs font-black text-cyan-300">◈ {Number(player.balance || 0).toLocaleString()}</td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-right font-orbitron text-xs font-bold text-slate-200">◈ {Number(player.total_spent || 0).toLocaleString()}</td>
                      <td className="px-3 py-2.5 text-center">
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-bold capitalize ${
                          status.toLowerCase() === 'active'
                            ? 'border-emerald-700/60 bg-emerald-950/60 text-emerald-300'
                            : 'border-slate-700 bg-slate-900 text-slate-300'
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${status.toLowerCase() === 'active' ? 'bg-emerald-400' : 'bg-slate-400'}`}></span>
                          {status}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <button
                          onClick={() => openLedger(player.profiles?.player_id)}
                          disabled={!player.profiles?.player_id}
                          className="rounded-md border border-slate-700 bg-slate-900/80 px-2.5 py-1.5 text-[10px] font-bold text-slate-200 transition-colors hover:border-cyan-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                          title="View ledger"
                        >
                          <i className="fa-solid fa-receipt mr-1.5"></i>Ledger
                        </button>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <button
                          onClick={() => startEdit(player)}
                          className="rounded-md bg-red-500 px-2.5 py-1.5 text-[10px] font-black text-[#031018] transition-colors hover:bg-cyan-300"
                        >
                          <i className="fa-solid fa-pen-to-square mr-1.5"></i>Edit
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-cyan-950 px-3 py-2.5 sm:px-4">
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            className="rounded-md border border-slate-800 bg-slate-900/70 px-3 py-1.5 text-[10px] font-semibold text-slate-300 transition-colors hover:border-cyan-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <i className="fa-solid fa-chevron-left mr-1.5"></i>Previous
          </button>
          <span className="text-[10px] font-semibold text-slate-400">Page {page + 1}</span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={filteredPlayers.length < pageSize}
            className="rounded-md border border-slate-800 bg-slate-900/70 px-3 py-1.5 text-[10px] font-semibold text-slate-300 transition-colors hover:border-cyan-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next<i className="fa-solid fa-chevron-right ml-1.5"></i>
          </button>
        </div>
      </div>

      {/* Edit Modal */}
      {editingPlayer && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[2000]">
          <div className="relative w-full h-[90vh] max-w-4xl p-4 bg-bg-card rounded-2xl border border-white/10 shadow-2xl animate-fade-in my-8 overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-orbitron font-black text-white">
                Edit Player: {tempProfile.full_name || 'Unknown'}
              </h3>
              <button onClick={() => setEditingPlayer(null)} className="text-gray-400 hover:text-white">
                <i className="fa-solid fa-times text-xl"></i>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column: Financial & Membership */}
              <div className="space-y-4">
                <h4 className="text-primary font-orbitron font-bold border-b border-white/10 pb-2 mb-4">Financial & Status</h4>
                {/* Balance */}
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-2">Balance (◈)</label>
                  <input
                    type="number"
                    value={tempBalance}
                    onChange={(e) => setTempBalance(e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-white focus:outline-none focus:border-primary"
                  />
                  <label className="block text-sm font-bold text-gray-400 mb-2">Description</label>
                  <input
                    type="text"
                    value={tempDescription}
                    onChange={(e) => setTempDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-white focus:outline-none focus:border-primary"
                  />
                </div>


                {/* Membership Tier */}
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-2">Membership Tier</label>
                  <select
                    value={tempMembership}
                    onChange={(e) => setTempMembership(e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-white focus:outline-none focus:border-primary"
                  >
                    {Object.entries(catalogMemberships).map(([key, value]) => (
                      <option className='bg-black' key={key} value={key}>
                        {value.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-2">Membership Duration Extension (Days)</label>
                  <input
                    type="number"
                    value={tempDuration}
                    onChange={(e) => setTempDuration(e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-white focus:outline-none focus:border-primary"
                  />
                </div>
                
                <h4 className="text-primary font-orbitron font-bold border-b border-white/10 pb-2 mt-8 mb-4">Game Stats</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-400 mb-2">Total Kills</label>
                    <input
                      type="number"
                      value={tempProfile.total_kills}
                      onChange={(e) => setTempProfile({...tempProfile, total_kills: e.target.value})}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-white focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-400 mb-2">Combat Score</label>
                    <input
                      type="number"
                      value={tempProfile.combat_score}
                      onChange={(e) => setTempProfile({...tempProfile, combat_score: e.target.value})}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-white focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-2">Current Rank</label>
                  <select
                    value={tempProfile.rank}
                    onChange={(e) => setTempProfile({...tempProfile, rank: e.target.value})}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-white focus:outline-none focus:border-primary"
                  >
                    <option className='bg-black' value="Unranked">Unranked</option>
                    <option className='bg-black' value="Bronze">Bronze</option>
                    <option className='bg-black' value="Silver">Silver</option>
                    <option className='bg-black' value="Gold">Gold</option>
                    <option className='bg-black' value="Platinum">Platinum</option>
                    <option className='bg-black' value="Diamond">Diamond</option>
                    <option className='bg-black' value="Crown">Crown</option>
                    <option className='bg-black' value="Ace">Ace</option>
                    <option className='bg-black' value="Conqueror">Conqueror</option>
                  </select>
                </div>
              </div>

              {/* Right Column: Profile & Achievements */}
              <div className="space-y-4">
                <h4 className="text-primary font-orbitron font-bold border-b border-white/10 pb-2 mb-4">Profile Details</h4>
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-2">Full Name / Gamertag</label>
                  <input
                    type="text"
                    value={tempProfile.full_name}
                    onChange={(e) => setTempProfile({...tempProfile, full_name: e.target.value})}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-white focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-400 mb-2">Age</label>
                    <input
                      type="number"
                      value={tempProfile.age}
                      onChange={(e) => setTempProfile({...tempProfile, age: e.target.value})}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-white focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-400 mb-2">Phone / Discord</label>
                    <input
                      type="text"
                      value={tempProfile.contact_info}
                      onChange={(e) => setTempProfile({...tempProfile, contact_info: e.target.value})}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-white focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-400 mb-2">Game UID</label>
                    <input
                      type="text"
                      value={tempProfile.game_uid}
                      onChange={(e) => setTempProfile({...tempProfile, game_uid: e.target.value})}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-white focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-400 mb-2">Promo Code</label>
                    <input
                      type="text"
                      value={tempProfile.promo_code}
                      onChange={(e) => setTempProfile({...tempProfile, promo_code: e.target.value})}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-white focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <h4 className="text-primary font-orbitron font-bold border-b border-white/10 pb-2 mt-8 mb-4">Achievements</h4>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                  {[
                    { id: 'FIRST_BLOOD', name: 'First Blood (10 Kills)' },
                    { id: 'ASSASSIN', name: 'Assassin (50 Kills)' },
                    { id: 'VETERAN', name: 'Veteran (100 Kills)' },
                    { id: 'TERMINATOR', name: 'Terminator (500 Kills)' },
                    { id: 'GLADIATOR', name: 'Gladiator (1k Combat)' },
                    { id: 'WARLORD', name: 'Warlord (5k Combat)' },
                    { id: 'ELITE_RANK', name: 'Elite Rank (Diamond+)' },
                  ].map(ach => (
                    <label key={ach.id} className="flex items-center gap-2 text-sm text-gray-300 bg-white/5 p-2 rounded border border-white/5 hover:bg-white/10 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={tempProfile.achievements.includes(ach.id)}
                        onChange={() => handleAchievementToggle(ach.id)}
                        className="accent-primary"
                      />
                      <span>{ach.name}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-500 italic mt-2">* Achievements automatically unlock based on stats when you save.</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-white/10">
                <button
                  onClick={() => setEditingPlayer(null)}
                  className="flex-1 px-4 py-2 bg-white/5 text-white rounded font-bold hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  onClick={savePlayerChanges}
                  className="flex-1 px-4 py-2 bg-primary text-dark rounded font-bold hover:bg-primary/80"
                >
                  Save Changes
                </button>
              </div>
          </div>
        </div>
      )}

      {/* Ledger Modal */}
      {ledgerWalletId && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-bg-card border border-white/10 rounded-2xl p-6 max-w-3xl w-full my-8">
            <div className="flex justify-between items-center mb-4">
              <div>
                <div className="text-gray-500 text-xs uppercase tracking-widest">Wallet Ledger</div>
                <div className="text-white font-orbitron font-black">{ledgerWalletId}</div>
              </div>
              <button onClick={() => setLedgerWalletId(null)} className="text-gray-400 hover:text-white">
                <i className="fa-solid fa-times text-xl"></i>
              </button>
            </div>

            {ledgerLoading ? (
              <div className="text-gray-400"><i className="fa-solid fa-spinner fa-spin mr-2"></i>Loading...</div>
            ) : ledgerRows.length === 0 ? (
              <div className="text-gray-500">No ledger entries.</div>
            ) : (
              <div className="space-y-2 max-h-[520px] overflow-y-auto pr-2 custom-scrollbar">
                {ledgerRows.map((tx) => {
                  const isOut = tx.from_wallet_id === ledgerWalletId && tx.to_wallet_id !== ledgerWalletId;
                  return (
                    <div key={tx.tx_id} className="bg-white/5 border border-white/10 rounded-lg p-3 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <div className="text-white font-bold text-sm truncate">{(tx.type || '').replaceAll('_', ' ')}</div>
                        <div className="text-xs text-gray-500 truncate">
                          {tx.description || '—'} • {tx.created_at ? new Date(tx.created_at).toLocaleString() : ''}
                        </div>
                        {(tx.reference_id || tx.idempotency_key) && (
                          <div className="text-[10px] text-gray-600 font-mono truncate">
                            {tx.reference_id ? `ref:${tx.reference_id}` : ''}{tx.reference_id && tx.idempotency_key ? ' • ' : ''}{tx.idempotency_key ? `idem:${tx.idempotency_key}` : ''}
                          </div>
                        )}
                      </div>
                      <div className={`font-orbitron font-black ${isOut ? 'text-pink' : 'text-tertiary'}`}>
                        {isOut ? '-' : '+'}◈ {Number(tx.amount || 0).toLocaleString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default PlayerStatsAdmin;
