import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const heroImage = 'https://res.cloudinary.com/dbjjzyrr3/image/upload/v1768562833/florian-olivo-Mf23RF8xArY-unsplash_mwnhvg.jpg';

const gameCatalog = [
  { id: 'pubg-mobile', name: 'PUBG Mobile & BGMI', category: 'Battle Royale', icon: 'fa-crosshairs', match: /pubg|bgmi/i, description: 'Squad up, sharpen your rotations, and compete for the final circle.' },
  { id: 'free-fire', name: 'Free Fire', category: 'Battle Royale', icon: 'fa-fire', match: /free\s?fire/i, description: 'Fast-paced rounds where every decision can change the match.' },
  { id: 'ludo-king', name: 'Ludo King', category: 'Strategy', icon: 'fa-dice', match: /ludo/i, description: 'Bring your best strategy to the board and challenge the community.' }
];

const GamesPage = ({ tournaments = [] }) => {
  const { hash } = useLocation();
  const events = Array.isArray(tournaments) ? tournaments : [];
  const games = gameCatalog.map((game) => {
    const matchingEvents = events.filter((event) => game.match.test(`${event.game || ''} ${event.title || ''}`));
    return {
      ...game,
      count: matchingEvents.length,
      image: matchingEvents.find((event) => event.image)?.image || heroImage
    };
  });

  useEffect(() => {
    if (!hash) return undefined;
    const target = document.getElementById(decodeURIComponent(hash.slice(1)));
    if (!target) return undefined;
    const frame = window.requestAnimationFrame(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    return () => window.cancelAnimationFrame(frame);
  }, [hash]);

  return (
    <div className="bg-bg-dark font-inter text-white">
      <section className="relative overflow-hidden border-b border-white/10 px-5 pb-12 pt-28 md:px-8 md:pb-16 md:pt-36">
        <img src={heroImage} alt="Esports competition" className="absolute inset-0 h-full w-full object-cover object-[60%_center] opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#030b12] via-[#061521]/90 to-[#061521]/55" />
        <div className="container relative mx-auto max-w-7xl">
          <p className="mb-2 font-space text-[10px] font-bold uppercase tracking-wider text-cyan">Taigour Arena</p>
          <h1 className="max-w-2xl font-space text-2xl font-bold sm:text-3xl md:text-4xl">Choose Your Game</h1>
          <p className="mt-3 max-w-xl text-xs leading-relaxed text-slate-300 sm:text-sm">Find your title, join the competition, and climb the rankings with players from across Nepal.</p>
          <Link to="/tournaments" className="premium-button mt-6 inline-flex items-center gap-2 rounded-md bg-cyan px-4 py-2.5 text-xs font-bold text-[#041018] hover:bg-white sm:px-5 sm:text-sm">Browse Tournaments <i className="fa-solid fa-arrow-right" /></Link>
        </div>
      </section>

      <section className="px-5 py-10 md:px-8 md:py-14">
        <div className="container mx-auto max-w-7xl">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div><p className="mb-1 font-space text-[9px] font-bold uppercase tracking-wider text-cyan">Supported Titles</p><h2 className="font-space text-xl font-bold sm:text-2xl">Our Game Lineup</h2></div>
            <span className="text-[10px] text-slate-400 sm:text-xs">{events.length} tournaments listed</span>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
            {games.map((game) => (
              <article key={game.id} id={game.id} className="scroll-mt-20 group overflow-hidden rounded-md border border-white/15 bg-[#0b141d] transition-colors hover:border-cyan/60">
                <div className="relative h-40 overflow-hidden sm:h-48">
                  <img src={game.image} alt={`${game.name} tournament`} className="h-full w-full object-cover opacity-65 transition duration-500 group-hover:scale-105 group-hover:opacity-85" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#07111a] via-[#07111a]/25 to-transparent" />
                  <span className="absolute left-3 top-3 rounded-sm border border-cyan/50 bg-[#07111a]/80 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-cyan">{game.category}</span>
                  <span className="absolute bottom-3 left-3 line-clamp-2 font-space text-base font-bold sm:left-4 sm:text-xl">{game.name}</span>
                </div>
                <div className="p-2.5 sm:p-4">
                  <p className="min-h-10 text-[11px] leading-relaxed text-slate-400 sm:text-xs">{game.description}</p>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3">
                    <span className="text-[10px] text-slate-300 sm:text-xs"><i className={`fa-solid ${game.icon} mr-1 text-cyan sm:mr-2`} />{game.count} {game.count === 1 ? 'tournament' : 'tournaments'}</span>
                    <Link to="/tournaments" className="inline-flex items-center gap-1.5 rounded-md border border-cyan/60 px-2 py-1.5 text-[9px] font-bold text-cyan transition-colors hover:bg-cyan hover:text-[#041018] sm:gap-2 sm:px-3 sm:py-2 sm:text-[10px]">View Events <i className="fa-solid fa-arrow-right" /></Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default GamesPage;