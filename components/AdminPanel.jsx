
import React, { useState, useMemo, lazy, Suspense, useEffect } from 'react';
import { adminFetch } from '../services/adminAuth';
import { hydrateCatalogFromSupabase } from '../constants/balanceConstants';
import { DEFAULT_REGISTRATION_FIELDS, REGISTRATION_FIELD_DEFS, normalizeRegistrationFieldConfig } from '../constants/registrationFields';

// Lazy-load AdminRequestsPanel at module level (not inside a render function)
const AdminRequestsPanel = lazy(() => import('./AdminRequestsPanel'));
import PlayerStatsAdmin from './PlayerStatsAdmin';
import NotificationsAdmin from './NotificationsAdmin';
import ErrorBox from './ErrorBox.jsx';
const AdminPanel = ({
  tournaments, saveTournaments, refetchTournaments,
  leaderboard, saveLeaderboard,
  streams, saveStreams,
  registrations, saveRegistrations,
  systemLogs,
  onRestore,
  onLogout
}) => {
  const [activeView, setActiveView] = useState('dashboard');
  const [showMoreViews, setShowMoreViews] = useState(false);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [filterGame, setFilterGame] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [listPage, setListPage] = useState(0);
  const [viewingReg, setViewingReg] = useState(null);
  const [whatsAppSentMap, setWhatsAppSentMap] = useState({});
  const [isRefreshingRegistrations, setIsRefreshingRegistrations] = useState(false);
  const [teamPlayers, setTeamPlayers] = useState([]);
  const [loadingPlayers, setLoadingPlayers] = useState(false);
  const [editRegForm, setEditRegForm] = useState({});
  const [savingReg, setSavingReg] = useState(false);
  const [errorBox, setErrorBox] = useState(null);
  const [catalogMode, setCatalogMode] = useState('membership');
  const [membershipItems, setMembershipItems] = useState([]);
  const [rechargeItems, setRechargeItems] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [membershipForm, setMembershipForm] = useState({
    slug: '',
    name: '',
    short_name: '',
    price: '0',
    color: 'gray',
    icon: 'user',
    benefits: '',
    description: '',
    badge_label: '',
    is_popular: false,
    sort_order: '100',
    is_active: true
  });
  const [rechargeForm, setRechargeForm] = useState({
    amount: '0',
    bonus: '0',
    cost: '0',
    icon: 'fa-wallet',
    sort_order: '100',
    is_active: true
  });
  const [editingCatalogId, setEditingCatalogId] = useState(null);

  const loadCatalogData = async () => {
    try {
      setCatalogLoading(true);
      const [membershipRes, rechargeRes] = await Promise.all([
        adminFetch('/api/admin/catalog/membership-tiers'),
        adminFetch('/api/admin/catalog/recharge-packages')
      ]);

      if (!membershipRes.ok || !rechargeRes.ok) throw new Error('Failed to load catalog');

      const [membershipData, rechargeData] = await Promise.all([
        membershipRes.json(),
        rechargeRes.json()
      ]);

      setMembershipItems(membershipData.data || []);
      setRechargeItems(rechargeData.data || []);
      hydrateCatalogFromSupabase({
        membershipTiers: membershipData.data || [],
        rechargePackages: rechargeData.data || []
      });
    } catch (error) {
      console.error('Failed to load catalog data:', error);
    } finally {
      setCatalogLoading(false);
    }
  };

  useEffect(() => {
    if (activeView === 'catalog') {
      loadCatalogData();
    }
  }, [activeView]);

  useEffect(() => {
    if (viewingReg && viewingReg.id) {
      setEditRegForm({
        team_name: viewingReg.team_name || '',
        team_tag: viewingReg.team_tag || '',
        manager_name: viewingReg.manager_name || '',
        manager_contact: viewingReg.manager_contact || viewingReg.playercontact || '',
        registrar_email: viewingReg.registrar_email || viewingReg.playeremail || '',
        registration_status: viewingReg.registration_status || 'pending',
        payment_status: viewingReg.payment_status || 'pending',
        notes: viewingReg.notes || '',
      });
      setLoadingPlayers(true);
      fetch(`/api/team-registration/${viewingReg.id}/players`)
        .then(res => res.json())
        .then(data => {
          if (data.players) setTeamPlayers(data.players);
          else setTeamPlayers([]);
        })
        .catch(err => {
          console.error("Error fetching players", err);
          setTeamPlayers([]);
        })
        .finally(() => setLoadingPlayers(false));
    } else {
      setTeamPlayers([]);
      setEditRegForm({});
    }
    setErrorBox(null);
  }, [viewingReg]);

  const saveRegistrationChanges = async () => {
    if (!viewingReg?.id) return;
    setSavingReg(true);
    try {
      const response = await adminFetch(`/api/admin/registrations/${viewingReg.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          team_name: editRegForm.team_name || undefined,
          team_tag: editRegForm.team_tag || undefined,
          manager_name: editRegForm.manager_name || undefined,
          manager_contact: editRegForm.manager_contact || undefined,
          registrar_email: editRegForm.registrar_email || undefined,
          registration_status: editRegForm.registration_status,
          payment_status: editRegForm.payment_status,
          notes: editRegForm.notes || '',
          updated_at: new Date().toISOString()
        })
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to save');
      }
      const result = await response.json();
      const saved = result.data || { ...viewingReg, ...editRegForm };
      await saveRegistrations(registrations.map(r => r.id === viewingReg.id ? saved : r));
      setViewingReg(null);
      // success - clear any errors
      setErrorBox(null);
    } catch (error) {
      console.error('Save registration failed:', error);
      setErrorBox('Failed to update registration: ' + error.message);
    } finally {
      setSavingReg(false);
    }
  };

  // Initial States for New Records
  const initialTournament = {
    title: '', game: 'Free Fire', type: 'freefire', location: 'Nepal',
    prize: '◈ 1,000', entry_fee: '◈ 100', date: '', time: '07:00 PM',
    registration_start_date: '', registration_end_date: '',
    registration_url: '#', image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=800',
    description: '', rules: ['No Emulators allowed', 'Fair play protocol active'],
    prize_breakdown: [{ position: '1st', reward: '◈ 600' }, { position: '2nd', reward: '◈ 400' }],
    max_slots: 48, stream_id: '',
    login_required: true, payment_type: 'tgc_coin', team_size: 4,
    registration_fields: { ...DEFAULT_REGISTRATION_FIELDS }
  };

  const initialLeaderboard = {
    game: 'freefire', rank: 0, kills: 0, wins: 0, points: 0, teamname: '',
    avatar: 'https://i.pravatar.cc/150?u=' + Math.random()
  };

  const initialStream = {
    title: '', youtubeid: '', islive: false
  };

  const resetCatalogForms = () => {
    setEditingCatalogId(null);
    setMembershipForm({
      slug: '',
      name: '',
      short_name: '',
      price: '0',
      color: 'gray',
      icon: 'user',
      benefits: '',
      description: '',
      badge_label: '',
      is_popular: false,
      sort_order: '100',
      is_active: true
    });
    setRechargeForm({
      amount: '0',
      bonus: '0',
      cost: '0',
      icon: 'fa-wallet',
      sort_order: '100',
      is_active: true
    });
  };

  // Form States
  const [tourneyForm, setTourneyForm] = useState(initialTournament);
  const [lbForm, setLbForm] = useState(initialLeaderboard);
  const [streamForm, setStreamForm] = useState(initialStream);

  // Statistics Calculation
  const stats = useMemo(() => {
    const totalPrize = tournaments.reduce((acc, t) => {
      const val = parseInt(t.prize.replace(/[^0-9]/g, ''));
      return acc + (isNaN(val) ? 0 : val);
    }, 0);
    const totalPlayers = registrations.length;
    const activeTourneys = tournaments.length;
    return { totalPrize, totalPlayers, activeTourneys };
  }, [tournaments, registrations]);

  // Filtered List Logic
  const filteredList = useMemo(() => {
    const normalizeGame = (value) => {
      const v = (value || '').toString().toLowerCase().trim();
      if (!v) return '';
      if (v === 'freefire' || v === 'free fire') return 'freefire';
      if (v === 'pubg' || v === 'pubg mobile') return 'pubg';
      if (v === 'ludo' || v === 'ludo king') return 'ludo';
      return v.replace(/\s+/g, '');
    };

    const s = search.toLowerCase();
    let base = [];
    switch (activeView) {
      case 'tournaments': base = tournaments; break;
      case 'leaderboard': base = leaderboard; break;
      case 'streams': base = streams; break;
      case 'registrations': base = registrations; break;
      default: return [];
    }
    return base.filter(item => {
      const matchSearch = (
        (item.title || '') +
        (item.teamname || '') +
        (item.playername || '') +
        (item.tournamenttitle || '') +
        (item.gameuid || '') +
        (item.playeremail || '')
      ).toLowerCase().includes(s);

      let itemGameType = normalizeGame(item.type || item.game);
      if (activeView === 'registrations') {
        const linkedTournament = tournaments.find(t => t.id === item.tournamentid);
        itemGameType = normalizeGame(linkedTournament?.type || linkedTournament?.game);
      }

      // Streams are not game-specific in current data model.
      const matchGame = activeView === 'streams' || filterGame === 'all' || itemGameType === filterGame;
      const itemStatus = String(item.status || 'draft').toLowerCase();
      const matchStatus = activeView !== 'tournaments' || filterStatus === 'all' || itemStatus === filterStatus;
      return matchSearch && matchGame && matchStatus;
    });
  }, [activeView, tournaments, leaderboard, streams, registrations, search, filterGame, filterStatus]);
  const rankedList = useMemo(
    () => activeView === 'leaderboard'
      ? [...filteredList].sort((a, b) => Number(a.rank || 0) - Number(b.rank || 0))
      : filteredList,
    [activeView, filteredList]
  );
  const listPageSize = 6;
  const pageItems = useMemo(
    () => ['tournaments', 'leaderboard'].includes(activeView)
      ? rankedList.slice(listPage * listPageSize, (listPage + 1) * listPageSize)
      : rankedList,
    [activeView, rankedList, listPage]
  );

  useEffect(() => {
    setListPage(0);
  }, [activeView, search, filterGame, filterStatus]);

  // Handlers
  const resetForms = () => {
    setEditingId(null);
    setTourneyForm(initialTournament);
    setLbForm(initialLeaderboard);
    setStreamForm(initialStream);
    resetCatalogForms();
  };

  const handleSaveTournament = async (e) => {
    e.preventDefault();
    if (tourneyForm.registration_start_date && tourneyForm.registration_end_date) {
      const regStart = new Date(tourneyForm.registration_start_date);
      const regEnd = new Date(tourneyForm.registration_end_date);
      if (regStart > regEnd) {
        alert('Registration start date must be before or equal to registration end date.');
        return;
      }
    }

    const gameLabel = tourneyForm.type === 'freefire' ? 'Free Fire' : tourneyForm.type === 'pubg' ? 'PUBG Mobile' : 'Ludo King';
    const sanitizedRules = (tourneyForm.rules || []).map(r => r.trim()).filter(r => r !== '');

    const finalForm = {
      ...tourneyForm,
      game: gameLabel,
      rules: sanitizedRules,
      registration_fields: normalizeRegistrationFieldConfig(tourneyForm.registration_fields)
    };

    try {
      let response;
      if (editingId) {
        // Update existing tournament
        response = await adminFetch(`/api/admin/tournaments/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(finalForm)
        });
      } else {
        // Create new tournament
        response = await adminFetch('/api/admin/tournaments/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(finalForm)
        });
      }

      if (response.ok) {
        const result = await response.json();
        // Update local state
        const newData = editingId
          ? tournaments.map(t => t.id === editingId ? result.data : t)
          : [...tournaments, result.data];
        await saveTournaments(newData);
        // Refetch from database to ensure display is updated
        await refetchTournaments();
        resetForms();
      } else {
        const error = await response.json();
        alert(`Failed to save tournament: ${error.error}`);
      }
    } catch (error) {
      console.error('Save tournament failed:', error);
      alert('Failed to save tournament. Please try again.');
    }
  };

  const handleSaveLeaderboard = async (e) => {
    e.preventDefault();

    try {
      let response;
      if (editingId) {
        // Update existing leaderboard entry
        response = await adminFetch(`/api/admin/leaderboard/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(lbForm)
        });
      } else {
        // Create new leaderboard entry
        response = await adminFetch('/api/admin/leaderboard/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(lbForm)
        });
      }

      if (response.ok) {
        const result = await response.json();
        // Update local state
        const newData = editingId
          ? leaderboard.map(l => l.id === editingId ? result.data : l)
          : [...leaderboard, result.data];
        await saveLeaderboard(newData);
        resetForms();
      } else {
        const error = await response.json();
        alert(`Failed to save leaderboard entry: ${error.error}`);
      }
    } catch (error) {
      console.error('Save leaderboard failed:', error);
      alert('Failed to save leaderboard entry. Please try again.');
    }
  };

  const handleSaveStream = async (e) => {
    e.preventDefault();
    let finalId = streamForm.youtubeid;
    if (finalId.includes('youtube.com/watch?v=')) {
      finalId = finalId.split('v=')[1]?.split('&')[0];
    } else if (finalId.includes('youtu.be/')) {
      finalId = finalId.split('youtu.be/')[1]?.split('?')[0];
    }

    const finalForm = { ...streamForm, youtubeid: finalId };

    try {
      let response;
      if (editingId) {
        // Update existing stream
        response = await adminFetch(`/api/admin/streams/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(finalForm)
        });
      } else {
        // Create new stream
        response = await adminFetch('/api/admin/streams/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(finalForm)
        });
      }

      if (response.ok) {
        const result = await response.json();
        // Update local state
        const newData = editingId
          ? streams.map(s => s.id === editingId ? result.data : s)
          : [...streams, result.data];
        await saveStreams(newData);
        resetForms();
      } else {
        const error = await response.json();
        alert(`Failed to save stream: ${error.error}`);
      }
    } catch (error) {
      console.error('Save stream failed:', error);
      alert('Failed to save stream. Please try again.');
    }
  };

  const handleSaveMembershipCatalog = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...membershipForm,
        benefits: (membershipForm.benefits || '').split('\n').map(item => item.trim()).filter(Boolean),
        price: Number(membershipForm.price || 0),
        sort_order: Number(membershipForm.sort_order || 100),
        is_popular: Boolean(membershipForm.is_popular),
        is_active: membershipForm.is_active !== false
      };

      const url = editingCatalogId
        ? `/api/admin/catalog/membership-tiers/${editingCatalogId}`
        : '/api/admin/catalog/membership-tiers';
      const method = editingCatalogId ? 'PUT' : 'POST';
      const response = await adminFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to save membership tier');
      }
      await loadCatalogData();
      resetCatalogForms();
      alert(editingCatalogId ? 'Membership tier updated.' : 'Membership tier created.');
    } catch (error) {
      console.error('Save membership catalog failed:', error);
      alert(error.message || 'Failed to save membership tier');
    }
  };

  const handleSaveRechargeCatalog = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...rechargeForm,
        amount: Number(rechargeForm.amount || 0),
        bonus: Number(rechargeForm.bonus || 0),
        cost: Number(rechargeForm.cost || 0),
        sort_order: Number(rechargeForm.sort_order || 100),
        is_active: rechargeForm.is_active !== false
      };

      const url = editingCatalogId
        ? `/api/admin/catalog/recharge-packages/${editingCatalogId}`
        : '/api/admin/catalog/recharge-packages';
      const method = editingCatalogId ? 'PUT' : 'POST';
      const response = await adminFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to save recharge package');
      }
      await loadCatalogData();
      resetCatalogForms();
      alert(editingCatalogId ? 'Recharge package updated.' : 'Recharge package created.');
    } catch (error) {
      console.error('Save recharge catalog failed:', error);
      alert(error.message || 'Failed to save recharge package');
    }
  };

  const handleDeleteCatalogItem = async (type, id) => {
    if (!window.confirm('Delete this catalog item?')) return;
    try {
      const response = await adminFetch(
        type === 'membership'
          ? `/api/admin/catalog/membership-tiers/${id}`
          : `/api/admin/catalog/recharge-packages/${id}`,
        { method: 'DELETE' }
      );
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to delete item');
      }
      await loadCatalogData();
      if (editingCatalogId === id) resetCatalogForms();
      alert('Catalog item deleted.');
    } catch (error) {
      console.error('Delete catalog item failed:', error);
      alert(error.message || 'Failed to delete catalog item');
    }
  };

  const startCatalogEdit = (item, type) => {
    setCatalogMode(type);
    setEditingCatalogId(item.id);
    if (type === 'membership') {
      setMembershipForm({
        slug: item.slug || '',
        name: item.name || '',
        short_name: item.short_name || '',
        price: String(item.price || 0),
        color: item.color || 'gray',
        icon: item.icon || 'user',
        benefits: Array.isArray(item.benefits) ? item.benefits.join('\n') : '',
        description: item.description || '',
        badge_label: item.badge_label || '',
        is_popular: Boolean(item.is_popular),
        sort_order: String(item.sort_order || 100),
        is_active: item.is_active !== false
      });
    } else {
      setRechargeForm({
        amount: String(item.amount || 0),
        bonus: String(item.bonus || 0),
        cost: String(item.cost || 0),
        icon: item.icon || 'fa-wallet',
        sort_order: String(item.sort_order || 100),
        is_active: item.is_active !== false
      });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("CONFIRM DELETION PROTOCOL: This action will permanently erase sector data. Proceed?")) return;

    try {
      switch (activeView) {
        case 'tournaments': {
          const res = await adminFetch(`/api/admin/tournaments/${id}`, { method: 'DELETE' });
          if (res.ok) await saveTournaments(tournaments.filter(t => t.id !== id));
          break;
        }
        case 'leaderboard': {
          const res = await adminFetch(`/api/admin/leaderboard/${id}`, { method: 'DELETE' });
          if (res.ok) await saveLeaderboard(leaderboard.filter(l => l.id !== id));
          break;
        }
        case 'streams': {
          const res = await adminFetch(`/api/admin/streams/${id}`, { method: 'DELETE' });
          if (res.ok) await saveStreams(streams.filter(s => s.id !== id));
          break;
        }
        case 'registrations': {
          const res = await adminFetch(`/api/admin/registrations/${id}`, { method: 'DELETE' });
          if (res.ok) await saveRegistrations(registrations.filter(r => r.id !== id));
          break;
        }
        default:
          break;
      }
    } catch (error) {
      console.error('Delete operation failed:', error);
      alert('Delete operation failed. Please try again.');
    }
  };

  const updateRegistrationFieldRequirement = (key, checked) => {
    setTourneyForm((prev) => ({
      ...prev,
      registration_fields: normalizeRegistrationFieldConfig({
        ...(prev.registration_fields || DEFAULT_REGISTRATION_FIELDS),
        [key]: checked
      })
    }));
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    if (activeView === 'tournaments') {
      setTourneyForm({
        ...initialTournament,
        ...item,
        registration_fields: normalizeRegistrationFieldConfig(item.registration_fields || item.required_fields || item.registration_required_fields),
        rules: item.rules || initialTournament.rules,
        prize_breakdown: item.prize_breakdown || initialTournament.prize_breakdown
      });
    }
    if (activeView === 'leaderboard') setLbForm({ ...initialLeaderboard, ...item });
    if (activeView === 'streams') setStreamForm({ ...initialStream, ...item });
  };

  // Render the lazily-loaded AdminRequestsPanel (component loaded at module level)
  const renderRequests = () => (
    <Suspense fallback={<div className="p-8 text-center text-gray-400">Loading requests...</div>}>
      <AdminRequestsPanel />
    </Suspense>
  );

  const updatePrizeBreakdown = (index, field, value) => {
    const newBreakdown = [...(tourneyForm.prize_breakdown || [])];
    newBreakdown[index] = { ...newBreakdown[index], [field]: value };
    setTourneyForm({ ...tourneyForm, prize_breakdown: newBreakdown });
  };

  const addPrizeRow = () => {
    setTourneyForm({
      ...tourneyForm,
      prize_breakdown: [...(tourneyForm.prize_breakdown || []), { position: '', reward: '' }]
    });
  };

  const removePrizeRow = (index) => {
    const newBreakdown = [...(tourneyForm.prize_breakdown || [])];
    newBreakdown.splice(index, 1);
    setTourneyForm({ ...tourneyForm, prize_breakdown: newBreakdown });
  };

  const getRegistrationMessageKey = (registration) => {
    if (!registration) return '';
    return registration.id || `${registration.gameuid || ''}-${registration.playercontact || ''}`;
  };

  const sendRegistrationWhatsApp = async (registration) => {
    const rawContact = registration?.manager_contact || '';
    const sanitizedNumber = rawContact.replace(/\D/g, '');

    if (!sanitizedNumber) {
      alert('WhatsApp number is missing for this player.');
      return;
    }

    const linkedTournament = tournaments.find(t => t.id === registration?.tournamentid);
    const tournamentName = registration?.tournamenttitle || linkedTournament?.title || 'your tournament';
    const tournamentDate = linkedTournament?.date || registration?.tournamentdate || null;
    const tournamentTime = linkedTournament?.time || registration?.tournamenttime || null;
    const dateLine = tournamentDate
      ? ` Tournament date: ${tournamentDate}${tournamentTime ? ` at ${tournamentTime}` : ''}.`
      : '';

    const message = `Hello ${registration.manager_name}, your registration is successful for ${tournamentName}. Your UID is ${registration.gameuid}.${dateLine} Welcome to Taigour E-Sports!`;
    const encodedMessage = encodeURIComponent(message);
    const webWhatsAppUrl = `https://web.whatsapp.com/send?phone=${sanitizedNumber}&text=${encodedMessage}`;
    const mobileWhatsAppUrl = `https://wa.me/${sanitizedNumber}?text=${encodedMessage}`;
    const isMobileDevice = /Android|iPhone|iPad|iPod|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const whatsappUrl = isMobileDevice ? mobileWhatsAppUrl : webWhatsAppUrl;
    const messageKey = getRegistrationMessageKey(registration);

    // Mark locally as sent on user action.
    setWhatsAppSentMap(prev => ({ ...prev, [messageKey]: true }));
    const updatedRegistration = {
      ...registration,
      SMS_Status: true
    };

    // Persist SMS status in database so personnel status stays true after refresh.
    if (registration?.id) {
      try {
        const response = await adminFetch(`/api/admin/registrations/${registration.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedRegistration)
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({ error: 'Failed to update SMS status.' }));
          throw new Error(error.error || 'Failed to update SMS status.');
        }

        const result = await response.json();
        const savedRegistration = result?.data || updatedRegistration;
        await saveRegistrations(registrations.map(r => r.id === registration.id ? savedRegistration : r));
        setViewingReg(savedRegistration);
      } catch (error) {
        console.error('Failed to persist SMS status:', error);
      }
    }

    const popupRef = window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    if (!popupRef) {
      alert('SMS Sent Successfully to the player.');
    }
  };

  const refreshRegistrations = async () => {
    setIsRefreshingRegistrations(true);
    try {
      const response = await fetch('/api/registrations');
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to refresh personnel data.' }));
        throw new Error(error.error || 'Failed to refresh personnel data.');
      }
      const data = await response.json();
      await saveRegistrations(data || []);
    } catch (error) {
      console.error('Refresh registrations failed:', error);
      alert(error.message || 'Failed to refresh personnel data.');
    } finally {
      setIsRefreshingRegistrations(false);
    }
  };

  const isSmsSent = (registration) => {
    const rawStatus = registration?.SMS_Status ?? registration?.sms_status ?? registration?.smsStatus;
    if (typeof rawStatus === 'boolean') return rawStatus;
    const normalized = (rawStatus || '').toString().trim().toLowerCase();
    return normalized === 'true' || normalized === 'sent' || normalized === 'success' || normalized === '1' || normalized === 'yes';
  };

  const primaryTabs = [
    { id: 'dashboard', label: 'Dash', icon: 'fa-chart-pie' },
    { id: 'players', label: 'Players', icon: 'fa-user-gear' },
    { id: 'catalog', label: 'Catalog', icon: 'fa-gem' },
    { id: 'tournaments', label: 'Arenas', icon: 'fa-crosshairs' },
    { id: 'leaderboard', label: 'Ranks', icon: 'fa-crown' }
  ];
  const moreTabs = [
    { id: 'streams', label: 'Feeds', icon: 'fa-bolt' },
    { id: 'registrations', label: 'Teams', icon: 'fa-users' },
    { id: 'notifications', label: 'Notify', icon: 'fa-bell' },
    { id: 'requests', label: 'Requests', icon: 'fa-inbox' },
    { id: 'logs', label: 'Logs', icon: 'fa-list-ul' }
  ];
  const hasEditorPanel = ['tournaments', 'leaderboard', 'streams'].includes(activeView);
  const activateTab = (tabId) => {
    setActiveView(tabId);
    setFilterGame('all');
    setFilterStatus('all');
    setListPage(0);
    setSearch('');
    setShowMoreViews(false);
    resetForms();
  };

  return (
    <div className="min-h-screen bg-[#030b12] font-rajdhani text-white">
      <header className="sticky top-0 z-[100] border-b border-cyann bg-[#030b12]/95 shadow-[0_8px_30px_rgba(0,0,0,0.28)] backdrop-blur-xl">
        <div className="relative mx-auto flex min-h-[60px] max-w-[1440px] items-center justify-between gap-3 px-3 sm:px-5 lg:px-8">
          <div className="flex min-w-0 shrink-0 items-center gap-3 sm:gap-4">
            <img
              src="https://res.cloudinary.com/dkoirxf41/image/upload/v1790497757/Taigours_E-Sports_White_Logo_only-removebg-preview_tmkzla.png"
              alt="Taigour E-Sports"
              className="h-9 w-9 object-contain"
            />
            <div className="hidden border-r border-cyann pr-4 sm:block">
              <div className="font-orbitron text-xs font-black leading-tight tracking-wide text-white">TAIGOUR</div>
              <div className="font-orbitron text-[8px] font-bold uppercase tracking-[0.28em] text-cyan-400">E-Sports</div>
            </div>
            <div className="flex items-center gap-2 border-l border-cyann pl-3 sm:pl-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-md border border-cyann bg-cyan-400/10 text-cyan-300">
                <i className="fa-solid fa-shield-halved"></i>
              </span>
              <div className="min-w-0">
                <h1 className="whitespace-nowrap font-orbitron text-[11px] font-black uppercase tracking-wide sm:text-sm">
                  Command <span className="text-cyan-400">Center</span>
                </h1>
                <p className="hidden text-[8px] font-bold uppercase tracking-[0.16em] text-slate-500 md:block">Supreme Administrator</p>
              </div>
            </div>
          </div>

          <nav aria-label="Admin sections" className="flex min-w-0 items-center justify-end gap-1 overflow-x-auto no-scrollbar">
            {primaryTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => activateTab(tab.id)}
                aria-current={activeView === tab.id ? 'page' : undefined}
                className={`flex shrink-0 items-center gap-1.5 rounded-md border px-2 py-2 font-orbitron text-[8px] font-black uppercase tracking-wider transition-colors sm:px-3 sm:text-[9px] ${
                  activeView === tab.id
                    ? 'border-cyann bg-cyan-400 text-cyan shadow-[0_0_16px_rgba(34,211,238,0.24)]'
                    : 'border-slate-800 bg-slate-900/70 text-slate-400 hover:border-cyann hover:text-white'
                }`}
              >
                <i className={`fa-solid ${tab.icon}`}></i>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
            <div className="relative shrink-0">
              <button
                onClick={() => setShowMoreViews((visible) => !visible)}
                aria-expanded={showMoreViews}
                aria-label="More admin sections"
                className={`flex items-center gap-1 rounded-md border px-2 py-2 font-orbitron text-[8px] font-black uppercase tracking-wider transition-colors sm:px-3 sm:text-[9px] ${
                  moreTabs.some((tab) => tab.id === activeView)
                    ? 'border-cyann bg-cyan text-[#031018]'
                    : 'border-slate-800 bg-slate-900/70 text-slate-400 hover:border-cyann hover:text-white'
                }`}
              >
                <i className="fa-solid fa-ellipsis"></i>
                <span className="hidden sm:inline">More</span>
              </button>
            </div>
            <button
              onClick={onLogout}
              className="ml-1 flex shrink-0 items-center gap-1.5 rounded-md border border-pink-500/50 bg-pink-600 px-2.5 py-2 font-orbitron text-[8px] font-black uppercase tracking-wider text-white transition-colors hover:bg-pink-500 sm:px-3 sm:text-[9px]"
            >
              <i className="fa-solid fa-power-off"></i>
              <span className="hidden sm:inline">Logout</span>
            </button>
          </nav>
          {showMoreViews && (
            <div className="absolute right-3 top-full z-[110] mt-2 min-w-44 overflow-hidden rounded-lg border border-cyann bg-[#071321] p-1 shadow-2xl sm:right-5 lg:right-8">
              {moreTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => activateTab(tab.id)}
                  className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-xs font-bold transition-colors ${
                    activeView === tab.id ? 'bg-cyan-400/10 text-cyan-300' : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <i className={`fa-solid ${tab.icon} w-4 text-center`}></i>{tab.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] px-3 pb-12 pt-5 sm:px-5 md:pt-7 lg:px-8">
        <div className={`grid grid-cols-1 gap-5 md:gap-7 ${hasEditorPanel ? 'md:grid-cols-12' : ''}`}>
          <div className={`${hasEditorPanel ? 'md:col-span-7 xl:col-span-8' : 'md:col-span-12'} min-w-0 space-y-5 md:space-y-7`}>
            {activeView === 'dashboard' && (
              <div className="animate-fade-in space-y-5 md:space-y-6">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {[
                    { label: 'Registered Players', value: stats.totalPlayers.toLocaleString(), note: 'Player database', icon: 'fa-users', color: 'text-cyan-300' },
                    { label: 'Prize Pool', value: `◈ ${stats.totalPrize.toLocaleString()}`, note: 'Across all tournaments', icon: 'fa-trophy', color: 'text-amber-300' },
                    { label: 'Tournaments', value: stats.activeTourneys.toLocaleString(), note: 'Currently listed', icon: 'fa-crosshairs', color: 'text-emerald-300' }
                  ].map((stat) => (
                    <div key={stat.label} className="relative flex min-h-28 items-center justify-between overflow-hidden rounded-xl border border-cyann bg-[#071625] p-4 before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:bg-cyan-400 sm:p-5">
                      <div>
                        <div className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">{stat.label}</div>
                        <div className={`mt-2 font-orbitron text-2xl font-black ${stat.color}`}>{stat.value}</div>
                        <div className="mt-1 text-[10px] text-slate-500">{stat.note}</div>
                      </div>
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-cyann bg-cyan-400/10 text-cyan-300">
                        <i className={`fa-solid ${stat.icon}`}></i>
                      </span>
                    </div>
                  ))}
                </div>

                <section className="overflow-hidden rounded-xl border border-cyann bg-[#061321]">
                  <div className="border-b border-cyann px-4 py-4 sm:px-5">
                    <h3 className="font-orbitron text-sm font-black uppercase tracking-widest text-white">Database backup</h3>
                    <p className="mt-1 text-xs text-slate-400">Export the current tournament data or restore it from a saved JSON file.</p>
                  </div>
                  <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 sm:p-5">
                    <button
                      onClick={() => {
                        const blob = new Blob([JSON.stringify({ tournaments, leaderboard, streams, registrations })], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `nexus_sector_state_${new Date().toISOString().split('T')[0]}.json`;
                        a.click();
                      }}
                      className="flex min-h-12 items-center justify-center gap-2 rounded-lg border border-cyann bg-cyan-400/10 px-4 py-3 font-orbitron text-[10px] font-black uppercase tracking-widest text-cyan-300 transition-colors hover:bg-cyan-400 hover:text-[#031018]"
                    >
                      <i className="fa-solid fa-download"></i> Export backup
                    </button>
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="application/json,.json"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = async (ev) => {
                            try {
                              const data = JSON.parse(ev.target?.result || '{}');
                              const success = await onRestore(data);
                              if (success) alert("CORE RESTORED: Nexus state has been updated to provided parameters.");
                            } catch (err) { alert("RESTORE FAILED: Data corruption detected in uploaded matrix."); }
                          };
                          reader.readAsText(file);
                        }}
                      />
                      <div className="flex min-h-12 items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-900/70 px-4 py-3 font-orbitron text-[10px] font-black uppercase tracking-widest text-slate-200 transition-colors hover:border-cyan-700 hover:text-white">
                        <i className="fa-solid fa-upload"></i> Restore backup
                      </div>
                    </label>
                  </div>
                </section>
              </div>
            )}

            {activeView === 'catalog' && (
              <section className="animate-fade-in mx-auto max-w-5xl space-y-4 overflow-hidden rounded-xl border border-cyann bg-[#061321] p-4 shadow-[0_16px_45px_rgba(0,0,0,0.22)] sm:p-5">
                <div className="flex flex-col gap-3 border-b border-cyann pb-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-cyann bg-cyan-400/10 text-cyan-300">
                      <i className="fa-solid fa-layer-group"></i>
                    </span>
                    <div>
                      <h2 className="font-orbitron text-xs font-black uppercase tracking-widest text-white">Catalog</h2>
                      <p className="mt-1 text-[10px] text-slate-400">Manage membership tiers and wallet recharge packages.</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setCatalogMode('membership')}
                      className={`rounded-md border px-3 py-2 font-orbitron text-[9px] font-black uppercase tracking-widest transition-colors ${catalogMode === 'membership' ? 'border-cyann bg-cyan text-[#031018]' : 'border-slate-800 bg-slate-900/70 text-slate-400 hover:border-cyann hover:text-white'}`}
                    >
                      Membership Tiers
                    </button>
                    <button
                      onClick={() => setCatalogMode('recharge')}
                      className={`rounded-md border px-3 py-2 font-orbitron text-[9px] font-black uppercase tracking-widest transition-colors ${catalogMode === 'recharge' ? 'border-cyann bg-cyan text-[#031018]' : 'border-slate-800 bg-slate-900/70 text-slate-400 hover:border-cyann hover:text-white'}`}
                    >
                      Recharge Packs
                    </button>
                  </div>
                </div>

                {catalogMode === 'membership' ? (
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <form onSubmit={handleSaveMembershipCatalog} className="space-y-2.5 rounded-lg border border-cyann bg-[#091a2b] p-3">
                      <div className="border-b border-cyann pb-2 font-orbitron text-[10px] font-black uppercase tracking-widest text-white">{editingCatalogId ? 'Edit Membership Tier' : 'Add Membership Tier'}</div>
                      <input value={membershipForm.slug} onChange={(e) => setMembershipForm({ ...membershipForm, slug: e.target.value })} placeholder="slug (e.g. gold)" className="w-full rounded-lg border border-white/10 bg-black/20 px-2.5 py-1.5 text-xs text-white" />
                      <input value={membershipForm.name} onChange={(e) => setMembershipForm({ ...membershipForm, name: e.target.value })} placeholder="Display name" className="w-full rounded-lg border border-white/10 bg-black/20 px-2.5 py-1.5 text-xs text-white" />
                      <input value={membershipForm.short_name} onChange={(e) => setMembershipForm({ ...membershipForm, short_name: e.target.value })} placeholder="Short name" className="w-full rounded-lg border border-white/10 bg-black/20 px-2.5 py-1.5 text-xs text-white" />
                      <input type="number" value={membershipForm.price} onChange={(e) => setMembershipForm({ ...membershipForm, price: e.target.value })} placeholder="Price" className="w-full rounded-lg border border-white/10 bg-black/20 px-2.5 py-1.5 text-xs text-white" />
                      <input value={membershipForm.color} onChange={(e) => setMembershipForm({ ...membershipForm, color: e.target.value })} placeholder="Color (gray/amber/yellow)" className="w-full rounded-lg border border-white/10 bg-black/20 px-2.5 py-1.5 text-xs text-white" />
                      <input value={membershipForm.icon} onChange={(e) => setMembershipForm({ ...membershipForm, icon: e.target.value })} placeholder="Icon" className="w-full rounded-lg border border-white/10 bg-black/20 px-2.5 py-1.5 text-xs text-white" />
                      <textarea value={membershipForm.benefits} onChange={(e) => setMembershipForm({ ...membershipForm, benefits: e.target.value })} placeholder="Benefits (one per line)" rows="3" className="w-full rounded-lg border border-white/10 bg-black/20 px-2.5 py-1.5 text-xs text-white" />
                      <textarea value={membershipForm.description} onChange={(e) => setMembershipForm({ ...membershipForm, description: e.target.value })} placeholder="Description" rows="2" className="w-full rounded-lg border border-white/10 bg-black/20 px-2.5 py-1.5 text-xs text-white" />
                      <input value={membershipForm.badge_label} onChange={(e) => setMembershipForm({ ...membershipForm, badge_label: e.target.value })} placeholder="Badge label" className="w-full rounded-lg border border-white/10 bg-black/20 px-2.5 py-1.5 text-xs text-white" />
                      <div className="flex gap-4 text-xs text-gray-300">
                        <label className="flex items-center gap-2"><input type="checkbox" checked={membershipForm.is_popular} onChange={(e) => setMembershipForm({ ...membershipForm, is_popular: e.target.checked })} /> Popular</label>
                        <label className="flex items-center gap-2"><input type="checkbox" checked={membershipForm.is_active} onChange={(e) => setMembershipForm({ ...membershipForm, is_active: e.target.checked })} /> Active</label>
                      </div>
                      <input type="number" value={membershipForm.sort_order} onChange={(e) => setMembershipForm({ ...membershipForm, sort_order: e.target.value })} placeholder="Sort order" className="w-full rounded-lg border border-white/10 bg-black/20 px-2.5 py-1.5 text-xs text-white" />
                      <div className="flex gap-2">
                        <button type="submit" className="rounded-md bg-primary px-3 py-1.5 text-[10px] font-bold text-dark">{editingCatalogId ? 'Save Tier' : 'Create Tier'}</button>
                        <button type="button" onClick={resetCatalogForms} className="rounded-md bg-white/10 px-3 py-1.5 text-[10px] text-white">Reset</button>
                      </div>
                    </form>
                    <div className="space-y-3">
                      <div className="font-orbitron text-[10px] font-black uppercase tracking-widest text-slate-300">Available tiers</div>
                      {catalogLoading ? <div className="text-gray-400">Loading catalog…</div> : membershipItems.map(item => (
                        <div key={item.id} className="rounded-lg border border-cyann bg-[#091a2b] p-3">
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <div className="text-xs font-bold text-white">{item.name}</div>
                              <div className="text-[10px] text-gray-400">Slug: {item.slug} • Price: ◈ {item.price} • Order: {item.sort_order}</div>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => startCatalogEdit(item, 'membership')} className="rounded-md border border-cyann bg-cyan-400/10 px-2.5 py-1.5 text-[10px] font-bold text-cyan-300 transition-colors hover:bg-cyan-400 hover:text-[#031018]">Edit</button>
                              <button onClick={() => handleDeleteCatalogItem('membership', item.id)} className="rounded-md border border-rose-900 bg-rose-950/40 px-2.5 py-1.5 text-[10px] font-bold text-rose-300 transition-colors hover:bg-rose-600 hover:text-white">Delete</button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <form onSubmit={handleSaveRechargeCatalog} className="space-y-2.5 rounded-lg border border-cyann bg-[#091a2b] p-3">
                      <div className="border-b border-cyann pb-2 font-orbitron text-[10px] font-black uppercase tracking-widest text-white">{editingCatalogId ? 'Edit Recharge Package' : 'Add Recharge Package'}</div>
                      <input type="number" value={rechargeForm.amount} onChange={(e) => setRechargeForm({ ...rechargeForm, amount: e.target.value })} placeholder="Package amount" className="w-full rounded-lg border border-white/10 bg-black/20 px-2.5 py-1.5 text-xs text-white" />
                      <input type="number" value={rechargeForm.bonus} onChange={(e) => setRechargeForm({ ...rechargeForm, bonus: e.target.value })} placeholder="Bonus amount" className="w-full rounded-lg border border-white/10 bg-black/20 px-2.5 py-1.5 text-xs text-white" />
                      <input type="number" value={rechargeForm.cost} onChange={(e) => setRechargeForm({ ...rechargeForm, cost: e.target.value })} placeholder="Cost" className="w-full rounded-lg border border-white/10 bg-black/20 px-2.5 py-1.5 text-xs text-white" />
                      <input value={rechargeForm.icon} onChange={(e) => setRechargeForm({ ...rechargeForm, icon: e.target.value })} placeholder="Icon class" className="w-full rounded-lg border border-white/10 bg-black/20 px-2.5 py-1.5 text-xs text-white" />
                      <div className="flex items-center gap-2 text-xs text-gray-300"><input type="checkbox" checked={rechargeForm.is_active} onChange={(e) => setRechargeForm({ ...rechargeForm, is_active: e.target.checked })} /> Active</div>
                      <input type="number" value={rechargeForm.sort_order} onChange={(e) => setRechargeForm({ ...rechargeForm, sort_order: e.target.value })} placeholder="Sort order" className="w-full rounded-lg border border-white/10 bg-black/20 px-2.5 py-1.5 text-xs text-white" />
                      <div className="flex gap-2">
                        <button type="submit" className="rounded-md bg-primary px-3 py-1.5 text-[10px] font-bold text-dark">{editingCatalogId ? 'Save Package' : 'Create Package'}</button>
                        <button type="button" onClick={resetCatalogForms} className="rounded-md bg-white/10 px-3 py-1.5 text-[10px] text-white">Reset</button>
                      </div>
                    </form>
                    <div className="space-y-3">
                      <div className="font-orbitron text-[10px] font-black uppercase tracking-widest text-slate-300">Available packages</div>
                      {catalogLoading ? <div className="text-gray-400">Loading catalog…</div> : rechargeItems.map(item => (
                        <div key={item.id} className="rounded-lg border border-cyann bg-[#091a2b] p-3">
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <div className="text-xs font-bold text-white">◈ {item.amount} + ◈ {item.bonus}</div>
                              <div className="text-[10px] text-gray-400">Cost: रु {item.cost} • Order: {item.sort_order}</div>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => startCatalogEdit(item, 'recharge')} className="rounded-md border border-cyann bg-cyan-400/10 px-2.5 py-1.5 text-[10px] font-bold text-cyan-300 transition-colors hover:bg-cyan-400 hover:text-[#031018]">Edit</button>
                              <button onClick={() => handleDeleteCatalogItem('recharge', item.id)} className="rounded-md border border-rose-900 bg-rose-950/40 px-2.5 py-1.5 text-[10px] font-bold text-rose-300 transition-colors hover:bg-rose-600 hover:text-white">Delete</button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}

            {activeView !== 'dashboard' && activeView !== 'logs' && activeView !== 'players' && activeView !== 'catalog' && (
              <section className={`animate-fade-in mx-auto overflow-hidden rounded-xl border border-cyann bg-[#061321] shadow-[0_16px_45px_rgba(0,0,0,0.22)] ${activeView === 'registrations' ? 'max-w-4xl' : ''}`}>
                {['tournaments', 'leaderboard', 'registrations'].includes(activeView) && (
                  <div className="flex flex-col gap-3 border-b border-cyann px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-cyann bg-cyan-400/10 text-lg text-cyan-300">
                        <i className={`fa-solid ${activeView === 'tournaments' ? 'fa-trophy' : activeView === 'leaderboard' ? 'fa-ranking-star' : 'fa-users'}`}></i>
                      </span>
                      <div className="min-w-0">
                        <h2 className="font-orbitron text-sm font-black uppercase tracking-widest text-white">
                          {activeView === 'tournaments' ? 'Tournaments' : activeView === 'leaderboard' ? 'Leaderboard' : 'Teams'}
                        </h2>
                        <p className="mt-1 text-xs text-slate-400">
                          {activeView === 'tournaments'
                            ? 'Manage and organize your esports tournaments.'
                            : activeView === 'leaderboard'
                              ? 'Manage team rankings and match performance.'
                              : 'Review team registrations and player details.'}
                        </p>
                      </div>
                    </div>
                    {['tournaments', 'leaderboard'].includes(activeView) && (
                      <button
                        onClick={resetForms}
                        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md border border-cyann bg-cyan px-4 py-2.5 font-orbitron text-[9px] font-black uppercase tracking-widest text-[#031018] transition-colors hover:bg-cyan-300"
                      >
                        <i className="fa-solid fa-plus"></i>
                        {activeView === 'tournaments' ? 'Add Tournament' : 'Add Ranking'}
                      </button>
                    )}
                  </div>
                )}
                <div className={`flex flex-col border-b border-cyann lg:flex-row lg:items-center ${activeView === 'registrations' ? 'gap-3 p-3 sm:p-4' : 'gap-4 p-4 sm:p-5'}`}>
                  <div className="relative w-full flex-grow">
                    <i className="fa-solid fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm"></i>
                    <input
                      type="text"
                      placeholder={`Search ${activeView}...`}
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className={`w-full rounded-lg border border-slate-700 bg-slate-950/50 pl-10 pr-3 font-medium text-white outline-none transition-colors placeholder:text-slate-500 focus:border-cyan-500 ${activeView === 'registrations' ? 'py-2 text-xs' : 'py-3 pr-4 text-sm'}`}
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {activeView === 'registrations' && (
                      <button
                        onClick={refreshRegistrations}
                        disabled={isRefreshingRegistrations}
                        className="rounded-md border border-cyann bg-cyan-400/10 px-2.5 py-1.5 text-[8px] font-orbitron font-bold uppercase tracking-widest text-cyan-300 transition-colors hover:bg-cyan-400 hover:text-[#031018] disabled:cursor-wait disabled:opacity-50"
                      >
                        <i className={`fa-solid ${isRefreshingRegistrations ? 'fa-spinner fa-spin' : 'fa-rotate-right'} mr-1`}></i>
                        {isRefreshingRegistrations ? 'Refreshing...' : 'Refresh'}
                      </button>
                    )}
                    {['tournaments', 'leaderboard'].includes(activeView) ? (
                      <>
                        <select
                          aria-label="Filter by game"
                          value={filterGame}
                          onChange={(e) => setFilterGame(e.target.value)}
                          className="rounded-md border border-slate-700 bg-[#091827] px-3 py-2.5 text-xs text-slate-200 outline-none focus:border-cyan-500"
                        >
                          <option value="all">All Games</option>
                          <option value="freefire">Free Fire</option>
                          <option value="pubg">PUBG Mobile</option>
                          <option value="ludo">Ludo King</option>
                        </select>
                        {activeView === 'tournaments' && (
                          <select
                            aria-label="Filter tournaments by status"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="rounded-md border border-slate-700 bg-[#091827] px-3 py-2.5 text-xs text-slate-200 outline-none focus:border-cyan-500"
                          >
                            <option value="all">All Statuses</option>
                            <option value="active">Active</option>
                            <option value="upcoming">Upcoming</option>
                            <option value="draft">Draft</option>
                          </select>
                        )}
                      </>
                    ) : ['all', 'freefire', 'pubg', 'ludo'].map(g => (
                      <button
                        key={g}
                        onClick={() => setFilterGame(g)}
                        className={`rounded-md border px-3 py-2 text-[9px] font-orbitron font-bold uppercase tracking-widest transition-colors ${filterGame === g ? 'border-cyann bg-cyan-400/10 text-cyan-300' : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-600 hover:text-white'}`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                {activeView === 'registrations' && (
                  <div className="grid grid-cols-2 gap-2 border-b border-cyann bg-[#071625] p-3 sm:grid-cols-3">
                    <div className="rounded-lg border border-cyann bg-[#091a2b] px-3 py-2">
                      <div className="mb-0.5 text-[8px] font-bold uppercase tracking-widest text-gray-500">Total Teams</div>
                      <div className="font-orbitron text-lg font-black text-primary">{registrations.length}</div>
                    </div>
                    <div className="rounded-lg border border-cyann bg-[#091a2b] px-3 py-2">
                      <div className="mb-0.5 text-[8px] font-bold uppercase tracking-widest text-gray-500">After Filters</div>
                      <div className="font-orbitron text-lg font-black text-tertiary">{filteredList.length}</div>
                    </div>
                    {(search || filterGame !== 'all') && (
                      <div className="rounded-lg border border-cyann bg-[#091a2b] px-3 py-2">
                        <div className="mb-0.5 text-[8px] font-bold uppercase tracking-widest text-gray-500">Hidden Records</div>
                        <div className="font-orbitron text-lg font-black text-gray-400">{registrations.length - filteredList.length}</div>
                      </div>
                    )}
                  </div>
                )}

                <div className={`overflow-x-auto ${activeView === 'registrations' ? '[&_td]:!px-3 [&_td]:!py-2.5' : ''}`}>
                  <table className={`${['tournaments', 'leaderboard'].includes(activeView) ? 'min-w-[540px]' : 'min-w-full'} w-full text-left ${activeView === 'registrations' ? 'text-xs' : 'text-sm'}`}>
                    <thead>
                      {activeView === 'tournaments' ? (
                        <tr className="border-b border-cyann bg-[#0a1a2a] text-[9px] font-orbitron uppercase tracking-widest text-slate-400">
                          <th className="w-10 px-3 py-3 text-center">#</th>
                          <th className="px-3 py-3">Tournament</th>
                          <th className="px-3 py-3">Game</th>
                          <th className="px-3 py-3">Registration</th>
                          <th className="px-3 py-3">Date / Status</th>
                          <th className="px-3 py-3 text-right">Actions</th>
                        </tr>
                      ) : activeView === 'leaderboard' ? (
                        <tr className="border-b border-cyann bg-[#0a1a2a] text-[9px] font-orbitron uppercase tracking-widest text-slate-400">
                          <th className="w-10 px-3 py-3 text-center">#</th>
                          <th className="px-3 py-3">Team</th>
                          <th className="px-3 py-3">Game</th>
                          <th className="px-3 py-3 text-right">Rank</th>
                          <th className="px-3 py-3 text-right">Performance</th>
                          <th className="px-3 py-3 text-right">Actions</th>
                        </tr>
                      ) : (
                        <tr className="border-b border-cyann bg-[#0a1a2a] font-orbitron uppercase tracking-widest text-slate-400">
                          <th className="px-3 py-2 text-[8px] sm:px-4">Team</th>
                          <th className="px-3 py-2 text-[8px] sm:px-4">Details</th>
                          <th className="px-3 py-2 text-right text-[8px] sm:px-4">Actions</th>
                        </tr>
                      )}
                    </thead>
                    <tbody className="divide-y divide-cyan-950/70">
                      {pageItems.length === 0 && (
                        <tr>
                          <td colSpan={['tournaments', 'leaderboard'].includes(activeView) ? 6 : 3} className="px-4 py-12 text-center text-xs text-slate-400">
                            {search || filterGame !== 'all' || filterStatus !== 'all' ? 'No records match these filters.' : `No ${activeView} found yet.`}
                          </td>
                        </tr>
                      )}
                      {pageItems.map((item, pageIndex) => {
                        const index = listPage * listPageSize + pageIndex;
                        const gameLabel = item.game || item.type || 'Game not set';
                        if (activeView === 'tournaments') {
                          const status = String(item.status || 'draft').toLowerCase();
                          const statusStyle = status === 'active'
                            ? 'border-emerald-700/60 bg-emerald-950/50 text-emerald-300'
                            : status === 'upcoming'
                              ? 'border-cyan-700/60 bg-cyan-950/50 text-cyan-300'
                              : 'border-slate-700 bg-slate-900 text-slate-300';
                          const registered = registrations.filter((registration) => registration.tournamentid === item.id).length;
                          const maxSlots = Number(item.max_slots || item.maxSlots || 0);

                          return (
                            <tr key={item.id} className="transition-colors hover:bg-cyan-400/[0.035]">
                              <td className="px-3 py-3 text-center text-xs font-semibold text-slate-500">{index + 1}</td>
                              <td className="px-3 py-3">
                                <div className="flex min-w-[150px] items-center gap-2.5">
                                  {item.image ? (
                                    <img src={item.image} alt="" className="h-10 w-10 shrink-0 rounded-md border border-cyann object-cover" />
                                  ) : (
                                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-cyann bg-cyan-400/10 text-cyan-300">
                                      <i className="fa-solid fa-trophy"></i>
                                    </span>
                                  )}
                                  <div className="min-w-0">
                                    <div className="line-clamp-2 text-xs font-bold leading-snug text-slate-100">{item.title || 'Untitled tournament'}</div>
                                    <div className="mt-1 truncate text-[9px] text-slate-500">{item.location || 'Location not set'}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="whitespace-nowrap px-3 py-3 text-[10px] font-bold text-slate-300">{gameLabel}</td>
                              <td className="whitespace-nowrap px-3 py-3 text-xs text-slate-300">
                                <span className="text-slate-100">{registered}</span>
                                <span className="text-slate-500"> / {maxSlots || '—'}</span>
                              </td>
                              <td className="px-3 py-3">
                                <div className="whitespace-nowrap text-[10px] text-slate-300">{item.date || 'Date not set'}</div>
                                <span className={`mt-1 inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[9px] font-bold capitalize ${statusStyle}`}>
                                  <span className={`h-1.5 w-1.5 rounded-full ${status === 'active' ? 'bg-emerald-400' : status === 'upcoming' ? 'bg-cyan-400' : 'bg-slate-400'}`}></span>
                                  {status}
                                </span>
                              </td>
                              <td className="whitespace-nowrap px-3 py-3">
                                <div className="flex justify-end gap-1.5">
                                  <button
                                    onClick={() => { setActiveView('registrations'); setSearch(item.title || ''); }}
                                    title="View registrations"
                                    aria-label={`View registrations for ${item.title || 'tournament'}`}
                                    className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-700 bg-slate-900 text-slate-300 transition-colors hover:border-cyan-700 hover:text-cyan-300"
                                  >
                                    <i className="fa-solid fa-users text-xs"></i>
                                  </button>
                                  <button
                                    onClick={() => startEdit(item)}
                                    title="Edit tournament"
                                    aria-label={`Edit ${item.title || 'tournament'}`}
                                    className="flex h-8 w-8 items-center justify-center rounded-md border border-cyann bg-cyan-400/10 text-cyan-300 transition-colors hover:bg-cyan-400 hover:text-[#031018]"
                                  >
                                    <i className="fa-solid fa-pen-to-square text-xs"></i>
                                  </button>
                                  <button
                                    onClick={() => handleDelete(item.id)}
                                    title="Delete tournament"
                                    aria-label={`Delete ${item.title || 'tournament'}`}
                                    className="flex h-8 w-8 items-center justify-center rounded-md border border-rose-900 bg-rose-950/40 text-rose-300 transition-colors hover:bg-rose-600 hover:text-white"
                                  >
                                    <i className="fa-solid fa-trash-can text-xs"></i>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        }

                        if (activeView === 'leaderboard') {
                          return (
                            <tr key={item.id} className="transition-colors hover:bg-cyan-400/[0.035]">
                              <td className="px-3 py-3 text-center font-orbitron text-xs font-black text-cyan-300">{item.rank || index + 1}</td>
                              <td className="px-3 py-3">
                                <div className="flex min-w-[140px] items-center gap-2.5">
                                  {item.avatar ? (
                                    <img src={item.avatar} alt="" className="h-9 w-9 shrink-0 rounded-full border border-cyann object-cover" />
                                  ) : (
                                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-cyann bg-cyan-400/10 text-cyan-300">
                                      <i className="fa-solid fa-users text-xs"></i>
                                    </span>
                                  )}
                                  <div className="min-w-0">
                                    <div className="truncate text-xs font-bold text-slate-100">{item.teamname || item.playername || 'Unnamed team'}</div>
                                    <div className="mt-1 text-[9px] text-slate-500">Leaderboard entry</div>
                                  </div>
                                </div>
                              </td>
                              <td className="whitespace-nowrap px-3 py-3 text-[10px] font-bold text-slate-300">{gameLabel}</td>
                              <td className="px-3 py-3 text-right font-orbitron text-xs font-black text-slate-100">{item.rank || '—'}</td>
                              <td className="whitespace-nowrap px-3 py-3 text-right text-[10px] text-slate-300">
                                <span className="text-cyan-300">{Number(item.points || 0).toLocaleString()} pts</span>
                                <span className="mx-1 text-slate-600">·</span>
                                {Number(item.kills || 0)} K
                                <span className="mx-1 text-slate-600">·</span>
                                {Number(item.wins || 0)} W
                              </td>
                              <td className="whitespace-nowrap px-3 py-3">
                                <div className="flex justify-end gap-1.5">
                                  <button
                                    onClick={() => startEdit(item)}
                                    title="Edit ranking"
                                    aria-label={`Edit ranking for ${item.teamname || item.playername || 'team'}`}
                                    className="flex h-8 w-8 items-center justify-center rounded-md border border-cyann bg-cyan-400/10 text-cyan-300 transition-colors hover:bg-cyan-400 hover:text-[#031018]"
                                  >
                                    <i className="fa-solid fa-pen-to-square text-xs"></i>
                                  </button>
                                  <button
                                    onClick={() => handleDelete(item.id)}
                                    title="Delete ranking"
                                    aria-label={`Delete ranking for ${item.teamname || item.playername || 'team'}`}
                                    className="flex h-8 w-8 items-center justify-center rounded-md border border-rose-900 bg-rose-950/40 text-rose-300 transition-colors hover:bg-rose-600 hover:text-white"
                                  >
                                    <i className="fa-solid fa-trash-can text-xs"></i>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        }

                        return (
                        <tr key={item.id} className={`transition-colors hover:bg-cyan-400/[0.035] ${activeView === 'registrations' ? 'text-[10px]' : ''}`}>
                          <td className={activeView === 'streams' || activeView === 'registrations' ? 'px-3 py-2.5 sm:px-4' : 'px-4 py-3 sm:px-5 sm:py-4'}>
                            <div className={`flex items-center ${activeView === 'registrations' ? 'gap-2' : 'gap-2 md:gap-4'}`}>
                              {item.image || item.avatar || item.team_logo ? (
                                <img src={item.image || item.avatar || item.team_logo} className={`${activeView === 'registrations' ? 'h-8 w-8' : 'h-10 w-10'} shrink-0 rounded-lg border border-cyann object-cover`} alt="" />
                              ) : (
                                <div className={`${activeView === 'registrations' ? 'h-8 w-8' : 'h-10 w-10'} flex shrink-0 items-center justify-center rounded-lg border border-cyann bg-cyan-400/10`}>
                                  <i className={`fa-solid fa-id-badge text-cyan-300 ${activeView === 'registrations' ? 'text-xs' : ''}`}></i>
                                </div>
                              )}
                              <div className="min-w-0">
                                <div className={`line-clamp-1 font-bold text-white ${activeView === 'streams' || activeView === 'registrations' ? 'text-xs' : 'text-sm md:text-base'}`}>{item.title || item.team_name || item.teamname || item.playername}</div>
                                <div className={`truncate font-bold uppercase tracking-widest text-gray-500 ${activeView === 'streams' || activeView === 'registrations' ? 'text-[8px]' : 'text-[8px] md:text-[10px]'}`}>
                                  {item.game || item.type || (activeView === 'registrations' ? `Sector: ${item.tournamenttitle}` : 'System Data')}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className={activeView === 'streams' || activeView === 'registrations' ? 'px-3 py-2.5 text-[10px] sm:px-4' : 'px-4 py-3 text-xs sm:px-5 sm:py-4'}>
                            <div className="space-y-1">
                              {item.prize && <div className="text-primary font-bold">Reward: {item.prize}</div>}
                              {item.maxSlots && <div className="text-gray-400">Slots: {item.max_slots}</div>}
                              {activeView === 'leaderboard' && <div className="text-accent font-bold">Rank: {item.rank || '-'} | Points: {item.points || 0} | K: {item.kills || 0} | W: {item.wins || 0}</div>}
                              {item.date && <div className="text-gray-400">Deploy: {item.date}</div>}
                              {(item.gameuid || item.team_tag) && (
                                <div className="space-y-0.5">
                                  <div className="text-white font-bold">{item.team_tag ? `Tag: ${item.team_tag}` : `UID: ${item.gameuid}`}</div>
                                  <div className="text-gray-500 text-[7px] md:text-[9px] truncate max-w-[150px]">{item.registrar_email || item.playeremail}</div>
                                </div>
                              )}
                              {item.manager_contact && (
                                <div className="text-gray-300">
                                  Contact: <span className="text-white font-bold">{item.manager_contact}</span>
                                </div>
                              )}
                              {item.youtubeid && <div className={`flex items-center gap-1 font-bold text-accent ${activeView === 'streams' ? 'text-[10px]' : ''}`}><i className="fab fa-youtube"></i> {item.youtubeid}</div>}
                              {activeView === 'registrations' && (
                                <div className={`font-bold flex items-center gap-1 ${isSmsSent(item) ? 'text-[#25D366]' : 'text-yellow-400'}`}>
                                  <i className={`fa-solid ${isSmsSent(item) ? 'fa-circle-check' : 'fa-signal'}`}></i>
                                  SMS: {isSmsSent(item) ? 'SENT' : 'PENDING'}
                                </div>
                              )}
                              {activeView === 'registrations' && (
                                <div className="text-gray-300">
                                  Age: <span className="text-white font-bold">{item.Player_Age || item.playerage || 'N/A'}</span>
                                </div>
                              )}
                              {activeView === 'registrations' && (
                                <div className="text-gray-300">
                                  Promo: <span className="text-primary font-bold">{item.Promo_Code || item.promo_code || 'N/A'}</span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className={activeView === 'streams' || activeView === 'registrations' ? 'px-3 py-2.5 text-right sm:px-4' : 'px-4 py-3 text-right sm:px-5 sm:py-4'}>
                            <div className="flex justify-end gap-1 md:gap-2">
                              {activeView === 'tournaments' && (
                                <button
                                  onClick={() => { setActiveView('registrations'); setSearch(item.title); }}
                                  title="View Enlistments"
                                  className="w-8 h-8 md:w-10 md:h-10 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center text-tertiary hover:bg-tertiary hover:text-dark transition-all flex-shrink-0"
                                >
                                  <i className="fa-solid fa-users-viewfinder text-xs md:text-sm"></i>
                                </button>
                              )}
                              {activeView === 'registrations' && (
                                <button
                                  onClick={() => setViewingReg(item)}
                                  title="View Dossier"
                                  className={`${activeView === 'registrations' ? 'h-8 w-8' : 'w-8 h-8 md:w-10 md:h-10'} flex flex-shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-primary transition-all hover:bg-primary hover:text-dark`}
                                >
                                  <i className="fa-solid fa-address-card text-xs md:text-sm"></i>
                                </button>
                              )}
                              {activeView !== 'registrations' && (
                                <button onClick={() => startEdit(item)} className="w-8 h-8 md:w-10 md:h-10 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center text-primary hover:bg-primary hover:text-dark transition-all flex-shrink-0">
                                  <i className="fa-solid fa-pen-to-square text-xs md:text-sm"></i>
                                </button>
                              )}
                              <button onClick={() => handleDelete(item.id)} className={`${activeView === 'registrations' ? 'h-8 w-8' : 'w-8 h-8 md:w-10 md:h-10'} flex flex-shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-pink transition-all hover:bg-pink hover:text-white`}>
                                <i className="fa-solid fa-trash-can text-xs md:text-sm"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
              </div>
              {['tournaments', 'leaderboard'].includes(activeView) && (
                <div className="flex items-center justify-between border-t border-cyann bg-[#071625] px-3 py-2.5 sm:px-4">
                  <button
                    onClick={() => setListPage((current) => Math.max(0, current - 1))}
                    disabled={listPage === 0}
                    className="rounded-md border border-slate-800 bg-slate-900/70 px-3 py-1.5 text-[10px] font-semibold text-slate-300 transition-colors hover:border-cyan-800 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <i className="fa-solid fa-chevron-left mr-1.5"></i>Previous
                  </button>
                  <span className="text-[10px] font-semibold text-slate-400">
                    Page {listPage + 1} of {Math.max(1, Math.ceil(rankedList.length / listPageSize))}
                  </span>
                  <button
                    onClick={() => setListPage((current) => Math.min(Math.ceil(rankedList.length / listPageSize) - 1, current + 1))}
                    disabled={listPage >= Math.ceil(rankedList.length / listPageSize) - 1}
                    className="rounded-md border border-slate-800 bg-slate-900/70 px-3 py-1.5 text-[10px] font-semibold text-slate-300 transition-colors hover:border-cyan-800 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next<i className="fa-solid fa-chevron-right ml-1.5"></i>
                  </button>
                </div>
              )}
              </section>
            )}

            {activeView === 'players' && (
              <PlayerStatsAdmin registrations={registrations} />
            )}

            {activeView === 'notifications' && (
              <NotificationsAdmin />
            )}

            {activeView === 'requests' && (
              renderRequests()
            )}

            {activeView === 'logs' && (
              <section className="animate-fade-in overflow-hidden rounded-xl border border-cyann bg-[#061321]">
                <div className="border-b border-cyann px-4 py-4 sm:px-5">
                  <h3 className="font-orbitron text-sm font-black uppercase tracking-widest text-white">System logs</h3>
                  <p className="mt-1 text-xs text-slate-400">Recent activity recorded by the admin system.</p>
                </div>
                <div className="max-h-[640px] space-y-2 overflow-y-auto p-3 font-mono text-[10px] custom-scrollbar sm:p-4">
                  {systemLogs.length === 0 && (
                    <div className="rounded-lg border border-cyann bg-[#091a2b] p-8 text-center text-xs uppercase tracking-widest text-slate-500">
                      No logs available yet
                    </div>
                  )}
                  {systemLogs.map(log => {
                    const logTimestamp = log.timestamp || log.created_at || 'N/A';
                    const logMethod = log.method || log.http_method || 'INFO';
                    const logEndpoint = log.endpoint || log.path || log.route || 'Unknown endpoint';

                    return (
                      <div key={log.id} className="flex flex-col gap-2 rounded-lg border border-cyann bg-[#091a2b] p-3 transition-colors hover:border-cyan-700 md:flex-row md:items-center md:justify-between md:gap-4">
                        <div className="flex flex-col gap-1 md:gap-0 md:flex-row md:items-center md:gap-4 min-w-0">
                          <span className="shrink-0 text-slate-500">[{logTimestamp}]</span>
                          <span className={`shrink-0 font-black uppercase tracking-wider ${logMethod === 'POST' ? 'text-emerald-300' : logMethod === 'PUT' ? 'text-cyan-300' : 'text-slate-300'}`}>{logMethod}</span>
                          <span className="truncate text-slate-200">{logEndpoint}</span>
                        </div>
                        <span className="text-tertiary font-bold flex-shrink-0">200_OK</span>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </div>

          <div className={hasEditorPanel ? 'md:col-span-5 xl:col-span-4' : 'hidden'}>
            {['tournaments', 'leaderboard', 'streams'].includes(activeView) && (
              <div className="animate-fade-in max-h-[calc(100vh-88px)] overflow-y-auto rounded-xl border border-cyann bg-[#061321] p-4 shadow-[0_16px_45px_rgba(0,0,0,0.22)] custom-scrollbar sm:p-5 md:sticky md:top-[76px]">
                <div className="mb-5 flex items-center justify-between gap-3 border-b border-cyann pb-4">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-cyann bg-cyan-400/10 text-cyan-300">
                      <i className={`fa-solid ${activeView === 'tournaments' ? 'fa-trophy' : activeView === 'leaderboard' ? 'fa-ranking-star' : 'fa-tower-broadcast'}`}></i>
                    </span>
                    <div className="min-w-0">
                      <h2 className="font-orbitron text-xs font-black uppercase tracking-widest text-white">
                        {editingId ? 'Edit' : 'Create'} {activeView === 'tournaments' ? 'Tournament' : activeView === 'leaderboard' ? 'Ranking' : 'Stream'}
                      </h2>
                      <p className="mt-1 text-[10px] text-slate-400">
                        {editingId ? 'Update the selected record.' : 'Enter details to create a new record.'}
                      </p>
                    </div>
                  </div>
                  {editingId && (
                    <button onClick={resetForms} className="shrink-0 rounded-md border border-slate-700 px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-widest text-slate-400 transition-colors hover:border-rose-800 hover:text-rose-300">Cancel</button>
                  )}
                </div>

                {activeView === 'tournaments' && (
                  <form
                    onSubmit={handleSaveTournament}
                    className="space-y-3 [&_input]:!px-2 [&_input]:!py-1.5 [&_input]:!text-[11px] [&_select]:!px-2 [&_select]:!py-1.5 [&_select]:!text-[11px] [&_textarea]:!px-2 [&_textarea]:!py-1.5 [&_textarea]:!text-[11px]"
                  >
                    <div className="grid grid-cols-2 gap-3 md:gap-4">
                      <div className="space-y-1">
                        <label className="text-[8px] md:text-[9px] font-bold text-gray-500 uppercase tracking-widest">Sector Game</label>
                        <select
                          className="w-full bg-black border border-white/10 p-2 md:p-3 rounded-xl text-white outline-none focus:border-primary transition-all text-[9px] md:text-[10px] font-bold uppercase"
                          value={tourneyForm.type}
                          onChange={e => {
                            const newType = e.target.value;
                            const defaultSize = newType === 'pubg' ? 5 : (newType === 'freefire' ? 4 : 1);
                            setTourneyForm({ ...tourneyForm, type: newType, team_size: defaultSize });
                          }}
                        >
                          <option value="freefire">Free Fire</option>
                          <option value="pubg">PUBG Mobile</option>
                          <option value="ludo">Ludo King</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] md:text-[9px] font-bold text-gray-500 uppercase tracking-widest">Max Slots</label>
                        <input
                          type="number"
                          className="w-full bg-white/5 border border-white/10 p-2 md:p-3 rounded-xl text-white outline-none focus:border-primary transition-all text-xs"
                          value={tourneyForm.max_slots}
                          onChange={e => setTourneyForm({ ...tourneyForm, max_slots: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] md:text-[9px] font-bold text-gray-500 uppercase tracking-widest">Team Size</label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          className="w-full bg-white/5 border border-white/10 p-2 md:p-3 rounded-xl text-white outline-none focus:border-primary transition-all text-xs"
                          value={tourneyForm.team_size || 4}
                          onChange={e => setTourneyForm({ ...tourneyForm, team_size: parseInt(e.target.value) || 1 })}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[8px] md:text-[9px] font-bold text-gray-500 uppercase tracking-widest">Operational Title</label>
                      <input
                        type="text"
                        required
                        className="w-full bg-white/5 border border-white/10 p-2 md:p-3 rounded-xl text-white outline-none focus:border-primary transition-all text-xs font-bold"
                        placeholder="Mission Name..."
                        value={tourneyForm.title}
                        onChange={e => setTourneyForm({ ...tourneyForm, title: e.target.value })}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[8px] md:text-[9px] font-bold text-gray-500 uppercase tracking-widest">Tournament Banner URL</label>
                      <input
                        type="text"
                        className="w-full bg-white/5 border border-white/10 p-2 md:p-3 rounded-xl text-white outline-none focus:border-primary transition-all text-[9px] md:text-[10px] mb-2 font-mono"
                        placeholder="https://image-link.com/banner.jpg"
                        value={tourneyForm.image}
                        onChange={e => setTourneyForm({ ...tourneyForm, image: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3 md:gap-4">
                      <div className="space-y-1">
                        <label className="text-[8px] md:text-[9px] font-bold text-gray-500 uppercase tracking-widest">Mission Date</label>
                        <input
                          type="date"
                          className="w-full bg-white/5 border border-white/10 p-2 md:p-3 rounded-xl text-white outline-none focus:border-primary transition-all text-xs"
                          placeholder="Dec 15, 2025"
                          value={tourneyForm.date}
                          onChange={e => setTourneyForm({ ...tourneyForm, date: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] md:text-[9px] font-bold text-gray-500 uppercase tracking-widest">Time (PST/NST)</label>
                        <input
                          type="text"
                          className="w-full bg-white/5 border border-white/10 p-2 md:p-3 rounded-xl text-white outline-none focus:border-primary transition-all text-xs"
                          placeholder="07:00 PM"
                          value={tourneyForm.time}
                          onChange={e => setTourneyForm({ ...tourneyForm, time: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 md:gap-4">
                      <div className="space-y-1">
                        <label className="text-[8px] md:text-[9px] font-bold text-gray-500 uppercase tracking-widest">Reg Start Date</label>
                        <input
                          type="date"
                          className="w-full bg-white/5 border border-white/10 p-2 md:p-3 rounded-xl text-white outline-none focus:border-primary transition-all text-xs"
                          value={tourneyForm.registration_start_date || ''}
                          onChange={e => setTourneyForm({ ...tourneyForm, registration_start_date: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] md:text-[9px] font-bold text-gray-500 uppercase tracking-widest">Reg End Date</label>
                        <input
                          type="date"
                          className="w-full bg-white/5 border border-white/10 p-2 md:p-3 rounded-xl text-white outline-none focus:border-primary transition-all text-xs"
                          value={tourneyForm.registration_end_date || ''}
                          onChange={e => setTourneyForm({ ...tourneyForm, registration_end_date: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[8px] md:text-[9px] font-bold text-gray-500 uppercase tracking-widest">Sector Location</label>
                      <input
                        type="text"
                        className="w-full bg-white/5 border border-white/10 p-2 md:p-3 rounded-xl text-white outline-none focus:border-primary transition-all text-xs"
                        placeholder="Nepal / Bermuda"
                        value={tourneyForm.location}
                        onChange={e => setTourneyForm({ ...tourneyForm, location: e.target.value })}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[8px] md:text-[9px] font-bold text-gray-500 uppercase tracking-widest">Sector Intel (Description)</label>
                      <textarea
                        rows={2}
                        className="w-full bg-white/5 border border-white/10 p-2 md:p-3 rounded-xl text-white outline-none focus:border-primary transition-all text-xs font-rajdhani"
                        placeholder="Mission Briefing..."
                        value={tourneyForm.description}
                        onChange={e => setTourneyForm({ ...tourneyForm, description: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3 md:gap-4">
                      <div className="space-y-1">
                        <label className="text-[8px] md:text-[9px] font-bold text-gray-500 uppercase tracking-widest">Total Prize</label>
                        <input
                          type="text"
                          className="w-full bg-white/5 border border-white/10 p-2 md:p-3 rounded-xl text-white outline-none focus:border-primary transition-all text-xs"
                          value={tourneyForm.prize}
                          onChange={e => setTourneyForm({ ...tourneyForm, prize: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] md:text-[9px] font-bold text-gray-500 uppercase tracking-widest">Entry Fee</label>
                        <input
                          type="text"
                          className="w-full bg-white/5 border border-white/10 p-2 md:p-3 rounded-xl text-white outline-none focus:border-primary transition-all text-xs"
                          value={tourneyForm.entry_fee}
                          onChange={e => setTourneyForm({ ...tourneyForm, entry_fee: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-3">
                      <h4 className="flex items-center gap-2 font-orbitron text-xs font-bold uppercase tracking-widest text-white">
                        <i className="fa-solid fa-lock-open text-primary"></i> Registration Configuration
                      </h4>

                      <div className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/5 p-2.5">
                        <div>
                          <div className="text-white font-bold text-xs md:text-sm uppercase tracking-widest">Login Required</div>
                          <div className="text-[8px] md:text-[9px] text-gray-500 uppercase font-bold tracking-widest mt-0.5">Users must authenticate before registration</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setTourneyForm({ ...tourneyForm, login_required: !tourneyForm.login_required })}
                          className={`relative h-7 w-12 flex-shrink-0 rounded-full transition-all ${tourneyForm.login_required ? 'bg-primary shadow-[0_0_10px_rgba(0,212,255,0.5)]' : 'bg-gray-800'}`}
                        >
                          <div className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${tourneyForm.login_required ? 'left-6' : 'left-1'}`}></div>
                        </button>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[8px] md:text-[9px] font-bold text-gray-500 uppercase tracking-widest block">Payment Method</label>
                        <div className="grid grid-cols-2 gap-2 md:gap-3">
                          <button
                            type="button"
                            onClick={() => setTourneyForm({ ...tourneyForm, payment_type: 'tgc_coin', login_required: true })}
                            className={`rounded-lg border p-2.5 text-center transition-all ${
                              tourneyForm.payment_type === 'tgc_coin'
                                ? 'bg-primary/20 border-primary text-primary'
                                : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                            }`}
                          >
                            <i className="fa-solid fa-coins mb-1.5 block text-base"></i>
                            <div className="text-[9px] font-bold uppercase tracking-widest">TGC Coin</div>
                            <div className="mt-1 text-[8px] text-gray-500">Requires Login</div>
                          </button>

                          <button
                            type="button"
                            onClick={() => setTourneyForm({ ...tourneyForm, payment_type: 'direct_payment' })}
                            className={`rounded-lg border p-2.5 text-center transition-all ${
                              tourneyForm.payment_type === 'direct_payment'
                                ? 'bg-pink/20 border-pink text-pink'
                                : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                            }`}
                          >
                            <i className="fa-solid fa-credit-card mb-1.5 block text-base"></i>
                            <div className="text-[9px] font-bold uppercase tracking-widest">Direct Payment</div>
                            <div className="mt-1 text-[8px] text-gray-500">Guest OK</div>
                          </button>
                        </div>
                      </div>

                      <div className="p-2 md:p-3 bg-white/2 rounded-lg border border-white/5">
                        <p className="text-[7px] md:text-[8px] text-gray-400 leading-relaxed">
                          <i className="fa-solid fa-circle-info text-primary mr-1"></i>
                          <strong>Rules:</strong> If <strong>TGC Coin</strong> is selected, login is enforced. If <strong>Direct Payment</strong> is selected, login can be disabled for guest registration.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-[8px] md:text-[9px] font-bold text-gray-500 uppercase tracking-widest">Required Registration Fields</label>
                        <span className="text-[7px] md:text-[8px] text-gray-500 uppercase tracking-widest">Fixed list only</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {REGISTRATION_FIELD_DEFS.map(({ key, label }) => {
                          const enabled = Boolean(tourneyForm.registration_fields?.[key] ?? DEFAULT_REGISTRATION_FIELDS[key]);
                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => updateRegistrationFieldRequirement(key, !enabled)}
                              className={`flex min-h-[44px] w-full items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-left transition-all ${
                                enabled
                                  ? 'bg-primary/10 border-primary/40 text-white'
                                  : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                              }`}
                            >
                              <span className="flex-1 break-words text-[9px] font-bold uppercase leading-tight tracking-wider">{label}</span>
                              <span className={`inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-all ${enabled ? 'bg-primary border-primary' : 'bg-gray-800 border-gray-700'}`}>
                                <span className={`h-4 w-4 rounded-full bg-white transition-all ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[8px] md:text-[9px] font-bold text-gray-500 uppercase tracking-widest">External Registration URL</label>
                      <input
                        type="text"
                        className="w-full bg-white/5 border border-white/10 p-2 md:p-3 rounded-xl text-white outline-none focus:border-primary transition-all text-xs font-mono"
                        placeholder="https://docs.google.com/..."
                        value={tourneyForm.registration_url}
                        onChange={e => setTourneyForm({ ...tourneyForm, registration_url: e.target.value })}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[8px] md:text-[9px] font-bold text-gray-500 uppercase tracking-widest">Primary Stream ID</label>
                      <input
                        type="text"
                        className="w-full bg-white/5 border border-white/10 p-2 md:p-3 rounded-xl text-white outline-none focus:border-primary transition-all text-xs font-mono"
                        placeholder="YouTube Video ID"
                        value={tourneyForm.stream_id}
                        onChange={e => setTourneyForm({ ...tourneyForm, stream_id: e.target.value })}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[8px] md:text-[9px] font-bold text-gray-500 uppercase tracking-widest">Prize Breakdown</label>
                      {(tourneyForm.prize_breakdown || []).map((row, idx) => (
                        <div key={idx} className="flex gap-2 mb-2 group/row">
                          <input
                            placeholder="Position"
                            className="flex-1 bg-white/5 border border-white/10 p-2 rounded text-[9px] md:text-[10px] text-white outline-none focus:border-primary"
                            value={row.position}
                            onChange={(e) => updatePrizeBreakdown(idx, 'position', e.target.value)}
                          />
                          <input
                            placeholder="Reward"
                            className="flex-1 bg-white/5 border border-white/10 p-2 rounded text-[9px] md:text-[10px] text-white outline-none focus:border-primary"
                            value={row.reward}
                            onChange={(e) => updatePrizeBreakdown(idx, 'reward', e.target.value)}
                          />
                          <button
                            type="button"
                            onClick={() => removePrizeRow(idx)}
                            className="text-pink hover:text-white transition-colors px-2"
                          >
                            <i className="fa-solid fa-xmark"></i>
                          </button>
                        </div>
                      ))}
                      <button type="button" onClick={addPrizeRow} className="text-[8px] md:text-[9px] text-primary uppercase font-bold hover:underline tracking-widest">+ Add Reward Tier</button>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[8px] md:text-[9px] font-bold text-gray-500 uppercase tracking-widest">Deployment Rules (One per line)</label>
                      <textarea
                        rows={3}
                        className="w-full bg-white/5 border border-white/10 p-2 md:p-3 rounded-xl text-white outline-none focus:border-primary transition-all text-xs custom-scrollbar"
                        value={tourneyForm.rules?.join('\n')}
                        onChange={e => setTourneyForm({ ...tourneyForm, rules: e.target.value.split('\n') })}
                      />
                    </div>

                    <button type="submit" className="w-full rounded bg-primary py-2 text-[10px] font-black uppercase tracking-[0.12em] text-dark cyber-button shadow-[0_0_20px_rgba(0,212,255,0.2)]">
                      {editingId ? 'COMMIT UPDATES' : 'DEPLOY SECTOR'}
                    </button>
                  </form>
                )}

                {activeView === 'leaderboard' && (
                  <form
                    onSubmit={handleSaveLeaderboard}
                    className="space-y-3 [&_input]:!px-2 [&_input]:!py-1.5 [&_input]:!text-[11px] [&_select]:!px-2 [&_select]:!py-1.5 [&_select]:!text-[11px]"
                  >
                    <div className="grid grid-cols-2 gap-3 md:gap-4">
                      <div className="space-y-1">
                        <label className="text-[8px] md:text-[9px] font-bold text-gray-500 uppercase tracking-widest">Target Game</label>
                        <select
                          className="w-full bg-black border border-white/10 p-2 md:p-3 rounded-xl text-white outline-none focus:border-primary transition-all text-[9px] md:text-[10px] font-bold uppercase"
                          value={lbForm.game}
                          onChange={e => setLbForm({ ...lbForm, game: e.target.value })}
                        >
                          <option value="freefire">Free Fire</option>
                          <option value="pubg">PUBG Mobile</option>
                          <option value="ludo">Ludo King</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] md:text-[9px] font-bold text-gray-500 uppercase tracking-widest">Squad Identity</label>
                        <input
                          type="text"
                          required
                          className="w-full bg-white/5 border border-white/10 p-2 md:p-3 rounded-xl text-white outline-none focus:border-primary transition-all text-xs font-bold"
                          placeholder="Team Name..."
                          value={lbForm.teamname}
                          onChange={e => setLbForm({ ...lbForm, teamname: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[8px] md:text-[9px] font-bold text-gray-500 uppercase tracking-widest">Player Image / Avatar URL</label>
                      <input
                        type="text"
                        className="w-full bg-white/5 border border-white/10 p-2 md:p-3 rounded-xl text-white outline-none focus:border-primary transition-all text-[9px] md:text-[10px] mb-2 font-mono"
                        placeholder="https://i.pravatar.cc/150?u=team"
                        value={lbForm.avatar}
                        onChange={e => setLbForm({ ...lbForm, avatar: e.target.value })}
                      />
                      {lbForm.avatar && (
                        <div className="flex justify-center">
                          <img src={lbForm.avatar} className="w-14 h-14 md:w-16 md:h-16 rounded-lg border border-white/10 object-cover" alt="Avatar Preview" />
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3 md:gap-4">
                      <div className="space-y-1">
                        <label className="text-[8px] md:text-[9px] font-bold text-gray-500 uppercase tracking-widest">Rank</label>
                        <input
                          type="number"
                          className="w-full bg-white/5 border border-white/10 p-2 md:p-3 rounded-xl text-white outline-none focus:border-primary transition-all text-xs"
                          value={lbForm.rank === 0 ? '' : lbForm.rank}
                          onChange={e => setLbForm({ ...lbForm, rank: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] md:text-[9px] font-bold text-gray-500 uppercase tracking-widest">Neutralized</label>
                        <input
                          type="number"
                          className="w-full bg-white/5 border border-white/10 p-2 md:p-3 rounded-xl text-white outline-none focus:border-primary transition-all text-xs"
                          value={lbForm.kills}
                          onChange={e => setLbForm({ ...lbForm, kills: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 md:gap-4">
                      <div className="space-y-1">
                        <label className="text-[8px] md:text-[9px] font-bold text-gray-500 uppercase tracking-widest">Wins</label>
                        <input
                          type="number"
                          className="w-full bg-white/5 border border-white/10 p-2 md:p-3 rounded-xl text-white outline-none focus:border-primary transition-all text-xs"
                          value={lbForm.wins}
                          onChange={e => setLbForm({ ...lbForm, wins: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] md:text-[9px] font-bold text-gray-500 uppercase tracking-widest">Total XP</label>
                        <input
                          type="number"
                          className="w-full bg-white/5 border border-white/10 p-2 md:p-3 rounded-xl text-white outline-none focus:border-primary transition-all text-xs"
                          value={lbForm.points}
                          onChange={e => setLbForm({ ...lbForm, points: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                    </div>

                    <button type="submit" className="w-full rounded bg-primary py-2 text-[10px] font-black uppercase tracking-[0.14em] text-dark cyber-button">
                      {editingId ? 'UPDATE RANKING' : 'INITIALIZE RANKING'}
                    </button>
                  </form>
                )}

                {activeView === 'streams' && (
                  <form
                    onSubmit={handleSaveStream}
                    className="space-y-3 [&_input]:!px-2 [&_input]:!py-1.5 [&_input]:!text-[11px]"
                  >
                    <div className="space-y-1">
                      <label className="text-[8px] md:text-[9px] font-bold text-gray-500 uppercase tracking-widest">Feed Title</label>
                      <input
                        type="text"
                        required
                        className="w-full bg-white/5 border border-white/10 p-2 md:p-3 rounded-xl text-white outline-none focus:border-primary transition-all text-xs"
                        placeholder="LIVE: Nexus Finals..."
                        value={streamForm.title}
                        onChange={e => setStreamForm({ ...streamForm, title: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] md:text-[9px] font-bold text-gray-500 uppercase tracking-widest">YouTube ID or Full Link</label>
                      <input
                        type="text"
                        required
                        className="w-full bg-white/5 border border-white/10 p-2 md:p-3 rounded-xl text-white outline-none focus:border-primary transition-all text-xs font-mono"
                        placeholder="e.g. bCcaErhe8as or full URL"
                        value={streamForm.youtubeid}
                        onChange={e => setStreamForm({ ...streamForm, youtubeid: e.target.value })}
                      />
                    </div>
                    <div className="flex items-center gap-3 rounded-lg border border-white/5 p-2.5 glass">
                      <div className="flex-grow">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-white">Deployment Status</div>
                        <div className="text-[8px] font-black uppercase tracking-widest text-gray-500">{streamForm.islive ? 'Online Broadcast' : 'Archived Feed'}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setStreamForm({ ...streamForm, islive: !streamForm.islive })}
                        className={`w-10 h-6 rounded-full transition-all relative flex-shrink-0 ${streamForm.islive ? 'bg-cyan' : 'bg-gray-800'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${streamForm.islive ? 'left-5' : 'left-1'}`}></div>
                      </button>
                    </div>

                    <button type="submit" className="w-full rounded bg-primary py-2 text-[10px] font-black uppercase tracking-[0.14em] text-dark cyber-button">
                      {editingId ? 'UPDATE BROADCAST' : 'ESTABLISH FEED'}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Registration Edit Panel */}
      {viewingReg && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center overflow-y-auto p-3 sm:p-5">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setViewingReg(null)}></div>
          <div className="relative flex max-h-[calc(100dvh-1.5rem)] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-white/10 bg-bg-card shadow-2xl animate-fade-in sm:max-h-[calc(100dvh-2.5rem)]">

            {/* Header */}
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-5">
              <h3 className="min-w-0 font-orbitron text-sm font-black uppercase tracking-widest text-white sm:text-base">
                Edit Registration: <span className="text-primary">{viewingReg.team_name || viewingReg.playername || 'Unknown'}</span>
              </h3>
              <button type="button" aria-label="Close registration editor" onClick={() => setViewingReg(null)} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-white/5 hover:text-white">
                <i className="fa-solid fa-times"></i>
              </button>
            </div>

            <div className="grid min-h-0 flex-1 grid-cols-1 gap-5 overflow-y-auto p-4 custom-scrollbar md:grid-cols-2 md:gap-6 sm:p-5">

              {/* Left Column: Editable Fields */}
              <div className="space-y-3">
                <h4 className="mb-3 border-b border-white/10 pb-2 font-orbitron text-xs font-bold text-primary">
                  <i className="fa-solid fa-pen-to-square mr-2"></i>Registration Details
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-[10px] font-bold text-gray-400">Team / Squad Name</label>
                    <input type="text" value={editRegForm.team_name || ''} onChange={(e) => setEditRegForm({...editRegForm, team_name: e.target.value})} className="w-full rounded border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-bold text-gray-400">Squad Tag</label>
                    <input type="text" value={editRegForm.team_tag || ''} onChange={(e) => setEditRegForm({...editRegForm, team_tag: e.target.value})} className="w-full rounded border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-primary" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-[10px] font-bold text-gray-400">Manager Name</label>
                    <input type="text" value={editRegForm.manager_name || ''} onChange={(e) => setEditRegForm({...editRegForm, manager_name: e.target.value})} className="w-full rounded border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-bold text-gray-400">Manager Contact</label>
                    <input type="text" value={editRegForm.manager_contact || ''} onChange={(e) => setEditRegForm({...editRegForm, manager_contact: e.target.value})} className="w-full rounded border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-primary" />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-[10px] font-bold text-gray-400">Registrar Email</label>
                  <input type="email" value={editRegForm.registrar_email || ''} onChange={(e) => setEditRegForm({...editRegForm, registrar_email: e.target.value})} className="w-full rounded border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-primary" />
                </div>

                <h4 className="mb-3 mt-5 border-b border-white/10 pb-2 font-orbitron text-xs font-bold text-primary">
                  <i className="fa-solid fa-sliders mr-2"></i>Status Controls
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-[10px] font-bold text-gray-400">Registration Status</label>
                    <select value={editRegForm.registration_status || 'pending'} onChange={(e) => setEditRegForm({...editRegForm, registration_status: e.target.value})} className="w-full rounded border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-primary">
                      <option className='bg-black' value="pending">Pending</option>
                      <option className='bg-black' value="approved">Approved</option>
                      <option className='bg-black' value="rejected">Rejected</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-bold text-gray-400">Payment Status</label>
                    <select value={editRegForm.payment_status || 'pending'} onChange={(e) => setEditRegForm({...editRegForm, payment_status: e.target.value})} className="w-full rounded border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-primary">
                      <option className='bg-black' value="pending">Pending</option>
                      <option className='bg-black' value="completed">Completed</option>
                      <option className='bg-black' value="failed">Failed</option>
                      <option className='bg-black' value="refunded">Refunded</option>
                      <option className='bg-black' value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-[10px] font-bold text-gray-400">Admin Notes</label>
                  <textarea value={editRegForm.notes || ''} onChange={(e) => setEditRegForm({...editRegForm, notes: e.target.value})} rows={3} placeholder="Internal notes about this registration..." className="w-full resize-none rounded border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-primary" />
                </div>

                {errorBox && (
                  <div className="mt-4">
                    <ErrorBox message={errorBox} onClose={() => setErrorBox(null)} type="error" />
                  </div>
                )}

                {/* Read-only Info */}
                <div className="mt-3 space-y-1.5 rounded-lg border border-white/5 bg-white/2 p-3">
                  <div className="flex justify-between gap-3 text-xs"><span className="font-bold text-gray-500">Arena</span><span className="text-right font-bold text-white">{viewingReg.tournamenttitle || 'N/A'}</span></div>
                  <div className="flex justify-between gap-3 text-xs"><span className="font-bold text-gray-500">Enrolled</span><span className="text-right text-gray-300">{new Date(viewingReg.registrationdate || viewingReg.created_at).toLocaleString()}</span></div>
                  <div className="flex justify-between gap-3 text-xs"><span className="font-bold text-gray-500">SMS</span><span className={`font-bold ${isSmsSent(viewingReg) ? 'text-[#25D366]' : 'text-yellow-400'}`}>{isSmsSent(viewingReg) ? 'SENT' : 'PENDING'}</span></div>
                </div>
              </div>

              {/* Right Column: Roster & Actions */}
              <div className="space-y-3">
                <h4 className="mb-3 border-b border-white/10 pb-2 font-orbitron text-xs font-bold text-primary">
                  <i className="fa-solid fa-users mr-2"></i>Player Roster
                </h4>

                {viewingReg.team_logo && (
                  <div className="mb-3 flex items-center gap-3 rounded-lg border border-white/5 bg-white/2 p-2.5">
                    <img src={viewingReg.team_logo} alt="Logo" className="h-10 w-10 rounded-lg border border-primary/30 object-cover" />
                    <div>
                      <div className="text-xs font-bold text-white">{viewingReg.team_name}</div>
                      <div className="font-mono text-[10px] text-gray-500">{viewingReg.team_tag}</div>
                    </div>
                  </div>
                )}

                {loadingPlayers ? (
                  <div className="text-center text-gray-500 py-8"><i className="fa-solid fa-spinner fa-spin mr-2"></i>Loading roster...</div>
                ) : teamPlayers.length > 0 ? (
                  <div className="max-h-[260px] space-y-1.5 overflow-y-auto pr-2 custom-scrollbar">
                    {teamPlayers.map((player, idx) => (
                      <div key={player.id} className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/5 p-2.5 transition-colors hover:bg-white/10">
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white">{idx + 1}. {player.player_name}</div>
                          <div className="mt-0.5 font-mono text-[10px] text-gray-500">UID: {player.player_uid}</div>
                        </div>
                        {player.player_citizenship_photo && (
                          <a href={player.player_citizenship_photo} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-primary/20 text-primary border border-primary/30 rounded text-[9px] font-orbitron font-bold uppercase hover:bg-primary hover:text-dark transition-all flex-shrink-0">
                            <i className="fa-solid fa-id-card mr-1"></i> Verify ID
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-600 py-8 bg-white/2 rounded-xl border border-white/5">
                    <i className="fa-solid fa-user-slash text-2xl mb-2 block"></i>
                    No player roster data
                  </div>
                )}

                {/* WhatsApp */}
                <h4 className="mb-3 mt-5 border-b border-white/10 pb-2 font-orbitron text-xs font-bold text-primary">
                  <i className="fa-solid fa-paper-plane mr-2"></i>Communication
                </h4>
                <button
                  onClick={() => sendRegistrationWhatsApp(viewingReg)}
                  className={`flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-[10px] font-black uppercase tracking-widest text-white transition-all ${whatsAppSentMap[getRegistrationMessageKey(viewingReg)] ? 'bg-[#1daa50]' : 'bg-[#25D366] hover:brightness-110'}`}
                >
                  <i className={`${whatsAppSentMap[getRegistrationMessageKey(viewingReg)] ? 'fa-solid fa-circle-check' : 'fa-brands fa-whatsapp'}`}></i>
                  {whatsAppSentMap[getRegistrationMessageKey(viewingReg)] ? 'WHATSAPP SENT' : 'SEND WHATSAPP'}
                </button>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex shrink-0 justify-end gap-2 border-t border-white/10 p-3 sm:px-5">
              <button onClick={() => setViewingReg(null)} className="rounded-lg bg-white/5 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white transition-all hover:bg-white/10">
                Cancel
              </button>
              <button onClick={saveRegistrationChanges} disabled={savingReg} className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-dark transition-all hover:bg-primary/80 disabled:opacity-50">
                {savingReg ? <><i className="fa-solid fa-spinner fa-spin"></i> Saving...</> : <><i className="fa-solid fa-floppy-disk"></i> Save Changes</>}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};


export default AdminPanel;
