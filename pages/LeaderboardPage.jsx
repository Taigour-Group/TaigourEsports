
import React, { useMemo, useRef, useState } from 'react';
import FadeContent from '../components/ReactBits/FadeContent';

const heroImage = 'https://res.cloudinary.com/dkoirxf41/image/upload/v1790498570/Teal_Battlefield_Lion_Crest_Banner_sdlnat.png';
const games = [
  { id: 'freefire', label: 'Free Fire' },
  { id: 'pubg', label: 'PUBG' },
  { id: 'ludo', label: 'Ludo' }
];

const TeamAvatar = ({ team, className, alt = '' }) => (
  <div className={`grid shrink-0 place-items-center overflow-hidden bg-[#07111a] ${className}`}>
    {team.avatar ? (
      <img src={team.avatar} alt={alt} className="h-full w-full object-cover" />
    ) : (
      <span className="font-space text-sm font-bold uppercase text-cyan" aria-label={`${team.teamname} avatar`}>
        {team.teamname?.trim().charAt(0) || '?'}
      </span>
    )}
  </div>
);

const LeaderboardPage = ({ leaderboard = [] }) => {
  const [activeTab, setActiveTab] = useState('freefire');
  const [sortBy, setSortBy] = useState('points');
  const touchStart = useRef(null);
  const touchEnd = useRef(null);
  const filtered = useMemo(() => {
    const entries = leaderboard.filter((entry) => entry.game === activeTab);
    return entries.sort((first, second) => sortBy === 'points'
      ? second.points - first.points
      : (first.rank > 0 ? first.rank : Number.MAX_SAFE_INTEGER) - (second.rank > 0 ? second.rank : Number.MAX_SAFE_INTEGER));
  }, [leaderboard, activeTab, sortBy]);
  const podium = [filtered[1], filtered[0], filtered[2]].filter(Boolean);

  const handleTouchStart = (event) => {
    touchStart.current = event.targetTouches[0].clientX;
  };

  const handleTouchMove = (event) => {
    touchEnd.current = event.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStart.current === null || touchEnd.current === null) return;
    const distance = touchStart.current - touchEnd.current;
    const currentIndex = games.findIndex((game) => game.id === activeTab);
    if (distance > 50 && currentIndex < games.length - 1) setActiveTab(games[currentIndex + 1].id);
    if (distance < -50 && currentIndex > 0) setActiveTab(games[currentIndex - 1].id);
    touchStart.current = null;
    touchEnd.current = null;
  };

  return (
    <div
      className="min-h-screen bg-[#030a10] pb-20 text-white md:pb-12"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <section className="relative isolate flex min-h-[260px] items-end overflow-hidden border-b border-cyan-300/20 pt-16 md:min-h-[205px] md:pt-10">
        <img src={heroImage} alt="Esports competitor in a mountain arena" className="absolute inset-0 -z-20 h-full w-full object-cover object-[62%_center]" />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(2,9,15,.96)_0%,rgba(2,9,15,.78)_43%,rgba(2,9,15,.12)_100%)]" />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(0deg,#030a10_0%,transparent_38%,rgba(1,8,14,.22)_100%)]" />
        <div className="container mx-auto w-full max-w-7xl px-5 pb-7 md:px-10 md:pb-8">
          <p className="mb-3 flex items-center gap-3 font-space text-[10px] font-bold uppercase tracking-[0.42em] text-cyan md:text-xs">
            <span className="h-px w-8 bg-cyan" />Elite Rank Standings
          </p>
          <h1 className="whitespace-nowrap font-space text-4xl font-black uppercase leading-none text-white sm:text-5xl md:text-[58px]">
            Hall of <span className="inline-block -skew-x-6 text-cyan">Fame</span>
          </h1>
          <p className="mt-2 max-w-xl font-space text-[10px] font-bold uppercase text-slate-100 md:text-xs">
            The top teams. The legends. The Taigour elite.
          </p>
          <p className="mt-2 max-w-md text-[10px] leading-[1.45] text-slate-300 md:text-xs">
            Discover the best squads in the Taigour E-sports community.<br />These teams have earned their place in the Hall of Fame through skill, consistency and dominance.
          </p>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#06111a]" style={{ backgroundImage: `linear-gradient(rgba(3, 10, 16, .82), rgba(3, 10, 16, .96)), url(${heroImage})`, backgroundPosition: 'center 58%', backgroundSize: 'cover' }}>
        <div className="container relative mx-auto max-w-7xl px-4 md:px-8">
          <FadeContent blur duration={700} easing="ease-out" initialOpacity={0}>
            <div className="flex flex-col gap-3 border-b border-cyan-300/10 py-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex w-full gap-2 rounded sm:w-auto" role="tablist" aria-label="Choose game">
                {games.map((game) => (
                  <button
                    key={game.id}
                    type="button"
                    role="tab"
                    aria-selected={activeTab === game.id}
                    onClick={() => setActiveTab(game.id)}
                    className={`flex min-h-9 flex-1 items-center rounded-xl justify-center border px-3 text-[9px] font-bold uppercase tracking-wider transition sm:flex-none sm:min-w-[82px] ${activeTab === game.id ? 'border-cyan bg-cyan text-[#041018] shadow-[0_0_18px_rgba(0,212,255,.25)]' : 'border-cyan-300/20 bg-[#07131d]/80 text-slate-400 hover:border-cyan/50 hover:text-white'}`}
                  >
                    {game.label}
                  </button>
                ))}
              </div>

              <div className="flex w-full items-center border rounded-2xl border-cyan-300/20 bg-[#07131d]/90 p-1 sm:w-auto" role="group" aria-label="Sort standings">
                <button type="button" aria-pressed={sortBy === 'points'} onClick={() => setSortBy('points')} className={`flex min-h-7 flex-1 items-center justify-center rounded-xl px-4 text-[9px] font-bold uppercase tracking-wider transition sm:flex-none ${sortBy === 'points' ? 'bg-cyan text-[#041018]' : 'text-slate-400 hover:text-white'}`}>
                  By points
                </button>
                <button type="button" aria-pressed={sortBy === 'position'} onClick={() => setSortBy('position')} className={`flex min-h-7 flex-1 items-center justify-center rounded-xl px-4 text-[9px] font-bold uppercase tracking-wider transition sm:flex-none ${sortBy === 'position' ? 'bg-cyan text-[#041018]' : 'text-slate-400 hover:text-white'}`}>
                  By position
                </button>
              </div>
            </div>

            {podium.length > 0 && (
              <div className="relative mx-auto max-w-[470px] pb-3 pt-5">
                <div aria-hidden="true" className="pointer-events-none absolute bottom-2 left-1/2 z-0 h-8 w-[96%] -translate-x-1/2 border-t border-cyan-200/80 bg-[linear-gradient(180deg,rgba(11,55,75,.82),rgba(3,15,24,.94))] shadow-[0_-5px_22px_rgba(0,212,255,.16)] [clip-path:polygon(0_100%,10%_0,90%_0,100%_100%)]" />
                <div aria-hidden="true" className="pointer-events-none absolute bottom-0 left-1/2 z-0 h-4 w-[68%] -translate-x-1/2 border-t border-cyan-300/50 bg-[#07131c] [clip-path:polygon(0_100%,7%_0,93%_0,100%_100%)]" />
                <div className="relative z-10 grid grid-cols-[1fr_1.2fr_1fr] items-end gap-2 sm:gap-5">
                {podium.map((team) => {
                  const rank = filtered.indexOf(team) + 1;
                  const champion = rank === 1;
                  const accent = rank === 1 ? 'border-amber-300 shadow-[0_0_30px_rgba(250,204,21,.16)]' : rank === 2 ? 'border-cyan-300/60' : 'border-orange-400/60';
                  return (
                    <article key={team.id} className={`relative flex min-w-0 flex-col items-center border bg-[#08131c]/95 px-1.5 pb-2 pt-2 text-center sm:px-2 sm:pt-3 ${champion ? `min-h-[112px] border-2 bg-[#10171a]/95 sm:min-h-[130px] ${accent}` : `min-h-[92px] ${accent} sm:min-h-[108px]`}`}>
                      {champion && <i className="fa-solid fa-crown absolute -top-6 left-1/2 -translate-x-1/2 text-base text-amber-300" aria-label="First place" />}
                      <span style={rank === 2 ? { borderColor: '#00d4ff' } : undefined} className={`absolute z-20 grid h-7 w-7 place-items-center border-1 text-xs font-black shadow-[0_2px_10px_rgba(0,0,0,.65)] [clip-path:polygon(25%_0,75%_0,100%_25%,100%_75%,75%_100%,25%_100%,0_75%,0_25%)] ${rank === 1 ? '-bottom-2 -right-2 border-amber-200 bg-amber-300 text-[#15130a]' : '-left-2 -top-3'} ${rank === 2 ? 'bg-[#09202c] text-white' : rank === 3 ? 'border-orange-300 bg-[#321b10] text-orange-100' : ''}`}>{rank}</span>
                      <TeamAvatar team={team} alt={`${team.teamname} team`} className={`mb-2 h-10 w-10 rounded-lg border-1 sm:h-14 sm:w-14 ${champion ? 'border-amber-300' : 'border-white/20'}`} />
                      <h2 className="w-full truncate font-space text-[10px] font-bold uppercase sm:text-sm">{team.teamname}</h2>
                      <p className={`mt-1 font-space p-1 rounded text-[10px] font-bold sm:text-xs ${champion ? 'text-cyan' : 'text-slate-300'}`}>{team.points} <span className="font-normal text-slate-400">pts</span></p>
                    </article>
                  );
                })}
                </div>
              </div>
            )}
          </FadeContent>
        </div>
      </section>

      <section className="mx-auto w-[calc(100%-24px)] max-w-[1100px] pb-8 sm:w-[84%]">
        {filtered.length > 0 ? (
          <div>
            <div className="grid grid-cols-[32px_minmax(0,1fr)_38px_38px_66px] items-center gap-2 border-b border-cyan-300/20 px-2.5 py-2 text-[8px] font-bold uppercase tracking-wider text-slate-400 sm:grid-cols-[42px_minmax(0,1fr)_72px_72px_96px] sm:gap-3 sm:px-3 sm:text-[10px]">
              <span>#</span><span>Team</span><span className="text-center">Kills</span><span className="text-center">Wins</span><span className="text-right">Points</span>
            </div>
            <ol className="mt-1 space-y-1">
              {filtered.map((team, index) => {
                const rank = index + 1;
                const topRank = rank <= 3;
                const rankColor = rank === 1 ? 'text-amber-300' : rank === 2 ? 'text-slate-200' : rank === 3 ? 'text-orange-400' : 'text-slate-400';
                const rowAccent = rank === 1 ? 'border-amber-300/90 bg-amber-300/[0.08] shadow-[0_0_15px_rgba(250,204,21,.12)]' : rank === 2 ? 'border-cyan-300/80 bg-cyan-300/[0.035]' : rank === 3 ? 'border-orange-400/80 bg-orange-400/[0.035]' : 'border-cyan-300/25 bg-[#071722]/90';
                return (
                  <li key={team.id} className={`grid min-h-[40px] grid-cols-[32px_minmax(0,1fr)_38px_38px_66px] items-center gap-2 rounded-md border px-2.5 py-1 transition-colors sm:min-h-[42px] sm:grid-cols-[42px_minmax(0,1fr)_72px_72px_96px] sm:gap-3 sm:px-3 ${rowAccent} hover:brightness-110`}>
                    <span className={`grid h-7 w-7 place-items-center border rounded-md border-white/10 bg-white/[0.04] font-space text-[10px] font-bold [clip-path:polygon(16%_0,100%_0,100%_84%,84%_100%,0_100%,0_16%)] sm:h-8 sm:w-8 ${rankColor}`}>
                      {rank === 1 ? <i className="fa-solid fa-crown text-[11px]" aria-label="First place" /> : rank}
                    </span>
                    <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                      <TeamAvatar team={team} className={`h-7 w-7 rounded-md border sm:h-8 sm:w-8 ${topRank ? 'border-cyan-200/40' : 'border-white/10'}`} />
                      <span className="truncate font-space text-[10px] font-bold uppercase text-slate-100 sm:text-xs">{team.teamname}</span>
                    </div>
                    <span className="text-center font-space text-[10px] text-slate-300 sm:text-xs">{team.kills}</span>
                    <span className="text-center font-space text-[10px] text-slate-300 sm:text-xs">{team.wins}</span>
                    <span className={`inline-flex rounded-md min-w-[72px] items-center justify-between gap-2 justify-self-end bg-[#06131d] px-2 py-1 font-space text-xs font-bold shadow-[0_0_8px_rgba(0,212,255,.08)] [clip-path:polygon(8px_0,100%_0,100%_100%,0_100%)] ${rank === 1 ? 'border-amber-300 text-amber-300 shadow-[0_0_10px_rgba(250,204,21,.2)]' : rank === 2 ? 'border-cyan-300 text-slate-100' : rank === 3 ? 'border-orange-400 text-orange-200' : 'border-cyan-300/60 text-slate-100'}`}>
                      {team.points}<span className={`border rounded px-1 text-[7px] leading-[1.4] ${rank === 1 ? 'border-amber-300/40 bg-amber-300/20 text-amber-200' : 'border-slate-500/50 bg-slate-700/60 text-slate-300'}`}>XP</span>
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>
        ) : (
          <div className="border border-white/10 bg-[#06111a]/80 py-16 text-center">
            <i className="fa-solid fa-ranking-star mb-4 text-3xl text-cyan/70" aria-hidden="true" />
            <p className="font-space text-xs font-bold uppercase tracking-[0.2em] text-slate-400">No rankings for this game yet</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default LeaderboardPage;
