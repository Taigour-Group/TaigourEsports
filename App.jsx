
import React, { useState, useEffect, useLayoutEffect, useCallback, useRef, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import OnboardingModal from './components/OnboardingModal.jsx';
import { dbService } from './services/dbService.js';
import { balanceService } from './services/balanceService.js';
import { hydrateCatalogFromSupabase } from './constants/balanceConstants.js';

// Lazy load page components
const HomePage = lazy(() => import('./pages/HomePageRedesigned.jsx'));
const GamesPage = lazy(() => import('./pages/GamesPage.jsx'));
const TournamentsPage = lazy(() => import('./pages/TournamentsPage.jsx'));
const TournamentDetailsPage = lazy(() => import('./pages/TournamentDetailsPage.jsx'));
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage.jsx'));
const StreamsPage = lazy(() => import('./pages/StreamsPage.jsx'));
const ProfilePage = lazy(() => import('./pages/ProfilePage.jsx'));
const BecomePartnerPage = lazy(() => import('./pages/BecomePartnerPage.jsx'));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage.jsx'));
const TermsOfServicePage = lazy(() => import('./pages/TermsOfServicePage.jsx'));
const LegalLandingPage = lazy(() => import('./pages/LegalLandingPage.jsx'));
const LegalPage = lazy(() => import('./pages/LegalLayout.jsx'));
const MobileAppDownloadPage = lazy(() => import('./pages/MobileAppDownloadPage.jsx'));
const AdminGate = lazy(() => import('./components/AdminGate.jsx'));
const AdminPanel = lazy(() => import('./components/AdminPanel.jsx'));

const RouteDataLoader = ({
  setTournaments,
  setLeaderboard,
  setStreams,
  setRegistrations,
  setLogs
}) => {
  const location = useLocation();
  const inFlightRequests = useRef(new Map());

  useEffect(() => {
    let cancelled = false;
    const path = location.pathname;
    const dataRequirements = path === '/'
      ? ['tournaments', 'registrations']
      : path === '/games'
        ? ['tournaments']
        : path === '/tournaments' || path.startsWith('/tournament/')
          ? ['tournaments', 'registrations']
          : path === '/leaderboard'
            ? ['leaderboard']
            : path === '/streams'
              ? ['streams']
            : path === '/profile'
              ? ['tournaments', 'registrations', 'leaderboard']
              : path === '/admin'
                  ? ['tournaments', 'leaderboard', 'streams', 'registrations', 'logs']
                  : [];
    const dataLoaders = {
      tournaments: dbService.getTournaments,
      leaderboard: dbService.getLeaderboard,
      streams: dbService.getStreams,
      registrations: dbService.getRegistrations,
      logs: dbService.getLogs
    };
    const dataSetters = {
      tournaments: setTournaments,
      leaderboard: setLeaderboard,
      streams: setStreams,
      registrations: setRegistrations,
      logs: setLogs
    };
    const loadOnce = (key, loader) => {
      const existingRequest = inFlightRequests.current.get(key);
      if (existingRequest) return existingRequest;

      const request = Promise.resolve().then(loader);
      inFlightRequests.current.set(key, request);
      const clearRequest = () => {
        if (inFlightRequests.current.get(key) === request) {
          inFlightRequests.current.delete(key);
        }
      };
      request.then(clearRequest, clearRequest);
      return request;
    };

    Promise.all(dataRequirements.map(async (key) => [key, await loadOnce(key, dataLoaders[key])]))
      .then((results) => {
        if (cancelled) return;
        results.forEach(([key, data]) => dataSetters[key](data));
      })
      .catch((error) => console.error(`Failed to load data for ${path}:`, error));

    if (path === '/profile') {
      loadOnce('catalog', () => balanceService.getCatalog()).then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error('Failed to load catalog:', error);
          return;
        }
        if (data) hydrateCatalogFromSupabase(data);
      });
    }

    return () => {
      cancelled = true;
    };
  }, [location.pathname, setTournaments, setLeaderboard, setStreams, setRegistrations, setLogs]);

  return null;
};

const App = () => {
  const [theme, setTheme] = useState(() => (
    window.localStorage.getItem('taigour-theme') === 'dark' ? 'dark' : 'light'
  ));
  // Keep data available when switching between routes.
  const [tournaments, setTournaments] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [streams, setStreams] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [logs, setLogs] = useState([]);
  const initialLoadStartedRef = useRef(false);

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem('taigour-theme', theme);
    document.querySelector("meta[name='theme-color']")?.setAttribute(
      'content',
      theme === 'light' ? '#f3f6fa' : '#0B0F14'
    );
  }, [theme]);

  const refetchAdminData = useCallback(async () => {
    try {
      const [tournamentsData, leaderboardData, streamsData, registrationsData, logsData] = await Promise.all([
        dbService.getTournaments(),
        dbService.getLeaderboard(),
        dbService.getStreams(),
        dbService.getRegistrations(),
        dbService.getLogs()
      ]);
      setTournaments(tournamentsData);
      setLeaderboard(leaderboardData);
      setStreams(streamsData);
      setRegistrations(registrationsData);
      setLogs(logsData);
    } catch (error) {
      console.error('Failed to refresh admin data:', error);
    }
  }, []);

  // Capacitor deep-link / OAuth error handling.
  useEffect(() => {
    if (initialLoadStartedRef.current) return;
    initialLoadStartedRef.current = true;

    // Handle native mobile deep links (Capacitor)
    if (window.Capacitor?.Plugins?.App) {
      window.Capacitor.Plugins.App.addListener('appUrlOpen', (data) => {
        if (data.url?.includes('access_token=')) {
          window.location.hash = new URL(data.url).hash;
        }
      });
    }

    // Alert on mobile OAuth state errors
    const params = new URLSearchParams(window.location.search);
    if (params.get('error') === 'invalid_request' && params.get('error_code') === 'bad_oauth_state') {
      alert("Mobile Login Error: Please ensure your computer's local IP address is added to your Supabase project's 'Allowed Redirect URLs'.");
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const RouteMeta = () => {
    const location = useLocation();

    useEffect(() => {
      const path = location.pathname.replace(/\/$/, '') || '/';
      const defaultMeta = {
        title: 'Taigour E-Sports | Nepal Esports Tournaments',
        description: 'Taigour E-Sports is Nepal’s premier esports tournament platform for PUBG Mobile, Free Fire, Ludo, live streams, leaderboards, and competitive gaming events.'
      };

      const routeMeta = {
        '/': defaultMeta,
        '/tournaments': {
          title: 'Find Nepal Esports Tournaments | Taigour E-Sports',
          description: 'Browse and register for PUBG Mobile, Free Fire, and Ludo tournaments across Nepal with Taigour E-Sports.'
        },
        '/games': {
          title: 'Games | Taigour E-Sports',
          description: 'Explore PUBG Mobile, Free Fire, and Ludo tournaments on Taigour E-Sports.'
        },
        '/leaderboard': {
          title: 'Leaderboard Rankings | Taigour E-Sports',
          description: 'Track top players and teams in Nepal esports tournaments with live leaderboard rankings.'
        },
        '/streams': {
          title: 'Live Esports Streams | Taigour E-Sports',
          description: 'Watch live competitive esports streams from Nepal gaming events and stay updated on current matches.'
        },
        '/profile': {
          title: 'Player Profile | Taigour E-Sports',
          description: 'Manage your player account and tournament registrations on Taigour E-Sports.'
        },
        '/admin': {
          title: 'Admin Dashboard | Taigour E-Sports',
          description: 'Manage tournaments, leaderboards, streams, and registrations on Taigour E-Sports.'
        },
        '/privacy-policy': {
          title: 'Privacy Policy | Taigour E-Sports',
          description: 'Read Taigour E-Sports privacy practices for our website, app, tournaments, and community services.'
        },
        '/terms-of-service': {
          title: 'Terms of Service | Taigour E-Sports',
          description: 'Review the rules and responsibilities for using Taigour E-Sports services and tournament platforms.'
        },
        '/download-app': {
          title: 'Download Taigour E-Sports App | Taigour E-Sports',
          description: 'Download the Taigour E-Sports mobile app for fast access to tournaments, streams, and player features.'
        }
      };

      const meta = path.startsWith('/tournament')
        ? {
            title: 'Tournament Details | Taigour E-Sports',
            description: 'View tournament details and register for competitive esports events in Nepal.'
          }
        : routeMeta[path] || defaultMeta;

      const setMeta = (selector, value) => {
        const element = document.querySelector(selector);
        if (element) {
          element.setAttribute('content', value);
        }
      };

      document.title = meta.title;
      setMeta("meta[name='description']", meta.description);
      setMeta("meta[property='og:title']", meta.title);
      setMeta("meta[property='og:description']", meta.description);
      setMeta("meta[name='twitter:title']", meta.title);
      setMeta("meta[name='twitter:description']", meta.description);
    }, [location.pathname]);

    return null;
  };

  // ── Admin handlers ──────────────────────────────────────────────

  const handleSaveLeaderboard = useCallback(async (data) => {
    try {
      const response = await fetch('/api/admin/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (response.ok) {
        setLeaderboard(data);
        const updatedLogs = await dbService.getLogs();
        setLogs(updatedLogs);
        return true;
      }
    } catch (error) {
      console.error('Failed to save leaderboard:', error);
    }
    return false;
  }, []);

  const handleSaveStreams = useCallback(async (data) => {
    try {
      const response = await fetch('/api/admin/streams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (response.ok) {
        setStreams(data);
        const updatedLogs = await dbService.getLogs();
        setLogs(updatedLogs);
        return true;
      }
    } catch (error) {
      console.error('Failed to save streams:', error);
    }
    return false;
  }, []);

  const handleSaveRegistrations = useCallback(async (data) => {
    setRegistrations(data);
    const updatedLogs = await dbService.getLogs();
    setLogs(updatedLogs);
    return true;
  }, []);

  const handleRegister = useCallback(async () => {
    const updatedRegistrations = await dbService.getRegistrations();
    setRegistrations(updatedRegistrations);
  }, []);

  const handleRestore = useCallback(async (data) => {
    const success = await dbService.restoreDatabase(data);
    if (success) {
      await refetchAdminData();
    }
    return success;
  }, [refetchAdminData]);

  return (
    <Router>
      <RouteMeta />
      <RouteDataLoader
        setTournaments={setTournaments}
        setLeaderboard={setLeaderboard}
        setStreams={setStreams}
        setRegistrations={setRegistrations}
        setLogs={setLogs}
      />
      <div className="min-h-screen relative bg-bg-dark">
        {/* Hide global site header on admin route (admin has its own header) */}
        {window.location.pathname !== '/admin' && (
          <Header
            theme={theme}
            onToggleTheme={() => setTheme((currentTheme) => currentTheme === 'dark' ? 'light' : 'dark')}
          />
        )}

        {/* New-account onboarding: collect full name, age, game UID & contact right after login */}
        <OnboardingModal />

        <main className="min-h-[80vh]">
          <Suspense fallback={<div className="min-h-[60vh]" aria-label="Loading page" />}>
            <Routes>

              <Route path="/" element={<HomePage tournaments={tournaments} registrations={registrations} />} />
              <Route path="/games" element={<GamesPage tournaments={tournaments} />} />
              <Route path="/tournaments" element={<TournamentsPage tournaments={tournaments} registrations={registrations} />} />
              <Route path="/tournament/:id" element={<TournamentDetailsPage tournaments={tournaments} onRegister={handleRegister} registrations={registrations} />} />
              <Route path="/leaderboard" element={<LeaderboardPage leaderboard={leaderboard} />} />
              <Route path="/streams" element={<StreamsPage streams={streams} />} />
              <Route path="/news" element={<Navigate to="/streams" replace />} />
              <Route path="/profile" element={<ProfilePage tournaments={tournaments} registrations={registrations} leaderboard={leaderboard} />} />
              <Route path="/become-partner" element={<BecomePartnerPage />} />
              <Route path="/legal" element={<LegalLandingPage />} />
              <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
              <Route path="/terms-of-service" element={<TermsOfServicePage />} />
              <Route path="/download-app" element={<MobileAppDownloadPage />} />
              <Route path="/legal-layout" element={<LegalPage />} />

              {/* Admin Route */}
              <Route path="/admin" element={
                <AdminGate>
                  {({ onLogout }) => (
                    <AdminPanel
                      tournaments={tournaments}
                      onTournamentsChange={setTournaments}
                      leaderboard={leaderboard}
                      saveLeaderboard={handleSaveLeaderboard}
                      streams={streams}
                      saveStreams={handleSaveStreams}
                      registrations={registrations}
                      saveRegistrations={handleSaveRegistrations}
                      systemLogs={logs}
                      onRestore={handleRestore}
                      onLogout={onLogout}
                    />
                  )}
                </AdminGate>
              } />
            </Routes>
          </Suspense>
        </main>

        <Footer />
      </div>
    </Router>
  );
};

export default App;
