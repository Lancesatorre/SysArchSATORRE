import React, { useState, useEffect } from 'react';
import LoadingScreen from '../components/LoadingScreen';

// ── Lightweight inline SVG icons ──────────────────────
const IcoClock = () => (
  <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const IcoMonitor = () => (
  <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);
const IcoShield = () => (
  <svg className="w-5 h-5 text-teal-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);
const IcoSave = () => (
  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);
const IcoDatabase = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
  </svg>
);

export default function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // ── 1. Operational Windows (KEPT!) ──
  const [openTime, setOpenTime] = useState('07:30');
  const [closeTime, setCloseTime] = useState('20:30');
  const [activeSemester, setActiveSemester] = useState('1st Semester 2025-2026');

  // ── 2. NEW CONTENT: Laboratory Workstation Specification Standardizer ──
  const [selectedLabRoom, setSelectedLabRoom] = useState('Lab 524');
  const [cpuSpec, setCpuSpec] = useState('Intel Core i7-13700');
  const [ramSpec, setRamSpec] = useState('16GB DDR5');
  const [gpuSpec, setGpuSpec] = useState('NVIDIA RTX 4060');
  const [osSpec, setOsSpec] = useState('Windows 11 Pro');
  const [installedTools, setInstalledTools] = useState('VS Code, Git, Node.js, JDK 21, Python 3.12');

  // ── 3. NEW CONTENT: Workstation Security & Auto-Clean Policies ──
  const [wipeProfile, setWipeProfile] = useState(true);
  const [deepFreeze, setDeepFreeze] = useState(true);
  const [blockUsb, setBlockUsb] = useState(false);

  useEffect(() => {
    // Load persisted settings
    const oTime = localStorage.getItem('sitin_settings_open_time');
    const cTime = localStorage.getItem('sitin_settings_close_time');
    const term = localStorage.getItem('sitin_settings_active_semester');

    const labRoom = localStorage.getItem('sitin_settings_lab_room');
    const cpu = localStorage.getItem('sitin_settings_cpu_spec');
    const ram = localStorage.getItem('sitin_settings_ram_spec');
    const gpu = localStorage.getItem('sitin_settings_gpu_spec');
    const os = localStorage.getItem('sitin_settings_os_spec');
    const tools = localStorage.getItem('sitin_settings_installed_tools');

    const wipe = localStorage.getItem('sitin_settings_wipe_profile');
    const freeze = localStorage.getItem('sitin_settings_deep_freeze');
    const usb = localStorage.getItem('sitin_settings_block_usb');

    if (oTime !== null) setOpenTime(oTime);
    if (cTime !== null) setCloseTime(cTime);
    if (term !== null) setActiveSemester(term);

    if (labRoom !== null) setSelectedLabRoom(labRoom);
    if (cpu !== null) setCpuSpec(cpu);
    if (ram !== null) setRamSpec(ram);
    if (gpu !== null) setGpuSpec(gpu);
    if (os !== null) setOsSpec(os);
    if (tools !== null) setInstalledTools(tools);

    if (wipe !== null) setWipeProfile(wipe === 'true');
    if (freeze !== null) setDeepFreeze(freeze === 'true');
    if (usb !== null) setBlockUsb(usb === 'true');

    setTimeout(() => {
      setLoading(false);
    }, 450);
  }, []);

  const handleSave = (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');

    setTimeout(() => {
      localStorage.setItem('sitin_settings_open_time', openTime);
      localStorage.setItem('sitin_settings_close_time', closeTime);
      localStorage.setItem('sitin_settings_active_semester', activeSemester);

      localStorage.setItem('sitin_settings_lab_room', selectedLabRoom);
      localStorage.setItem('sitin_settings_cpu_spec', cpuSpec);
      localStorage.setItem('sitin_settings_ram_spec', ramSpec);
      localStorage.setItem('sitin_settings_gpu_spec', gpuSpec);
      localStorage.setItem('sitin_settings_os_spec', osSpec);
      localStorage.setItem('sitin_settings_installed_tools', installedTools);

      localStorage.setItem('sitin_settings_wipe_profile', String(wipeProfile));
      localStorage.setItem('sitin_settings_deep_freeze', String(deepFreeze));
      localStorage.setItem('sitin_settings_block_usb', String(blockUsb));

      setSaving(false);
      setSuccessMsg('Laboratory operating profiles and workstation specs updated successfully!');

      setTimeout(() => {
        setSuccessMsg('');
      }, 3500);
    }, 900);
  };

  const handleResetStudentHours = () => {
    if (!confirm('Are you absolutely sure you want to restore all students remaining seat hours back to pristine allowances (30 hours)?')) {
      return;
    }
    setResetting(true);
    setSuccessMsg('');

    setTimeout(() => {
      try {
        const studentRaw = localStorage.getItem('sitin_user');
        if (studentRaw) {
          const student = JSON.parse(studentRaw);
          if (student.role !== 'admin') {
            student.available_sessions = 30;
            localStorage.setItem('sitin_user', JSON.stringify(student));
            window.dispatchEvent(new Event('storage'));
          }
        }
        setResetting(false);
        setSuccessMsg('All students hourly balances successfully restored to default allowances!');
        setTimeout(() => {
          setSuccessMsg('');
        }, 3500);
      } catch (err) {
        setResetting(false);
        alert('Failed to reset student hour allowances.');
      }
    }, 1200);
  };

  if (loading) return <LoadingScreen message="Loading IT System Configurations..." />;

  return (
    <div className="py-6 px-4 sm:px-6 min-h-[85vh] bg-transparent">
      <div className="max-w-[70rem] mx-auto flex flex-col gap-6">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 dark:border-zinc-800/80 pb-6">
          <div>
            <p className="text-[0.62rem] font-black uppercase tracking-[0.25em] text-[#3c096c] dark:text-purple-400 mb-1">
              Control Deck
            </p>
            <h1 className="text-3xl font-black text-gray-900 dark:text-zinc-50 tracking-tight">
              Laboratory Configurations
            </h1>
            <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
              Standardize hardware profiles, enforce auto-clean security policies, and manage operational hours.
            </p>
          </div>
        </div>

        {/* Toast message */}
        {successMsg && (
          <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-2xl px-5 py-4 text-emerald-800 dark:text-emerald-300 shadow-md shadow-emerald-500/05 animate-fade-in">
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-bold tracking-wide">{successMsg}</p>
          </div>
        )}

        <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1 & 2: Main settings */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            
            {/* Lab Workstation Specifications */}
            <div className="bg-white dark:bg-zinc-900/90 border border-gray-100 dark:border-zinc-800/80 rounded-3xl p-6 shadow-sm flex flex-col gap-5">
              <div className="flex items-center gap-3 border-b border-gray-50 dark:border-zinc-800/50 pb-4">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/20 flex items-center justify-center border border-purple-100 dark:border-purple-900/25">
                  <IcoMonitor />
                </div>
                <div>
                  <h3 className="text-base font-black text-gray-900 dark:text-zinc-100">
                    Workstation Spec Standardizer
                  </h3>
                  <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">
                    Define technical hardware spec profiles for checked-in student PCs.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="text-[0.62rem] font-black uppercase tracking-widest text-gray-400 dark:text-zinc-500">
                    Select Target Laboratory Room
                  </label>
                  <select
                    value={selectedLabRoom}
                    onChange={(e) => setSelectedLabRoom(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-zinc-950/60 border-2 border-gray-100 dark:border-zinc-800/70 rounded-2xl px-4 py-2.5 text-sm font-bold text-gray-700 dark:text-zinc-300 focus:outline-none focus:border-purple-600 focus:bg-white dark:focus:bg-zinc-900 transition-all cursor-pointer"
                  >
                    <option value="Lab 524">Lab 524 (Advanced Programming Lab)</option>
                    <option value="Lab 526">Lab 526 (Multimedia & Graphics)</option>
                    <option value="Lab 542">Lab 542 (Hardware & Networking)</option>
                    <option value="Lab 544">Lab 544 (General IT Laboratory)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[0.62rem] font-black uppercase tracking-widest text-gray-400 dark:text-zinc-500">
                    Processor Standard (CPU)
                  </label>
                  <input
                    type="text"
                    value={cpuSpec}
                    onChange={(e) => setCpuSpec(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-zinc-950/60 border-2 border-gray-100 dark:border-zinc-800/70 rounded-2xl px-4 py-2.5 text-sm font-black text-gray-800 dark:text-zinc-200 focus:outline-none focus:border-purple-600 focus:bg-white dark:focus:bg-zinc-900 transition-all"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[0.62rem] font-black uppercase tracking-widest text-gray-400 dark:text-zinc-500">
                    RAM Capacity Standard
                  </label>
                  <input
                    type="text"
                    value={ramSpec}
                    onChange={(e) => setRamSpec(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-zinc-950/60 border-2 border-gray-100 dark:border-zinc-800/70 rounded-2xl px-4 py-2.5 text-sm font-black text-gray-800 dark:text-zinc-200 focus:outline-none focus:border-purple-600 focus:bg-white dark:focus:bg-zinc-900 transition-all"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[0.62rem] font-black uppercase tracking-widest text-gray-400 dark:text-zinc-500">
                    Graphics Card Standard (GPU)
                  </label>
                  <input
                    type="text"
                    value={gpuSpec}
                    onChange={(e) => setGpuSpec(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-zinc-950/60 border-2 border-gray-100 dark:border-zinc-800/70 rounded-2xl px-4 py-2.5 text-sm font-black text-gray-800 dark:text-zinc-200 focus:outline-none focus:border-purple-600 focus:bg-white dark:focus:bg-zinc-900 transition-all"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[0.62rem] font-black uppercase tracking-widest text-gray-400 dark:text-zinc-500">
                    Default Operating System (OS)
                  </label>
                  <input
                    type="text"
                    value={osSpec}
                    onChange={(e) => setOsSpec(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-zinc-950/60 border-2 border-gray-100 dark:border-zinc-800/70 rounded-2xl px-4 py-2.5 text-sm font-black text-gray-800 dark:text-zinc-200 focus:outline-none focus:border-purple-600 focus:bg-white dark:focus:bg-zinc-900 transition-all"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="text-[0.62rem] font-black uppercase tracking-widest text-gray-400 dark:text-zinc-500">
                    Pre-installed Developer Software Suite
                  </label>
                  <textarea
                    value={installedTools}
                    onChange={(e) => setInstalledTools(e.target.value)}
                    rows={2}
                    className="w-full bg-gray-50 dark:bg-zinc-950/60 border-2 border-gray-100 dark:border-zinc-800/70 rounded-2xl px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-zinc-300 placeholder:text-gray-400 focus:outline-none focus:border-purple-600 focus:bg-white dark:focus:bg-zinc-900 transition-all resize-y"
                    required
                  />
                  <p className="text-[0.68rem] text-gray-400 dark:text-zinc-500 mt-0.5 leading-relaxed">
                    A comma-separated list of compiler tools and frameworks pre-deployed across all PC nodes.
                  </p>
                </div>
              </div>
            </div>

            {/* Workstation Security & Auto-Clean Policies */}
            <div className="bg-white dark:bg-zinc-900/90 border border-gray-100 dark:border-zinc-800/80 rounded-3xl p-6 shadow-sm flex flex-col gap-5">
              <div className="flex items-center gap-3 border-b border-gray-50 dark:border-zinc-800/50 pb-4">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950/20 flex items-center justify-center border border-teal-100 dark:border-teal-900/25">
                  <IcoShield />
                </div>
                <div>
                  <h3 className="text-base font-black text-gray-900 dark:text-zinc-100">
                    OS Security & Auto-Clean
                  </h3>
                  <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">
                    Define direct operating system and storage cleaning routines inside laboratories.
                  </p>
                </div>
              </div>

              {/* Security Toggles */}
              <div className="flex flex-col gap-5 mt-2">
                
                {/* Toggle 1 */}
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-800 dark:text-zinc-200">
                      Wipe Student Local Profile
                    </p>
                    <p className="text-[0.68rem] text-gray-400 dark:text-zinc-500 mt-0.5 leading-relaxed">
                      Automatically erase student downloaded documents, temporary workspace configurations, and git credentials upon workstation check-out.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setWipeProfile(!wipeProfile)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      wipeProfile ? 'bg-[#3c096c] dark:bg-purple-600' : 'bg-gray-200 dark:bg-zinc-800'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        wipeProfile ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Toggle 2 */}
                <div className="flex items-start justify-between gap-4 border-t border-gray-50 dark:border-zinc-800/30 pt-4">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-800 dark:text-zinc-200">
                      Enforce Deep Freeze
                    </p>
                    <p className="text-[0.68rem] text-gray-400 dark:text-zinc-500 mt-0.5 leading-relaxed">
                      Enforce system drive freeze to restore pristine operating system state upon PC restart, defending against virus deployments.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDeepFreeze(!deepFreeze)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      deepFreeze ? 'bg-[#3c096c] dark:bg-purple-600' : 'bg-gray-200 dark:bg-zinc-800'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        deepFreeze ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Toggle 3 */}
                <div className="flex items-start justify-between gap-4 border-t border-gray-50 dark:border-zinc-800/30 pt-4">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-800 dark:text-zinc-200">
                      Block Unauthorized USB Storage
                    </p>
                    <p className="text-[0.68rem] text-gray-400 dark:text-zinc-500 mt-0.5 leading-relaxed">
                      Enforce OS security policies blocking external flash drives to mitigate database extraction and unauthorized file execution.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setBlockUsb(!blockUsb)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      blockUsb ? 'bg-[#3c096c] dark:bg-purple-600' : 'bg-gray-200 dark:bg-zinc-800'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        blockUsb ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

              </div>
            </div>

          </div>

          {/* Column 3: Operational hours & Action */}
          <div className="flex flex-col gap-6">
            
            {/* Laboratory Operational Hours & Term */}
            <div className="bg-white dark:bg-zinc-900/90 border border-gray-100 dark:border-zinc-800/80 rounded-3xl p-6 shadow-sm flex flex-col gap-5">
              <div className="flex items-center gap-3 border-b border-gray-50 dark:border-zinc-800/50 pb-4">
                <div className="w-10 h-10 rounded-2xl bg-orange-50 dark:bg-orange-950/20 flex items-center justify-center border border-orange-100 dark:border-orange-900/25">
                  <IcoClock />
                </div>
                <div>
                  <h3 className="text-base font-black text-gray-900 dark:text-zinc-100">
                    Operational Windows
                  </h3>
                  <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">
                    Define active academic term and hours.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[0.62rem] font-black uppercase tracking-widest text-gray-400 dark:text-zinc-500">
                    Active Academic Term
                  </label>
                  <select
                    value={activeSemester}
                    onChange={(e) => setActiveSemester(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-zinc-950/60 border-2 border-gray-100 dark:border-zinc-800/70 rounded-2xl px-4 py-2.5 text-sm font-bold text-gray-700 dark:text-zinc-300 focus:outline-none focus:border-purple-600 focus:bg-white dark:focus:bg-zinc-900 transition-all cursor-pointer"
                  >
                    <option value="1st Semester 2025-2026">1st Semester 2025-2026</option>
                    <option value="2nd Semester 2025-2026">2nd Semester 2025-2026</option>
                    <option value="Summer Term 2026">Summer Term 2026</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[0.62rem] font-black uppercase tracking-widest text-gray-400 dark:text-zinc-500">
                      Opening Time
                    </label>
                    <input
                      type="time"
                      value={openTime}
                      onChange={(e) => setOpenTime(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-zinc-950/60 border-2 border-gray-100 dark:border-zinc-800/70 rounded-2xl px-4 py-2 text-sm font-bold text-gray-700 dark:text-zinc-300 focus:outline-none focus:border-purple-600 focus:bg-white dark:focus:bg-zinc-900 transition-all"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[0.62rem] font-black uppercase tracking-widest text-gray-400 dark:text-zinc-500">
                      Closing Time
                    </label>
                    <input
                      type="time"
                      value={closeTime}
                      onChange={(e) => setCloseTime(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-zinc-950/60 border-2 border-gray-100 dark:border-zinc-800/70 rounded-2xl px-4 py-2 text-sm font-bold text-gray-700 dark:text-zinc-300 focus:outline-none focus:border-purple-600 focus:bg-white dark:focus:bg-zinc-900 transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Action Box */}
            <div className="bg-[#140828] border border-[#7b2cbf]/30 rounded-3xl p-5 shadow-lg flex flex-col gap-4 text-left">
              <div>
                <p className="text-[0.6rem] font-black uppercase tracking-[0.2em] text-[#e0aaff]">
                  Persistent Updates
                </p>
                <p className="text-xs text-[#d4c6ea] font-medium leading-relaxed mt-1">
                  Adjustments made here are written instantly into the master configuration registries.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  type="submit"
                  disabled={saving || resetting}
                  className="w-full flex items-center justify-center gap-2 bg-[#ff9100] text-[#3c096c] font-black hover:bg-orange-400 transition-all rounded-2xl py-3 text-[0.7rem] uppercase tracking-widest disabled:opacity-50 hover:shadow-lg hover:-translate-y-0.5 duration-300"
                >
                  {saving ? (
                    <span>Updating System...</span>
                  ) : (
                    <>
                      <IcoSave />
                      <span>Apply Settings</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleResetStudentHours}
                  disabled={saving || resetting}
                  className="w-full flex items-center justify-center gap-2 bg-transparent text-red-400 font-bold border border-red-500/30 hover:border-red-400 hover:bg-red-500/10 transition-all rounded-2xl py-3 text-[0.68rem] uppercase tracking-wider disabled:opacity-50 duration-300"
                >
                  {resetting ? (
                    <span>Restoring Hours...</span>
                  ) : (
                    <>
                      <IcoDatabase />
                      <span>Reset Student Hours</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        </form>

      </div>
    </div>
  );
}
