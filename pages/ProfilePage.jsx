import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import PlayerBalance from '../components/PlayerBalance';
import FadeContent from '../components/ReactBits/FadeContent';
import BlurText from '../components/ReactBits/BlurText';
import ShinyText from '../components/ReactBits/ShinyText';
import ErrorBox from '../components/ErrorBox.jsx';
import CountUpNumber from '../components/CountUpNumber.jsx';

const profileSections = [
  { id: 'wallet', label: 'Wallet', desc: 'Balance and membership', icon: 'fa-wallet', title: 'Wallet' },
  { id: 'deployments', label: 'Deployments', desc: 'Tournament entries', icon: 'fa-shield-halved', title: 'Deployments' },
  { id: 'settings', label: 'Settings', desc: 'Account and player details', icon: 'fa-sliders', title: 'Settings' },
  { id: 'achievements', label: 'Achievements', desc: 'Badges and rank rewards', icon: 'fa-medal', title: 'Achievements' },
];

const ProfilePage = ({ tournaments, registrations, leaderboard }) => {
  const { user, profile, loading, loginWithGoogle, loginWithEmail, updateAccountPassword, logout, reloadProfile } = useAuth();

  const [activeSection, setActiveSection] = useState(null);
  const activeTab = activeSection || 'wallet';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailAuthLoading, setEmailAuthLoading] = useState(false);
  const [emailAuthError, setEmailAuthError] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
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
  const [verificationFormOpen, setVerificationFormOpen] = useState(false);
  const [verificationStep, setVerificationStep] = useState(0);
  const [verificationForm, setVerificationForm] = useState({
    full_name: '',
    players_id: '',
    whatsapp_number: '',
    payment_method: 'esewa',
    payment_account_number: '',
    payment_account_owner: ''
  });
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [playerIdCopied, setPlayerIdCopied] = useState(false);

  useEffect(() => {
    if (!playerIdCopied) return undefined;
    const timeout = window.setTimeout(() => setPlayerIdCopied(false), 2000);
    return () => window.clearTimeout(timeout);
  }, [playerIdCopied]);

  const handleEmailAuth = async (event) => {
    event.preventDefault();
    setEmailAuthLoading(true);
    setEmailAuthError('');

    try {
      const result = await loginWithEmail(email, password);

      if (result.error) {
        setEmailAuthError(result.error.message || 'Email authentication failed. Please try again.');
      }
    } catch (error) {
      setEmailAuthError(error.message || 'Email authentication failed. Please try again.');
    } finally {
      setEmailAuthLoading(false);
    }
  };

  const handleSetPassword = async (event) => {
    event.preventDefault();
    setPasswordError('');
    setPasswordMessage('');

    if (newPassword !== confirmPassword) {
      setPasswordError('The passwords do not match.');
      return;
    }

    setPasswordSaving(true);
    try {
      const { error } = await updateAccountPassword(newPassword);
      if (error) {
        setPasswordError(error.message || 'Unable to set your password. Please try again.');
      } else {
        setNewPassword('');
        setConfirmPassword('');
        setPasswordMessage('Password saved. You can now sign in with this account email and password.');
      }
    } catch (error) {
      setPasswordError(error.message || 'Unable to set your password. Please try again.');
    } finally {
      setPasswordSaving(false);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    setSuccessMsg('');
    setErrorMsg('');
  }, [activeSection]);

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
    setVerificationForm((current) => ({
      ...current,
      full_name: current.full_name || profile?.full_name || user?.user_metadata?.full_name || '',
      players_id: current.players_id || profile?.player_id || '',
      whatsapp_number: current.whatsapp_number || profile?.contact_info || ''
    }));
  }, [profile, user]);

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

  const updateVerificationField = (field, value) => {
    setVerificationForm((current) => ({ ...current, [field]: value }));
  };

  const validateVerificationStep = (step) => {
    const fields = step === 0
      ? ['full_name', 'players_id', 'whatsapp_number']
      : ['payment_account_number', 'payment_account_owner'];
    const missingField = fields.find((field) => !verificationForm[field].trim());
    if (missingField) {
      const messages = {
        full_name: 'Enter your full name or gamertag to continue.',
        players_id: 'Enter the Player ID to print on your bill.',
        whatsapp_number: 'Enter a WhatsApp number so admins can contact you.',
        payment_account_number: 'Enter the account number used for payment.',
        payment_account_owner: 'Enter the payment account holder name.'
      };
      setErrorMsg(messages[missingField]);
      return false;
    }
    return true;
  };

  const moveVerificationStep = (nextStep) => {
    if (nextStep > verificationStep && !validateVerificationStep(verificationStep)) return;
    setErrorMsg('');
    setVerificationStep(nextStep);
  };

  const handleVerificationRequest = async () => {
    if (!validateVerificationStep(1)) return;
    setVerificationSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');
    const { data, error } = await authService.submitVerificationRequest(verificationForm);
    if (error) {
      setErrorMsg(error.message || 'Failed to submit verification request.');
    } else {
      setVerificationPending(Boolean(data?.pending));
      setVerificationFormOpen(false);
      setVerificationStep(0);
      setSuccessMsg('Verification request submitted. Your NPR 50 fee and billing details are recorded for admin review.');
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
      <div className="profile-dashboard pt-32 pb-24 px-4 bg-bg-dark min-h-screen flex items-center justify-center relative overflow-hidden">
        <div
          className="glass p-8 md:p-12 rounded-2xl max-w-lg w-full text-center relative border border-primary/10"
          style={{ boxShadow: '0 0 50px rgba(0,212,255,0.05)' }}
        >
          <div className="w-16 h-16 bg-primary/10 border border-primary/30 rounded-2xl flex items-center justify-center mx-auto mb-6 relative">
            <i className="fa-solid fa-lock text-2xl text-primary animate-pulse"></i>
          </div>

          <h1 className="text-xl font-orbitron font-black text-white uppercase tracking-tight mb-3 sm:text-2xl">
            SECTOR <span className="text-primary">RESTRICTED</span>
          </h1>
          <p className="text-sm text-gray-400 font-rajdhani mb-8 leading-relaxed uppercase tracking-wider sm:text-base">
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

          <div className="my-6 flex items-center gap-3 text-[10px] font-orbitron uppercase tracking-widest text-gray-500">
            <span className="h-px flex-1 bg-white/10" />
            <span>Or use email</span>
            <span className="h-px flex-1 bg-white/10" />
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-3 text-left">
            <label className="block text-left text-[10px] font-orbitron font-bold uppercase tracking-widest text-gray-400">
              Email
              <input
                type="email"
                name="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-1.5 w-full rounded-md border border-white/10 bg-black/30 px-4 py-3 font-rajdhani text-sm normal-case tracking-normal text-white outline-none transition focus:border-primary"
                placeholder="you@example.com"
              />
            </label>
            <label className="block text-left text-[10px] font-orbitron font-bold uppercase tracking-widest text-gray-400">
              Password
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                minLength={6}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-1.5 w-full rounded-md border border-white/10 bg-black/30 px-4 py-3 font-rajdhani text-sm normal-case tracking-normal text-white outline-none transition focus:border-primary"
                placeholder="Your account password"
              />
            </label>

            {emailAuthError && <p role="alert" className="text-left text-sm text-red-400">{emailAuthError}</p>}

            <button
              type="submit"
              disabled={emailAuthLoading}
              className="w-full rounded-md border border-primary/40 bg-primary/10 px-4 py-3 font-orbitron text-xs font-black uppercase tracking-widest text-primary transition hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {emailAuthLoading ? 'Signing in...' : 'Sign in with email'}
            </button>
          </form>
          <p className="mt-4 text-xs leading-relaxed text-gray-500">
            To use your Google account with a password, sign in with Google first, then set a password under Profile Settings. This keeps both sign-in methods on the same account.
          </p>
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

  const handleCopyPlayerId = async () => {
    setPlayerIdCopied(false);
    try {
      try {
        await navigator.clipboard.writeText(playerID);
      } catch {
        const textArea = document.createElement('textarea');
        textArea.value = playerID;
        textArea.setAttribute('readonly', '');
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        let copied;
        try {
          textArea.select();
          copied = document.execCommand('copy');
        } finally {
          textArea.remove();
        }
        if (!copied) throw new Error('Clipboard copy was unsuccessful.');
      }
      setPlayerIdCopied(true);
    } catch {
      setErrorMsg('Unable to copy Player ID. Please try again.');
    }
  };

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
    <div id="profile-dashboard" className="profile-dashboard relative min-h-screen overflow-hidden bg-[#050d14] pb-16 pt-20 text-white md:pt-24">
      {errorMsg && (
        <ErrorBox message={errorMsg} onClose={() => setErrorMsg('')} type="error" />
      )}
      {successMsg && (
        <ErrorBox message={successMsg} onClose={() => setSuccessMsg('')} type="success" />
      )}
      <div className="container relative mx-auto max-w-7xl px-4 md:px-8">

        {!activeSection && (
        <>
        {/* ─── Profile Header / Hero ─── */}
        <section className="profile-identity-card mb-5 rounded-2xl border p-4 sm:p-5 md:p-6">
          <div className="flex items-center gap-3 sm:gap-5">
            <div className="profile-avatar relative h-[68px] w-[68px] shrink-0 overflow-hidden rounded-2xl border sm:h-20 sm:w-20">
              <div className="profile-avatar-fallback absolute inset-0 grid place-items-center font-space text-2xl font-bold">
                {(profile?.full_name || user.user_metadata?.full_name || user.email || 'P').charAt(0).toUpperCase()}
              </div>
              {(profile?.avatar_url || user.user_metadata?.avatar_url) && (
                <img
                  src={profile?.avatar_url || user.user_metadata?.avatar_url}
                  className="profile-avatar-image absolute inset-0 h-full w-full object-cover"
                  alt=""
                  onError={(event) => { event.currentTarget.style.display = 'none'; }}
                />
              )}
              <span className="profile-active-indicator absolute bottom-1 right-1 h-3 w-3 rounded-full border-2" aria-label="Active" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="profile-eyebrow text-[10px] font-bold uppercase tracking-[0.16em]">Player profile</p>
              <div className="mt-1 flex min-w-0 items-center gap-1.5">
                <h1 className="truncate font-space text-lg font-black leading-tight sm:text-2xl">
                  {profile?.full_name || user.user_metadata?.full_name || 'Player One'}
                </h1>
                {profile?.verified === true && (
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4 shrink-0 text-cyan sm:h-5 sm:w-5"
                    fill="currentColor"
                    role="img"
                    aria-label="Verified account"
                    title="Verified account"
                  >
                    <path d="M8.004 1.183a1.5 1.5 0 0 1 2.049-.55L12 1.759 13.947.634a1.5 1.5 0 0 1 2.05.549L17.045 3H19.5A1.5 1.5 0 0 1 21 4.5v2.453l1.817 1.05a1.5 1.5 0 0 1 .55 2.049L22.241 12l1.124 1.947a1.5 1.5 0 0 1-.55 2.05L21 17.044V19.5a1.5 1.5 0 0 1-1.5 1.5h-2.454l-1.05 1.817a1.5 1.5 0 0 1-2.048.549L12 22.241l-1.948 1.125a1.5 1.5 0 0 1-2.049-.549L6.955 21H4.5A1.5 1.5 0 0 1 3 19.5v-2.455l-1.817-1.049a1.5 1.5 0 0 1-.549-2.049L1.758 12 .634 10.053a1.5 1.5 0 0 1 .549-2.05L3 6.954V4.5A1.5 1.5 0 0 1 4.5 3h2.454l1.05-1.817zm9.703 9.024a1 1 0 0 0-1.414-1.414l-5.44 5.44a.5.5 0 0 1-.707 0l-2.439-2.44a1 1 0 0 0-1.414 1.414l2.44 2.44a2.5 2.5 0 0 0 3.535 0l5.44-5.44z" />
                  </svg>
                )}
              </div>
              <p className="profile-email mt-1 truncate text-xs sm:text-sm">{user.email}</p>
            </div>
          </div>

          <div className="profile-identity-details mt-4 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <div className="profile-player-id flex min-w-0 items-center justify-between gap-2 rounded-xl border px-3 py-2.5">
              <span className="min-w-0">
                <span className="profile-detail-label block text-[9px] font-bold uppercase tracking-wider">Player ID</span>
                <span className="profile-id-value mt-0.5 block truncate font-mono text-xs font-bold">{playerID}</span>
              </span>
              <button
                type="button"
                onClick={handleCopyPlayerId}
                className="profile-copy-button inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border px-2.5 text-[10px] font-bold uppercase transition-colors"
                aria-label={playerIdCopied ? 'Player ID copied' : 'Copy player ID'}
                aria-live="polite"
              >
                <i className={playerIdCopied ? 'fa-solid fa-check' : 'fa-regular fa-copy'} aria-hidden="true" />
                {playerIdCopied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <div className="profile-age flex items-center justify-between rounded-xl border px-3 py-2.5 sm:min-w-[110px] sm:flex-col sm:items-start">
              <span className="profile-detail-label text-[9px] font-bold uppercase tracking-wider">Age</span>
              <span className="profile-age-value text-xs font-bold">{profile?.age || 'Not set'}</span>
            </div>
          </div>

        </section>

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
                <span className="block font-space text-base font-black leading-none text-white md:text-xl">
                  <CountUpNumber value={stat.val} />
                </span>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#050d14] transition-colors group-hover:bg-cyan-400/15 md:h-10 md:w-10">
                <i className={`fa-solid ${stat.icon} ${stat.color} text-sm md:text-base`}></i>
              </div>
            </div>
          ))}
        </div>
        </>
        )}

        {!activeSection ? (
        <div className="profile-section-list mx-auto grid max-w-3xl gap-2">
          {profileSections.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => setActiveSection(section.id)}
              className="profile-section-link flex min-h-[68px] w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-cyan/20 bg-cyan/10 text-base text-cyan">
                <i className={`fa-solid ${section.icon}`} aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-space text-sm font-bold">{section.label}</span>
                <span className="mt-0.5 block text-xs leading-tight text-slate-400">{section.desc}</span>
              </span>
              <i className="fa-solid fa-chevron-right text-xs text-slate-400" aria-hidden="true" />
            </button>
          ))}
        </div>
        ) : (
          <section className="profile-section-panel min-h-[60vh] min-w-0 rounded-2xl border border-cyann bg-[#07131d]/95 p-3 shadow-[0_8px_32px_rgba(0,0,0,0.12)] sm:p-5 md:p-6">
            <div className="mb-4 flex items-center gap-3 border-b border-white/10 pb-3 sm:mb-5 sm:pb-4">
              <button
                type="button"
                onClick={() => setActiveSection(null)}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 text-sm text-slate-300 transition-colors hover:border-cyan/50 hover:text-cyan"
                aria-label="Back to profile sections"
              >
                <i className="fa-solid fa-arrow-left" aria-hidden="true" />
              </button>
              <h1 className="font-space text-base font-black uppercase tracking-wide text-white sm:text-lg">
                {profileSections.find((profileSection) => profileSection.id === activeSection)?.title || 'Player Profile'}
              </h1>
            </div>

            {/* ─── TAB 0: Wallet / Balance ─── */}
            {activeTab === 'wallet' && (
              <PlayerBalance />
            )}

            {/* ─── TAB 1: Deployments ─── */}
            {activeTab === 'deployments' && (
              <div className="space-y-4 sm:space-y-5">
                <div className="border-b border-white/5 pb-3">
                  <h3 className="font-space text-sm font-bold uppercase tracking-wide text-white sm:text-base">
                    Tournament registrations
                  </h3>
                </div>

                {myRegistrations.length === 0 ? (
                  <div className="rounded-xl border border-white/10 bg-black/10 px-4 py-10 text-center">
                    <i className="fa-solid fa-gamepad mb-3 block text-2xl text-cyan"></i>
                    <p className="font-space text-sm font-bold text-white">No registrations yet</p>
                    <p className="mt-1 text-xs text-slate-400">Join a tournament to get started.</p>
                    <Link
                      to="/tournaments"
                      className="mt-4 inline-flex min-h-10 items-center rounded-lg bg-primary px-4 py-2 font-space text-[11px] font-bold uppercase tracking-wide text-dark"
                    >
                      Browse tournaments
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
                            {parentT?.image && (
                              <div className="relative h-24 w-full overflow-hidden rounded-lg">
                                <img src={parentT.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="scrim" />
                                <div className="absolute inset-0 bg-gradient-to-t from-bg-dark via-transparent to-transparent"></div>
                                <span className="absolute bottom-2 left-2 rounded border border-primary/20 bg-primary/10 px-2 py-0.5 font-orbitron text-[8px] uppercase tracking-wider text-primary">
                                  {parentT.game}
                                </span>
                              </div>
                            )}

                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <h4 className="truncate font-space text-sm font-bold text-white">
                                  {reg.tournamenttitle || 'Tournament Registration'}
                                </h4>
                                <p className="mt-1 truncate font-mono text-[10px] text-gray-500">
                                UID: <span className="font-mono text-primary">{reg.gameuid || 'TEAM DEPLOYMENT'}</span>
                                </p>
                              </div>
                              <span className={`shrink-0 rounded-full border px-2 py-1 text-[9px] font-bold uppercase tracking-wide ${
                                reg.registration_status === 'approved' ? 'bg-green-500/10 text-green-400 border-green-500/30' :
                                reg.registration_status === 'rejected' ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                                'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
                              }`}>
                                {reg.registration_status || 'PENDING'}
                              </span>
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
              <div className="space-y-4 sm:space-y-5">
                <div className="border-b border-white/5 pb-3">
                  <h3 className="font-space text-sm font-bold uppercase tracking-wide text-white sm:text-base">
                    Profile details
                  </h3>
                </div>

                <section className="space-y-4 rounded-lg border border-white/10 bg-black/10 p-4">
                  <div>
                    <h4 className="font-space text-xs font-bold uppercase tracking-wide text-white">
                      Email &amp; Password Sign-In
                    </h4>
                    <p className="mt-1 break-all text-xs text-gray-400">
                      Set password for {user.email}
                    </p>
                  </div>
                  <form onSubmit={handleSetPassword} className="grid gap-3 sm:grid-cols-2">
                    <label className="text-[10px] font-orbitron font-bold uppercase tracking-widest text-gray-400">
                      New password
                      <input
                        type="password"
                        autoComplete="new-password"
                        minLength={6}
                        required
                        value={newPassword}
                        onChange={(event) => setNewPassword(event.target.value)}
                        className="mt-1.5 w-full rounded-md border border-white/10 bg-black/30 px-3 py-2.5 font-rajdhani text-sm normal-case tracking-normal text-white outline-none focus:border-primary"
                        placeholder="At least 6 characters"
                      />
                    </label>
                    <label className="text-[10px] font-orbitron font-bold uppercase tracking-widest text-gray-400">
                      Confirm password
                      <input
                        type="password"
                        autoComplete="new-password"
                        minLength={6}
                        required
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        className="mt-1.5 w-full rounded-md border border-white/10 bg-black/30 px-3 py-2.5 font-rajdhani text-sm normal-case tracking-normal text-white outline-none focus:border-primary"
                        placeholder="Enter it again"
                      />
                    </label>
                    {passwordError && <p role="alert" className="text-sm text-red-400 sm:col-span-2">{passwordError}</p>}
                    {passwordMessage && <p role="status" className="text-sm text-emerald-400 sm:col-span-2">{passwordMessage}</p>}
                    <button
                      type="submit"
                      disabled={passwordSaving}
                      className="w-full rounded-md border border-primary/40 bg-primary/10 px-4 py-2.5 font-orbitron text-[10px] font-black uppercase tracking-widest text-primary transition hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-50 sm:col-span-2"
                    >
                      {passwordSaving ? 'Saving password...' : 'Set account password'}
                    </button>
                  </form>
                </section>

                <div className="flex flex-col gap-3 rounded-xl border border-cyan-300/15 bg-cyan-400/5 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
                  <div>
                    <h4 className="font-space text-xs font-bold uppercase tracking-wide text-white">
                      Account Verification
                    </h4>
                    <p className="mt-1 text-xs text-gray-400">
                      {profile?.verified
                        ? 'Verified'
                        : verificationPending
                          ? 'Review pending'
                          : 'Not verified'}
                    </p>
                  </div>
                  {!profile?.verified && !verificationFormOpen && (
                    <button
                      type="button"
                      onClick={() => {
                        setVerificationStep(0);
                        setVerificationFormOpen(true);
                      }}
                      disabled={verificationPending || verificationSubmitting}
                      className="shrink-0 rounded-md border border-cyan-300/40 bg-cyan-400/10 px-4 py-2 font-orbitron text-[10px] font-black uppercase tracking-wider text-cyan transition-colors hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {verificationPending ? 'Request Pending' : 'Start Verification'}
                    </button>
                  )}
                </div>

                {verificationFormOpen && !verificationPending && (
                  <section className="overflow-hidden rounded-xl border border-cyan-300/20 bg-[#071722]">
                    <div className="border-b border-white/10 p-4 sm:p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h4 className="font-space text-sm font-bold uppercase tracking-wide text-white">Verification request</h4>
                          <p className="mt-1 text-xs text-gray-400">Fee: Rs. 50</p>
                        </div>
                        <div className="rounded-lg border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-right">
                          <span className="block text-[9px] font-bold uppercase tracking-widest text-amber-200">Verification fee</span>
                          <strong className="font-orbitron text-lg text-amber-100">Rs. 50/-</strong>
                        </div>
                      </div>
                      <div className="mt-5 grid grid-cols-3 gap-2">
                        {['Player details', 'Payment details', 'Review'].map((label, index) => (
                          <button
                            key={label}
                            type="button"
                            onClick={() => index < verificationStep && moveVerificationStep(index)}
                            aria-current={index === verificationStep ? 'step' : undefined}
                            className={`rounded-md border px-2 py-2 text-left text-[9px] font-orbitron font-bold uppercase tracking-wide sm:px-3 ${
                              index === verificationStep
                                ? 'border-cyan-300/60 bg-cyan-300/10 text-cyan-100'
                                : index < verificationStep
                                  ? 'border-green-300/30 bg-green-300/5 text-green-200'
                                  : 'border-white/10 bg-black/10 text-gray-500'
                            }`}
                          >
                            <span className="mr-1.5">{index < verificationStep ? '✓' : `0${index + 1}`}</span>
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4 p-4 sm:p-5">
                      {verificationStep === 0 && (
                        <>
                          <div className="grid gap-4 sm:grid-cols-2">
                            <label className="space-y-1.5 text-xs font-bold uppercase tracking-wider text-gray-400">
                              Full name / Gamertag
                              <input required value={verificationForm.full_name} onChange={(event) => updateVerificationField('full_name', event.target.value)} className="w-full rounded-md border border-white/10 bg-black/30 px-3 py-2.5 text-sm normal-case tracking-normal text-white outline-none focus:border-cyan-300/60" />
                            </label>
                            <label className="space-y-1.5 text-xs font-bold uppercase tracking-wider text-gray-400">
                              Player ID
                              <input required value={verificationForm.players_id} onChange={(event) => updateVerificationField('players_id', event.target.value)} className="w-full rounded-md border border-white/10 bg-black/30 px-3 py-2.5 font-mono text-sm normal-case tracking-normal text-white outline-none focus:border-cyan-300/60" />
                            </label>
                            <label className="space-y-1.5 text-xs font-bold uppercase tracking-wider text-gray-400">
                              WhatsApp number
                              <input required type="tel" value={verificationForm.whatsapp_number} onChange={(event) => updateVerificationField('whatsapp_number', event.target.value)} className="w-full rounded-md border border-white/10 bg-black/30 px-3 py-2.5 text-sm normal-case tracking-normal text-white outline-none focus:border-cyan-300/60" />
                            </label>
                            <label className="space-y-1.5 text-xs font-bold uppercase tracking-wider text-gray-400">
                              Account email
                              <input readOnly value={user?.email || ''} className="w-full cursor-not-allowed rounded-md border border-white/10 bg-white/5 px-3 py-2.5 text-sm normal-case tracking-normal text-gray-400" />
                            </label>
                          </div>
                        </>
                      )}

                      {verificationStep === 1 && (
                        <>
                          <p className="text-sm text-gray-400">Enter the payer details to include on the bill. Admins will review the NPR 50 payment before approving verification.</p>
                          <div className="grid gap-4 sm:grid-cols-2">
                            <label className="space-y-1.5 text-xs font-bold uppercase tracking-wider text-gray-400">
                              Payment method
                              <select value={verificationForm.payment_method} onChange={(event) => updateVerificationField('payment_method', event.target.value)} className="w-full rounded-md border border-white/10 bg-[#0b1b26] px-3 py-2.5 text-sm normal-case tracking-normal text-white outline-none focus:border-cyan-300/60">
                                <option value="esewa">eSewa</option>
                                <option value="khalti">Khalti</option>
                                <option value="bank">Bank transfer</option>
                              </select>
                            </label>
                            <label className="space-y-1.5 text-xs font-bold uppercase tracking-wider text-gray-400">
                              Payer account number
                              <input required value={verificationForm.payment_account_number} onChange={(event) => updateVerificationField('payment_account_number', event.target.value)} className="w-full rounded-md border border-white/10 bg-black/30 px-3 py-2.5 text-sm normal-case tracking-normal text-white outline-none focus:border-cyan-300/60" />
                            </label>
                            <label className="space-y-1.5 text-xs font-bold uppercase tracking-wider text-gray-400 sm:col-span-2">
                              Payer account holder
                              <input required value={verificationForm.payment_account_owner} onChange={(event) => updateVerificationField('payment_account_owner', event.target.value)} className="w-full rounded-md border border-white/10 bg-black/30 px-3 py-2.5 text-sm normal-case tracking-normal text-white outline-none focus:border-cyan-300/60" />
                            </label>
                          </div>
                        </>
                      )}

                      {verificationStep === 2 && (
                        <>
                          <div className="grid gap-3 rounded-lg border border-white/10 bg-black/20 p-4 text-sm sm:grid-cols-2">
                            <div><span className="text-gray-500">Player</span><p className="font-bold text-white">{verificationForm.full_name}</p></div>
                            <div><span className="text-gray-500">Email</span><p className="break-all font-bold text-white">{user?.email || '-'}</p></div>
                            <div><span className="text-gray-500">Player ID</span><p className="font-mono font-bold text-white">{verificationForm.players_id}</p></div>
                            <div><span className="text-gray-500">WhatsApp</span><p className="font-bold text-white">{verificationForm.whatsapp_number}</p></div>
                            <div><span className="text-gray-500">Payment method</span><p className="font-bold capitalize text-white">{verificationForm.payment_method}</p></div>
                            <div><span className="text-gray-500">Payer account</span><p className="font-bold text-white">{verificationForm.payment_account_number} · {verificationForm.payment_account_owner}</p></div>
                          </div>
                          <div className="flex items-center justify-between rounded-lg border border-amber-300/20 bg-amber-300/5 px-4 py-3">
                            <span className="text-sm font-bold text-gray-200">Account verification</span>
                            <strong className="font-orbitron text-lg text-amber-200">Rs. 50/-</strong>
                          </div>
                          <p className="text-xs text-gray-500">Verification follows payment review.</p>
                        </>
                      )}

                      <div className="flex flex-wrap justify-between gap-2 border-t border-white/10 pt-4">
                        <button
                          type="button"
                          onClick={() => verificationStep === 0 ? setVerificationFormOpen(false) : moveVerificationStep(verificationStep - 1)}
                          disabled={verificationSubmitting}
                          className="rounded-md border border-white/15 px-4 py-2 text-xs font-bold uppercase tracking-wider text-gray-300 transition-colors hover:bg-white/5 disabled:opacity-50"
                        >
                          {verificationStep === 0 ? 'Cancel' : 'Back'}
                        </button>
                        {verificationStep < 2 ? (
                          <button type="button" onClick={() => moveVerificationStep(verificationStep + 1)} className="rounded-md border border-cyan-300/40 bg-cyan-300/10 px-5 py-2 text-xs font-orbitron font-black uppercase tracking-wider text-cyan-100 transition-colors hover:bg-cyan-300/20">
                            Continue <i className="fa-solid fa-arrow-right ml-2"></i>
                          </button>
                        ) : (
                          <button type="button" onClick={handleVerificationRequest} disabled={verificationSubmitting} className="rounded-md border border-green-300/40 bg-green-400/10 px-5 py-2 text-xs font-orbitron font-black uppercase tracking-wider text-green-100 transition-colors hover:bg-green-400/20 disabled:cursor-wait disabled:opacity-50">
                            {verificationSubmitting ? 'Submitting...' : 'Submit verification request'}
                          </button>
                        )}
                      </div>
                    </div>
                  </section>
                )}

                <form onSubmit={handleUpdateProfile} className="space-y-4 font-rajdhani">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                    <div className="space-y-1.5">
                      <label className="text-gray-400 font-orbitron text-[10px] uppercase tracking-widest block">
                        Name / Gamertag
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
                        Age
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
                        Game UID
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
                        <div className="mt-1 font-orbitron text-base font-black text-accent sm:text-lg">
                          {playerRank || 'UNRANKED'}
                        </div>
                      </div>
                      <div className="bg-black/40 border border-white/10 rounded-lg px-4 py-3">
                        <label className="text-gray-400 font-orbitron text-[9px] uppercase tracking-widest block">
                          Combat Points
                        </label>
                        <div className="mt-1 font-orbitron text-base font-black text-primary sm:text-lg">
                          {playerPoints}
                        </div>
                      </div>
                      <div className="bg-black/40 border border-white/10 rounded-lg px-4 py-3">
                        <label className="text-gray-400 font-orbitron text-[9px] uppercase tracking-widest block">
                          Total Kills
                        </label>
                        <div className="mt-1 font-orbitron text-base font-black text-pink sm:text-lg">
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
                <div className="border-b border-white/5 pb-3">
                  <h3 className="font-space text-sm font-bold uppercase tracking-wide text-white sm:text-base">
                    Achievements
                  </h3>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                  {[
                    { title: 'Arena Rookie', desc: '1 tournament entry', unlocked: totalTournaments >= 1, icon: 'fa-shield', color: 'text-primary' },
                    { title: 'Veteran Warrior', desc: '5 tournament entries', unlocked: totalTournaments >= 5, icon: 'fa-medal', color: 'text-pink' },
                    { title: 'Top Challenger', desc: 'Leaderboard placement', unlocked: leaderEntry !== undefined, icon: 'fa-crown', color: 'text-accent' },
                  ].map((badge, idx) => (
                    <div
                      key={idx}
                      className={`p-4 sm:p-5 rounded-xl border flex flex-col justify-between items-center text-center relative overflow-hidden transition-all duration-300 ${badge.unlocked
                        ? 'bg-bg-dark border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.02)]'
                        : 'bg-black/40 border-white/5 opacity-40'
                        }`}
                    >
                      <div className="space-y-4">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto border transition-transform duration-500 ${badge.unlocked
                            ? 'bg-white/5 border-white/20'
                            : 'bg-white/5 border-white/5'
                            }`}
                        >
                          <i className={`fa-solid ${badge.icon} ${badge.unlocked ? badge.color : 'text-gray-600'} text-xl`}></i>
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-space font-bold text-xs uppercase text-white tracking-wide">
                            {badge.title}
                          </h4>
                          <p className="font-rajdhani text-xs text-gray-500 leading-snug max-w-[180px] mx-auto">
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

          </section>
        )}

      </div>
    </div>
  );

};

export default ProfilePage;
