import React, { useState, useEffect } from 'react';
import LoadingScreen from '../components/LoadingScreen';

// ── Lightweight inline SVG icons ──────────────────────
const IcoUser = () => (
  <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);
const IcoLock = () => (
  <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);
const IcoBell = () => (
  <svg className="w-5 h-5 text-pink-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);
const IcoSave = () => (
  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);
const IcoComputer = () => (
  <svg className="w-5 h-5 text-teal-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);
const IcoList = () => (
  <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
  </svg>
);

const PRESET_AVATARS = [
  { name: 'Girl Coder', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80' },
  { name: 'Guy Coder', url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80' },
  { name: 'Woman Tech', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80' },
  { name: 'Guy focused', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80' },
  { name: 'Student Bright', url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80' },
  { name: 'Guy Tech Friendly', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80' },
];

export default function StudentSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Student profile states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [course, setCourse] = useState('BSCS');
  const [yearLevel, setYearLevel] = useState('3');
  const [profileUrl, setProfileUrl] = useState('');
  
  // Real-time dynamic hours remaining balance tracker
  const [availableSessions, setAvailableSessions] = useState(30);
  const [semesterLimit, setSemesterLimit] = useState(30);

  // Workstation Environmental Preferences
  const [prefIde, setPrefIde] = useState('VS Code');
  const [prefOs, setPrefOs] = useState('Windows 11');
  const [prefKeyboard, setPrefKeyboard] = useState('QWERTY');

  // Password fields
  const [currPass, setCurrPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confPass, setConfPass] = useState('');

  // Notification Preferences
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [pushAlerts, setPushAlerts] = useState(true);
  
  // Custom lab policies configured by admin
  const [labPolicies, setLabPolicies] = useState('');

  useEffect(() => {
    // Load student data from local storage
    try {
      const saved = localStorage.getItem('sitin_user');
      if (saved) {
        const u = JSON.parse(saved);
        setFirstName(u.first_name || '');
        setLastName(u.last_name || '');
        setCourse(u.course || 'BSCS');
        setYearLevel(String(u.year_level || '3'));
        setProfileUrl(u.profile_picture || '');
        setAvailableSessions(Number(u.available_sessions !== undefined ? u.available_sessions : 24));
      }

      // Load semester limits
      const sem = localStorage.getItem('sitin_settings_semester_limit');
      if (sem !== null) setSemesterLimit(Number(sem));

      // Load preferences
      const email = localStorage.getItem('sitin_student_email_alerts');
      const push = localStorage.getItem('sitin_student_push_alerts');
      const ide = localStorage.getItem('sitin_student_pref_ide');
      const os = localStorage.getItem('sitin_student_pref_os');
      const kb = localStorage.getItem('sitin_student_pref_keyboard');
      const policies = localStorage.getItem('sitin_settings_lab_policies');

      if (email !== null) setEmailAlerts(email === 'true');
      if (push !== null) setPushAlerts(push === 'true');
      if (ide !== null) setPrefIde(ide);
      if (os !== null) setPrefOs(os);
      if (kb !== null) setPrefKeyboard(kb);

      if (policies !== null) setLabPolicies(policies);
      else setLabPolicies('1. Strictly no food, drinks, or candies inside laboratory facilities.\n2. Maintain silence at all times; use headphones for multimedia tasks.\n3. Keep your workstation keyboard and desktop clean. Shut down the workstation computer correctly before leaving.');

    } catch (e) {
      console.error(e);
    }

    setTimeout(() => {
      setLoading(false);
    }, 450);
  }, []);

  // Listen for changes from standard reset buttons in Admin console
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('sitin_user');
      if (saved) {
        const u = JSON.parse(saved);
        setAvailableSessions(Number(u.available_sessions !== undefined ? u.available_sessions : 24));
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handlePresetSelect = (url) => {
    setProfileUrl(url);
  };

  const handleSave = (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    // Verify passwords if user typed a new password
    if (newPass || confPass || currPass) {
      if (!currPass) {
        setErrorMsg('Please input your Current Password to verify.');
        setSaving(false);
        return;
      }
      if (newPass !== confPass) {
        setErrorMsg('New passwords do not match!');
        setSaving(false);
        return;
      }
      if (newPass.length < 6) {
        setErrorMsg('New password must be at least 6 characters.');
        setSaving(false);
        return;
      }
    }

    setTimeout(() => {
      try {
        const saved = localStorage.getItem('sitin_user');
        if (saved) {
          const u = JSON.parse(saved);
          const updated = {
            ...u,
            first_name: firstName,
            last_name: lastName,
            course: course,
            year_level: Number(yearLevel),
            profile_picture: profileUrl,
            available_sessions: availableSessions
          };

          // Save back
          localStorage.setItem('sitin_user', JSON.stringify(updated));
          localStorage.setItem('sitin_student_email_alerts', String(emailAlerts));
          localStorage.setItem('sitin_student_push_alerts', String(pushAlerts));
          localStorage.setItem('sitin_student_pref_ide', prefIde);
          localStorage.setItem('sitin_student_pref_os', prefOs);
          localStorage.setItem('sitin_student_pref_keyboard', prefKeyboard);

          // Dispatch custom event to notify Navbar / other components to refresh
          window.dispatchEvent(new Event('storage'));
        }

        setSaving(false);
        setSuccessMsg('Account preferences successfully updated!');
        setCurrPass('');
        setNewPass('');
        setConfPass('');

        setTimeout(() => {
          setSuccessMsg('');
        }, 3500);
      } catch (err) {
        setSaving(false);
        setErrorMsg('Failed to save account details.');
      }
    }, 850);
  };

  if (loading) return <LoadingScreen message="Loading Profile Settings..." />;

  const balancePercent = Math.min(100, Math.max(0, (availableSessions / semesterLimit) * 100));

  return (
    <div className="py-6 px-4 sm:px-6 min-h-[85vh] bg-transparent">
      <div className="max-w-[70rem] mx-auto flex flex-col gap-6">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 dark:border-zinc-800/80 pb-6">
          <div>
            <p className="text-[0.62rem] font-black uppercase tracking-[0.25em] text-[#ff9100] mb-1">
              Account Control
            </p>
            <h1 className="text-3xl font-black text-gray-900 dark:text-zinc-50 tracking-tight">
              Settings & Customization
            </h1>
            <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
              Manage your personal student profile, workstation preferences, preset avatars, and session balances.
            </p>
          </div>
        </div>

        {/* Message Boxes */}
        {successMsg && (
          <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-2xl px-5 py-4 text-emerald-800 dark:text-emerald-300 shadow-md shadow-emerald-500/05 animate-fade-in">
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-bold tracking-wide">{successMsg}</p>
          </div>
        )}
        {errorMsg && (
          <div className="flex items-center gap-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 rounded-2xl px-5 py-4 text-rose-800 dark:text-rose-300 shadow-md shadow-rose-500/05 animate-fade-in">
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-sm font-bold tracking-wide">{errorMsg}</p>
          </div>
        )}

        {/* 📋 Hourly Balance Monitor & Guidelines Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Progress balance card */}
          <div className="bg-linear-to-br from-[#3c096c] to-[#240046] border border-[#7b2cbf]/30 rounded-3xl p-6 shadow-md text-white flex flex-col justify-between min-h-[10rem]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[0.62rem] font-black uppercase tracking-[0.2em] text-[#e0aaff]">Semester Balance</p>
                <h4 className="text-2xl font-black tracking-tight mt-1">Sit-in Time Remaining</h4>
              </div>
              <span className="text-[0.7rem] bg-orange-400/20 text-[#ff9100] border border-orange-400/30 px-3 py-1 rounded-full font-black uppercase tracking-wider">
                {availableSessions} / {semesterLimit} Hrs
              </span>
            </div>

            <div className="mt-6 flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs font-bold text-[#e0aaff]">
                <span>Remaining Workstation Allocation</span>
                <span>{Math.round(balancePercent)}% Left</span>
              </div>
              <div className="w-full bg-[#140828] h-3.5 rounded-full overflow-hidden border border-[#7b2cbf]/25 p-0.5">
                <div 
                  style={{ width: `${balancePercent}%` }} 
                  className="bg-linear-to-r from-[#ff9100] to-orange-400 h-full rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(255,145,0,0.5)]"
                />
              </div>
            </div>
          </div>

          {/* Active Policies rules reader */}
          <div className="bg-white dark:bg-zinc-900/90 border border-gray-100 dark:border-zinc-800/80 rounded-3xl p-6 shadow-sm flex flex-col gap-3 min-h-[10rem]">
            <div className="flex items-center gap-2.5 border-b border-gray-50 dark:border-zinc-800/30 pb-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/20 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/25">
                <IcoList />
              </div>
              <h4 className="text-sm font-black text-gray-900 dark:text-zinc-100 uppercase tracking-wider">CCS Laboratory Regulations</h4>
            </div>
            <p className="text-[0.72rem] text-gray-500 dark:text-zinc-400 leading-relaxed font-semibold whitespace-pre-line mt-1">
              {labPolicies}
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1 & 2: Profile & Workspace */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            
            {/* Student Personal details */}
            <div className="bg-white dark:bg-zinc-900/90 border border-gray-100 dark:border-zinc-800/80 rounded-3xl p-6 shadow-sm flex flex-col gap-5">
              <div className="flex items-center gap-3 border-b border-gray-50 dark:border-zinc-800/50 pb-4">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/20 flex items-center justify-center border border-purple-100 dark:border-purple-900/25">
                  <IcoUser />
                </div>
                <div>
                  <h3 className="text-base font-black text-gray-900 dark:text-zinc-100">
                    Profile Personalization
                  </h3>
                  <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">
                    Update your official registry details and customize your avatar.
                  </p>
                </div>
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[0.62rem] font-black uppercase tracking-widest text-gray-400 dark:text-zinc-500">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-zinc-950/60 border-2 border-gray-100 dark:border-zinc-800/70 rounded-2xl px-4 py-3 text-sm font-semibold text-gray-700 dark:text-zinc-300 focus:outline-none focus:border-[#ff9100] focus:bg-white dark:focus:bg-zinc-900 transition-all"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[0.62rem] font-black uppercase tracking-widest text-gray-400 dark:text-zinc-500">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-zinc-950/60 border-2 border-gray-100 dark:border-zinc-800/70 rounded-2xl px-4 py-3 text-sm font-semibold text-gray-700 dark:text-zinc-300 focus:outline-none focus:border-[#ff9100] focus:bg-white dark:focus:bg-zinc-900 transition-all"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[0.62rem] font-black uppercase tracking-widest text-gray-400 dark:text-zinc-500">
                    Academic Course
                  </label>
                  <select
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-zinc-950/60 border-2 border-gray-100 dark:border-zinc-800/70 rounded-2xl px-4 py-3 text-sm font-bold text-gray-700 dark:text-zinc-300 focus:outline-none focus:border-[#ff9100] focus:bg-white dark:focus:bg-zinc-900 transition-all cursor-pointer"
                  >
                    <option value="BSCS">BS in Computer Science (BSCS)</option>
                    <option value="BSIT">BS in Information Technology (BSIT)</option>
                    <option value="BSCE">BS in Computer Engineering (BSCE)</option>
                    <option value="ACT">Associate in Computer Tech (ACT)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[0.62rem] font-black uppercase tracking-widest text-gray-400 dark:text-zinc-500">
                    Year Level
                  </label>
                  <select
                    value={yearLevel}
                    onChange={(e) => setYearLevel(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-zinc-950/60 border-2 border-gray-100 dark:border-zinc-800/70 rounded-2xl px-4 py-3 text-sm font-bold text-gray-700 dark:text-zinc-300 focus:outline-none focus:border-[#ff9100] focus:bg-white dark:focus:bg-zinc-900 transition-all cursor-pointer"
                  >
                    <option value="1">First Year (Freshman)</option>
                    <option value="2">Second Year (Sophomore)</option>
                    <option value="3">Third Year (Junior)</option>
                    <option value="4">Fourth Year (Senior)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Academic Workstation Environmental Preferences */}
            <div className="bg-white dark:bg-zinc-900/90 border border-gray-100 dark:border-zinc-800/80 rounded-3xl p-6 shadow-sm flex flex-col gap-5">
              <div className="flex items-center gap-3 border-b border-gray-50 dark:border-zinc-800/50 pb-4">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950/20 flex items-center justify-center border border-teal-100 dark:border-teal-900/25">
                  <IcoComputer />
                </div>
                <div>
                  <h3 className="text-base font-black text-gray-900 dark:text-zinc-100">
                    Workstation Environment Preferences
                  </h3>
                  <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">
                    Customize default environments when checking into laboratory computer workstations.
                  </p>
                </div>
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[0.62rem] font-black uppercase tracking-widest text-gray-400 dark:text-zinc-500">
                    Default IDE/Editor
                  </label>
                  <select
                    value={prefIde}
                    onChange={(e) => setPrefIde(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-zinc-950/60 border-2 border-gray-100 dark:border-zinc-800/70 rounded-2xl px-3 py-2.5 text-sm font-bold text-gray-700 dark:text-zinc-300 focus:outline-none focus:border-[#ff9100] focus:bg-white dark:focus:bg-zinc-900 transition-all cursor-pointer"
                  >
                    <option value="VS Code">Visual Studio Code</option>
                    <option value="Eclipse">Eclipse IDE</option>
                    <option value="NetBeans">Apache NetBeans</option>
                    <option value="PyCharm">JetBrains PyCharm</option>
                    <option value="CodeBlocks">Code::Blocks</option>
                    <option value="Terminal">Terminal Compiler Only</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[0.62rem] font-black uppercase tracking-widest text-gray-400 dark:text-zinc-500">
                    Workstation Operating System
                  </label>
                  <select
                    value={prefOs}
                    onChange={(e) => setPrefOs(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-zinc-950/60 border-2 border-gray-100 dark:border-zinc-800/70 rounded-2xl px-3 py-2.5 text-sm font-bold text-gray-700 dark:text-zinc-300 focus:outline-none focus:border-[#ff9100] focus:bg-white dark:focus:bg-zinc-900 transition-all cursor-pointer"
                  >
                    <option value="Windows 11">Microsoft Windows 11</option>
                    <option value="Ubuntu Linux">Ubuntu Linux LTS</option>
                    <option value="macOS">Apple macOS Virtual</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[0.62rem] font-black uppercase tracking-widest text-gray-400 dark:text-zinc-500">
                    Keyboard Layout
                  </label>
                  <select
                    value={prefKeyboard}
                    onChange={(e) => setPrefKeyboard(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-zinc-950/60 border-2 border-gray-100 dark:border-zinc-800/70 rounded-2xl px-3 py-2.5 text-sm font-bold text-gray-700 dark:text-zinc-300 focus:outline-none focus:border-[#ff9100] focus:bg-white dark:focus:bg-zinc-900 transition-all cursor-pointer"
                  >
                    <option value="QWERTY">Standard US (QWERTY)</option>
                    <option value="DVORAK">Dvorak Simplified</option>
                    <option value="ISO/ANSI">ANSI International</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Custom Avatar Selector */}
            <div className="bg-white dark:bg-zinc-900/90 border border-gray-100 dark:border-zinc-800/80 rounded-3xl p-6 shadow-sm flex flex-col gap-5">
              <div>
                <h3 className="text-base font-black text-gray-900 dark:text-zinc-100">
                  Laboratory Avatar Graphics
                </h3>
                <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">
                  Choose a preset student profile picture or paste a custom image URL.
                </p>
              </div>

              {/* Avatar presets grid */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
                {PRESET_AVATARS.map((avatar, idx) => {
                  const isSelected = profileUrl === avatar.url;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handlePresetSelect(avatar.url)}
                      className={`relative aspect-square rounded-2xl overflow-hidden border-2 group hover:scale-105 active:scale-95 transition-all duration-300 ${
                        isSelected ? 'border-[#ff9100] ring-4 ring-[#ff9100]/20' : 'border-gray-100 dark:border-zinc-800'
                      }`}
                    >
                      <img
                        src={avatar.url}
                        alt={avatar.name}
                        className="w-full h-full object-cover"
                      />
                      {isSelected && (
                        <div className="absolute inset-0 bg-[#ff9100]/15 flex items-center justify-center">
                          <span className="w-5 h-5 rounded-full bg-[#ff9100] flex items-center justify-center shadow-md">
                            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Input for custom URL */}
              <div className="flex flex-col gap-1.5 mt-2">
                <label className="text-[0.62rem] font-black uppercase tracking-widest text-gray-400 dark:text-zinc-500">
                  Custom Profile Picture URL
                </label>
                <input
                  type="text"
                  value={profileUrl}
                  onChange={(e) => setProfileUrl(e.target.value)}
                  placeholder="Paste a direct image web link..."
                  className="w-full bg-gray-50 dark:bg-zinc-950/60 border-2 border-gray-100 dark:border-zinc-800/70 rounded-2xl px-4 py-3 text-sm font-semibold text-gray-700 dark:text-zinc-300 focus:outline-none focus:border-[#ff9100] focus:bg-white dark:focus:bg-zinc-900 transition-all placeholder:text-gray-400"
                />
              </div>
            </div>

          </div>

          {/* Column 3: Security & Alerts */}
          <div className="flex flex-col gap-6">
            
            {/* Password security */}
            <div className="bg-white dark:bg-zinc-900/90 border border-gray-100 dark:border-zinc-800/80 rounded-3xl p-6 shadow-sm flex flex-col gap-5">
              <div className="flex items-center gap-3 border-b border-gray-50 dark:border-zinc-800/50 pb-4">
                <div className="w-10 h-10 rounded-2xl bg-orange-50 dark:bg-orange-950/20 flex items-center justify-center border border-orange-100 dark:border-orange-900/25">
                  <IcoLock />
                </div>
                <div>
                  <h3 className="text-base font-black text-gray-900 dark:text-zinc-100">
                    Security Credentials
                  </h3>
                  <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">
                    Update your account passwords periodically.
                  </p>
                </div>
              </div>

              {/* Password inputs */}
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[0.62rem] font-black uppercase tracking-widest text-gray-400 dark:text-zinc-500">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={currPass}
                    onChange={(e) => setCurrPass(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-zinc-950/60 border-2 border-gray-100 dark:border-zinc-800/70 rounded-2xl px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-zinc-300 focus:outline-none focus:border-[#ff9100] focus:bg-white dark:focus:bg-zinc-900 transition-all"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[0.62rem] font-black uppercase tracking-widest text-gray-400 dark:text-zinc-500">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-zinc-950/60 border-2 border-gray-100 dark:border-zinc-800/70 rounded-2xl px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-zinc-300 focus:outline-none focus:border-[#ff9100] focus:bg-white dark:focus:bg-zinc-900 transition-all"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[0.62rem] font-black uppercase tracking-widest text-gray-400 dark:text-zinc-500">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confPass}
                    onChange={(e) => setConfPass(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-zinc-950/60 border-2 border-gray-100 dark:border-zinc-800/70 rounded-2xl px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-zinc-300 focus:outline-none focus:border-[#ff9100] focus:bg-white dark:focus:bg-zinc-900 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Notification preferences */}
            <div className="bg-white dark:bg-zinc-900/90 border border-gray-100 dark:border-zinc-800/80 rounded-3xl p-6 shadow-sm flex flex-col gap-5">
              <div className="flex items-center gap-3 border-b border-gray-50 dark:border-zinc-800/50 pb-4">
                <div className="w-10 h-10 rounded-2xl bg-pink-50 dark:bg-pink-950/20 flex items-center justify-center border border-pink-100 dark:border-pink-900/25">
                  <IcoBell />
                </div>
                <div>
                  <h3 className="text-base font-black text-gray-900 dark:text-zinc-100">
                    Notification Toggles
                  </h3>
                  <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">
                    Customize alert preferences.
                  </p>
                </div>
              </div>

              {/* Switch inputs */}
              <div className="flex flex-col gap-4 mt-1">
                
                {/* Toggle 1 */}
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-800 dark:text-zinc-200">
                      Email updates
                    </p>
                    <p className="text-[0.68rem] text-gray-400 dark:text-zinc-500 mt-0.5 leading-relaxed">
                      Receive alerts on approved or rejected lab seat bookings.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEmailAlerts(!emailAlerts)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      emailAlerts ? 'bg-[#ff9100]' : 'bg-gray-200 dark:bg-zinc-800'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        emailAlerts ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Toggle 2 */}
                <div className="flex items-start justify-between gap-4 border-t border-gray-50 dark:border-zinc-800/30 pt-4">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-800 dark:text-zinc-200">
                      Push Notifications
                    </p>
                    <p className="text-[0.68rem] text-gray-400 dark:text-zinc-500 mt-0.5 leading-relaxed">
                      Receive browser alerts when admin updates workstation availabilities.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPushAlerts(!pushAlerts)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      pushAlerts ? 'bg-[#ff9100]' : 'bg-gray-200 dark:bg-zinc-800'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        pushAlerts ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

              </div>
            </div>

            {/* Submit Block */}
            <div className="bg-[#140828] border border-[#ff9100]/25 rounded-3xl p-5 shadow-lg flex flex-col gap-4 text-left">
              <div>
                <p className="text-[0.6rem] font-black uppercase tracking-[0.2em] text-[#ff9100]">
                  Registry synchronization
                </p>
                <p className="text-xs text-[#e9d5ff] font-semibold leading-relaxed mt-1">
                  Saving updates your identity globally across the entire CCS Sit-in booking client immediately.
                </p>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 bg-[#ff9100] text-[#3c096c] font-black hover:bg-orange-400 transition-all rounded-2xl py-3 text-[0.7rem] uppercase tracking-widest disabled:opacity-50 hover:shadow-lg hover:-translate-y-0.5 duration-300"
              >
                {saving ? (
                  <span>Saving details...</span>
                ) : (
                  <>
                    <IcoSave />
                    <span>Save Preferences</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </form>

      </div>
    </div>
  );
}
