import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { getTournamentRegistrationFields } from '../constants/registrationFields';

const MAX_IMAGE_SIZE = 2 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

const TeamRegistrationForm = ({ tournament, onSubmit, onCancel, isSubmitting }) => {
  const { user, profile } = useAuth();
  const formContainerRef = useRef(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [formErrors, setFormErrors] = useState({});
  const previewUrls = useRef(new Set());
  const requiredFields = getTournamentRegistrationFields(tournament);
  const isFieldRequired = (fieldKey) => requiredFields[fieldKey] ?? true;

  const [formData, setFormData] = useState({
    // Basic Details
    registrantEmail: '',
    // Team Information
    teamName: '',
    teamTag: '',
    teamLogo: null,
    teamLogoPreview: '',
    // Team Manager Details
    managerFullName: '',
    managerContactNumber: '',
    // Player Details (determined by team_size)
    players: Array.from({ length: Math.max(1, Number(tournament?.team_size) || (
      String(tournament?.type || tournament?.game || '').toLowerCase().includes('pubg')
        ? 5
        : String(tournament?.type || tournament?.game || '').toLowerCase().includes('freefire')
          || String(tournament?.type || tournament?.game || '').toLowerCase().includes('free fire')
          ? 4
          : 1
    )) }, (_, i) => ({ id: i + 1, fullName: '', uid: '', citizenshipPhoto: null, citizenshipPhotoPreview: '' }))
  });

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      registrantEmail: prev.registrantEmail || user?.email || '',
      managerFullName: prev.managerFullName || profile?.full_name || '',
      managerContactNumber: prev.managerContactNumber || profile?.contact_info || ''
    }));
  }, [user?.email, profile?.full_name, profile?.contact_info]);

  useEffect(() => () => {
    previewUrls.current.forEach((url) => URL.revokeObjectURL(url));
    previewUrls.current.clear();
  }, []);

  const validateStep = (step) => {
    const errors = {};

    if (step === 1) {
      if (isFieldRequired('registrant_email') || formData.registrantEmail.trim()) {
        if (!formData.registrantEmail.trim()) errors.registrantEmail = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.registrantEmail)) {
          errors.registrantEmail = 'Invalid email format';
        }
      }
    }

    if (step === 2) {
      if (isFieldRequired('team_name') && !formData.teamName.trim()) errors.teamName = 'Team name is required';
      if (isFieldRequired('team_tag') && !formData.teamTag.trim()) errors.teamTag = 'Team tag is required';
      if (isFieldRequired('team_logo') && !formData.teamLogo) errors.teamLogo = 'Team logo is required';
    }

    if (step === 3) {
      if (isFieldRequired('manager_name') && !formData.managerFullName.trim()) errors.managerFullName = 'Manager full name is required';
      if (isFieldRequired('manager_contact') || formData.managerContactNumber.trim()) {
        if (!formData.managerContactNumber.trim()) errors.managerContactNumber = 'Contact number is required';
        else if (!/^[+]?[\d\s-()]{7,}$/.test(formData.managerContactNumber.replace(/\s/g, ''))) {
          errors.managerContactNumber = 'Invalid phone number format';
        }
      }
    }

    if (step === 4) {
      formData.players.forEach((player, idx) => {
        if (isFieldRequired('player_name') && !player.fullName?.trim()) {
          errors[`player_${idx}_name`] = `Player ${idx + 1} name is required`;
        }
        if (isFieldRequired('player_uid') && !player.uid?.toString().trim()) {
          errors[`player_${idx}_uid`] = `Player ${idx + 1} UID is required`;
        }
        if (isFieldRequired('citizenship_photo') && !player.citizenshipPhoto) {
          errors[`player_${idx}_photo`] = `Player ${idx + 1} citizenship photo is required`;
        }
      });
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
      formContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(currentStep - 1);
    formContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleInputChange = (field, value) => {
    if (field === 'teamLogo' && !value && formData.teamLogoPreview) {
      URL.revokeObjectURL(formData.teamLogoPreview);
      previewUrls.current.delete(formData.teamLogoPreview);
    }
    setFormData(prev => ({
      ...prev,
      [field]: value,
      ...(field === 'teamLogo' && !value ? { teamLogoPreview: '' } : {})
    }));
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleFileChange = (field, file) => {
    if (!file) return;
    if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
      setFormErrors(prev => ({ ...prev, [field]: 'Choose a JPG, PNG, or WebP image.' }));
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setFormErrors(prev => ({ ...prev, [field]: 'Image must be 2 MB or smaller.' }));
      return;
    }

    const previewField = `${field}Preview`;
    const previousPreview = formData[previewField];
    if (previousPreview) {
      URL.revokeObjectURL(previousPreview);
      previewUrls.current.delete(previousPreview);
    }
    const preview = URL.createObjectURL(file);
    previewUrls.current.add(preview);
    setFormData(prev => ({ ...prev, [field]: file, [previewField]: preview }));
    setFormErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handlePlayerChange = (playerIndex, field, value) => {
    const existingPreview = formData.players[playerIndex].citizenshipPhotoPreview;
    if (field === 'citizenshipPhoto' && !value && existingPreview) {
      URL.revokeObjectURL(existingPreview);
      previewUrls.current.delete(existingPreview);
    }
    const updatedPlayers = [...formData.players];
    updatedPlayers[playerIndex] = {
      ...updatedPlayers[playerIndex],
      [field]: value,
      ...(field === 'citizenshipPhoto' && !value ? { citizenshipPhotoPreview: '' } : {})
    };
    setFormData(prev => ({
      ...prev,
      players: updatedPlayers
    }));
    const errorField = field === 'fullName' ? 'name' : field === 'uid' ? 'uid' : 'photo';
    const errorKey = `player_${playerIndex}_${errorField}`;
    if (formErrors[errorKey]) {
      setFormErrors(prev => ({
        ...prev,
        [errorKey]: ''
      }));
    }
  };

  const handlePlayerFileChange = (playerIndex, file) => {
    if (!file) return;
    const errorKey = `player_${playerIndex}_photo`;
    if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
      setFormErrors(prev => ({ ...prev, [errorKey]: 'Choose a JPG, PNG, or WebP image.' }));
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setFormErrors(prev => ({ ...prev, [errorKey]: 'Image must be 2 MB or smaller.' }));
      return;
    }

    const previousPreview = formData.players[playerIndex].citizenshipPhotoPreview;
    if (previousPreview) {
      URL.revokeObjectURL(previousPreview);
      previewUrls.current.delete(previousPreview);
    }
    const preview = URL.createObjectURL(file);
    previewUrls.current.add(preview);
    const updatedPlayers = [...formData.players];
    updatedPlayers[playerIndex] = {
      ...updatedPlayers[playerIndex],
      citizenshipPhoto: file,
      citizenshipPhotoPreview: preview
    };
    setFormData(prev => ({ ...prev, players: updatedPlayers }));
    setFormErrors(prev => ({ ...prev, [errorKey]: '' }));
  };

  // addPlayer and removePlayer functions have been removed as team size is now strictly enforced

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateStep(4)) {
      onSubmit(formData);
    }
  };

  const progressSteps = [
    { number: 1, label: 'Basic Info', icon: 'fa-envelope' },
    { number: 2, label: 'Team Details', icon: 'fa-users' },
    { number: 3, label: 'Manager Info', icon: 'fa-user' },
    { number: 4, label: 'Players', icon: 'fa-gamepad' }
  ];

  return (
    <div ref={formContainerRef} className="w-full max-h-[90vh] overflow-y-auto custom-scrollbar">
      {/* Progress Indicator */}
      <div className="sticky top-0 z-10 border-b border-white/10 bg-[#071321] p-4 sm:p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.2em] text-cyan-300">Tournament Entry</p>
            <h3 className="font-orbitron text-base font-black uppercase text-white sm:text-lg">
              Team Registration
            </h3>
          </div>
          <span className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-[10px] font-bold text-cyan-200">
            STEP {currentStep} OF 4
          </span>
        </div>
        <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuemin="1" aria-valuemax="4" aria-valuenow={currentStep} aria-label={`Registration step ${currentStep} of 4`}>
          <div className="h-full rounded-full bg-cyan-300 transition-[width] duration-300" style={{ width: `${(currentStep / 4) * 100}%` }} />
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {progressSteps.map((step) => (
            <div key={step.number} className={`truncate text-center text-[8px] font-bold uppercase tracking-wide sm:text-[9px] ${step.number === currentStep ? 'text-cyan-200' : step.number < currentStep ? 'text-white/70' : 'text-slate-500'}`}>
              {step.label}
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 p-4 sm:p-6 md:p-7">
        {/* Step 1: Basic Details */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="mb-2 flex items-center gap-2 font-orbitron text-xl font-black text-white sm:text-2xl">
                <i className="fa-solid fa-envelope text-cyan-300"></i> Basic Information
              </h2>
              <p className="text-sm text-slate-400">Who should we contact about this registration?</p>
            </div>

            <div>
              <label htmlFor="registrant-email" className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-200">
                Email Address {isFieldRequired('registrant_email') ? <span className="text-rose-400">*</span> : <span className="font-medium normal-case tracking-normal text-slate-500">(optional)</span>}
              </label>
              <input
                id="registrant-email"
                type="email"
                autoComplete="email"
                value={formData.registrantEmail}
                onChange={(e) => handleInputChange('registrantEmail', e.target.value)}
                placeholder="you@example.com"
                aria-invalid={Boolean(formErrors.registrantEmail)}
                className={`w-full rounded-lg border bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:ring-2 focus:ring-cyan-300/20 ${
                  formErrors.registrantEmail ? 'border-rose-400' : 'border-white/10 focus:border-cyan-300'
                }`}
                disabled={!!user?.email}
              />
              {formErrors.registrantEmail && <p role="alert" className="mt-1 text-xs font-bold text-rose-300">{formErrors.registrantEmail}</p>}
              {user?.email && <p className="mt-1.5 text-xs text-slate-500">Using your signed-in account email.</p>}
            </div>
          </div>
        )}

        {/* Step 2: Team Details */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="mb-2 flex items-center gap-2 font-orbitron text-xl font-black text-white sm:text-2xl">
                <i className="fa-solid fa-users text-cyan-300"></i> Team Information
              </h2>
              <p className="text-sm text-slate-400">Add your team identity and logo.</p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="team-name" className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-200">Team Name {isFieldRequired('team_name') ? <span className="text-rose-400">*</span> : <span className="font-medium normal-case tracking-normal text-slate-500">(optional)</span>}</label>
                  <input id="team-name" type="text" value={formData.teamName} onChange={(e) => handleInputChange('teamName', e.target.value)} placeholder="e.g. Phoenix Warriors" aria-invalid={Boolean(formErrors.teamName)} className={`w-full rounded-lg border bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:ring-2 focus:ring-cyan-300/20 ${formErrors.teamName ? 'border-rose-400' : 'border-white/10 focus:border-cyan-300'}`} />
                  {formErrors.teamName && <p role="alert" className="mt-1 text-xs font-bold text-rose-300">{formErrors.teamName}</p>}
                </div>
                <div>
                  <label htmlFor="team-tag" className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-200">Team Tag {isFieldRequired('team_tag') ? <span className="text-rose-400">*</span> : <span className="font-medium normal-case tracking-normal text-slate-500">(optional)</span>}</label>
                  <input id="team-tag" type="text" value={formData.teamTag} onChange={(e) => handleInputChange('teamTag', e.target.value.toUpperCase())} placeholder="e.g. PW" maxLength="10" aria-invalid={Boolean(formErrors.teamTag)} className={`w-full rounded-lg border bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:ring-2 focus:ring-cyan-300/20 ${formErrors.teamTag ? 'border-rose-400' : 'border-white/10 focus:border-cyan-300'}`} />
                  {formErrors.teamTag && <p role="alert" className="mt-1 text-xs font-bold text-rose-300">{formErrors.teamTag}</p>}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-200">Team Logo {isFieldRequired('team_logo') ? <span className="text-rose-400">*</span> : <span className="font-medium normal-case tracking-normal text-slate-500">(optional)</span>}</label>
                <div className="relative">
                  {formData.teamLogoPreview ? (
                    <div className="relative w-full h-48 bg-white/5 rounded-lg border border-white/10 overflow-hidden flex items-center justify-center">
                      <img src={formData.teamLogoPreview} alt="Team Logo Preview" className="max-h-full max-w-full object-contain" />
                      <button
                        type="button"
                        onClick={() => handleInputChange('teamLogo', null)}
                        className="absolute top-2 right-2 bg-pink/20 hover:bg-pink/40 text-pink px-3 py-1 rounded text-xs font-bold"
                      >
                        REMOVE
                      </button>
                    </div>
                  ) : (
                    <label className={`w-full h-48 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer transition-all ${
                      formErrors.teamLogo ? 'border-pink' : 'border-white/20 hover:border-primary'
                    } bg-white/5 hover:bg-white/10`}>
                      <div className="text-center">
                        <i className="fa-solid fa-cloud-arrow-up text-3xl text-primary/50 mb-2"></i>
                        <p className="text-white font-bold text-sm">Click to upload Team Logo</p>
                        <p className="text-slate-500 text-xs">JPG, PNG, or WebP · up to 2 MB</p>
                      </div>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(e) => {
                          handleFileChange('teamLogo', e.target.files[0]);
                          e.target.value = '';
                        }}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
                {formErrors.teamLogo && <p role="alert" className="mt-1 text-xs font-bold text-rose-300">{formErrors.teamLogo}</p>}
              </div>
          </div>
        )}

        {/* Step 3: Team Manager Details */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="mb-2 flex items-center gap-2 font-orbitron text-xl font-black text-white sm:text-2xl">
                <i className="fa-solid fa-user text-cyan-300"></i> Team Manager Details
              </h2>
              <p className="text-sm text-slate-400">Who can we contact about your team?</p>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="manager-name" className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-200">Full Name {isFieldRequired('manager_name') ? <span className="text-rose-400">*</span> : <span className="font-medium normal-case tracking-normal text-slate-500">(optional)</span>}</label>
                <input id="manager-name" type="text" autoComplete="name" value={formData.managerFullName} onChange={(e) => handleInputChange('managerFullName', e.target.value)} placeholder="Your full name" aria-invalid={Boolean(formErrors.managerFullName)} className={`w-full rounded-lg border bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:ring-2 focus:ring-cyan-300/20 ${formErrors.managerFullName ? 'border-rose-400' : 'border-white/10 focus:border-cyan-300'}`} />
                {formErrors.managerFullName && <p role="alert" className="mt-1 text-xs font-bold text-rose-300">{formErrors.managerFullName}</p>}
              </div>
              <div>
                <label htmlFor="manager-contact" className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-200">Contact Number {isFieldRequired('manager_contact') ? <span className="text-rose-400">*</span> : <span className="font-medium normal-case tracking-normal text-slate-500">(optional)</span>}</label>
                <input id="manager-contact" type="tel" autoComplete="tel" value={formData.managerContactNumber} onChange={(e) => handleInputChange('managerContactNumber', e.target.value)} placeholder="+977 9800000000" aria-invalid={Boolean(formErrors.managerContactNumber)} className={`w-full rounded-lg border bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:ring-2 focus:ring-cyan-300/20 ${formErrors.managerContactNumber ? 'border-rose-400' : 'border-white/10 focus:border-cyan-300'}`} />
                {formErrors.managerContactNumber && <p role="alert" className="mt-1 text-xs font-bold text-rose-300">{formErrors.managerContactNumber}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Player Details */}
        {currentStep === 4 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="mb-2 flex items-center gap-2 font-orbitron text-xl font-black text-white sm:text-2xl">
                <i className="fa-solid fa-gamepad text-cyan-300"></i> Team Roster
              </h2>
              <p className="text-sm text-slate-400">Enter details for your {formData.players.length}-player roster. Fields marked optional can be skipped.</p>
            </div>

            {formData.players.map((player, index) => (
              <div
                key={player.id}
                className="space-y-4 rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:p-5"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-orbitron font-bold text-white">Player {index + 1}</h3>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label htmlFor={`player-${index}-name`} className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-200">Full Name {isFieldRequired('player_name') ? <span className="text-rose-400">*</span> : <span className="font-medium normal-case tracking-normal text-slate-500">(optional)</span>}</label>
                    <input id={`player-${index}-name`} type="text" value={player.fullName} onChange={(e) => handlePlayerChange(index, 'fullName', e.target.value)} placeholder="Player's full name" aria-invalid={Boolean(formErrors[`player_${index}_name`])} className={`w-full rounded-lg border bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:ring-2 focus:ring-cyan-300/20 ${formErrors[`player_${index}_name`] ? 'border-rose-400' : 'border-white/10 focus:border-cyan-300'}`} />
                    {formErrors[`player_${index}_name`] && <p role="alert" className="mt-1 text-xs font-bold text-rose-300">{formErrors[`player_${index}_name`]}</p>}
                  </div>
                  <div>
                    <label htmlFor={`player-${index}-uid`} className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-200">Game UID {isFieldRequired('player_uid') ? <span className="text-rose-400">*</span> : <span className="font-medium normal-case tracking-normal text-slate-500">(optional)</span>}</label>
                    <input id={`player-${index}-uid`} type="text" inputMode="numeric" value={player.uid} onChange={(e) => handlePlayerChange(index, 'uid', e.target.value)} placeholder="In-game player ID" aria-invalid={Boolean(formErrors[`player_${index}_uid`])} className={`w-full rounded-lg border bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:ring-2 focus:ring-cyan-300/20 ${formErrors[`player_${index}_uid`] ? 'border-rose-400' : 'border-white/10 focus:border-cyan-300'}`} />
                    {formErrors[`player_${index}_uid`] && <p role="alert" className="mt-1 text-xs font-bold text-rose-300">{formErrors[`player_${index}_uid`]}</p>}
                  </div>
                </div>

                <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-200">Citizenship Photo {isFieldRequired('citizenship_photo') ? <span className="text-rose-400">*</span> : <span className="font-medium normal-case tracking-normal text-slate-500">(optional)</span>}</label>
                    {player.citizenshipPhotoPreview ? (
                      <div className="relative w-full h-40 bg-white/5 rounded-lg border border-white/10 overflow-hidden flex items-center justify-center">
                        <img src={player.citizenshipPhotoPreview} alt="Citizenship Photo" className="max-h-full max-w-full object-contain" />
                        <button
                          type="button"
                          onClick={() => handlePlayerChange(index, 'citizenshipPhoto', null)}
                          className="absolute top-2 right-2 bg-pink/20 hover:bg-pink/40 text-pink px-3 py-1 rounded text-xs font-bold"
                        >
                          REMOVE
                        </button>
                      </div>
                    ) : (
                      <label className={`w-full h-40 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer transition-all ${
                        formErrors[`player_${index}_photo`] ? 'border-pink' : 'border-white/20 hover:border-primary'
                      } bg-white/5 hover:bg-white/10`}>
                        <div className="text-center">
                          <i className="fa-solid fa-id-card text-2xl text-primary/50 mb-2"></i>
                          <p className="text-white font-bold text-sm">Upload Citizenship Photo</p>
                          <p className="text-slate-500 text-xs">JPG, PNG, or WebP · up to 2 MB</p>
                        </div>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={(e) => {
                            handlePlayerFileChange(index, e.target.files[0]);
                            e.target.value = '';
                          }}
                          className="hidden"
                        />
                      </label>
                    )}
                    {formErrors[`player_${index}_photo`] && (
                      <p role="alert" className="mt-1 text-xs font-bold text-rose-300">{formErrors[`player_${index}_photo`]}</p>
                    )}
                </div>
              </div>
            ))}

            {/* Add/Remove player buttons removed to enforce strict team size */}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="sticky bottom-0 -mx-4 -mb-4 flex gap-2 border-t border-white/10 bg-[#071321] px-4 py-3 sm:-mx-6 sm:-mb-6 sm:px-6 sm:py-4">
          {currentStep > 1 && (
            <button
              type="button"
              onClick={handlePrevStep}
              className="min-h-11 flex-1 rounded-lg border border-white/15 px-3 py-3 text-xs font-bold uppercase tracking-wide text-white transition-colors hover:bg-white/5"
            >
              <i className="fa-solid fa-chevron-left mr-2"></i> PREVIOUS
            </button>
          )}

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="min-h-11 flex-1 rounded-lg bg-cyan-300 px-3 py-3 text-xs font-black uppercase tracking-wide text-[#031321] transition-colors hover:bg-cyan-200"
            >
              NEXT <i className="fa-solid fa-chevron-right ml-2"></i>
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className="min-h-11 flex-1 rounded-lg bg-cyan-300 px-3 py-3 text-xs font-black uppercase tracking-wide text-[#031321] transition-colors hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin mr-2"></i> REGISTERING...
                </>
              ) : (
                <>
                  COMPLETE REGISTRATION <i className="fa-solid fa-check ml-2"></i>
                </>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={onCancel}
            aria-label="Cancel registration"
            className="min-h-11 min-w-11 rounded-lg border border-white/15 px-3 py-3 text-white transition-colors hover:bg-white/5"
          >
            <i className="fa-solid fa-times"></i>
          </button>
        </div>
      </form>
    </div>
  );
};

export default TeamRegistrationForm;