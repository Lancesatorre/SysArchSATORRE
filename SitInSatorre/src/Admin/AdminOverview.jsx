import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authService } from '../services/authService'
import LoadingScreen from '../components/LoadingScreen'

const Ico = ({ d, d2, cls = 'w-4 h-4' }) => (
  <svg className={cls} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    {d2 && <path strokeLinecap="round" strokeLinejoin="round" d={d2} />}
  </svg>
)
const IcoUsers = ({ cls = 'w-4 h-4' }) => <Ico cls={cls} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" />
const IcoPlay = ({ cls = 'w-4 h-4' }) => <Ico cls={cls} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" d2="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
const IcoList = ({ cls = 'w-4 h-4' }) => <Ico cls={cls} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
const IcoClock = ({ cls = 'w-4 h-4' }) => <Ico cls={cls} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
const IcoSearch = ({ cls = 'w-4 h-4' }) => <Ico cls={cls} d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
const IcoShield = ({ cls = 'w-4 h-4' }) => <Ico cls={cls} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
const IcoChevron = ({ cls = 'w-4 h-4' }) => <Ico cls={cls} d="M9 5l7 7-7 7" />
const IcoMonitor = ({ cls = 'w-4 h-4' }) => <Ico cls={cls} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
const IcoActivity = ({ cls = 'w-4 h-4' }) => <Ico cls={cls} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />

export default function AdminOverview() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({ active: 0, records: 0 })
  const [loading, setLoading] = useState(true)
  const [records, setRecords] = useState([])
  const [sessions, setSessions] = useState([])
  const [labsData, setLabsData] = useState([])
  const [hoveredIndex, setHoveredIndex] = useState(null)
  const [mounted, setMounted] = useState(false)

  const user = authService.getUser?.() || {}
  const initials = `${user.first_name?.[0] || 'A'}${user.last_name?.[0] || ''}`.toUpperCase()
  const now = new Date()
  const hour = now.getHours()

  const loadData = async (showLoading = false) => {
    if (showLoading) setLoading(true)
    try {
      const [sessionsRes, recordsRes, reservationsRes] = await Promise.allSettled([
        authService.adminCurrentSessions?.() || Promise.resolve([]),
        authService.adminSitInRecords?.() || Promise.resolve([]),
        authService.adminGetReservations?.() || Promise.resolve({ success: false })
      ])

      const sessionsVal = sessionsRes.status === 'fulfilled' && Array.isArray(sessionsRes.value)
        ? sessionsRes.value
        : []
      const recordsVal = recordsRes.status === 'fulfilled' && Array.isArray(recordsRes.value)
        ? recordsRes.value
        : []
      const labsVal = reservationsRes.status === 'fulfilled' && reservationsRes.value?.success
        ? (reservationsRes.value.data?.labs || [])
        : []

      setStats({ active: sessionsVal.length, records: recordsVal.length })
      setRecords(recordsVal)
      setSessions(sessionsVal)
      setLabsData(labsVal)
    } catch (_) { }
    finally {
      if (showLoading) setLoading(false)
    }
  }

  useEffect(() => {
    const u = authService.getUser?.() || null
    if (!u || u.role !== 'admin') { navigate('/login'); return }

    loadData(true)

    const intervalId = setInterval(() => {
      loadData(false)
    }, 10000)

    const handleFocusRefresh = () => {
      loadData(false)
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadData(false)
      }
    }

    window.addEventListener('focus', handleFocusRefresh)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      clearInterval(intervalId)
      window.removeEventListener('focus', handleFocusRefresh)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [navigate])

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => setMounted(true), 80);
      return () => clearTimeout(timer);
    } else {
      setMounted(false);
    }
  }, [loading]);

  const getDynamicLabs = () => {
    if (!labsData || labsData.length === 0) {
      return [];
    }

    return labsData.map(lab => {
      // Extract numeric lab ID from lab_name (e.g. "Lab 524" -> "524")
      const id = String(lab.lab_name || '').replace(/[^0-9]/g, '') || lab.id;
      const capacity = Number(lab.total_pcs || 50);
      const available = Number(lab.available_pcs || 50);

      // Since disabled/maintenance PCs are not included in available_pcs,
      // the occupied count is exactly capacity - available:
      const occupied = Math.max(0, capacity - available);

      let status = 'open';
      if (lab.status === 'inactive') {
        status = 'closed';
      } else if (occupied >= capacity) {
        status = 'busy';
      }

      return {
        id,
        floor: '5F',
        status,
        occupied,
        capacity
      };
    });
  };
  const LABS = getDynamicLabs();

  const getTopLongestSessions = () => {
    const studentMap = {};
    records.forEach(r => {
      const name = `${r.first_name || ''} ${r.last_name || ''}`.trim() || r.student_id_number || 'Student';
      const duration = Number(r.duration_minutes || 0);
      if (!studentMap[name]) {
        studentMap[name] = {
          name,
          duration: 0,
          id: r.student_id_number,
          course: r.course || 'BSIT',
          year: r.year_level || '3'
        };
      }
      studentMap[name].duration += duration;
    });

    let topStudents = Object.values(studentMap)
      .filter(s => s.duration > 0)
      .sort((a, b) => b.duration - a.duration);

    return topStudents.slice(0, 5);
  };

  const getIndividualLongestSessions = () => {
    const studentMap = {};
    records.forEach(r => {
      const name = `${r.first_name || ''} ${r.last_name || ''}`.trim() || r.student_id_number || 'Student';
      const duration = Number(r.duration_minutes || 0);

      if (!studentMap[name] || duration > studentMap[name].duration) {
        studentMap[name] = {
          name,
          duration,
          id: r.student_id_number,
          course: r.course || 'BSIT',
          year: r.year_level || '3'
        };
      }
    });

    return Object.values(studentMap)
      .filter(s => s.duration > 0)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 5);
  };

  const formatDuration = (mins) => {
    if (mins >= 60) {
      const hrs = Math.floor(mins / 60);
      const remainingMins = mins % 60;
      return remainingMins > 0 ? `${hrs}h ${remainingMins}m` : `${hrs} hrs`;
    }
    return `${mins} mins`;
  };

  const topStudents = getTopLongestSessions();
  const topIndividualSessions = getIndividualLongestSessions();

  const maxTopDuration = Math.max(...topStudents.map(s => s.duration), 1);
  const scaledTopStudents = topStudents.map(s => ({
    ...s,
    scaledVal: Math.pow(s.duration / maxTopDuration, 0.45)
  }));
  const totalScaledTop = scaledTopStudents.reduce((sum, s) => sum + s.scaledVal, 0);
  const totalDuration = topStudents.reduce((sum, s) => sum + s.duration, 0);
  const COLORS = ['#7b2cbf', '#ff7b00', '#3f37c9', '#ffb703', '#ff5c8a'];

  const basePctPerSlice = 0.08; // 8% minimum arc to make sure every slice is beautifully visible and hoverable
  const proportionalTotalPct = 1.0 - (topStudents.length * basePctPerSlice); // Remaining is distributed proportionally

  let accumulatedPct = 0;
  const slices = scaledTopStudents.map((s, index) => {
    const propShare = totalScaledTop > 0 ? (s.scaledVal / totalScaledTop) : (1 / topStudents.length);
    const pct = basePctPerSlice + (propShare * proportionalTotalPct);

    // Circumference at radius 80 is 502.65
    const strokeLength = pct * 502.65;
    const strokeOffset = -accumulatedPct * 502.65; // Clockwise contiguous offset

    accumulatedPct += pct;

    return {
      ...s,
      pct,
      actualPct: totalDuration > 0 ? (s.duration / totalDuration) : 0,
      strokeLength,
      strokeOffset,
      color: COLORS[index % COLORS.length]
    };
  });

  if (loading) {
    return <LoadingScreen message="Loading Command Center..." />;
  }

  return (
    <div className="pt-2 sm:pt-3 pb-4 sm:pb-6 px-1 sm:px-2 min-h-[calc(100vh-7rem)] flex">
      <div className="max-w-380 mx-auto w-full flex flex-col gap-6 flex-1">

        {/* ── HEADER BANNER ── */}
        <div className="bg-[#3c096c] rounded-2xl overflow-hidden shadow-xl shadow-[#3c096c]/20 relative">
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)', backgroundSize: '12px 12px' }} />
          <div className="absolute -top-16 right-32 w-64 h-64 rounded-full bg-[#ff9100]/10 blur-3xl pointer-events-none" />
          <div className="h-1.5 w-full bg-linear-to-r from-[#ff9100] via-violet-400 to-[#3c096c]" />
          <div className="relative px-4 sm:px-6 lg:px-8 py-5 sm:py-7 flex items-center justify-between gap-6 flex-wrap">
            <div className="flex items-center gap-5">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <IcoShield cls="w-3 h-3 text-[#ff9100]" />
                  <p className="text-[#ff9100] text-[0.58rem] font-black uppercase tracking-[0.22em]">Administrator</p>
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-none">Dashboard</h1>
                <p className="text-white/40 text-xs mt-1.5">Here's a snapshot of the sit-in system.</p>
              </div>
            </div>
            <div className="flex items-end gap-2 flex-col">
              <span className="flex items-center gap-2 bg-white/08 border border-white/10 rounded-full px-4 py-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs font-semibold text-white/70">System Online</span>
              </span>
              <span className="bg-white/08 border border-white/10 rounded-xl px-4 py-2 text-xs font-bold text-white/60">
                {now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </span>
            </div>
          </div>
        </div>

        {/* ── STAT ROW ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Active Sessions', value: loading ? '—' : stats.active, icon: <IcoPlay />, accent: true },
            { label: 'Total Records', value: loading ? '—' : stats.records, icon: <IcoList />, orange: true },
            { label: 'Total Labs', value: loading ? '—' : LABS.length, icon: <IcoMonitor />, accent: false },
            { label: 'Total PCs', value: loading ? '—' : LABS.reduce((sum, lab) => sum + lab.capacity, 0), icon: <IcoUsers />, accent: false },
          ].map(({ label, value, icon, accent, orange }) => (
            <div key={label} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${orange ? 'bg-[#ff9100]/10' : accent ? 'bg-[#3c096c]/08' : 'bg-gray-100'
                }`}>
                {React.cloneElement(icon, { cls: `w-3.5 h-3.5 ${orange ? 'text-[#ff9100]' : accent ? 'text-[#3c096c]' : 'text-gray-500'}` })}
              </div>
              <div>
                <p className={`text-3xl font-black leading-none ${orange ? 'text-[#ff9100]' : accent ? 'text-[#3c096c]' : 'text-[#1a0030]'}`}>{value}</p>
                <p className="text-[0.6rem] font-black uppercase tracking-[0.14em] text-gray-400 mt-1.5">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── MAIN GRID ── */}
        <div className="grid grid-cols-12 gap-5 flex-1">

          {/* ── LEFT: Session Analytics Donut Chart ── */}
          <div className="col-span-12 lg:col-span-5 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 bg-[#3c096c] rounded-full" />
              <h2 className="font-black text-[#1a0030] text-base tracking-tight">Session Analytics</h2>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 flex flex-col gap-6 items-center">
              <div className="w-full flex items-center justify-between">
                <div>
                  <h3 className="font-black text-[#1a0030] text-sm">Top Sit-in Hours</h3>
                  <p className="text-[0.62rem] text-gray-400 font-medium">Top 5 students by total logged hours</p>
                </div>
                <span className="text-[0.58rem] font-bold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full uppercase tracking-wider">Live Stats</span>
              </div>

              {/* Interactive Infographic Leader-Line Donut Chart (Supreme Modern Luxury) */}
              <div className="relative w-80 h-80 sm:w-96 sm:h-96 md:w-[26rem] md:h-[26rem] flex items-center justify-center transition-all duration-300">
                {/* Embedded style block for the spectacular spin-in bounce reload animation */}
                <style>{`
                  @keyframes donut-roll-reveal {
                    0% { transform: rotate(-360deg) scale(0.35); opacity: 0; }
                    65% { transform: rotate(10deg) scale(1.05); opacity: 0.95; }
                    100% { transform: rotate(0deg) scale(1); opacity: 1; }
                  }
                  .animate-donut-roll {
                    animation: donut-roll-reveal 1.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
                    transform-origin: center;
                  }
                `}</style>

                {/* SVG Donut Canvas */}
                <svg className="absolute w-full h-full -rotate-90 animate-donut-roll" viewBox="0 0 200 200">
                  <defs>
                    <filter id="soft-neon-glow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="4.5" result="blur" />
                      <feComponentTransfer in="blur" result="glow">
                        <feFuncA type="linear" slope="0.75" />
                      </feComponentTransfer>
                      <feMerge>
                        <feMergeNode in="glow" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>

                    {/* Majestic Dynamic Center Radial Glow */}
                    <radialGradient id="center-glow-gradient" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor={hoveredIndex !== null ? slices[hoveredIndex]?.color : '#3c096c'} stopOpacity="0.18" />
                      <stop offset="65%" stopColor={hoveredIndex !== null ? slices[hoveredIndex]?.color : '#3c096c'} stopOpacity="0.04" />
                      <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                    </radialGradient>
                  </defs>

                  {/* 1. Ambient Background Center Radial Glow */}
                  <circle
                    cx="100"
                    cy="100"
                    r="74"
                    fill="url(#center-glow-gradient)"
                    className="transition-all duration-500"
                    style={{
                      transform: hoveredIndex !== null ? 'scale(1.08)' : 'scale(1)',
                      transformOrigin: 'center'
                    }}
                  />

                  {/* 2. Thin Technical Dash Orbit Radar Ring (Spectacular Premium Detail) */}
                  <circle
                    cx="100"
                    cy="100"
                    r="92"
                    fill="transparent"
                    stroke="#3c096c"
                    className="opacity-[0.08]"
                    strokeWidth="0.75"
                    strokeDasharray="3 4"
                  />

                  {/* 3. Base Track Ring */}
                  <circle
                    cx="100"
                    cy="100"
                    r="80"
                    fill="transparent"
                    stroke="#f3f4f6"
                    className="dark:stroke-zinc-800"
                    strokeWidth="11.5"
                    style={{ opacity: hoveredIndex !== null ? 0.35 : 0.8, transition: 'opacity 0.3s ease' }}
                  />

                  {/* 4. Contiguous Rounded Slices */}
                  {slices.map((slice, index) => {
                    const isHovered = hoveredIndex === index;
                    const anyHovered = hoveredIndex !== null;
                    return (
                      <circle
                        key={index}
                        cx="100"
                        cy="100"
                        r="80"
                        fill="transparent"
                        stroke={slice.color}
                        strokeWidth={isHovered ? "15.5" : "11.5"}
                        strokeDashoffset={mounted ? slice.strokeOffset : "502.65"}
                        strokeDasharray={(slice.strokeLength - 5.5) + " 502.65"}
                        filter={isHovered ? "url(#soft-neon-glow)" : undefined}
                        className="transition-all duration-500 cursor-pointer"
                        onMouseEnter={() => setHoveredIndex(index)}
                        onMouseLeave={() => setHoveredIndex(null)}
                        style={{
                          transformOrigin: 'center',
                          transform: isHovered ? 'scale(1.025)' : 'scale(1)',
                          transition: `transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.25) 0ms, stroke-width 0.3s ease 0ms, stroke-dashoffset 1.1s cubic-bezier(0.25, 1, 0.5, 1) ${mounted ? index * 120 : 0}ms, opacity 0.3s ease 0ms`,
                          opacity: anyHovered && !isHovered ? 0.3 : 1,
                          pointerEvents: 'stroke' // Solves always-selected collision hover bug!
                        }}
                      />
                    );
                  })}
                </svg>

                {/* Donut Hole - Center Details Display */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 pointer-events-none select-none z-10">
                  {(() => {
                    const activeSlice = hoveredIndex !== null ? slices[hoveredIndex] : slices[0];
                    if (!activeSlice) return null;
                    return (
                      <div className="flex flex-col items-center justify-center mt-1.5">
                        <span 
                          className="text-[0.62rem] sm:text-[0.65rem] font-black uppercase tracking-[0.24em] px-3 py-1 rounded-full mb-1.5 transition-all duration-300 border"
                          style={{
                            backgroundColor: 'rgba(255, 145, 0, 0.08)',
                            borderColor: 'rgba(255, 145, 0, 0.25)',
                            color: '#ff9100'
                          }}
                        >
                          {hoveredIndex !== null ? 'Selected' : 'Top Hours'}
                        </span>
                        <p className="text-sm sm:text-base font-black text-[#1a0030] dark:text-white truncate max-w-[10.5rem] mt-1 leading-tight tracking-tight">
                          {activeSlice.name}
                        </p>
                        <p className="text-[0.62rem] text-gray-400 font-bold mt-1 uppercase tracking-wider">
                          {activeSlice.course} — Year {activeSlice.year}
                        </p>
                        <div className="w-8 h-0.5 bg-gray-100 dark:bg-zinc-800 rounded-full my-2.5" />
                        <p className="text-2xl sm:text-3xl font-black text-[#3c096c] dark:text-[#ff9100] leading-none drop-shadow-sm font-mono tracking-tight transition-all duration-300">
                          {formatDuration(activeSlice.duration)}
                        </p>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Legend Grid with Clean Interactive Cards */}
              <div className="w-full flex flex-col gap-1.5">
                {slices.map((slice, index) => {
                  const isHovered = hoveredIndex === index;
                  const anyHovered = hoveredIndex !== null;
                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all border cursor-pointer select-none"
                      onMouseEnter={() => setHoveredIndex(index)}
                      onMouseLeave={() => setHoveredIndex(null)}
                      style={{
                        backgroundColor: isHovered ? slice.color + '08' : 'transparent',
                        borderColor: isHovered ? slice.color + '35' : 'transparent',
                        transform: isHovered ? 'scale(1.02) translateX(4px)' : 'scale(1) translateX(0px)',
                        boxShadow: isHovered ? '0 4px 12px ' + slice.color + '06' : 'none',
                        opacity: anyHovered && !isHovered ? 0.45 : 1,
                        transition: 'all 0.3s cubic-bezier(0.25, 1, 0.5, 1)'
                      }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: slice.color, boxShadow: isHovered ? '0 0 6px ' + slice.color : 'none' }} />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#1a0030] dark:text-white truncate max-w-[10.5rem]">{slice.name}</p>
                          <p className="text-[0.55rem] text-gray-400 font-medium font-mono">{slice.id}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-black text-[#3c096c] dark:text-[#ff9100]">{formatDuration(slice.duration)}</p>
                        <p className="text-[0.52rem] text-gray-400 font-semibold font-mono">{Math.round(slice.actualPct * 100)}% share</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── RIGHT: System Overview & CCS Laboratories ── */}
          <div className="col-span-12 lg:col-span-7 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 bg-[#ff9100] rounded-full" />
              <h2 className="font-black text-[#1a0030] text-base tracking-tight">System Overview</h2>
            </div>

            {/* Longest Sessions Vertical Column Bar Graph - Spectacular Modern Telemetry Analytics */}
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 flex flex-col gap-6 relative overflow-hidden group/card">
              {/* Subtle background dynamic abstract grid details for premium feel */}
              <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ff7b00 1px, transparent 0), radial-gradient(#7b2cbf 1px, transparent 0)', backgroundSize: '16px 16px', backgroundPosition: '0 0, 8px 8px' }} />

              <div className="flex items-center justify-between z-10">
                <div className="flex items-center gap-2">

                  <div>
                    <h3 className="font-black text-[#1a0030] text-sm tracking-tight">Record Sessions</h3>
                    <p className="text-[0.62rem] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Top 5 Student Record Milestones</p>
                  </div>
                </div>

              </div>

              {/* Vertical Column Chart Area */}
              <div className="relative w-full h-56 flex items-end justify-between px-2 pt-8 pb-1 border-b border-gray-200/80 z-10 select-none">
                {(() => {
                  const maxDuration = Math.max(...topIndividualSessions.map(s => s.duration), 1);
                  const COLORS = ['#ff7b00', '#7b2cbf', '#3f37c9', '#00b4d8', '#ff5c8a'];

                  return topIndividualSessions.map((student, index) => {
                    const pct = Math.round(Math.pow(student.duration / maxDuration, 0.45) * 100);
                    const color = COLORS[index % COLORS.length];

                    return (
                      <div
                        key={index}
                        className="flex flex-col items-center flex-1 h-full justify-end group/col relative cursor-pointer"
                        onMouseEnter={() => setHoveredIndex(index)}
                        onMouseLeave={() => setHoveredIndex(null)}
                      >
                        {/* Interactive floating duration above bar */}
                        <span className="absolute -top-7 text-[0.62rem] sm:text-[0.68rem] font-black text-[#1a0030] dark:text-white font-mono bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 px-2 py-0.5 rounded shadow-sm opacity-90 group-hover/col:opacity-100 group-hover/col:-translate-y-1 transition-all duration-300">
                          {formatDuration(student.duration)}
                        </span>

                        {/* Interactive Vertical Column Bar */}
                        <div
                          className="w-10 sm:w-14 rounded-t-xl relative overflow-hidden"
                          style={{
                            height: `${mounted ? pct : 0}%`,
                            backgroundColor: color,
                            boxShadow: hoveredIndex === index ? `0 0 16px ${color}80, inset 0 2px 4px rgba(255,255,255,0.3)` : `0 0 6px ${color}15, inset 0 1px 2px rgba(255,255,255,0.25)`,
                            transform: hoveredIndex === index ? 'scale(1.06) translateY(-2px)' : 'scale(1) translateY(0px)',
                            transformOrigin: 'bottom',
                            transition: `height 1.3s cubic-bezier(0.34, 1.56, 0.64, 1) ${mounted ? index * 120 : 0}ms, transform 0.3s cubic-bezier(0.25, 1, 0.5, 1) 0ms, box-shadow 0.3s ease 0ms`
                          }}
                        >
                          {/* Minimalist circular Rank number instead of emoji, only if bar has enough height */}
                          {pct >= 15 && (
                            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-[0.62rem] font-bold text-white leading-none">
                              {index + 1}
                            </div>
                          )}

                          {/* Inner premium glass specular shine highlight */}
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/col:animate-[pulse_1.5s_infinite]" style={{ width: '50%' }} />
                        </div>

                        {/* Custom Axis Label Under Bar */}
                        <div className="absolute -bottom-8 flex flex-col items-center">
                          <p className="text-[0.62rem] sm:text-[0.68rem] font-black text-[#1a0030] dark:text-white truncate max-w-[4rem] tracking-tight">
                            {student.name.split(' ')[0]}
                          </p>
                          <span className="text-[0.52rem] text-gray-400 font-bold uppercase tracking-wider scale-90">
                            {student.course}
                          </span>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>

              {/* Extra spacing to accommodate X-axis labels */}
              <div className="h-2" />

              {/* Breathtaking dynamic interactive detailed telemetric console pane */}
              <div className="w-full bg-gray-50/60 dark:bg-zinc-800/40 border border-gray-100 dark:border-zinc-700/80 rounded-xl p-3 flex items-center justify-between min-h-[4.25rem] z-10 transition-all duration-300">
                {(() => {
                  const activeStudent = hoveredIndex !== null ? topIndividualSessions[hoveredIndex] : topIndividualSessions[0];
                  const activeIndex = hoveredIndex !== null ? hoveredIndex : 0;
                  const color = COLORS[activeIndex % COLORS.length];

                  if (!activeStudent) {
                    return (
                      <p className="text-[0.62rem] text-gray-400 font-bold uppercase tracking-wider mx-auto">
                        Hover over columns to query telemetry
                      </p>
                    );
                  }
                  return (
                    <div className="flex items-center justify-between w-full transition-all duration-300 animate-fadeIn">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-[0.55rem] font-black text-white px-2.5 py-1 rounded uppercase tracking-wider font-mono shrink-0 shadow-sm" style={{ backgroundColor: color }}>
                          Rank #{activeIndex + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-black text-[#1a0030] dark:text-white truncate">{activeStudent.name}</p>
                          <p className="text-[0.58rem] text-gray-400 font-bold uppercase mt-0.5 tracking-wider">
                            {activeStudent.course} — Year {activeStudent.year} • <span className="font-mono">{activeStudent.id}</span>
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-black text-[#3c096c] dark:text-[#ff9100] font-mono bg-white dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 px-2 py-0.5 rounded shadow-sm">
                          {formatDuration(activeStudent.duration)}
                        </p>
                        <p className="text-[0.52rem] text-gray-400 font-bold uppercase mt-0.5 tracking-widest">Single Longest check-in</p>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Redesigned CCS Laboratories Overview */}
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden flex flex-col gap-1">
              <div className="flex items-center justify-between px-5 py-4.5 border-b border-gray-50">
                <div className="flex items-center gap-2.5">
                  <div className="w-7.5 h-7.5 rounded-xl bg-[#3c096c]/08 flex items-center justify-center">
                    <IcoMonitor cls="w-4 h-4 text-[#3c096c]" />
                  </div>
                  <div>
                    <h3 className="font-black text-[#1a0030] text-sm leading-none">CCS Laboratories</h3>
                    <p className="text-[0.58rem] text-gray-400 font-bold mt-1 uppercase tracking-widest">Real-time status</p>
                  </div>
                </div>
                <span className="text-[0.58rem] font-bold text-[#3c096c] bg-[#3c096c]/08 px-3 py-1.5 rounded-full uppercase tracking-wider">8 Labs Registered</span>
              </div>

              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {LABS.map(lab => {
                  const pct = Math.round((lab.occupied / lab.capacity) * 100);
                  const isClosed = lab.status === 'closed';
                  const isBusy = lab.status === 'busy' || lab.occupied >= lab.capacity;

                  return (
                    <div key={lab.id} className={"bg-gray-50 border border-gray-100 rounded-2xl p-4 flex flex-col justify-between gap-3.5 transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:shadow-[#3c096c]/05 " + (
                      isClosed ? 'opacity-60 cursor-default' :
                        isBusy ? 'hover:border-[#ff9100]/30' : 'hover:border-[#3c096c]/20'
                    )}>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-black text-[#1a0030]">Lab {lab.id}</p>
                          <p className="text-[0.58rem] text-gray-400 font-bold uppercase tracking-widest mt-0.5">{lab.floor} Floor</p>
                        </div>
                        <span className={"inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[0.55rem] font-bold uppercase tracking-wider " + (
                          isClosed ? 'bg-gray-100 text-gray-500' :
                            isBusy ? 'bg-[#ff9100]/10 text-[#ff9100]' : 'bg-green-50 text-green-600'
                        )}>
                          <span className={"w-1.5 h-1.5 rounded-full " + (
                            isClosed ? 'bg-gray-400' :
                              isBusy ? 'bg-[#ff9100] animate-pulse' : 'bg-green-500 animate-pulse'
                          )} />
                          {isClosed ? 'Closed' : isBusy ? 'Full' : 'Open'}
                        </span>
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-[0.62rem] text-gray-400 font-black uppercase tracking-wider mb-1.5">
                          <span>PC Status</span>
                          <span className={"font-mono font-bold " + (isClosed ? 'text-gray-400' : isBusy ? 'text-[#ff9100]' : 'text-[#3c096c]')}>
                            {lab.occupied}/{lab.capacity} PCs
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                          <div className={"h-full rounded-full transition-all duration-500 " + (
                            isClosed ? 'bg-gray-300' :
                              isBusy ? 'bg-[#ff9100]' : 'bg-gradient-to-r from-[#3c096c] to-[#ff9100]'
                          )} style={{ width: pct + "%" }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="px-5 pb-5 flex items-center gap-5">
                {[['bg-green-400', 'Open'], ['bg-[#ff9100]', 'In Use / Busy'], ['bg-gray-300', 'Closed']].map(([c, l]) => (
                  <div key={l} className="flex items-center gap-1.5">
                    <span className={"w-2 h-2 rounded-full " + c} />
                    <span className="text-[0.58rem] font-bold uppercase tracking-widest text-gray-400">{l}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}