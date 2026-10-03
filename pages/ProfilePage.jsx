import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import PlayerBalance from '../components/PlayerBalance';
import FadeContent from '../components/ReactBits/FadeContent';
import BlurText from '../components/ReactBits/BlurText';
import ShinyText from '../components/ReactBits/ShinyText';
import ErrorBox from '../components/ErrorBox.jsx';

const ProfilePage = ({ tournaments, registrations, leaderboard }) => {
  const { user, profile, loading, loginWithGoogle, logout, reloadProfile } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('wallet');
  const [formData, setFormData] = useState({
    full_name: '',
    age: '',
    game_uid: '',
    promo_code: '',
    contact_info: ''
  });
  const [updating, setUpdating] = useState(false);
  const [verificationPending, setVerificationPending] = useState(false);
  const [verificationSubmitting, setVerificationSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Sync profile details with form inputs
  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        age: profile.age || '',
        game_uid: profile.game_uid || '',
        promo_code: profile.promo_code || '',
        contact_info: profile.contact_info || ''
      });
    }
  }, [profile]);

  useEffect(() => {
    if (!user || profile?.verified) return;
    let cancelled = false;
    authService.getVerificationRequest().then(({ data, error }) => {
      if (cancelled) return;
      if (error) {
        setErrorMsg(error.message || 'Unable to check verification request status.');
        return;
      }
      setVerificationPending(Boolean(data?.pending));
    });
    return () => {
      cancelled = true;
    };
  }, [user, profile?.verified]);

  const handleVerificationRequest = async () => {
    setVerificationSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');
    const { data, error } = await authService.submitVerificationRequest();
    if (error) {
      setErrorMsg(error.message || 'Failed to submit verification request.');
    } else {
      setVerificationPending(Boolean(data?.pending));
      setSuccessMsg('Verification request submitted. An admin will review your account.');
    }
    setVerificationSubmitting(false);
  };

  if (loading) {
    return (
      <div className="pt-32 pb-24 text-center min-h-[80vh] flex flex-col justify-center items-center">
        <div className="w-12 h-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin mb-4"></div>
        <p className="font-orbitron font-black text-gray-500 uppercase tracking-widest text-sm animate-pulse">Syncing Player Data...</p>
      </div>
    );
  }

  // Not Logged In View
  if (!user) {
    return (
      <div className="pt-32 pb-24 px-4 bg-bg-dark min-h-screen flex items-center justify-center relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none"></div>

        <div
          className="glass p-8 md:p-12 rounded-2xl max-w-lg w-full text-center relative border border-primary/10"
          style={{ boxShadow: '0 0 50px rgba(0,212,255,0.05)' }}
        >
          <div className="w-16 h-16 bg-primary/10 border border-primary/30 rounded-2xl flex items-center justify-center mx-auto mb-6 relative">
            <i className="fa-solid fa-lock text-2xl text-primary animate-pulse"></i>
            <div className="absolute -inset-1 bg-primary/20 blur-md rounded-2xl -z-10"></div>
          </div>

          <h1 className="text-2xl md:text-3xl font-orbitron font-black text-white uppercase tracking-tight mb-3">
            SECTOR <span className="text-primary">RESTRICTED</span>
          </h1>
          <p className="text-gray-400 font-rajdhani text-base md:text-lg mb-8 leading-relaxed uppercase tracking-wider">
            Warrior authentication is required to access the profile dashboard. Connect your account to enter.
          </p>

          <button
            onClick={loginWithGoogle}
            className="w-full py-4 px-6 bg-primary text-dark font-orbitron font-black text-sm uppercase tracking-widest transition-all duration-300 relative overflow-hidden group cursor-pointer"
            style={{
              clipPath: 'polygon(6% 0, 100% 0, 100% 70%, 94% 100%, 0 100%, 0 30%)',
              boxShadow: '0 0 25px rgba(0, 212, 255, 0.3)',
            }}
          >
            <span className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></span>
            <span className="flex items-center justify-center gap-3">
              <i className="fa-brands fa-google text-lg"></i>
              <span>AUTHENTICATE WITH GOOGLE</span>
            </span>
          </button>
        </div>
      </div>
    );
  }

  // Get user's registered tournaments (matching email or full name)
  const userEmail = user.email ? user.email.toLowerCase() : '';
  const myRegistrations = (Array.isArray(registrations) ? registrations : []).filter(reg => {
    return (reg.playeremail?.toLowerCase() === userEmail) || (reg.registrar_email?.toLowerCase() === userEmail);
  });

  // Calculate stats
  const totalTournaments = myRegistrations.length;
  const activeSectors = myRegistrations.filter(reg => {
    const parentT = (tournaments || []).find(t => String(t.id) === String(reg.tournamentid));
    if (!parentT) return false;
    const now = new Date();
    const endD = parentT.registration_end_date ? new Date(parentT.registration_end_date) : null;
    return !endD || now <= endD;
  }).length;

  // Lookup in leaderboard to see achievements/points
  const leaderEntry = (Array.isArray(leaderboard) ? leaderboard : []).find(entry => {
    return entry.teamname?.toLowerCase() === profile?.full_name?.toLowerCase() ||
      entry.teamname?.toLowerCase() === user?.user_metadata?.full_name?.toLowerCase();
  });

  const playerPoints = profile?.combat_score || leaderEntry?.points || 0;
  const playerRank = profile?.rank || leaderEntry?.rank || 'N/A';
  const playerKills = profile?.total_kills || leaderEntry?.kills || 0;
  const playerID = profile?.player_id || 'N/A';



  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setSuccessMsg('');
    setErrorMsg('');

    if (!formData.full_name.trim() || !formData.age || !formData.contact_info.trim()) {
      setErrorMsg('All credential fields are mandatory.');
      setUpdating(false);
      return;
    }


    const ageNum = parseInt(formData.age);
    if (isNaN(ageNum) || ageNum < 10 || ageNum > 100) {
      setErrorMsg('Please enter a valid age (10-100).');
      setUpdating(false);
      return;
    }

    const profileData = {
      email: user.email,
      full_name: formData.full_name.trim(),
      avatar_url: user.user_metadata?.avatar_url || '',
      age: ageNum,
      game_uid: formData.game_uid.trim() || '',
      rank: profile?.rank || 'UNRANKED',
      total_kills: profile?.total_kills || 0,
      combat_score: profile?.combat_score || 0,
      promo_code: formData.promo_code.trim() || '',
      contact_info: formData.contact_info.trim()
    };



    const { error } = await authService.createProfile(user.id, profileData);
    if (error) {
      setErrorMsg('Failed to update Settings: ' + error.message);
    } else {
      setSuccessMsg('Warrior Settings saved successfully!');
      await reloadProfile();
    }
    setUpdating(false);
  };

  const generatepromo_code = () => {
    const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const generatedCode = `TAIG${randomCode}`;
    console.log('Generated Promo Code:', generatedCode);
    setFormData({ ...formData, promo_code: generatedCode });
  };



  return (
    <div id="profile-dashboard" className="relative min-h-screen overflow-hidden bg-[#050d14] pb-16 pt-20 text-white md:pt-24">
      {errorMsg && (
        <ErrorBox message={errorMsg} onClose={() => setErrorMsg('')} type="error" />
      )}
      {successMsg && (
        <ErrorBox message={successMsg} onClose={() => setSuccessMsg('')} type="success" />
      )}
      <div className="container relative mx-auto max-w-7xl px-4 md:px-8">

        {/* ─── Profile Header / Hero ─── */}
        <div className="relative mb-5 overflow-hidden rounded-lg border border-cyann bg-[#071722] p-5 md:p-8">
          <div className="absolute inset-0 bg-[linear-gradient(105deg,rgba(4,15,23,.98)_0%,rgba(4,15,23,.92)_48%,rgba(4,15,23,.65)_100%)]" />
          <img src="https://res.cloudinary.com/dkoirxf41/image/upload/v1790497757/Taigours_E-Sports_White_Logo_only-removebg-preview_tmkzla.png" alt="" aria-hidden="true" className="pointer-events-none absolute -right-10 -top-24 hidden h-[390px] w-[390px] object-contain opacity-[0.09] md:block" />
          <div className="absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-cyann to-transparent" />
          <div className="relative z-10 flex flex-col items-center gap-5 sm:flex-row sm:items-start md:gap-6">
            {/* Avatar block */}
            <div className="relative">
              {profile?.avatar_url || user.user_metadata?.avatar_url ? (
                <img
                  src={profile?.avatar_url || user.user_metadata?.avatar_url}
                  className="h-24 w-24 rounded-lg border border-cyann object-cover shadow-[0_0_24px_rgba(0,212,255,.16)] md:h-28 md:w-28"
                  alt="Avatar"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-lg border border-cyann bg-cyan-400/10 font-orbitron text-3xl font-black text-cyan shadow-[0_0_24px_rgba(0,212,255,.16)] md:h-28 md:w-28">
                  {profile?.full_name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                </div>
              )}
              {/* Online pulse */}
              <div
                className="absolute -bottom-1 -right-2 flex items-center gap-1 rounded-sm border border-[#071722] bg-emerald-400 px-2 py-1 font-orbitron text-[8px] font-bold text-[#06110d]"
                style={{ boxShadow: '0 0 10px #00ff80' }}
              >
                <span className="w-1.5 h-1.5 bg-dark rounded-full animate-ping"></span>
                ACTIVE
              </div>
            </div>

            {/* Profile Info details */}
            <div className="mt-1 min-w-0 flex-1 space-y-2 text-center sm:text-left">
              <p className="font-space text-[9px] font-bold uppercase tracking-[0.24em] text-cyan">Player Profile</p>
              <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <h1 className="break-words font-space text-3xl font-black uppercase leading-none text-white sm:text-4xl md:text-5xl">
                  {profile?.full_name || user.user_metadata?.full_name || 'Player One'}
                </h1>
                {profile?.verified === true && (
                  <svg
                    viewBox="0 0 24 24"
                    className="h-6 w-6 shrink-0 text-cyan"
                    fill="currentColor"
                    role="img"
                    aria-label="Verified account"
                    title="Verified account"
                  >
                    <path d="M8.004 1.183a1.5 1.5 0 0 1 2.049-.55L12 1.759 13.947.634a1.5 1.5 0 0 1 2.05.549L17.045 3H19.5A1.5 1.5 0 0 1 21 4.5v2.453l1.817 1.05a1.5 1.5 0 0 1 .55 2.049L22.241 12l1.124 1.947a1.5 1.5 0 0 1-.55 2.05L21 17.044V19.5a1.5 1.5 0 0 1-1.5 1.5h-2.454l-1.05 1.817a1.5 1.5 0 0 1-2.048.549L12 22.241l-1.948 1.125a1.5 1.5 0 0 1-2.049-.549L6.955 21H4.5A1.5 1.5 0 0 1 3 19.5v-2.455l-1.817-1.049a1.5 1.5 0 0 1-.549-2.049L1.758 12 .634 10.053a1.5 1.5 0 0 1 .549-2.05L3 6.954V4.5A1.5 1.5 0 0 1 4.5 3h2.454l1.05-1.817zm9.703 9.024a1 1 0 0 0-1.414-1.414l-5.44 5.44a.5.5 0 0 1-.707 0l-2.439-2.44a1 1 0 0 0-1.414 1.414l2.44 2.44a2.5 2.5 0 0 0 3.535 0l5.44-5.44z" />
                  </svg>
                )}
              </div>
              <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 font-rajdhani text-sm text-slate-300 sm:justify-start md:text-base">
                <span className="break-all">{user.email}</span>
                <span className="hidden text-cyan/50 sm:inline">/</span>
                <span className="font-rajdhani text-xs uppercase text-slate-400">
                  Age: {profile?.age || 'Unset'}
                </span>
              </p>

              {/* Player ID */}

              <div className="mt-2 flex items-center justify-center gap-1 sm:justify-start">
                <div className="inline-block rounded-md border border-cyann bg-[#06111a]/80 px-3">
                  <span className="font-orbitron text-[9px] font-bold uppercase text-slate-400">Player ID: </span>
                  <span className="font-mono text-[10px] font-bold text-cyan">{playerID}</span>
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText(playerID)}
                  className="rounded-md border border-cyann bg-[#06111a]/80 px-3 py-2 font-orbitron text-[9px] font-bold uppercase tracking-wider text-slate-300 transition-colors hover:bg-cyan hover:text-[#041018]"
                >
                  Copy <i className="fa-regular fa-copy"></i>
                </button>
              </div>

              {/* Wallet quick actions */}
              <div className="mt-3 flex flex-col justify-center gap-2 sm:flex-row sm:justify-start">
                <button
                  onClick={() => setActiveTab('wallet')}
                  className="rounded-md border border-cyann bg-cyan px-4 py-2 font-orbitron text-[10px] font-black uppercase tracking-widest text-[#041018] transition-colors hover:bg-white"
                >
                  Open Wallet
                </button>
                <Link
                  to="/tournaments"
                  className="rounded-md border border-cyann bg-[#07131d]/70 px-4 py-2 text-center font-orbitron text-[10px] font-black uppercase tracking-widest text-white transition-colors hover:border-cyann hover:text-cyan"
                >
                  Join Tournaments
                </Link>
              </div>

              {/* Badges */}
              
            </div>
          </div>
        </div>

        {/* ─── Profile Stats Dashboard grid ─── */}
        <div className="mb-5 grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3">
          
          {[
            { label: 'ARENA ENTRIES', val: totalTournaments, icon: 'fa-trophy', color: 'text-primary' },
            { label: 'ACTIVE SECTORS', val: activeSectors, icon: 'fa-crosshairs', color: 'text-tertiary' },
            { label: 'LEADERBOARD RANK', val: playerRank === 'N/A' ? '-' : `#${playerRank}`, icon: 'fa-crown', color: 'text-accent' },
            { label: 'COMBAT POINTS', val: playerPoints, icon: 'fa-bolt', color: 'text-pink' },
          ].map((stat, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between rounded-md border border-cyann bg-[#081722] p-3 transition-colors group hover:border-cyann md:p-4"
            >
              <div className="space-y-1">
                <span className="block font-space text-[8px] font-bold uppercase text-slate-400 md:text-[9px]">
                  {stat.label}
                </span>
                <span className="block font-space text-lg font-black leading-none text-white md:text-2xl">
                  {stat.val}
                </span>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#050d14] transition-colors group-hover:bg-cyan-400/15 md:h-10 md:w-10">
                <i className={`fa-solid ${stat.icon} ${stat.color} text-sm md:text-base`}></i>
              </div>
            </div>
          ))}
        </div>

        {/* ─── Main Content Tabs ─── */}
        <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-[190px_minmax(0,1fr)] md:gap-5">
          {/* Tab buttons / selector sidebar */}
          <aside className="space-y-3">
          <div className="grid grid-cols-2 gap-2 md:grid-cols-1">
            {[
              { id: 'wallet', label: 'Wallet', desc: 'Balance & membership', icon: 'fa-wallet' },
              { id: 'deployments', label: 'Deployments', desc: 'Registered Tournament', icon: 'fa-shield-halved' },
              { id: 'settings', label: 'Settings', desc: 'Update profile sheet', icon: 'fa-sliders' },
              { id: 'achievements', label: 'Achievements', desc: 'Acquired rank titles', icon: 'fa-medal' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setSuccessMsg(''); setErrorMsg(''); }}
                aria-pressed={activeTab === tab.id}
                className="flex w-full cursor-pointer items-center gap-2 rounded-md border p-2.5 text-left transition-colors group sm:gap-3 sm:p-3"
                style={{
                  background: activeTab === tab.id
                    ? 'linear-gradient(135deg, rgba(0, 212, 255, 0.1) 0%, rgba(0, 213, 255, 0.36) 100%)'
                    : 'rgba(7, 19, 29, 0.88)',
                  borderColor: activeTab === tab.id ? 'rgba(0, 212, 255, 0.75)' : 'rgba(0, 212, 255, 0.3)',
                  boxShadow: activeTab === tab.id ? 'inset 3px 0 0 #00d4ff' : 'none',
                }}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors sm:h-9 sm:w-9 ${activeTab === tab.id
                    ? 'bg-primary/20 border border-primary/30 text-primary shadow-[0_0_10px_rgba(0,212,255,0.2)]'
                    : 'bg-cyan-400/5 border border-cyann text-gray-400 group-hover:text-gray-300'
                    }`}
                >
                  <i className={`fa-solid ${tab.icon} text-[14px] md:text-sm`}></i>
                </div>
                <div className="flex-1">
                  <span className={`block font-space text-[9px] font-bold uppercase sm:text-[10px] ${activeTab === tab.id ? 'text-cyan' : 'text-slate-200 group-hover:text-white'
                    }`}>
                    {tab.label}
                  </span>
                  <span className="mt-0.5 hidden truncate font-rajdhani text-[9px] uppercase text-slate-400 sm:block">
                    {tab.desc}
                  </span>
                </div>
              </button>
            ))}
          </div>
          <div className="relative mt-3 hidden min-h-[250px] overflow-hidden rounded-lg border border-cyann bg-[#06111a] p-5 md:flex md:flex-col md:items-center md:justify-end md:text-center">
            <img src="https://res.cloudinary.com/dkoirxf41/image/upload/v1790497757/Taigours_E-Sports_White_Logo_only-removebg-preview_tmkzla.png" alt="Taigour E-Sports" className="absolute inset-x-0 top-4 mx-auto h-36 w-36 object-contain opacity-80" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#06111a] via-[#06111a]/50 to-transparent" />
            <div className="relative z-10">
              <p className="font-space text-base font-black uppercase text-white">TAIGOUR <span className="text-cyan">E-SPORTS</span></p>
              <p className="mt-1 font-space text-[8px] font-bold uppercase tracking-[0.3em] text-slate-400">More than a game</p>
              <Link to="/tournaments" className="mt-4 inline-flex items-center gap-2 rounded-md border border-cyann px-4 py-2 font-space text-[9px] font-bold uppercase text-cyan transition-colors hover:bg-cyan hover:text-[#041018]">
                Enter the arena <i className="fa-solid fa-arrow-right" />
              </Link>
            </div>
          </div>
          </aside>

          {/* Tab content panel */}
          <div className="min-h-[400px] min-w-0 rounded-lg border border-cyann bg-[#07131d]/95 p-3 shadow-[0_0_18px_rgba(0,212,255,0.06)] sm:p-4 md:p-5">

            {/* ─── TAB 0: Wallet / Balance ─── */}
            {activeTab === 'wallet' && (
              <PlayerBalance />
            )}

            {/* ─── TAB 1: Deployments ─── */}
            {activeTab === 'deployments' && (
              <div className="space-y-6">
                <div className="border-b border-white/5 pb-4">
                  <h3 className="font-orbitron font-bold text-xl text-white uppercase tracking-tight">
                    ACTIVE SCRIMS & TOURNAMENTS
                  </h3>
                  <p className="text-gray-500 font-rajdhani text-xs uppercase tracking-widest mt-1">
                    Your active sectors in competitive brackets
                  </p>
                </div>

                {myRegistrations.length === 0 ? (
                  <div className="py-16 text-center">
                    <i className="fa-solid fa-gamepad text-gray-600 text-4xl mb-4 block animate-bounce"></i>
                    <p className="font-orbitron font-bold text-gray-400 uppercase tracking-wide">NO ACTIVE DEPLOYMENTS</p>
                    <p className="text-gray-500 font-rajdhani text-sm mt-1 max-w-sm mx-auto leading-relaxed">
                      You are currently not deployed in any arena sectors. Enter the arena index and secure your slot!
                    </p>
                    <Link
                      to="/tournaments"
                      className="mt-6 inline-block px-8 py-3 bg-primary text-dark font-orbitron font-black text-xs uppercase tracking-widest cyber-button"
                    >
                      ENTER TOURNAMENTS
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {myRegistrations.map((reg) => {
                      const parentT = (tournaments || []).find(t => String(t.id) === String(reg.tournamentid));

                      return (
                        <div
                          key={reg.id}
                          className="bg-bg-dark border border-white/5 p-4 rounded-xl relative overflow-hidden flex flex-col justify-between group hover:border-primary/20 transition-all duration-300"
                        >
                          <div className="space-y-3">
                            <div className="absolute top-6 right-6 z-10">
                              <span className={`px-2 py-1 rounded text-[9px] font-orbitron font-bold uppercase tracking-wider border ${
                                reg.registration_status === 'approved' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                                reg.registration_status === 'rejected' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                                'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                              }`} style={{ backdropFilter: 'blur(4px)' }}>
                                {reg.registration_status || 'PENDING'}
                              </span>
                            </div>
                            {parentT?.image && (
                              <div className="h-24 w-full rounded-lg overflow-hidden relative">
                                <img src={parentT.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="scrim" />
                                <div className="absolute inset-0 bg-gradient-to-t from-bg-dark via-transparent to-transparent"></div>
                                <span className="absolute top-2 left-2 px-2.5 py-0.5 bg-primary/10 border border-primary/20 text-primary font-orbitron text-[8px] uppercase tracking-wider rounded">
                                  {parentT.game}
                                </span>
                              </div>
                            )}

                            <div>
                              <h4 className="font-orbitron font-black text-white text-sm uppercase tracking-tight truncate">
                                {reg.tournamenttitle || 'Tournament Registration'}
                              </h4>
                              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">
                                UID: <span className="font-mono text-primary">{reg.gameuid || 'TEAM DEPLOYMENT'}</span>
                              </p>
                            </div>
                          </div>

                          <div className="border-t border-white/5 pt-3.5 mt-4 flex items-center justify-between text-xs font-rajdhani">
                            <div className="flex items-center gap-2 text-gray-400 font-bold">
                              <i className="fa-solid fa-clock text-primary"></i>
                              <span>{parentT ? `${parentT.date} @ ${parentT.time}` : 'TBA'}</span>
                            </div>
                            <Link
                              to={`/tournament/${reg.tournamentid}`}
                              className="text-primary font-orbitron font-black text-[9px] uppercase tracking-widest hover:underline"
                            >
                              SECTOR INFO <i className="fa-solid fa-arrow-right ml-1"></i>
                            </Link>
                          </div>
                        </div>
                      );
                    })} 
                  </div>
                )}
              </div>
            )}

            {/* ─── TAB 2: Warrior Settings Form ─── */}
            {activeTab === 'settings' && (
              <div className="space-y-6 p-2 md:p-6">
                <div className="border-b border-white/5 pb-4">
                  <h3 className="font-orbitron font-bold text-xl text-white uppercase tracking-tight">
                    WARRIOR SHEET SETTINGS
                  </h3>
                  <p className="text-gray-500 font-rajdhani text-xs uppercase tracking-widest mt-1">
                    Manage your competitive metadata and contact channels
                  </p>
                </div>

                <div className="flex flex-col gap-3 rounded-lg border border-cyan-300/15 bg-cyan-400/5 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h4 className="font-orbitron text-sm font-bold uppercase tracking-wide text-white">
                      Account Verification
                    </h4>
                    <p className="mt-1 font-rajdhani text-sm text-gray-400">
                      {profile?.verified
                        ? 'Your account is verified.'
                        : verificationPending
                          ? 'Your verification request is pending admin review.'
                          : 'Request an admin review to verify your account.'}
                    </p>
                  </div>
                  {!profile?.verified && (
                    <button
                      type="button"
                      onClick={handleVerificationRequest}
                      disabled={verificationPending || verificationSubmitting}
                      className="shrink-0 rounded-md border border-cyan-300/40 bg-cyan-400/10 px-4 py-2 font-orbitron text-[10px] font-black uppercase tracking-wider text-cyan transition-colors hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {verificationSubmitting ? 'Submitting...' : verificationPending ? 'Request Pending' : 'Verify Your ID / Account'}
                    </button>
                  )}
                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-5 font-rajdhani">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-gray-400 font-orbitron text-[10px] uppercase tracking-widest block">
                        Full Name / Gamertag
                      </label>
                      <input
                        type="text"
                        name="full_name"
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white font-medium focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all text-sm"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-gray-400 font-orbitron text-[10px] uppercase tracking-widest block">
                        Age (Years)
                      </label>
                      <input
                        type="number"
                        name="age"
                        value={formData.age}
                        onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white font-medium focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all text-sm"
                        min="10"
                        max="100"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-gray-400 font-orbitron text-[10px] uppercase tracking-widest block">
                        Game UID (For match registrations)
                      </label>
                      <input
                        type="text"
                        name="game_uid"
                        value={formData.game_uid}
                        onChange={(e) => setFormData({ ...formData, game_uid: e.target.value })}
                        placeholder="Enter Your In-Game UID"
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white font-medium focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all text-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-gray-400 font-orbitron text-[10px] uppercase tracking-widest block">
                        Promo Code
                      </label>
                      <div className="flex gap-2 items-end">
                        <input
                          type="text"
                          name="promo_code"
                          value={formData.promo_code}
                          onChange={(e) => setFormData({ ...formData, promo_code: e.target.value })}
                          className="flex-1 bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-gray-500 font-medium focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all text-sm"
                          readOnly
                        />
                        {!formData.promo_code && (
                          <button
                            type="button"
                            onClick={generatepromo_code}
                            className="bg-primary hover:bg-primary/80 text-dark font-orbitron font-black text-xs uppercase tracking-wider py-3 px-4 rounded-lg transition-all whitespace-nowrap"
                          >
                            Generate
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-gray-400 font-orbitron text-[10px] uppercase tracking-widest block">
                        Contact Information (Discord tag / Phone)
                      </label>
                      <input
                        type="text"
                        name="contact_info"
                        value={formData.contact_info}
                        onChange={(e) => setFormData({ ...formData, contact_info: e.target.value })}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white font-medium focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all text-sm"
                        required
                      />
                    </div>
                  </div>


                  {/* Player Stats Section */}
                  <div className="border-t border-white/5 pt-5 mt-5">
                    <h4 className="font-orbitron font-bold text-sm text-primary uppercase tracking-tight mb-4">Combat Statistics</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-black/40 border border-white/10 rounded-lg px-4 py-3">
                        <label className="text-gray-400 font-orbitron text-[9px] uppercase tracking-widest block">
                          Current Rank
                        </label>
                        <div className="text-lg md:text-xl font-orbitron font-black text-accent mt-1">
                          {playerRank || 'UNRANKED'}
                        </div>
                      </div>
                      <div className="bg-black/40 border border-white/10 rounded-lg px-4 py-3">
                        <label className="text-gray-400 font-orbitron text-[9px] uppercase tracking-widest block">
                          Combat Points
                        </label>
                        <div className="text-lg md:text-xl font-orbitron font-black text-primary mt-1">
                          {playerPoints}
                        </div>
                      </div>
                      <div className="bg-black/40 border border-white/10 rounded-lg px-4 py-3">
                        <label className="text-gray-400 font-orbitron text-[9px] uppercase tracking-widest block">
                          Total Kills
                        </label>
                        <div className="text-lg md:text-xl font-orbitron font-black text-pink mt-1">
                          {playerKills}
                        </div>
                      </div>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={updating}
                    className="py-3 px-8 bg-primary text-dark font-orbitron font-black text-xs uppercase tracking-widest transition-all duration-300 relative overflow-hidden group cursor-pointer disabled:opacity-50"
                    style={{
                      clipPath: 'polygon(8% 0, 100% 0, 100% 75%, 92% 100%, 0 100%, 0 25%)',
                      boxShadow: '0 0 20px rgba(0, 212, 255, 0.3)',
                    }}
                  >
                    <span className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></span>
                    <span className="flex items-center gap-2">
                      {updating ? (
                        <>
                          <i className="fa-solid fa-spinner animate-spin"></i>
                          <span>SAVING METADATA...</span>
                        </>
                      ) : (
                        <>
                          <span>SAVE CHANGES</span>
                          <i className="fa-solid fa-check"></i>
                        </>
                      )}
                    </span>
                  </button>

                </form>
              </div>
            )}

            {/* ─── TAB 3: Achievements ─── */}
            {activeTab === 'achievements' && (
              <div className="space-y-6">
                <div className="border-b border-white/5 pb-4">
                  <h3 className="font-orbitron font-bold text-xl text-white uppercase tracking-tight">
                    WARRIOR MEDAL & BADGES
                  </h3>
                  <p className="text-gray-500 font-rajdhani text-xs uppercase tracking-widest mt-1">
                    Acquired combat levels and rankings in official Taigour tournaments
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { title: 'Arena Rookie', desc: 'Registered in your first match sector', unlocked: totalTournaments >= 1, icon: 'fa-shield', color: 'text-primary' },
                    { title: 'Veteran Warrior', desc: 'Participated in 5+ tournament sectors', unlocked: totalTournaments >= 5, icon: 'fa-medal', color: 'text-pink' },
                    { title: 'Top Challenger', desc: 'Earned a spot on the competitive rankings leaderboard', unlocked: leaderEntry !== undefined, icon: 'fa-crown', color: 'text-accent' },
                  ].map((badge, idx) => (
                    <div
                      key={idx}
                      className={`p-6 rounded-xl border flex flex-col justify-between items-center text-center relative overflow-hidden transition-all duration-300 ${badge.unlocked
                        ? 'bg-bg-dark border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.02)]'
                        : 'bg-black/40 border-white/5 opacity-40'
                        }`}
                    >
                      <div className="space-y-4">
                        <div
                          className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto border transition-transform duration-500 ${badge.unlocked
                            ? 'bg-white/5 border-white/20'
                            : 'bg-white/5 border-white/5'
                            }`}
                        >
                          <i className={`fa-solid ${badge.icon} ${badge.unlocked ? badge.color : 'text-gray-600'} text-xl`}></i>
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-orbitron font-black text-sm uppercase text-white tracking-wide">
                            {badge.title}
                          </h4>
                          <p className="font-rajdhani text-xs text-gray-500 leading-relaxed max-w-[180px] mx-auto">
                            {badge.desc}
                          </p>
                        </div>
                      </div>

                      <div className="pt-5 mt-6 border-t border-white/5 w-full flex justify-center">
                        <span className={`font-orbitron font-bold text-[9px] uppercase tracking-widest ${badge.unlocked ? 'text-tertiary' : 'text-gray-500'}`}>
                          {badge.unlocked ? 'UNLOCKED' : 'LOCKED'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );

};

export default ProfilePage;
