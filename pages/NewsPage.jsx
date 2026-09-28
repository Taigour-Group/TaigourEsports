import React from 'react';
import { Link } from 'react-router-dom';

const articles = [
  {
    id: 1,
    title: 'Taigour Arena opens registration for the next Nepal PUBG Mobile showdown',
    category: 'Tournament',
    date: 'September 27, 2026',
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80',
    excerpt: 'Players from across Nepal can secure their slots for a high-stakes competition with a bigger prize pool, live commentary, and community team battles.',
    badge: 'Featured'
  },
  {
    id: 2,
    title: 'Metro teams prepare for the league finals with new roster upgrades',
    category: 'Esports',
    date: 'September 18, 2026',
    image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&q=80',
    excerpt: 'Teams are stepping up their strategies and training schedules as the city finals approach.',
    badge: 'Community'
  },
  {
    id: 3,
    title: 'Taigour launches a new creator spotlight series for streamers and casters',
    category: 'Community',
    date: 'September 11, 2026',
    image: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?auto=format&fit=crop&w=1200&q=80',
    excerpt: 'From breakout players to rising content creators, Taigour is highlighting the people behind the matches.',
    badge: 'Creators'
  },
  {
    id: 4,
    title: 'How player rankings are evolving heading into the next seasonal cup',
    category: 'Rankings',
    date: 'September 04, 2026',
    image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80',
    excerpt: 'Analysts break down the top performers, momentum shifts, and the new names entering the competitive ladder.',
    badge: 'Analysis'
  },
  {
    id: 5,
    title: 'Free Fire and Ludo squads gear up for Nepal-wide qualifiers',
    category: 'Games',
    date: 'August 29, 2026',
    image: 'https://images.unsplash.com/photo-1560253023-3ec9e4f1e0b7?auto=format&fit=crop&w=1200&q=80',
    excerpt: 'Organizers are adding new brackets, regional qualifiers, and fresh reward structures for the competitive season.',
    badge: 'Qualifiers'
  },
  {
    id: 6,
    title: 'Community meetups bring local players together for coaching and scrims',
    category: 'Events',
    date: 'August 22, 2026',
    image: 'https://images.unsplash.com/photo-1528819622761-6bcf9e1b2f5f?auto=format&fit=crop&w=1200&q=80',
    excerpt: 'Players and fans came together for hands-on training sessions, player Q&As, and casual community scrims.',
    badge: 'Local'
  }
];

const featuredArticle = articles[0];

const NewsPage = () => {
  return (
    <div className="min-h-screen bg-[#061018] pb-20 pt-24 md:pt-28">
      <section className="relative overflow-hidden border-b border-white/10 bg-[#091821] px-5 py-12 md:px-8 md:py-16">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(0,212,255,0.18),transparent_45%)]" />
        <div className="container relative z-10 mx-auto max-w-7xl">
          <p className="mb-2 font-space text-[10px] font-bold uppercase tracking-[0.28rem] text-cyan">Latest Updates</p>
          <h1 className="font-space text-3xl font-black tracking-tight text-white md:text-5xl">Taigour News & Updates</h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-300 md:text-base">
            Follow the latest tournaments, player rankings, community stories, and big moments from the Taigour esports scene.
          </p>
        </div>
      </section>

      <section className="container mx-auto max-w-7xl px-5 py-10 md:px-8 md:py-12">
        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <article className="group overflow-hidden rounded-2xl border border-white/10 bg-[#0b1720] shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
            <div className="relative h-72 overflow-hidden md:h-80">
              <img
                src={featuredArticle.image}
                alt={featuredArticle.title}
                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#08151d] via-[#08151d]/35 to-transparent" />
              <span className="absolute left-4 top-4 rounded-full border border-cyan/70 bg-cyan/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.2em] text-cyan">
                {featuredArticle.badge}
              </span>
            </div>
            <div className="p-5 md:p-6">
              <div className="mb-3 flex items-center justify-between gap-3 text-[10px] uppercase tracking-[0.18em] text-slate-400">
                <span>{featuredArticle.category}</span>
                <span>{featuredArticle.date}</span>
              </div>
              <h2 className="font-space text-2xl font-bold text-white md:text-3xl">{featuredArticle.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-300 md:text-base">{featuredArticle.excerpt}</p>
              <div className="mt-5 flex items-center justify-between gap-3">
                <Link to="/tournaments" className="inline-flex items-center gap-2 rounded-md border border-cyan px-4 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-cyan transition hover:bg-cyan hover:text-[#041018]">
                  Join the action
                  <i className="fa-solid fa-arrow-right" />
                </Link>
                <span className="text-xs text-slate-400">Live now</span>
              </div>
            </div>
          </article>

          <div className="space-y-4">
            {articles.slice(1, 4).map((article) => (
              <article key={article.id} className="overflow-hidden rounded-xl border border-white/10 bg-[#0b1720]">
                <div className="flex gap-3 p-3">
                  <img src={article.image} alt={article.title} className="h-24 w-24 rounded-lg object-cover md:h-28 md:w-28" />
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center justify-between gap-2 text-[9px] uppercase tracking-[0.14em] text-cyan">
                      <span>{article.category}</span>
                      <span className="text-slate-400">{article.date}</span>
                    </div>
                    <h3 className="font-space text-base font-bold text-white md:text-lg">{article.title}</h3>
                    <p className="mt-2 text-xs leading-relaxed text-slate-400">{article.excerpt}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto max-w-7xl px-5 pb-8 md:px-8">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <p className="mb-1 font-space text-[10px] font-bold uppercase tracking-[0.22em] text-cyan">More Stories</p>
            <h2 className="font-space text-2xl font-bold text-white md:text-3xl">Community & Competition</h2>
          </div>
          <Link to="/tournaments" className="hidden items-center gap-2 rounded-md border border-cyan px-4 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-cyan hover:bg-cyan hover:text-[#041018] sm:inline-flex">
            Explore events
            <i className="fa-solid fa-arrow-right" />
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {articles.slice(4).map((article) => (
            <article key={article.id} className="group overflow-hidden rounded-2xl border border-white/10 bg-[#0b1720] hover:border-cyan/60 transition-all">
              <div className="relative h-52 overflow-hidden">
                <img src={article.image} alt={article.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#061018] via-[#061018]/25 to-transparent" />
                <span className="absolute left-3 top-3 rounded-full border border-white/15 bg-black/40 px-2 py-1 text-[8px] font-bold uppercase tracking-[0.2em] text-white">
                  {article.badge}
                </span>
              </div>
              <div className="p-4">
                <div className="mb-2 flex items-center justify-between gap-2 text-[9px] uppercase tracking-[0.14em] text-slate-400">
                  <span>{article.category}</span>
                  <span>{article.date}</span>
                </div>
                <h3 className="font-space text-lg font-bold leading-tight text-white">{article.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{article.excerpt}</p>
                <button type="button" className="mt-4 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-cyan">
                  Read story
                  <i className="fa-solid fa-arrow-right" />
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};

export default NewsPage;
