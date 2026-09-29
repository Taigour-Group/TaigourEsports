
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Tournament, GameType, Registration } from '../types.js';
import FadeContent from '../components/ReactBits/FadeContent';

const tournamentHeroImage = 'https://res.cloudinary.com/dkoirxf41/image/upload/v1790498570/Teal_Battlefield_Lion_Crest_Banner_sdlnat.png';

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

const formatCardDate = (dateValue) => {
  if (!dateValue) return 'TBA';
  const formatSingleDate = (value) => {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString().slice(0, 10);
  };
  const dateRange = dateValue.split(/\s+(?:-|–|to)\s+/i);
  return dateRange.length === 2
    ? `${formatSingleDate(dateRange[0])} - ${formatSingleDate(dateRange[1])}`
    : formatSingleDate(dateValue);
};

const getRegistrationStatus = (tournament) => {
  const now = new Date();
  const regStart = parseDateAtStartOfDay(tournament.registration_start_date);
  const regEnd = parseDateAtEndOfDay(tournament.registration_end_date);

  if (regStart && now < regStart) return 'upcoming';
  if (regEnd && now > regEnd) return 'ended';
  return 'open';
};

export const CountdownTimer = ({ targetDate, status }) => {
  const [state, setState] = useState({ mode: 'timeLeft', timeLeft: null });

  useEffect(() => {
    const calculate = () => {
      const startMs = new Date(targetDate).getTime();
      if (Number.isNaN(startMs)) {
        setState({ mode: 'liveEnded', timeLeft: null });
        return;
      }

      const nowMs = Date.now();

      // Expected tournament duration: use a 2-hour window from start.
      // Display rules:
      // - if time left (now < start) -> show countdown
      // - if time came (start <= now <= end) -> show LIVE
      // - if event ended (now > end) OR status === 'ended' -> show LIVE ENDED
      const endMs = startMs + (2 * 60 * 60 * 1000);
      const liveEndedByTime = nowMs > endMs;
      const liveEndedByServer = status === 'ended';

      if (liveEndedByServer || liveEndedByTime) {
        setState({ mode: 'liveEnded', timeLeft: null });
        return;
      }

      if (nowMs >= startMs) {
        setState({ mode: 'live', timeLeft: null });
        return;
      }

      const distance = startMs - nowMs;
      setState({
        mode: 'timeLeft',
        timeLeft: {
          d: Math.floor(distance / (1000 * 60 * 60 * 24)),
          h: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          m: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          s: Math.floor((distance % (1000 * 60)) / 1000),
        }
      });
    };

    calculate();
    const t = setInterval(calculate, 1000);
    return () => clearInterval(t);
  }, [targetDate, status]);

  if (state.mode === 'timeLeft' && state.timeLeft) {
    const { d, h, m } = state.timeLeft;
    return (
      <div className="flex gap-0.5 md:gap-1 items-center bg-navy/90 backdrop-blur-md px-2 md:px-3 py-1 md:py-1.5 rounded-md border border-white/10 shadow-sm">
        <div className="text-white font-space text-[8px] md:text-xs font-semibold">{d}d</div>
        <div className="text-gray-500 text-[8px]">:</div>
        <div className="text-white font-space text-[8px] md:text-xs font-semibold">{String(h).padStart(2, '0')}h</div>
        <div className="text-gray-500 text-[8px]">:</div>
        <div className="text-white font-space text-[8px] md:text-xs font-semibold">{String(m).padStart(2, '0')}m</div>
      </div>
    );
  }

  if (state.mode === 'liveEnded') {
    return (
      <div className="flex items-center gap-1 bg-navy/90 border border-white/10 rounded-md px-1.5 md:px-2 py-0.5 md:py-1 text-gray-300 font-inter text-[8px] md:text-xs font-semibold tracking-wide">
        <span className="relative flex h-1.5 md:h-2 w-1.5 md:w-2">
          <span className="absolute inline-flex h-full w-full rounded-full bg-white/20 opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 md:h-2 w-1.5 md:w-2 bg-white/40" />
        </span>
        LIVE ENDED
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 bg-red-500/10 bg-white border border-red-500/20 rounded-md px-1.5 md:px-2 py-0.5 md:py-1 text-red-500 font-inter text-[8px] md:text-xs font-semibold tracking-wide">
      <span className="relative flex h-1.5 md:h-2 w-1.5 md:w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-1.5 md:h-2 w-1.5 md:w-2 bg-red-500"></span>
      </span>
      LIVE
    </div>
  );
};

export const FeeTooltip = () => (
  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 md:mb-3 w-40 md:w-48 p-3 md:p-4 bg-navy border border-white/10 rounded-lg md:rounded-xl text-[8px] md:text-xs text-gray-300 font-inter opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-50 shadow-xl scale-95 group-hover:scale-100 origin-bottom">
    <div className="text-cyan mb-2 md:mb-3 flex items-center gap-2 font-space font-semibold tracking-wide text-[8px] md:text-[10px]">
      <i className="fas fa-shield-halved text-xs"></i>
      PROTOCOL
    </div>
    <ul className="space-y-1 md:space-y-2">
      <li className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 bg-cyan rounded-full flex-shrink-0"></span>
        Slot Verification
      </li>
      <li className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 bg-green-400 rounded-full flex-shrink-0"></span>
        Anti-Cheat Active
      </li>
      <li className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 bg-white rounded-full flex-shrink-0"></span>
        Instant Payout
      </li>
    </ul>
    <div className="absolute top-full left-1/2 -translate-x-1/2 border-6 md:border-8 border-transparent border-t-white/10"></div>
  </div>
);

export const TournamentCard = ({ t, registrationStatus, registrations = [] }) => {
  const statusLabel = registrationStatus === 'upcoming' ? 'Coming Soon' : registrationStatus === 'ended' ? 'Event Ended' : 'Reg Open';
  const gameLabel = t.game || ({ freefire: 'Free Fire', pubg: 'PUBG', ludo: 'Ludo' }[t.type] || 'Esports');
  const gameIcon = t.type === 'freefire' ? 'fa-fire' : t.type === 'ludo' ? 'fa-dice' : 'fa-helmet-safety';
  const participantCount = (Array.isArray(registrations) ? registrations : []).filter((registration) => String(registration.tournamentid ?? registration.tournament_id) === String(t.id)).length;
  const maxSlots = Number(t.max_slots) || 0;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-cyann bg-[#06111c] transition-colors hover:border-cyan">
      <div className="relative aspect-[16/10] overflow-hidden bg-[#07111a]">
        <img src={t.image} alt={`${t.game || 'Tournament'} artwork`} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#06111c]/80 via-transparent to-black/15" />
        <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-cyan/70 bg-cyan px-2.5 py-1 text-[7px] font-bold uppercase tracking-wide text-[#041018] sm:text-[8px]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#041018]" />{statusLabel}
        </span>
        <span className="absolute right-3 top-3 rounded border border-white/30 bg-black/55 px-2 py-1 font-space text-[9px] font-bold uppercase text-white">{gameLabel}</span>
      </div>
      <div className="flex flex-1 flex-col px-3 pb-3 pt-2.5 sm:px-3.5 sm:pb-3.5">
        <h3 className="line-clamp-1 min-h-5 font-space text-[10px] font-bold uppercase leading-tight text-white sm:text-sm">{t.title}</h3>
        <p className="mt-1 inline-flex items-center gap-1.5 text-[8px] font-semibold uppercase tracking-wide text-cyan sm:text-[9px]">
          <i className={`fa-solid ${gameIcon}`} aria-hidden="true" />{gameLabel}
        </p>
        <div className="mt-2.5 grid grid-cols-2 divide-x divide-white/10 border-y border-white/10 py-2">
          <div className="flex min-w-0 items-center gap-2 pr-2">
            <i className="fa-solid fa-trophy w-4 shrink-0 text-center text-sm text-cyan" aria-hidden="true" />
            <div className="min-w-0">
              <span className="block text-[7px] font-semibold uppercase text-cyan sm:text-[8px]">Prize Pool</span>
              <span className="block truncate font-space text-xs font-bold text-white sm:text-base">{t.prize || 'TBA'}</span>
            </div>
          </div>
          <div className="flex min-w-0 items-center gap-2 pl-2">
            <i className="fa-regular fa-calendar-days w-4 shrink-0 text-center text-sm text-cyan" aria-hidden="true" />
            <div className="min-w-0">
              <span className="block text-[7px] font-semibold uppercase text-cyan sm:text-[8px]">Date</span>
              <span className="block truncate text-[8px] font-medium text-slate-200 sm:text-[10px]">{formatCardDate(t.date)}</span>
            </div>
          </div>
        </div>
        <div className="mb-2 mt-2 flex items-center gap-2 text-cyan">
          <i className="fa-solid fa-users text-sm" aria-hidden="true" />
          <div className="min-w-0">
            <span className="block text-[7px] font-semibold uppercase sm:text-[8px]">Participants</span>
            <span className="block text-[9px] text-slate-200 sm:text-[10px]">{participantCount}{maxSlots ? ` / ${maxSlots}` : ''}</span>
          </div>
        </div>
        <Link to={`/tournament/${t.id}`} className="mt-auto flex min-h-9 items-center justify-center gap-2 rounded-md border border-cyan px-3 py-2 text-[10px] font-bold text-cyan transition-colors hover:bg-cyan hover:text-[#041018]">
          View Details <i className="fa-solid fa-arrow-right" />
        </Link>
      </div>
    </article>
  );
};


const TournamentsPage = ({ tournaments, registrations }) => {
  const [activeTab, setActiveTab] = useState('all');
  const tabs = ['all', 'freefire', 'pubg', 'ludo'];
  const touchStart = useRef(null);
  const touchEnd = useRef(null);
  const filtered = tournaments
    .filter(t => activeTab === 'all' || t.type === activeTab)
    .sort((a, b) => {
      const statusOrder = { open: 0, upcoming: 1, ended: 2 };
      const aStatus = getRegistrationStatus(a);
      const bStatus = getRegistrationStatus(b);

      if (statusOrder[aStatus] !== statusOrder[bStatus]) {
        return statusOrder[aStatus] - statusOrder[bStatus];
      }

      const aStart = parseDateAtStartOfDay(a.registration_start_date)?.getTime() ?? Infinity;
      const bStart = parseDateAtStartOfDay(b.registration_start_date)?.getTime() ?? Infinity;
      if (aStart !== bStart) return aStart - bStart;

      return (a.title || '').localeCompare(b.title || '');
    });

  const handleTouchStart = (e) => {
    touchStart.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEnd.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStart.current || !touchEnd.current) return;
    const distance = touchStart.current - touchEnd.current;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe || isRightSwipe) {
      const currentIndex = tabs.indexOf(activeTab);
      if (isLeftSwipe && currentIndex < tabs.length - 1) {
        setActiveTab(tabs[currentIndex + 1]);
      } else if (isRightSwipe && currentIndex > 0) {
        setActiveTab(tabs[currentIndex - 1]);
      }
    }
    touchStart.current = null;
    touchEnd.current = null;
  };

  const tabDetails = [
    { id: 'all', label: 'All', icon: 'fa-grip' },
    { id: 'freefire', label: 'Free Fire', icon: 'fa-fire' },
    { id: 'pubg', label: 'PUBG', icon: 'fa-helmet-safety' },
    { id: 'ludo', label: 'Ludo', icon: 'fa-dice' }
  ];

  return (
    <div 
      className="pt-24 md:pt-32 pb-20 md:pb-24 min-h-screen bg-bg-dark"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <section className="relative isolate -mt-20 overflow-hidden border-b border-white/10 bg-[#071722] pt-20 md:-mt-24 md:pt-24">
        <img src={tournamentHeroImage} alt="Esports arena ready for tournament play" className="absolute inset-0 -z-20 h-full w-full object-cover object-[58%_42%]" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#031018] via-[#031018]/80 to-[#031018]/15" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#061018] via-transparent to-[#061018]/20" />
        <div className="container mx-auto max-w-7xl px-5 pb-8 pt-6 md:px-8 md:pb-10 md:pt-8">
          <p className="mb-2 font-space text-[8px] font-bold uppercase tracking-[0.3em] text-cyan sm:text-[10px]">Compete / Win / Be Legendary</p>
          <h1 className="font-space text-3xl font-black italic uppercase leading-[0.9] text-white sm:text-5xl md:text-7xl">Tournaments</h1>
          <p className="mt-3 max-w-md text-[10px] font-semibold uppercase text-slate-200 sm:text-sm">Show your skills. Earn rewards. Rise to the top.</p>
          <p className="mt-2 max-w-sm text-[10px] leading-relaxed text-slate-300 sm:text-xs">Join exciting tournaments and compete with the best from across the Taigour esports community.</p>
        </div>
      </section>

      <div className="container mx-auto max-w-7xl px-4 md:px-8">
        <nav aria-label="Filter tournaments by game" className="flex flex-wrap justify-center gap-2 py-6 md:gap-3 md:py-8">
          {tabDetails.map(({ id, label, icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              aria-pressed={activeTab === id}
              className={`inline-flex min-w-[76px] items-center justify-center gap-2 rounded-md border px-3 py-2.5 text-[8px] font-bold uppercase tracking-wide transition-colors sm:min-w-[100px] sm:px-5 sm:text-[9px] ${activeTab === id ? 'border-cyan bg-cyan text-[#041018] shadow-[0_0_16px_rgba(0,212,255,0.25)]' : 'border-white/20 bg-[#08151f] text-slate-300 hover:border-cyan/70 hover:text-cyan'}`}
            >
              <i className={`fa-solid ${icon} text-[11px]`} aria-hidden="true" />{label}
            </button>
          ))}
        </nav>

        <FadeContent blur={true} duration={1000} easing="ease-out" initialOpacity={0}>
          <div className="grid grid-cols-2 gap-3 pb-10 sm:gap-4 md:grid-cols-4 md:gap-5 md:pb-12">
            {filtered.length > 0 ? filtered.map(t => (
              <TournamentCard key={t.id} t={t} registrations={registrations} registrationStatus={getRegistrationStatus(t)} />
            )) : (
              <div className="col-span-full flex flex-col items-center py-24 text-center md:py-40">
                 <div className="w-12 md:w-16 lg:w-24 h-12 md:h-16 lg:h-24 rounded-full border border-white/5 flex items-center justify-center mb-4 md:mb-8 relative">
                      <i className="fa-solid fa-satellite-dish text-lg md:text-3xl lg:text-5xl text-gray-800 animate-pulse"></i>
                      <div className="absolute inset-0 rounded-full border border-primary/20 animate-ping"></div>
                 </div>
                 <p className="font-space text-xs font-bold uppercase tracking-[0.2em] text-gray-400">No tournaments found for this game</p>
              </div>
            )}
          </div>
        </FadeContent>
      </div>
    </div>
  );
};

export default TournamentsPage;
