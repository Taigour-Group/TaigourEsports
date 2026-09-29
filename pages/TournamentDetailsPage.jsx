
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CountdownTimer, FeeTooltip } from './TournamentsPage';
import TeamRegistrationForm from '../components/TeamRegistrationForm.jsx';
import { dbService } from '../services/dbService.js';
import ErrorBox from '../components/ErrorBox.jsx';
import FadeContent from '../components/ReactBits/FadeContent';
import BlurText from '../components/ReactBits/BlurText';
import ShinyText from '../components/ReactBits/ShinyText';

const parseDateAtStartOfDay = (dateValue) => {
  if (!dateValue) return null;
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return null;
  parsed.setHours(0, 0, 0, 0);
  return parsed;
};

const parseDateAtEndOfDay = (dateValue) => {
  if (!dateValue) return null;
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return null;
  parsed.setHours(23, 59, 59, 999);
  return parsed;
};

const parseAmountClient = (value) => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  const cleaned = String(value).replace(/[^\d.]/g, '');
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : 0;
};

const formatDateLabel = (dateValue) => {
  if (!dateValue) return 'TBA';
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return dateValue;
  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const TournamentDetailsPage = ({ tournaments, onRegister, registrations }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const tournament = tournaments.find(t => t.id === id);

  const [activeTab, setActiveTab] = useState('overview');
  const [showRegModal, setShowRegModal] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [queueStatus, setQueueStatus] = useState(null);
  const [errorBox, setErrorBox] = useState(null);

  const touchStart = useRef(null);
  const touchEnd = useRef(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (!tournament) {
    return (
      <div className="pt-32 pb-24 text-center">
        <h2 className="text-3xl font-orbitron text-white">404: SECTOR NOT FOUND</h2>
        <Link to="/tournaments" className="mt-8 inline-block text-primary font-bold">RETURN TO ARENA</Link>
      </div>
    );
  }

  const currentRegs = (Array.isArray(registrations) ? registrations : []).filter(r => String(r.tournamentid) === String(tournament.id)).length;
  const max_slots = Number(tournament.max_slots) || 48;
  const slotsLeft = Math.max(0, max_slots - currentRegs);
  const isSoldOut = slotsLeft === 0;
  const regStart = parseDateAtStartOfDay(tournament.registration_start_date);
  const regEnd = parseDateAtEndOfDay(tournament.registration_end_date);
  const now = new Date();
  const registrationUpcoming = regStart && now < regStart;
  const registrationEnded = regEnd && now > regEnd;
  const registrationOpen = !registrationUpcoming && !registrationEnded;
  const canRegister = registrationOpen && !isSoldOut;

  const handleRegistrationSubmit = async (formData) => {
    if (!canRegister || isSubmitting) return;

    setIsSubmitting(true);
    setQueueStatus({ status: 'uploading', message: 'Encrypting and uploading dossiers...' });

    // Pre-check balance when entry fee is required to avoid wasting uploads
    try {
      const fee = parseAmountClient(tournament.entry_fee || 0);
      if ((tournament.payment_method || 'tgc_coin') === 'tgc_coin' && fee > 0) {
        if (!user || !user.id) {
          setErrorBox('Please sign in to complete registration and pay the entry fee.');
          setIsSubmitting(false);
          setQueueStatus(null);
          closeModals(); // Close modal to make error box visible at top
          return;
        }

        const balRes = await fetch(`/api/balance/${user.id}`);
        if (!balRes.ok) {
          console.error('Failed to fetch balance for pre-check');
          setErrorBox('Unable to verify wallet balance. Please try again later.');
          setIsSubmitting(false);
          setQueueStatus(null);
          closeModals(); // Close modal to make error box visible at top
          return;
        }
        const balData = await balRes.json();
        const available = Number(balData.balance ?? balData.available_balance ?? 0);
        if (available < fee) {
          setErrorBox(`Insufficient balance. Entry fee: ${fee} TGC. Your wallet: ${available} TGC.`);
          setIsSubmitting(false);
          setQueueStatus(null);
          closeModals(); // Close modal to make error box visible at top
          return;
        }
      }
    } catch (e) {
      console.error('Pre-check failed', e);
      setErrorBox('Unable to verify balance. Try again later.');
      setIsSubmitting(false);
      setQueueStatus(null);
      closeModals(); // Close modal to make error box visible at top
      return;
    }

    try {
      // 1. Upload files if provided
      let teamLogoUrl = null;
      if (formData.teamLogo) {
        teamLogoUrl = await dbService.uploadFile('team-logos', `team_${Date.now()}_${formData.teamLogo.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`, formData.teamLogo);
      }

      const uploadedPlayers = await Promise.all(formData.players.map(async (player) => {
        let photoUrl = null;
        if (player.citizenshipPhoto) {
          photoUrl = await dbService.uploadFile('citizenship-photos', `player_${Date.now()}_${player.citizenshipPhoto.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`, player.citizenshipPhoto);
        }
        return {
          player_name: player.fullName,
          player_uid: player.uid,
          player_citizenship_photo: photoUrl
        };
      }));

      setQueueStatus({ status: 'queuing', message: 'Entering secure registration queue...' });

      // 2. Submit to Queue API
      const response = await fetch('/api/team-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tournament_id: tournament.id,
          team_name: formData.teamName,
          team_tag: formData.teamTag,
          team_logo: teamLogoUrl,
          manager_name: formData.managerFullName,
          manager_contact: formData.managerContactNumber,
          registrar_email: formData.registrantEmail,
          players: uploadedPlayers
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to enter queue');
      }

      const { ticket_id } = await response.json();

      // 3. Poll for Status
      setQueueStatus({ status: 'queued', message: 'Awaiting deployment clearance...' });

      const pollInterval = setInterval(async () => {
        try {
          const statusRes = await fetch(`/api/registration-status/${ticket_id}`);
          if (!statusRes.ok) return; // Keep trying on network blips

          const statusData = await statusRes.json();

          if (statusData.status === 'processing') {
            setQueueStatus({ status: 'processing', message: 'Finalizing registration...' });
          } else if (statusData.status === 'success') {
            clearInterval(pollInterval);
            onRegister();
            setRegistrationSuccess(true);
            setQueueStatus(null);
            setShowToast(true);
            setTimeout(() => {
              setShowToast(false);
              closeModals();
            }, 3000);
          } else if (statusData.status === 'failed') {
            clearInterval(pollInterval);
            // Surface worker error to UI
            const msg = statusData.error || 'Registration failed during processing';
            setErrorBox(msg);
            setIsSubmitting(false);
            setQueueStatus(null);
            // stop polling
            return;
          }
        } catch (pollErr) {
          console.error('Polling error:', pollErr);
          // Keep polling on transient errors, let the user cancel if needed
        }
      }, 1500); // Check every 1.5s

      // Store interval ID in a ref to clean up if modal is closed early
      if (!window.pollIntervals) window.pollIntervals = [];
      window.pollIntervals.push(pollInterval);

    } catch (error) {
      console.error('Registration failed:', error);
      setErrorBox(`Registration error: ${error.message}`);
      setIsSubmitting(false);
      setQueueStatus(null);
    }
  };

  const closeModals = () => {
    if (window.pollIntervals) {
      window.pollIntervals.forEach(clearInterval);
      window.pollIntervals = [];
    }
    setShowRegModal(false);
    setRegistrationSuccess(false);
    setIsSubmitting(false);
    setQueueStatus(null);
  };

  const handleModalTouchStart = (e) => {
    touchStart.current = e.targetTouches[0].clientY;
  };

  const handleModalTouchMove = (e) => {
    touchEnd.current = e.targetTouches[0].clientY;
  };

  const handleModalTouchEnd = () => {
    if (!touchStart.current || !touchEnd.current) return;
    const distance = touchEnd.current - touchStart.current;
    if (distance > 150) { // Swiped down significantly
      closeModals();
    }
    touchStart.current = null;
    touchEnd.current = null;
  };

  const addToCalendar = () => {
    if (!tournament) return;
    const title = tournament.title.replace(/,/g, '');
    const location = tournament.location.replace(/,/g, '');
    const description = `Taigour E-Sports Tournament: ${tournament.game}. Prize: ${tournament.prize}`;
    const dateStr = tournament.date.replace(/,/g, '');
    const startDate = new Date(`${dateStr} ${tournament.time}`);
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);

    const formatICSDate = (date) => date.toISOString().replace(/-|:|\.\d+/g, '');

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'BEGIN:VEVENT',
      `SUMMARY:${title}`,
      `DTSTART:${formatICSDate(startDate)}`,
      `DTEND:${formatICSDate(endDate)}`,
      `LOCATION:${location}`,
      `DESCRIPTION:${description}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `${title.replace(/\s+/g, '_')}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const gameLabel = tournament.game || ({ freefire: 'Free Fire', pubg: 'PUBG Mobile', ludo: 'Ludo King' }[tournament.type] || 'Esports');
  const playerCount = Number(tournament.player_count || tournament.players || max_slots * 4) || 0;
  const teamCount = Number(tournament.team_count || max_slots) || 0;
  const eventStatus = registrationEnded ? 'EVENT ENDED' : registrationUpcoming ? 'REGISTRATION SOON' : 'REGISTRATION OPEN';

  const detailItems = [
    { icon: 'fa-calendar-days', label: 'DEPARTURE', value: `${formatDateLabel(tournament.date)} @ ${tournament.time || 'TBA'}` },
    { icon: 'fa-location-dot', label: 'ARENA', value: tournament.location || 'TBA' },
    { icon: 'fa-coins', label: 'ENTRY FEE', value: tournament.entry_fee || '0' }
  ];

  const stats = [
    { icon: 'fa-users', label: 'TOTAL TEAMS', value: teamCount },
    { icon: 'fa-user', label: 'ACTIVE PLAYERS', value: playerCount },
    { icon: 'fa-coins', label: 'PRIZE POOL', value: tournament.prize || '0' },
    { icon: 'fa-trophy', label: 'EVENT TYPE', value: tournament.mode || tournament.type_label || gameLabel.toUpperCase() }
  ];

  return (
    <div className="min-h-screen bg-[#020b14] pb-16 pt-20 text-white md:pt-24">
      {errorBox && (
        <ErrorBox message={errorBox} onClose={() => setErrorBox(null)} type="error" />
      )}
      {showToast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[2000] animate-slide-up w-[90%] max-w-sm">
          <div className="bg-tertiary/20 backdrop-blur-xl border border-tertiary/50 px-6 py-4 rounded-2xl shadow-[0_0_30px_rgba(0,255,128,0.3)] flex items-center gap-4">
            <div className="w-8 h-8 bg-tertiary rounded-full flex items-center justify-center shrink-0">
              <i className="fas fa-check text-bg-dark text-sm"></i>
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="font-orbitron font-black text-white text-[10px] uppercase tracking-widest truncate">Registration Confirmed</p>
              <p className="font-rajdhani text-gray-300 text-xs truncate">Registration Successful!</p>
            </div>
            <button onClick={() => setShowToast(false)} className="text-white/40 hover:text-white transition-colors shrink-0">
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-[1180px] px-4 md:px-6">
        <div className="mb-5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
          <Link to="/tournaments" className="transition-colors hover:text-cyan-300"><i className="fas fa-house mr-2 text-cyan-400" />Tournaments</Link>
          <i className="fas fa-chevron-right text-[8px]" />
          <span className="truncate text-slate-300">{tournament.title}</span>
        </div>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="relative min-h-[340px] overflow-hidden rounded-xl border border-cyann bg-[#071a29] shadow-[0_0_30px_rgba(0,191,255,0.12)] md:min-h-[410px]">
            <img src={tournament.image} alt={tournament.title} className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#020b14] via-[#020b14]/35 to-[#031321]/10" />
            <div className="absolute inset-x-0 bottom-0 p-5 md:p-9">
              <span className="mb-3 inline-flex rounded-md border border-cyann bg-[#031321]/80 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-300">{gameLabel}</span>
              <h1 className="max-w-2xl font-orbitron text-3xl font-black uppercase leading-[0.95] tracking-tight text-white drop-shadow-[0_2px_16px_rgba(0,0,0,0.7)] md:text-6xl">{tournament.title}</h1>
              <p className="mt-4 max-w-xl text-sm font-semibold uppercase tracking-[0.12em] text-slate-200 md:text-base">{tournament.description || 'Show your skills. Prove yourself.'}</p>
              <div className="mt-5 flex flex-wrap gap-2 text-[9px] font-bold uppercase tracking-wider text-cyan-100">
                <span className="rounded-xl border border-cyann bg-[#031321]/80 px-3 py-2"><i className="fas fa-user mr-2 text-cyan-300" />Solo</span>
                <span className="rounded-xl border border-cyann bg-[#031321]/80 px-3 py-2"><i className="fas fa-users mr-2 text-cyan-300" />Squad</span>
                <span className="rounded-xl border border-cyann bg-[#031321]/80 px-3 py-2"><i className="fas fa-crosshairs mr-2 text-cyan-300" />{stats[3].value}</span>
              </div>
            </div>
            <div className="absolute right-4 top-4"><CountdownTimer targetDate={`${tournament.date} ${tournament.time}`} /></div>
          </div>

          <aside className="rounded-xl border border-cyann/80 bg-[#041321]/90 p-5 shadow-[0_0_25px_rgba(0,191,255,0.1)] md:p-6">
            <h2 className="mb-5 flex items-center gap-3 font-orbitron text-sm font-black uppercase tracking-wide text-cyan-300"><i className="fas fa-clipboard-list" />Event Details</h2>
            <div className="space-y-1">
              {detailItems.map((item) => <div key={item.label} className="flex items-center gap-3 rounded-lg bg-[#061d30] p-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-cyann/50 bg-cyan-500/10 text-lg text-cyan-300"><i className={`fas ${item.icon}`} /></span><span className="min-w-0"><small className="block text-[9px] font-bold uppercase tracking-widest text-cyan">{item.label}</small><strong className="block truncate text-sm text-slate-100">{item.value}</strong></span>{item.label === 'ENTRY FEE' && <FeeTooltip />}</div>)}
            </div>
            <button disabled={!canRegister} onClick={() => setShowRegModal(true)} className={`mt-5 flex w-full items-center justify-center gap-2 rounded-lg border py-3 font-orbitron text-xs font-black uppercase tracking-widest transition-all ${canRegister ? 'border-cyann bg-cyan-400 text-[#02111d] shadow-[0_0_20px_rgba(0,212,255,0.25)] hover:bg-cyan-300' : 'cursor-not-allowed border-slate-700 bg-slate-800 text-slate-500'}`}><i className="fas fa-lock" />{isSoldOut ? 'Slots Full' : registrationUpcoming ? 'Coming Soon' : registrationEnded ? 'Event Ended' : 'Register Now'}</button>
            <p className={`mt-3 text-center text-[9px] font-bold uppercase tracking-widest ${canRegister ? 'text-slate-500' : 'text-rose-400'}`}>{eventStatus} {canRegister && `- ${slotsLeft} slots remaining`}</p>
          </aside>
        </section>

        <section className="my-5 grid grid-cols-2 overflow-hidden rounded-xl border border-cyann bg-[#061a2b] md:grid-cols-4">
          {stats.map((stat, index) => <div key={stat.label} className={`flex items-center gap-3 p-4 md:p-5 ${index < stats.length - 1 ? 'border-b border-cyann md:rounded-xl md:border-b-0 md:border-r' : ''} ${index === 1 ? 'border-r md:border-r' : ''}`}><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-cyann/50 bg-cyan-500/10 text-lg text-cyan-300"><i className={`fas ${stat.icon}`} /></span><span><small className="block text-[8px] font-bold uppercase tracking-widest text-cyan-400/70">{stat.label}</small><strong className="block text-base uppercase text-slate-100 md:text-lg">{stat.value}</strong></span></div>)}
        </section>

        <section className="grid gap-2 lg:grid-cols-[220px_minmax(0,1fr)]">
          <nav className="rounded-xl border space-y-1 border-cyann/70 bg-[#041321]/20 p-2">
            {['overview', 'rules', 'prizes', 'teams', 'schedule', 'results'].map((tab) => {
              const isActive = activeTab === tab;
              return <button key={tab} onClick={() => setActiveTab(tab)} style={isActive ? { backgroundColor: '#22D3EE', borderColor: '#22D3EE', color: '#031321' } : undefined} className={`flex w-full items-center gap-2 rounded-lg border bg-[#0269811d] px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest transition-colors ${isActive ? 'border-cyann' : 'border-transparent text-slate-300 hover:border-cyann/70 hover:bg-cyan-950/50'}`}><i style={isActive ? { color: '#031321' } : undefined} className={`fas ${['fa-book-open', 'fa-shield-halved', 'fa-gift', 'fa-users', 'fa-calendar-days', 'fa-chart-column'][['overview', 'rules', 'prizes', 'teams', 'schedule', 'results'].indexOf(tab)]} w-4 text-center`} /><span style={isActive ? { color: '#031321' } : undefined}>{tab}</span></button>;
            })}
            <div className="relative mt-3 hidden aspect-[3/4] overflow-hidden rounded-lg md:block"><img src={tournament.image} alt="" className="h-full w-full object-cover opacity-70" /><div className="absolute inset-0 bg-gradient-to-t from-[#041321] via-transparent to-transparent" /><strong className="absolute bottom-5 left-4 right-4 font-orbitron text-xl uppercase italic text-cyan-300">Fight<br />for glory</strong></div>
          </nav>

          <article className="rounded-xl border border-cyann/70 bg-[#041321]/90 p-5 md:p-7">
            <div className="mb-6 flex flex-col justify-between gap-3 border-b border-cyann/70 pb-5 md:flex-row md:items-end"><div><span className="font-orbitron text-[10px] font-black uppercase tracking-[0.18em] text-cyan-300">Tournament Overview</span><h2 className="mt-2 font-orbitron text-2xl font-black uppercase text-white md:text-3xl">{tournament.title}</h2></div><span className="text-xs font-bold uppercase tracking-widest text-slate-400">{eventStatus}</span></div>
            <p className="max-w-2xl text-sm leading-relaxed text-slate-300 md:text-base">{tournament.description || 'Deploy into the most competitive arena of the season. Only the elite will survive and claim the ultimate reward.'}</p>
            <div className="mt-6 grid gap-2 sm:grid-cols-3"><div className="rounded-lg border border-cyann/80 bg-[#061d30] p-4"><small className="block text-[9px] uppercase tracking-widest text-cyan-400">Mode</small><strong className="text-sm uppercase">{stats[3].value}</strong></div><div className="rounded-lg border border-cyann/80 bg-[#061d30] p-4"><small className="block text-[9px] uppercase tracking-widest text-cyan-400">Players</small><strong className="text-sm uppercase">Squad</strong></div><div className="rounded-lg border border-cyann/80 bg-[#061d30] p-4"><small className="block text-[9px] uppercase tracking-widest text-cyan-400">Map / Arena</small><strong className="text-sm uppercase">{tournament.location || 'TBA'}</strong></div></div>
            <div className="mt-7"><h3 className="mb-4 flex items-center gap-3 font-orbitron text-sm font-black uppercase tracking-widest text-cyan-300"><i className="fas fa-person-running" />Event Rules</h3>{activeTab === 'prizes' ? <div className="grid gap-3 sm:grid-cols-3">{(tournament.prizeBreakdown || [{ position: '1st Place', reward: '60% of Prize Pool' }, { position: '2nd Place', reward: '25% of Prize Pool' }, { position: '3rd Place', reward: '15% of Prize Pool' }]).map((item) => <div key={item.position} className="rounded-lg border border-cyann/80 bg-[#061d30] p-4"><small className="block text-xs uppercase text-slate-500">{item.position}</small><strong className="text-cyan-300">{item.reward}</strong></div>)}</div> : <ul className="space-y-3 rounded-lg border border-cyann/80 bg-[#061d30] p-4">{(tournament.rules || ['Must use mobile device only. No Emulators.', 'Players must be present 15 minutes before start.', 'Hacking or exploitation results in instant disqualification.', 'Admin decisions are final and binding.']).map((rule, index) => <li key={rule} className="flex items-center gap-3 text-sm text-slate-200"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-cyann/60 text-xs text-cyan-300">{index + 1}</span>{rule}</li>)}</ul>}</div>
          </article>
        </section>
      </main>

      {showRegModal && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center p-4 overflow-y-auto"
          onTouchStart={handleModalTouchStart}
          onTouchMove={handleModalTouchMove}
          onTouchEnd={handleModalTouchEnd}
        >
          <div className="fixed inset-0 bg-bg-dark/95 backdrop-blur-md" onClick={closeModals}></div>
          <div className="relative w-full max-w-xl glass p-6 md:p-12 rounded-xl border border-primary/30 shadow-[0_0_100px_rgba(0,212,255,0.1)] my-auto animate-fade-in overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-6 flex items-center justify-center opacity-30 md:hidden">
              <div className="w-12 h-1 bg-white/20 rounded-full"></div>
            </div>

            <button onClick={closeModals} className="absolute top-4 right-4 md:top-6 md:right-6 text-gray-500 hover:text-white transition-colors z-50">
              <i className="fas fa-times text-xl md:text-2xl"></i>
            </button>

            {queueStatus ? (
              <div className="text-center py-12 animate-fade-in">
                <div className="relative w-20 h-20 mx-auto mb-8">
                  <div className="absolute inset-0 border-4 border-white/10 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <i className="fas fa-satellite-dish text-primary text-xl animate-pulse"></i>
                  </div>
                </div>
                <h3 className="text-xl md:text-2xl font-orbitron font-black text-white uppercase tracking-widest mb-3">
                  {queueStatus.status === 'uploading' ? 'UPLOADING DATA' : queueStatus.status === 'processing' ? 'PROCESSING' : 'IN QUEUE'}
                </h3>
                <p className="text-gray-400 font-rajdhani text-lg animate-pulse">{queueStatus.message}</p>
              </div>
            ) : !registrationSuccess ? (
              <TeamRegistrationForm
                tournament={tournament}
                onSubmit={handleRegistrationSubmit}
                onCancel={closeModals}
                isSubmitting={isSubmitting}
              />
            ) : (
              <div className="text-center py-6 md:py-10 animate-fade-in">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-tertiary/20 border border-tertiary/40 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_20px_rgba(0,255,128,0.2)]">
                  <i className="fas fa-check text-2xl md:text-3xl text-tertiary"></i>
                </div>
                <h3 className="text-2xl md:text-3xl font-orbitron font-black text-white uppercase tracking-tighter mb-2">MISSION <span className="text-tertiary">AUTHORIZED</span></h3>
                <p className="text-gray-400 font-rajdhani text-base md:text-lg mb-6 md:mb-8">Registration confirmed for <span className="text-primary font-bold">{tournament.title}</span></p>

                <div className="bg-white/5 border border-white/10 rounded-lg p-5 md:p-6 mb-6 md:mb-8 text-left space-y-3 font-rajdhani text-sm">
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-gray-500 uppercase text-[9px] font-black tracking-widest shrink-0">Team Name</span>
                    <span className="text-white font-mono truncate ml-4">Authorized</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-gray-500 uppercase text-[9px] font-black tracking-widest shrink-0">Deploy</span>
                    <span className="text-white truncate ml-4">{tournament.date} @ {tournament.time}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 uppercase text-[9px] font-black tracking-widest shrink-0">Arena</span>
                    <span className="text-white truncate ml-4">{tournament.location}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={addToCalendar}
                    className="w-full py-3 md:py-4 bg-white/5 border border-white/10 text-white font-orbitron font-black text-[10px] md:text-xs uppercase tracking-widest hover:bg-primary/10 hover:border-primary transition-all flex items-center justify-center gap-2"
                  >
                    <i className="far fa-calendar-plus text-primary"></i>
                    CALENDAR SYNC
                  </button>
                  <button
                    onClick={closeModals}
                    className="w-full py-3 md:py-4 bg-primary text-bg-dark font-orbitron font-black text-[10px] md:text-xs uppercase tracking-widest hover:scale-[1.01] transition-all"
                  >
                    RETURN TO SECTOR
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TournamentDetailsPage;
