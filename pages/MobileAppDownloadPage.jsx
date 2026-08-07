import React from 'react';
import { Link } from 'react-router-dom';

const DRIVE_VIEW_URL = 'https://drive.google.com/file/d/1y8ZqVdnsCXfN8UZBriLKSkSJcMd00UqR/view?usp=sharing';
const DRIVE_DOWNLOAD_URL = 'https://drive.google.com/uc?export=download&id=1y8ZqVdnsCXfN8UZBriLKSkSJcMd00UqR';

const features = [
  {
    title: 'Fast Tournament Access',
    description: 'Check live events, register quickly, and stay updated from your phone.',
    icon: 'fa-mobile-screen-button'
  },
  { 
    title: 'Live Community Updates',
    description: 'Receive announcements, stream reminders, and leaderboards in real time.',
    icon: 'fa-bell'
  },
  {
    title: 'Player Profile & Wallet',
    description: 'Manage your profile, balance, and registrations from one place.',
    icon: 'fa-wallet'
  }
];

const installSteps = [
  'Tap the Download App button to start the download from our Google Drive link.',
  'If your device asks for permission, allow installation from this source.',
  'Open the downloaded file and complete the installation to launch Taigour E-Sports.',
  'Sign in and start exploring tournaments, streams, and your profile.'
];

const MobileAppDownloadPage = () => {
  return (
    <div className="pt-20 md:pt-24 pb-16 min-h-screen bg-bg-dark font-inter">
      <div className="container mx-auto px-4">
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-bg-card/70 shadow-[0_20px_80px_rgba(0,0,0,0.35)]">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan/20 via-bg-dark to-bg-dark" />
          <div className="relative p-6 md:p-10 lg:p-12">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-cyan/20 bg-cyan/10 mb-6">
              <i className="fa-solid fa-download text-cyan" />
              <span className="text-[10px] md:text-xs font-bold uppercase tracking-[0.25em] text-cyan">Official Mobile App</span>
            </div>

            <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-8 items-center">
              <div>
                <h1 className="text-3xl md:text-5xl font-orbitron font-black text-white tracking-tight mb-4">
                  Download the Taigour E-Sports app
                </h1>
                <p className="text-gray-400 text-sm md:text-base leading-relaxed max-w-2xl">
                  Get faster access to tournaments, streams, player profiles, and community updates straight from your phone.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 mt-8">
                  <a
                    href={DRIVE_DOWNLOAD_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan px-6 py-3 font-space font-bold uppercase tracking-[0.2em] text-charcoal transition-transform duration-300 hover:-translate-y-0.5"
                  >
                    <i className="fa-solid fa-download" />
                    Download App
                  </a>
                  <a
                    href={DRIVE_VIEW_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-6 py-3 font-space font-bold uppercase tracking-[0.2em] text-white transition-colors duration-300 hover:border-cyan hover:bg-cyan/10"
                  >
                    <i className="fa-solid fa-arrow-up-right-from-square" />
                    Open Google Drive
                  </a>
                </div>

                <div className="mt-6 flex flex-wrap gap-2">
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-300">
                    Android Ready
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-300">
                    Direct Download
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-300">
                    Official Link
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan/10 text-cyan">
                    <i className="fa-solid fa-mobile-screen-button text-xl" />
                  </div>
                  <div>
                    <h2 className="text-white font-space font-bold text-lg">Why download it?</h2>
                    <p className="text-sm text-gray-400">Stay connected to Taigour anywhere.</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {features.map((item) => (
                    <div key={item.title} className="rounded-xl border border-white/10 bg-bg-dark/70 p-3">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-cyan/10 text-cyan">
                          <i className={`fa-solid ${item.icon}`} />
                        </div>
                        <div>
                          <h3 className="text-white font-semibold">{item.title}</h3>
                          <p className="text-sm text-gray-400 mt-1">{item.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-orbitron font-black text-white uppercase tracking-[0.2em] mb-4">Install guide</h2>
            <ol className="space-y-3 text-sm text-gray-300">
              {installSteps.map((step, index) => (
                <li key={step} className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cyan/10 text-cyan font-bold text-xs">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-3xl border border-cyan/20 bg-cyan/10 p-6">
            <h2 className="text-xl font-orbitron font-black text-white uppercase tracking-[0.2em] mb-3">Need help?</h2>
            <p className="text-sm text-gray-300 leading-relaxed">
              If the download does not start or the app does not install, contact our support team or try the Google Drive link directly.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link to="/" className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10">
                <i className="fa-solid fa-house" />
                Back to Home
              </Link>
              <Link to="/become-partner" className="inline-flex items-center gap-2 rounded-full border border-cyan/25 bg-cyan/20 px-4 py-2 text-sm font-semibold text-cyan hover:bg-cyan/30">
                <i className="fa-solid fa-handshake" />
                Become a Partner
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default MobileAppDownloadPage;
