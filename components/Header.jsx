
import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { balanceService } from '../services/balanceService';

const Header = () => {
  const { user, profile, loading, loginWithGoogle, loginWithApple, loginWithFacebook, logout } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [playerBalance, setPlayerBalance] = useState(null);
  const [showBalanceTooltip, setShowBalanceTooltip] = useState(false);
  const location = useLocation();
  const userMenuRef = useRef(null);
  const balanceTooltipRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch balance whenever the logged-in user first appears (avoid repeated fetches on focus)
  const fetchBalance = async () => {
    try {
      const { data, error } = await balanceService.getPlayerBalance(user.id);
      if (!error && data) {
        setPlayerBalance(data);
      }
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    }
  };

  const fetchedBalanceRef = useRef(false);

  useEffect(() => {
    if (!user?.id) {
      setPlayerBalance(null);
      fetchedBalanceRef.current = false; // reset when logged out
      return;
    }
    if (fetchedBalanceRef.current) return; // already fetched for this session
    fetchedBalanceRef.current = true;
    fetchBalance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
      if (balanceTooltipRef.current && !balanceTooltipRef.current.contains(e.target)) {
        setShowBalanceTooltip(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isActive = (path) => path.startsWith('/#')
    ? location.pathname === '/' && location.hash === path.slice(1)
    : location.pathname === path;

  const navLinks = [
    { name: 'Home', path: '/', icon: 'fa-house' },
    { name: 'Tournaments', path: '/tournaments', icon: 'fa-crosshairs' },
    { name: 'Games', path: '/games', icon: 'fa-gamepad' },
    { name: 'Rankings', path: '/leaderboard', icon: 'fa-crown' },
    { name: 'News', path: '/news', icon: 'fa-newspaper' },
    { name: 'Live', path: '/streams', icon: 'fa-bolt' }
  ];

  const desktopNavLinks = [
    { name: 'Home', path: '/' },
    { name: 'Tournaments', path: '/tournaments' },
    { name: 'Games', path: '/games' },
    { name: 'Rankings', path: '/leaderboard' },
    { name: 'News', path: '/news' },
    { name: 'About', path: '/#about' },
    { name: 'Contact', path: '/#contact' }
  ];

  const getUserDisplayName = () => {
    if (profile?.username) return profile.username;
    if (user?.user_metadata?.full_name) return user.user_metadata.full_name;
    if (user?.email) return user.email.split('@')[0];
    return 'Player';
  };

  const getUserAvatar = () => {
    if (profile?.avatar_url) return profile.avatar_url;
    if (user?.user_metadata?.avatar_url) return user.user_metadata.avatar_url;
    return null;
  };

  return (
    <>
      {/* ─── Desktop Top Bar ─── */}
      <nav
        id="desktop-navbar"
        className="fixed top-0 z-[100] hidden w-full py-2 transition-all duration-300 md:block"
        style={{
          background: 'rgba(3, 11, 18, 0.96)',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div className="container mx-auto flex items-center justify-between gap-3 px-4 lg:px-6">
          {/* ─── Logo ─── */}
          <Link to="/" className="flex items-center gap-3 group relative z-10" id="nav-logo">
            <div className="relative">
              <img
                src="https://res.cloudinary.com/dkoirxf41/image/upload/v1790497757/Taigours_E-Sports_White_Logo_only-removebg-preview_tmkzla.png"
                className="w-10 h-10 group-hover:rotate-[360deg] transition-transform duration-1000 relative z-10"
                alt="Taigour"
              />
              <div className="absolute -inset-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: 'radial-gradient(circle, rgba(0,212,255,0.25) 0%, transparent 70%)' }}
              ></div>
            </div>
            <div className="flex flex-col">
              <span className="font-orbitron font-black text-white text-lg tracking-tighter leading-none flex items-center gap-1.5">
                TAIGOUR
                <span className="w-1.5 h-1.5 bg-tertiary rounded-full shadow-[0_0_8px_#00ff80]"
                  style={{ animation: 'navPulse 2s ease-in-out infinite' }}
                ></span>
              </span>
              <span className="font-orbitron font-bold text-[9px] tracking-[0.4em] uppercase leading-none mt-0.5"
                style={{ color: '#00d4ff' }}
              >
                E-Sports
              </span>
            </div>
          </Link>

          {/* ─── Center Navigation Pill ─── */}
          <div className="flex min-w-0 flex-1 items-center justify-center gap-0 lg:gap-1" id="desktop-nav-links">
            {desktopNavLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`relative whitespace-nowrap px-2 py-3 font-space text-[10px] transition-colors lg:px-2.5 lg:text-[11px] ${isActive(link.path) ? 'text-cyan' : 'text-slate-300 hover:text-white'}`}
                id={`nav-link-${link.name.toLowerCase()}`}
              >
                {link.name}
                {isActive(link.path) && <span className="absolute bottom-1 left-2 right-2 h-px bg-cyan" />}
              </Link>
            ))}
          </div>

          {/* ─── Right Side: User / Auth ─── */}
          <div className="relative z-10 flex shrink-0 items-center gap-2">
            <Link to="/tournaments" className="hidden rounded-2xl border border-cyan px-3 py-2 font-space text-[10px] font-bold text-cyan transition-colors hover:bg-cyan hover:text-[#041018] md:inline-flex">Join Now</Link>
            {loading ? (
              <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin"></div>
            ) : user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2.5 pl-3 pr-1.5 py-1.5 rounded-full transition-all duration-300 group cursor-pointer"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.07)',
                  }}
                  id="user-menu-button"
                >
                  <div className="flex items-center gap-1">
                    <i className="fa-solid fa-wallet text-primary text-xs"></i>
                    <span className="font-orbitron font-bold text-[10px] text-primary uppercase tracking-wider">
                      ◈ {playerBalance?.balance?.toLocaleString() || '0'}
                    </span>
                  </div>
                  <div className="relative">
                    {getUserAvatar() ? (
                      <img
                        src={getUserAvatar()}
                        alt="avatar"
                        className="w-8 h-8 rounded-full object-cover ring-2 ring-primary/30 group-hover:ring-primary/60 transition-all"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full flex items-center justify-center font-orbitron font-black text-xs text-primary ring-2 ring-primary/30 group-hover:ring-primary/60 transition-all"
                        style={{ background: 'rgba(0,212,255,0.1)' }}
                      >
                        {getUserDisplayName().charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-tertiary rounded-full border-2 border-bg-dark"
                      style={{ boxShadow: '0 0 6px #00ff80' }}
                    ></span>
                  </div>
                </button>

                {/* Dropdown */}
                {showUserMenu && (
                  <div
                    className="absolute right-0 top-full mt-2 w-52 rounded-xl overflow-hidden animate-fade-in"
                    style={{
                      background: 'rgba(15, 15, 19, 0.95)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      boxShadow: '0 16px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,212,255,0.05)',
                    }}
                    id="user-dropdown"
                  >
                    <div className="px-4 py-3 border-b border-white/5">
                      <p className="font-orbitron font-bold text-xs text-white truncate">{getUserDisplayName()}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <i className="fa-solid fa-wallet text-primary text-[9px]"></i>
                        <p className="text-[10px] text-primary font-bold">◈ {playerBalance?.balance?.toLocaleString() || '0'}</p>
                      </div>
                      <p className="text-[10px] text-gray-500 truncate mt-0.5">{user.email}</p>
                    </div>
                    <div className="py-1 border-b border-white/5">
                      <Link
                        to="/profile"
                        onClick={() => setShowUserMenu(false)}
                        className="w-full text-left px-4 py-2.5 flex items-center gap-3 text-gray-400 hover:text-primary hover:bg-white/5 transition-all cursor-pointer"
                        id="profile-button"
                      >
                        <i className="fa-solid fa-circle-user text-xs"></i>
                        <span className="font-orbitron font-bold text-[10px] uppercase tracking-wider">My Profile</span>
                      </Link>
                    </div>
                    <div className="py-1">
                      <button
                        onClick={() => { logout(); setShowUserMenu(false); }}
                        className="w-full text-left px-4 py-2.5 flex items-center gap-3 text-gray-400 hover:text-red-400 hover:bg-white/5 transition-all cursor-pointer"
                        id="logout-button"
                      >
                        <i className="fa-solid fa-arrow-right-from-bracket text-xs"></i>
                        <span className="font-orbitron font-bold text-[10px] uppercase tracking-wider">Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button onClick={loginWithGoogle} className="grid h-9 w-9 place-items-center rounded-md border border-white/15 text-cyan transition-colors hover:border-cyan" id="sign-in-button" aria-label="Sign in">
                <i className="fa-regular fa-user text-xs" />
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* ─── Mobile Top Bar (minimal, just logo) ─── */}
      <nav
        className={`fixed top-0 w-full z-[100] transition-all duration-300 md:hidden ${
          isScrolled ? 'bg-bg-dark/80 backdrop-blur-lg border-b border-primary/10 py-3 shadow-2xl' : 'bg-transparent py-5'
        }`}
      >
        <div className="container mx-auto px-4 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="relative">
              <img
                src="https://res.cloudinary.com/dbjjzyrr3/image/upload/v1768567786/tiger-logo_jcf2zj.png"
                className="w-10 h-10 group-hover:rotate-[360deg] transition-transform duration-1000"
                alt="Taigour"
              />
              <div className="absolute -inset-1 bg-primary/20 blur-lg rounded-full animate-pulse"></div>
            </div>
            <div className="flex flex-col">
              <span className="font-orbitron font-black text-white text-lg tracking-tighter leading-none flex items-center gap-1.5">
                TAIGOUR <span className="w-1.5 h-1.5 bg-tertiary rounded-full animate-pulse shadow-[0_0_8px_#00ff80]"></span>
              </span>
              <span className="text-primary font-orbitron font-bold text-[8px] tracking-[0.4em] uppercase leading-none mt-1">E-Sports</span>
            </div>
          </Link>

          {/* Mobile Auth Menu */}
          <div className="flex items-center gap-2">
            {loading ? (
              <div className="w-6 h-6 rounded-full border-2 border-primary/30 border-t-primary animate-spin"></div>
            ) : user ? (
              <div className="flex items-center gap-2">
                {/* Balance display */}
                <div className="flex items-center gap-1 pl-2 pr-1.5 py-1 rounded-full relative"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.07)',
                  }}
                  ref={balanceTooltipRef}
                >
                  <i className="fa-solid fa-wallet text-primary text-[12px]"></i>
                  <span className="font-orbitron font-bold text-[12px] text-white uppercase tracking-wider">
                    ◈ {playerBalance?.balance?.toLocaleString() || '0'}
                  </span> 
                  <button
                    onClick={() => setShowBalanceTooltip(!showBalanceTooltip)}
                    className="cursor-pointer ml-1 hover:opacity-80 transition-opacity"
                  >
                    <i className="fa-solid fa-info text-primary text-[10px]"></i>
                  </button>
                  {/* Tooltip */}
                  {showBalanceTooltip && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-bg-dark text-white text-xs rounded py-2 px-3 whitespace-nowrap z-50 animate-fade-in"
                      style={{
                        border: '1px solid rgba(0,212,255,0.3)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.4), 0 0 12px rgba(0,212,255,0.2)',
                      }}
                    >
                      <p className="text-[8px] text-white mb-1">
                      Current balance in your account.  You can use this to enter <br/> tournaments and buy items from the store.
                      </p>
                      {/* Arrow */}
                      <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-bg-dark rotate-45"
                        style={{
                          border: '1px solid rgba(0,212,255,0.3)',
                          borderRight: 'none',
                          borderBottom: 'none',
                        }}
                      ></div>
                    </div>
                  )}
                </div>
                {/* Avatar */}
                <Link to="/profile" className="relative group block">
                  {getUserAvatar() ? (
                    <img
                      src={getUserAvatar()}
                      alt="avatar"
                      className="w-8 h-8 rounded-full object-cover ring-2 ring-primary/30"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full flex items-center justify-center font-orbitron font-black text-[10px] text-primary ring-2 ring-primary/30"
                      style={{ background: 'rgba(0,212,255,0.1)' }}
                    >
                      {getUserDisplayName().charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-tertiary rounded-full border-2 border-bg-dark animate-pulse"
                    style={{ boxShadow: '0 0 6px #00ff80' }}
                  ></span>
                </Link>
              </div>
            ) : (
              <button
                onClick={loginWithGoogle}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full transition-all duration-300 group cursor-pointer"
                style={{
                  background: 'linear-gradient(135deg, rgba(0,212,255,0.15) 0%, rgba(0,212,255,0.05) 100%)',
                  border: '1px solid rgba(0,212,255,0.2)',
                  boxShadow: '0 0 10px rgba(0,212,255,0.08)',
                }}
              >
                <i className="fa-brands fa-google text-[9px] text-primary"></i>
                <span className="font-orbitron font-bold text-[8px] text-primary uppercase tracking-widest">Sign In</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* ─── Mobile Bottom Navigation ─── */}
      <div className="md:hidden fixed rounded-full m-2 bottom-0 left-0 right-0 z-[100] bottom-nav-glass mobile-safe-bottom">
        <div className="flex justify-around items-center h-16">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`flex flex-col items-center justify-center w-full h-full relative transition-all duration-300 ${isActive(link.path) ? 'text-primary' : 'text-gray-500'}`}
            >
              {isActive(link.path) && (
                <div className="absolute top-0 w-12 h-[3px] bg-primary rounded-b-full shadow-[0_0_15px_#00d4ff]"></div>
              )}
              <i className={`fa-solid ${link.icon} text-lg mb-1 ${isActive(link.path) ? 'scale-110 drop-shadow-[0_0_8px_rgba(0,212,255,0.5)]' : ''}`}></i>
              <span className="text-[9px] font-orbitron font-black uppercase tracking-widest">{link.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
};

export default Header;
