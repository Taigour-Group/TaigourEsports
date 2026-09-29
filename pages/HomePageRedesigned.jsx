import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { TournamentCard } from './TournamentsPage';

const heroImage = 'https://res.cloudinary.com/dkoirxf41/image/upload/v1790498570/Teal_Battlefield_Lion_Crest_Banner_sdlnat.png';
const Logo = 'https://res.cloudinary.com/dkoirxf41/image/upload/v1790497757/Taigours_E-Sports_White_Logo_only-removebg-preview_tmkzla.png';

const parseDate = (value, endOfDay = false) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0);
  return date;
};

const getRegistrationStatus = (tournament) => {
  const now = new Date();
  if (parseDate(tournament.registration_start_date) > now) return 'upcoming';
  if (parseDate(tournament.registration_end_date, true) < now) return 'ended';
  return 'open';
};

const HomePageRedesigned = ({ tournaments = [], registrations = [] }) => {
  const { pathname, hash } = useLocation();
  const events = Array.isArray(tournaments) ? tournaments : [];
  const featured = [...events]
    .sort((a, b) => {
      const order = { open: 0, upcoming: 1, ended: 2 };
      return order[getRegistrationStatus(a)] - order[getRegistrationStatus(b)] || (a.title || '').localeCompare(b.title || '');
    })
    .slice(0, 6);

  const games = [
    { name: 'PUBG Mobile', category: 'Battle Royale', icon: 'fa-gamepad', match: /pubg|bgmi/i },
    { name: 'Free Fire', category: 'Battle Royale', icon: 'fa-fire', match: /free fire/i },
    { name: 'BGMI', category: 'Mobile Esports', icon: 'fa-crosshairs', match: /bgmi/i }
  ].map((game) => ({ ...game, image: events.find((event) => game.match.test(event.game || ''))?.image || heroImage }));

  const updates = featured.length
    ? featured.slice(0, 3).map((event) => ({ title: event.title, category: event.game || 'Tournament', image: event.image || heroImage, href: '/tournaments', date: event.date }))
    : [
        { title: 'Find your next tournament', category: 'Tournament Desk', image: heroImage, href: '/tournaments' },
        { title: 'See where the competition stands', category: 'Player Rankings', image: heroImage, href: '/leaderboard' },
        { title: 'Catch matches live', category: 'Live Matches', image: heroImage, href: '/streams' }
      ];

  useEffect(() => {
    if (pathname !== '/' || !hash) return undefined;
    const target = document.getElementById(decodeURIComponent(hash.slice(1)));
    if (!target) return undefined;
    const frame = window.requestAnimationFrame(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    return () => window.cancelAnimationFrame(frame);
  }, [pathname, hash]);

  return (
    <div className="bg-bg-dark font-inter text-white selection:bg-cyan/30">
      <section id="home" className="relative flex min-h-[540px] items-center overflow-hidden border-b border-white/10 pt-20 md:min-h-[600px]">
        <img src={heroImage} alt="Esports player ready for competition" className="absolute inset-0 h-full w-full object-cover object-[62%_center] opacity-85" />
        <div className="absolute inset-0 " />
        <div className="absolute inset-0 bg-gradient-to-t from-bg-dark via-transparent to-[#06111b]/35" />
        <div className="container relative z-10 mx-auto grid items-center gap-8 px-5 pb-14 pt-10 md:grid-cols-[1.1fr_.9fr] md:px-8 md:pb-20">
          <div className="max-w-2xl animate-fade-in">
            <p className="mb-3 font-space text-xs font-bold uppercase tracking-[0.14em] text-cyan">Taigour E-Sports</p>
            <h1 className="font-space text-[clamp(2.8rem,7vw,5.8rem)] font-bold leading-[.86] text-white">
              ONE TEAM<br />ONE FIGHT
              <span className="mt-2 block -rotate-2 font-marker text-[.72em] text-cyan">ONE FAMILY</span>
            </h1>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-slate-200 md:text-lg">From Local Legends to National Champions.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/tournaments" className="premium-button inline-flex items-center gap-3 bg-cyan px-5 py-3 text-sm font-bold text-[#041018] hover:bg-white">Register for Tournament <i className="fa-solid fa-arrow-right" /></Link>
              <Link to="/games" className="premium-button inline-flex items-center gap-3 border border-cyan/70 px-5 py-3 text-sm font-semibold text-white hover:bg-cyan/10">Explore Games</Link>
            </div>
          </div>
          
          <Link to="/streams" className="absolute bottom-5 right-6 hidden items-center gap-3 text-xs text-slate-200 md:flex">
            <span className="inline-flex items-center gap-2 border border-cyan/50 px-3 py-1 text-cyan"><span className="h-1.5 w-1.5 rounded-full bg-cyan" /> LIVE</span>
            Live Matches &amp; Updates <i className="fa-solid fa-chevron-right text-cyan" />
          </Link>
        </div>
      </section>

      <section aria-label="Taigour in numbers" className="border-b border-white/10 bg-[#070e15]">
        <div className="container mx-auto grid grid-cols-2 divide-x divide-y divide-white/10 px-4 py-5 md:grid-cols-4 md:divide-y-0 md:px-8 md:py-6">
          {[
            { label: 'Tournaments Completed', value: '48+', icon: 'fa-trophy' },
            { label: 'Active Players', value: '1,500+', icon: 'fa-users' },
            { label: 'Total Prize Pool', value: 'Rs 50K+', icon: 'fa-star' },
            { label: 'Active Teams', value: '12', icon: 'fa-trophy' }
          ].map((stat) => <div key={stat.label} className="flex flex-col items-center justify-center px-3 py-4 text-center md:py-1"><i className={`fa-solid ${stat.icon} mb-2 text-cyan`} /><strong className="font-space text-xl font-bold md:text-2xl">{stat.value}</strong><span className="mt-1 text-[10px] text-slate-400 md:text-xs">{stat.label}</span></div>)}
        </div>
      </section>

      <section id="tournaments" className="relative overflow-hidden border-b border-white/10 bg-[#030c14] px-5 py-12 md:px-8 md:py-16">
        <div className="container relative z-10 mx-auto grid max-w-7xl gap-8 md:grid-cols-[.72fr_1.28fr] md:items-center">
          <div>
            <p className="mb-3 flex items-center gap-3 font-space text-xs font-bold uppercase text-cyan"><span className="h-[3px] w-16 bg-cyan shadow-[0_0_12px_rgba(34,211,238,.55)]" />Featured Tournaments</p>
            <h2 className="font-space text-4xl font-bold leading-[.98] text-white md:text-5xl lg:text-6xl">Featured<br />Tournaments</h2>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-300 md:text-base">Compete against the best. Register for premium events and build your legacy.</p>
            <Link to="/tournaments" className=" mt-6 inline-flex min-h-12 rounded-2xl items-center gap-3 border border-cyan bg-cyan px-6 py-3 text-xs font-bold text-[#041018] transition-colors hover:bg-white">View All Tournaments <i className="fa-solid fa-arrow-right" /></Link>
          </div>
          <div className="min-w-0">
            <div className="mb-2 flex justify-end gap-2">
              <button type="button" onClick={(event) => event.currentTarget.parentElement?.nextElementSibling?.scrollBy({ left: -180, behavior: 'smooth' })} aria-label="Previous tournaments" className="grid h-10 w-10 place-items-center rounded-full border border-cyan/50 text-cyan transition-colors hover:bg-cyan hover:text-[#041018]"><i className="fa-solid fa-chevron-left text-xs" /></button>
              <button type="button" onClick={(event) => event.currentTarget.parentElement?.nextElementSibling?.scrollBy({ left: 180, behavior: 'smooth' })} aria-label="Next tournaments" className="grid h-10 w-10 place-items-center rounded-full border border-cyan/50 text-cyan transition-colors hover:bg-cyan hover:text-[#041018]"><i className="fa-solid fa-chevron-right text-xs" /></button>
            </div>
            {featured.length ? (
              <div className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1">
                {featured.map((event) => (
                  <div key={event.id} className="min-w-0 shrink-0 basis-[calc((100%-12px)/2)] snap-start md:basis-[calc((100%-24px)/3)]">
                    <TournamentCard t={event} registrationStatus={getRegistrationStatus(event)} />
                  </div>
                ))}
              </div>
            ) : <div className="rounded-md border border-white/10 bg-white/[0.02] px-5 py-8 text-sm text-slate-400">New tournaments are on the way. Check back soon.</div>}
          </div>
        </div>
      </section>

      <section id="about" className="scroll-mt-16 relative overflow-hidden border-b border-white/10 bg-[#07131d] px-5 py-12 md:px-8 md:py-16">
        <img src={Logo} alt="" aria-hidden="true" className="pointer-events-none absolute -left-20 top-1/2 w-72 -translate-y-1/2 opacity-[.08] md:w-[30rem]" />
        <div className="container relative z-10 mx-auto grid max-w-7xl gap-8 md:grid-cols-[.8fr_1.2fr] md:items-center">
          <div><p className="mb-1 font-space text-[10px] font-bold uppercase tracking-wider text-cyan">Why Choose Taigour</p><h2 className="font-space text-2xl font-bold md:text-3xl">More Than Just Tournaments</h2><p className="mt-2 max-w-md text-sm leading-relaxed text-slate-400">We provide the most professional and reliable esports ecosystem in Nepal, built for players, by gamers.</p></div>
          <div className="grid grid-cols-2 gap-0 md:grid-cols-4">{[
            { title: 'Fair Competition', desc: 'Verified slots and fair-play systems.', icon: 'fa-shield-halved' },
            { title: 'Fast Payouts', desc: 'Automated prize distribution.', icon: 'fa-bolt' },
            { title: 'Nationwide Reach', desc: 'Connect with players across Nepal.', icon: 'fa-users' },
            { title: 'Pro Management', desc: 'Experienced event operations.', icon: 'fa-headset' }
          ].map((feature) => <div key={feature.title} className="border-l border-white/10 px-3 py-4 md:px-4"><i className={`fa-solid ${feature.icon} mb-3 text-xl text-cyan`} /><h3 className="font-space text-sm font-bold">{feature.title}</h3><p className="mt-1 text-xs leading-relaxed text-slate-400">{feature.desc}</p></div>)}</div>
        </div>
      </section>

      <section id="games" className="scroll-mt-16 border-b border-white/10 px-5 py-12 md:px-8 md:py-16">
        <div className="container mx-auto max-w-7xl">
          <div className="mb-7 flex items-end justify-between gap-5"><div><p className="mb-1 font-space text-[10px] font-bold uppercase tracking-wider text-cyan">Supported Games</p><h2 className="font-space text-2xl font-bold md:text-3xl">Our Game Lineup</h2><p className="mt-2 text-sm text-slate-400">We organize tournaments and events for the most popular mobile esports titles in Nepal.</p></div><Link to="/games" className="hidden shrink-0 items-center gap-2 rounded-md border border-cyan px-4 py-2 text-xs font-semibold text-cyan hover:bg-cyan hover:text-[#041018] sm:inline-flex">View All Games <i className="fa-solid fa-arrow-right" /></Link></div>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-3">{games.map((game) => <Link key={game.name} to="/games" className="group relative flex min-h-32 items-end overflow-hidden rounded-md border border-white/15 bg-[#0b1720] p-2.5 transition-colors hover:border-cyan/70 sm:p-4"><img src={game.image} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover opacity-45 transition duration-500 group-hover:scale-105 group-hover:opacity-65" /><div className="absolute inset-0 bg-gradient-to-r from-[#06111b] via-[#06111b]/50 to-transparent" /><div className="relative flex items-center gap-2 sm:gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-white/30 bg-black/40 text-base sm:h-11 sm:w-11 sm:text-lg"><i className={`fa-solid ${game.icon}`} /></span><span className="min-w-0"><strong className="block truncate font-space text-sm font-bold sm:text-lg">{game.name}</strong><span className="block truncate text-[9px] uppercase text-cyan sm:text-[10px]">{game.category}</span></span></div></Link>)}</div>
        </div>
      </section>

      <section id="news" className="scroll-mt-16 border-b border-white/10 bg-[#070e15] px-5 py-12 md:px-8 md:py-16">
        <div className="container mx-auto max-w-7xl">
          <div className="mb-7 flex items-end justify-between gap-5"><div><p className="mb-1 font-space text-[10px] font-bold uppercase tracking-wider text-cyan">Latest News</p><h2 className="font-space text-2xl font-bold md:text-3xl">News &amp; Updates</h2><p className="mt-2 text-sm text-slate-400">Stay close to tournament results, player rankings, and live matches.</p></div><Link to="/streams" className="hidden shrink-0 items-center gap-2 border border-cyan px-4 py-2 text-xs font-semibold text-cyan hover:bg-cyan hover:text-[#041018] sm:inline-flex">View All News <i className="fa-solid fa-arrow-right" /></Link></div>
          <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-3">{updates.map((update, index) => <Link key={`${update.title}-${index}`} to={update.href} className="group overflow-hidden rounded-md border border-white/10 bg-[#0b141d] hover:border-cyan/50"><div className="relative h-24 overflow-hidden sm:h-32"><img src={update.image} alt="" aria-hidden="true" className="h-full w-full object-cover opacity-55 transition duration-500 group-hover:scale-105 group-hover:opacity-80" /><div className="absolute inset-0 bg-gradient-to-t from-[#0b141d] to-transparent" /></div><div className="px-2 pb-2 sm:px-3 sm:pb-3"><span className="text-[8px] font-bold uppercase text-cyan sm:text-[9px]">{update.category}</span><h3 className="mt-1 line-clamp-2 font-space text-xs font-bold sm:text-sm">{update.title}</h3><span className="mt-2 flex items-center justify-between gap-1 text-[9px] text-slate-400 sm:text-[10px]">{update.date || 'Explore Taigour'} <span className="shrink-0 text-cyan">Read More <i className="fa-solid fa-arrow-right" /></span></span></div></Link>)}</div>
        </div>
      </section>

      <section id="contact" className="scroll-mt-16 relative isolate overflow-hidden border-b border-white/10 px-5 py-7 md:px-8 md:py-8">
        <img src="https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=2200&q=85" alt="Himalayan landscape in Nepal" loading="lazy" className="absolute inset-0 h-full w-full object-cover object-center" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#03101a]/95 via-[#061521]/80 to-[#061521]/35" />
        <div className="container relative z-10 mx-auto grid max-w-7xl items-center gap-6 md:grid-cols-[1.15fr_.85fr]">
          <div className="max-w-xl">
            <p className="mb-1 font-space text-[10px] font-bold uppercase tracking-wider text-cyan">Join Our Community</p>
            <h2 className="font-space text-2xl font-bold md:text-3xl">Be Part of Taigour E-Sports</h2>
            <p className="mt-1.5 max-w-lg text-xs text-slate-200 md:text-sm">Get the latest updates, join tournaments, and connect with fellow gamers.</p>
            <div className="mt-4 flex flex-wrap gap-2.5">
              <a href="https://discord.gg/f2bgpfNP" target="_blank" rel="noopener noreferrer" className="premium-button inline-flex min-w-24 items-center justify-center gap-2 rounded-md bg-cyan px-4 py-2 text-xs font-bold text-[#041018]"><i className="fa-brands fa-discord" /> Discord</a>
              <a href="https://wa.me/9766115626" target="_blank" rel="noopener noreferrer" className="premium-button inline-flex min-w-24 items-center justify-center gap-2 rounded-md border border-cyan/70 bg-[#041018]/30 px-4 py-2 text-xs font-semibold text-white"><i className="fa-brands fa-whatsapp text-cyan" /> WhatsApp</a>
              <a href="https://www.youtube.com/@TaigoursE-Sports" target="_blank" rel="noopener noreferrer" className="premium-button inline-flex min-w-24 items-center justify-center gap-2 rounded-md border border-red-400/70 bg-[#041018]/30 px-4 py-2 text-xs font-semibold text-white"><i className="fa-brands fa-youtube text-red-400" /> YouTube</a>
            </div>
          </div>
          <div className="flex items-center justify-center gap-3 py-1 md:justify-end md:gap-5">
            <p className="-rotate-6 font-marker text-xl leading-[1.35] text-cyan drop-shadow-[0_2px_10px_rgba(0,0,0,.8)] sm:text-2xl md:text-3xl">
              <span className="block">PLAY</span>
              <span className="block">COMPETE</span>
              <span className="block text-white">GROW</span>
            </p>
            <img src={Logo} alt="Taigour E-Sports" loading="lazy" className="h-16 w-20 object-contain drop-shadow-[0_2px_12px_rgba(0,0,0,.8)] sm:h-20 sm:w-24 md:h-28 md:w-32" />
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePageRedesigned;