import React, { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import ccsLogo from '../assets/ccsmainlogo.png'
import { authService } from '../services/authService'

// ── Minimal SVG icons for features ──
const IconMonitor = () => (
  <svg className="w-6 h-6 text-[#ff9100]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <rect x="2" y="3" width="20" height="14" rx="2" strokeLinecap="round" strokeLinejoin="round" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 21h8M12 17v4" />
  </svg>
)

const IconUsers = () => (
  <svg className="w-6 h-6 text-[#ff9100]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
    <circle cx="9" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
  </svg>
)

const IconCalendar = () => (
  <svg className="w-6 h-6 text-[#ff9100]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <rect x="3" y="4" width="18" height="18" rx="2" strokeLinecap="round" strokeLinejoin="round" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 2v4M8 2v4M3 10h18" />
  </svg>
)

const FEATURES = [
  { Icon: IconMonitor, title: 'Real-time Availability', desc: 'See which labs are open or full the moment you check — no guessing.' },
  { Icon: IconUsers, title: 'Seat Counter', desc: 'Know exactly how many seats are taken before you walk to the lab.' },
  { Icon: IconCalendar, title: 'Schedule View', desc: 'Browse class schedules per lab so you can plan your sit-in ahead.' },
]

const FAQS = [
  {
    q: 'What is a "Sit-in"?',
    a: 'A sit-in allows computer studies students to utilize unoccupied laboratory computers for self-paced programming practice, academic assignments, or independent study when no classes are in session.'
  },
  {
    q: 'Who is authorized to sit-in?',
    a: 'Sit-in privileges are exclusively granted to currently enrolled students of the College of Computer Studies (CCS) who have a valid student account.'
  },
  {
    q: 'How do I start a sit-in session?',
    a: 'First, log into your student portal to check real-time lab seat availability. Once you locate an open PC, check in with the lab supervisor or scan your credential to begin your session!'
  },
  {
    q: 'What are the core laboratory rules?',
    a: 'Students must maintain absolute silence, strictly refrain from bringing food or drinks into the lab, avoid altering any computer hardware/software configurations, and clean up their workstation before departure.'
  },
  {
    q: 'How do I end my session?',
    a: 'When you are finished, make sure to log out from the PC and confirm session termination with the lab supervisor at the gate to ensure your duration is recorded accurately.'
  },
  {
    q: 'Where can I see my sit-in history and remaining hours?',
    a: 'Log into your Student Dashboard! It displays your current sit-in history, total hours spent, and any pending reservation details.'
  }
]
// Modern minimal SVG icon components for high-end styling
const MonitorIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
    <path d="M8 21h8" />
    <path d="M12 17v4" />
  </svg>
);

const TrophyIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 9H4.5a2.5 2.5 0 010-5H6M18 9h1.5a2.5 2.5 0 000-5H18M4 22h16M10 14.66V17c0 .55.45 1 1 1h2c.55 0 1-.45 1-1v-2.34M12 2a6 6 0 016 6v3a6 6 0 01-12 0V8a6 6 0 016-6z" />
  </svg>
);

const CrownIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 19h18" />
  </svg>
);

const MinimalHourIcon = ({ className = "w-3.5 h-3.5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export default function Landing() {
  const [typed, setTyped] = useState('')
  const [cursorOn, setCursorOn] = useState(true)
  const [wordIdx, setWordIdx] = useState(0)
  const [deleting, setDeleting] = useState(false)
  const [openFaqIdx, setOpenFaqIdx] = useState(null)

  // Helper to format total_hours string nicely (e.g. 21.5 -> 21hrs 30mins, 21 -> 21hrs)
  const formatLeaderboardTime = (totalHoursStr) => {
    const num = parseFloat(totalHoursStr);
    if (isNaN(num)) return "0hrs";
    const hours = Math.floor(num);
    const mins = Math.round((num - hours) * 60);
    if (mins > 0) {
      return `${hours}hrs ${mins}mins`;
    }
    return `${hours}hrs`;
  };

  // Real-time dynamic labs state with default mock fallbacks
  const [labs, setLabs] = useState([
    { id: 1, lab_name: 'Lab 524', floor: 5, total_pcs: 40, available_pcs: 28, status: 'active' },
    { id: 2, lab_name: 'Lab 526', floor: 5, total_pcs: 38, available_pcs: 0, status: 'active' },
    { id: 3, lab_name: 'Lab 528', floor: 5, total_pcs: 40, available_pcs: 40, status: 'active' },
    { id: 4, lab_name: 'Lab 530', floor: 5, total_pcs: 36, available_pcs: 15, status: 'active' },
  ])
  const [syncingStatus, setSyncingStatus] = useState('Syncing data...')

  const words = ['Open.', 'Available.', 'Ready.']

  useEffect(() => {
    const target = words[wordIdx]
    let t
    if (!deleting && typed.length < target.length)
      t = setTimeout(() => setTyped(target.slice(0, typed.length + 1)), 80)
    else if (!deleting && typed.length === target.length)
      t = setTimeout(() => setDeleting(true), 1600)
    else if (deleting && typed.length > 0)
      t = setTimeout(() => setTyped(typed.slice(0, -1)), 45)
    else { setDeleting(false); setWordIdx(i => (i + 1) % words.length) }
    return () => clearTimeout(t)
  }, [typed, deleting, wordIdx])

  useEffect(() => {
    const t = setInterval(() => setCursorOn(p => !p), 500)
    return () => clearInterval(t)
  }, [])

  const fallbackTestimonials = [
    {
      record_id: null,
      first_name: 'Gabriel',
      last_name: 'Satorre',
      course: 'BSIT',
      room: 'Lab 524',
      rating: 5,
      likes: 15,
      feedback: 'The PC performance is exceptionally smooth! Check-in was fast, and the environment is very peaceful for coding homework.',
      date: 'May 2026'
    },
    {
      record_id: null,
      first_name: 'Krystel',
      last_name: 'Bernardo',
      course: 'BSCS',
      room: 'Lab 528',
      rating: 5,
      likes: 12,
      feedback: 'I love using the Seat Counter before walking all the way up to 5th floor. Absolute game changer for computer studies students!',
      date: 'May 2026'
    },
    {
      record_id: null,
      first_name: 'Daryl',
      last_name: 'Almonte',
      course: 'BSIT',
      room: 'Lab 530',
      rating: 5,
      likes: 8,
      feedback: 'Highly recommended. Clean workstations and prompt assistance from the lab supervisors when I had internet problems.',
      date: 'Apr 2026'
    }
  ];

  const [testimonials, setTestimonials] = useState(fallbackTestimonials);
  const [leaderboard, setLeaderboard] = useState([]);
  const [selectedStars, setSelectedStars] = useState(0);
  const leaderboardRef = useRef(null);
  const testimonialsRef = useRef(null);
  const [podiumProgress, setPodiumProgress] = useState(1);
  const [testimonialsProgress, setTestimonialsProgress] = useState(1);

  useEffect(() => {
    const handleScroll = () => {
      // If at the very top of the page (e.g. clicked Home), immediately reset both sections to fully open/expanded
      if (window.scrollY < 50) {
        setPodiumProgress(1);
        setTestimonialsProgress(1);
        return;
      }

      // 1. Leaderboard scroll progress
      if (leaderboardRef.current) {
        const rect = leaderboardRef.current.getBoundingClientRect();
        const threshold = 180;
        if (rect.top <= threshold) {
          const range = threshold + rect.height;
          const current = rect.top + rect.height;
          const progress = Math.max(0, Math.min(1, current / range));
          setPodiumProgress(progress);
        } else {
          setPodiumProgress(1);
        }
      }

      // 2. Testimonials scroll progress
      if (testimonialsRef.current) {
        const rect = testimonialsRef.current.getBoundingClientRect();
        const threshold = 180;
        if (rect.top <= threshold) {
          const range = threshold + rect.height;
          const current = rect.top + rect.height;
          const progress = Math.max(0, Math.min(1, current / range));
          setTestimonialsProgress(progress);
        } else {
          setTestimonialsProgress(1);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleScroll);
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  // Sync real-time labs status from the database
  useEffect(() => {
    let active = true
    const loadLabs = async () => {
      try {
        const data = await authService.fetchLabAvailability()
        if (active && data && data.length > 0) {
          setLabs(data)
          setSyncingStatus('Synced data')
          setTimeout(() => {
            if (active) setSyncingStatus('Syncing data...')
          }, 2000)
        }
      } catch (err) {
        console.error("Failed to fetch lab availability:", err)
        if (active) setSyncingStatus('Offline mode')
      }
    }

    const loadTestimonials = async () => {
      try {
        const response = await fetch(authService.getActionUrl('getTestimonials.php'));
        const result = await response.json();
        if (result.success && result.data && result.data.length > 0) {
          // Sort them by likes desc, just in case
          const sorted = [...result.data].sort((a, b) => b.likes - a.likes);
          setTestimonials(sorted);
        }
      } catch (err) {
        console.error("Failed to fetch testimonials:", err);
      }
    };

    const loadLeaderboard = async () => {
      try {
        const response = await fetch(authService.getActionUrl('getLeaderboard.php'));
        const result = await response.json();
        if (result.success && result.data && result.data.length > 0) {
          setLeaderboard(result.data);
        }
      } catch (err) {
        console.error("Failed to fetch leaderboard:", err);
      }
    };

    loadLabs()
    loadTestimonials()
    loadLeaderboard()
    const interval = setInterval(() => {
      loadLabs()
      loadTestimonials()
      loadLeaderboard()
    }, 10000) // sync every 10 seconds
    return () => {
      active = false
      clearInterval(interval)
    }
  }, [])

  // Auto-swap Hero card between Labs Monitor and Leaderboard every 6 seconds with premium transitions
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveHeroTab(prev => prev === 'labs' ? 'leaderboard' : 'labs');
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const [likedIds, setLikedIds] = useState(() => {
    try {
      const saved = localStorage.getItem('sitin_liked_testimonials');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const handleLikeTestimonial = async (record_id, index) => {
    const identifier = record_id ? `real_${record_id}` : `fallback_${index}`;

    // Prevent double liking on this device/browser
    if (likedIds.includes(identifier)) return;

    // Track the new liked identifier
    const newLikedIds = [...likedIds, identifier];
    setLikedIds(newLikedIds);
    try {
      localStorage.setItem('sitin_liked_testimonials', JSON.stringify(newLikedIds));
    } catch (e) {
      console.error("Failed to save likes to localStorage", e);
    }

    // If it's a real testimonial in DB
    if (record_id) {
      try {
        // Optimistic UI Update for maximum responsiveness!
        setTestimonials(prev => {
          const updated = prev.map(t => t.record_id === record_id ? { ...t, likes: (t.likes || 0) + 1 } : t);
          return updated.sort((a, b) => (b.likes || 0) - (a.likes || 0));
        });

        // Trigger backend increment
        await fetch(authService.getActionUrl('likeTestimonial.php'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ record_id })
        });
      } catch (err) {
        console.error("Failed to like testimonial:", err);
      }
    } else {
      // Mock testimonial like
      setTestimonials(prev => {
        const updated = prev.map((t, idx) => idx === index ? { ...t, likes: (t.likes || 0) + 1 } : t);
        return updated.sort((a, b) => (b.likes || 0) - (a.likes || 0));
      });
    }
  };

  // Compute dynamic stats
  const displayTotalLabs = labs.length > 0 ? labs.length : 8
  const displayTotalSeats = labs.length > 0 ? labs.reduce((acc, l) => acc + (l.total_pcs || 0), 0) : 316

  return (
    <div className="min-h-screen bg-transparent">
      <style dangerouslySetInnerHTML={{
        __html: `
        .live-badge-text {
          color: #3c096c !important;
          font-size: 0.68rem !important;
        }
        .dark .live-badge-text {
          color: #e0aaff !important;
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes shimmerGlow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes floatGold {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        @keyframes fillBar {
          from { width: 0%; }
          to { width: var(--progress-width); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .animate-float-gold {
          animation: floatGold 4s ease-in-out infinite;
        }
        .shimmer-gradient-bg {
          background-size: 200% 200%;
          animation: shimmerGlow 8s ease infinite;
        }
        .progress-bar-fill {
          animation: fillBar 1.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes neonPulse {
          0%, 100% { 
            border-color: rgba(245, 158, 11, 0.3); 
            box-shadow: 0 0 15px rgba(245, 158, 11, 0.1); 
          }
          50% { 
            border-color: rgba(245, 158, 11, 0.65); 
            box-shadow: 0 0 30px rgba(245, 158, 11, 0.35); 
          }
        }
        .animate-neon-pulse {
          animation: neonPulse 3s ease-in-out infinite;
        }
        @keyframes growPodium {
          from { transform: scaleY(0); }
          to { transform: scaleY(1); }
        }
        .animate-grow-podium {
          transform-origin: bottom;
          animation: growPodium 1.4s cubic-bezier(0.175, 0.885, 0.32, 1.2) forwards;
        }
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: flex;
          width: max-content;
          animation: marquee 30s linear infinite;
        }
      `}} />

      {/* Ambient background glows for 3D depth */}
      <div className="absolute top-20 left-10 md:left-24 w-72 md:w-96 h-72 md:h-96 rounded-full bg-[#3c096c]/5 dark:bg-[#7b2cbf]/5 blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-40 right-10 md:right-32 w-80 h-80 rounded-full bg-[#ff9100]/5 blur-3xl pointer-events-none -z-10 animate-pulse" />

      {/* ─── HERO ─── */}
      <section className="relative max-w-6xl mx-auto px-6 pt-16 pb-24 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">

        {/* LEFT (col-span-6) */}
        <div className="lg:col-span-6 flex flex-col">
          <div
            className="inline-flex items-center gap-2.5 self-start mb-6 px-4.5 py-2 rounded-full border border-purple-500/15 dark:border-purple-400/10 bg-purple-500/5 dark:bg-purple-400/5 backdrop-blur-md shadow-inner"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            <span className="live-badge-text font-black uppercase tracking-widest text-[0.68rem]">
              Lab Status · CCS
            </span>
          </div>

          <h1 className="text-5xl lg:text-7xl font-extrabold leading-[1.08] tracking-tight text-[#1a0030] dark:text-white mb-6">
            Find a Lab<br />
            That's{' '}
            <span className="bg-gradient-to-r from-[#ff9100] via-amber-500 to-yellow-400 bg-clip-text text-transparent font-black drop-shadow-sm select-none">
              {typed}
            </span>
            <span className="text-[#3c096c] dark:text-[#ff9100] transition-opacity animate-pulse ml-0.5 font-light">|</span>
          </h1>

          <p className="text-base md:text-lg text-gray-500 dark:text-purple-200/90 leading-relaxed max-w-lg mb-9">
            Welcome to the <span className="font-extrabold text-[#3c096c] dark:text-[#ff9100]">CCS Sit-in Command Center</span>. Check real-time lab capacity, active PC counts, and class schedules instantly before stepping out.
          </p>

          <div className="flex items-center gap-4 flex-wrap mb-12">
            <Link to="/signup" className="group relative bg-[#ff9100] text-[#3c096c] font-black px-8 py-4 rounded-full shadow-lg shadow-[#ff9100]/25 hover:shadow-xl hover:shadow-[#ff9100]/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 flex items-center gap-2">
              Get Started Free
              <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
            </Link>
            <Link to="/login" className="text-[#3c096c] dark:text-white font-extrabold px-8 py-4 rounded-full border border-purple-500/20 dark:border-white/10 hover:border-[#3c096c] dark:hover:border-white hover:bg-[#3c096c]/5 dark:hover:bg-white/5 transition-all duration-300">
              Log In
            </Link>
          </div>

          <div className="flex items-center gap-10 pt-8 border-t border-purple-500/10 dark:border-white/10">
            {[[String(displayTotalLabs), 'Total Labs'], [String(displayTotalSeats), 'Total Seats'], ['99.9%', 'Uptime']].map(([n, l]) => (
              <div key={l} className="flex flex-col gap-1">
                <div className="text-3xl font-black tracking-tight text-[#3c096c] dark:text-[#ff9100]">{n}</div>
                <div className="text-[0.68rem] uppercase tracking-widest font-bold text-gray-400 dark:text-purple-300/70">{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT (col-span-6) */}
        <div className="lg:col-span-6 flex flex-col justify-center items-center w-full relative">
          <div className="w-full max-w-lg lg:max-w-xl">

            {/* ─── LEADERBOARD CONTAINER ─── */}
            <div
              ref={leaderboardRef}
              style={{
                opacity: podiumProgress,
                transform: `scale(${0.85 + 0.15 * podiumProgress}) translateY(${(1 - podiumProgress) * -20}px)`,
                transformOrigin: 'top center',
                transition: 'transform 0.15s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.15s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
              className="w-full bg-white/95 dark:bg-[#140828]/85 backdrop-blur-2xl rounded-[2rem] border border-purple-500/15 dark:border-purple-400/10 shadow-2xl shadow-purple-900/10 dark:shadow-none overflow-hidden"
            >
              {/* CLEAN DEDICATED HEADER */}
              <div className="bg-[#3c096c] dark:bg-linear-to-r dark:from-[#150527] dark:to-[#240046] px-6 py-4.5 flex items-center justify-between border-b border-purple-500/10 dark:border-white/10">
                <span className="text-[0.8rem] font-black uppercase tracking-widest text-white flex items-center gap-2">
                  <TrophyIcon className="w-4.5 h-4.5 text-[#ff9100]" /> Sit-in Leaderboard
                </span>
                <div className="flex gap-1.5 items-center bg-[#240046]/40 dark:bg-black/35 px-3 py-1.5 rounded-full border border-purple-500/20 dark:border-white/5">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <span className="text-[0.6rem] font-black uppercase text-amber-400 tracking-wider">Top 5 Leaders</span>
                </div>
              </div>

              {/* DYNAMIC SPOTLIGHT & RANKING STACK LAYOUT */}
              <div className="p-4 flex flex-col gap-4">
                {leaderboard.length === 0 ? (
                  /* GORGEOUS PREMIUM LOADING SKELETON */
                  <div className="flex flex-col gap-4 animate-pulse">
                    {/* Rank 1 Skeleton */}
                    <div className="rounded-[1.5rem] border border-purple-500/10 dark:border-white/5 bg-slate-100/50 dark:bg-white/5 p-5 flex items-center justify-between h-[88px] relative overflow-hidden">
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-zinc-800" />
                        <div className="flex flex-col gap-2">
                          <div className="h-3.5 bg-slate-200 dark:bg-zinc-800 rounded-full w-20" />
                          <div className="h-4.5 bg-slate-200 dark:bg-zinc-800 rounded-full w-28" />
                        </div>
                      </div>
                      <div className="w-16 h-8 bg-slate-200 dark:bg-zinc-800 rounded-2xl" />
                    </div>
                    {/* Ranks 2 - 5 Skeleton Stack */}
                    <div className="flex flex-col gap-3">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className="bg-slate-50 dark:bg-black/25 border border-purple-500/10 dark:border-white/5 rounded-2xl p-3.5 flex items-center justify-between h-[64px]">
                          <div className="flex items-center gap-3 w-full">
                            <div className="w-10 h-5 bg-slate-200 dark:bg-zinc-800 rounded-full" />
                            <div className="w-8.5 h-8.5 rounded-xl bg-slate-200 dark:bg-zinc-800" />
                            <div className="flex flex-col gap-1.5 w-1/2">
                              <div className="h-3 bg-slate-200 dark:bg-zinc-800 rounded-full w-20" />
                              <div className="h-2.5 bg-slate-200 dark:bg-zinc-800 rounded-full w-28" />
                            </div>
                          </div>
                          <div className="w-12 h-4 bg-slate-200 dark:bg-zinc-800 rounded-full" />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    {/* PODIUM VISUALIZATION (Ranks 1, 2, 3) */}
                    <div className="flex items-end justify-center gap-2.5 pt-6 pb-2 px-1 relative">
                      {/* Rank 2 (Left Podium) */}
                      {leaderboard[1] && (
                        <div className="flex flex-col items-center flex-1 min-w-0 group/column cursor-pointer transition-all duration-500 ease-out hover:-translate-y-3" style={{ animationDelay: '0.2s' }}>
                          {/* Avatar block */}
                          <div className="relative mb-3.5">
                            {/* Halo Glow */}
                            <div className="absolute -inset-1 bg-slate-300/10 rounded-full blur-xs pointer-events-none group-hover/column:scale-110 transition-transform duration-500" />
                            <div className="w-18 h-18 rounded-full bg-slate-200 dark:bg-zinc-800 border-2 border-slate-300 dark:border-zinc-500/50 shadow-md shadow-black/10 overflow-hidden flex items-center justify-center shrink-0 transition-transform duration-500 ease-out group-hover/column:scale-105 group-hover/column:rotate-2 relative z-10">
                              {leaderboard[1].profile_picture ? (
                                <img src={leaderboard[1].profile_picture} alt="Rank 2" className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-slate-800 dark:text-zinc-300 font-black text-lg uppercase">{leaderboard[1].first_name[0] || 'S'}</span>
                              )}
                            </div>
                            {/* Floating Silver Rank Crest Badge */}
                            <span className="absolute -top-1 -right-1 bg-gradient-to-r from-slate-300 via-slate-100 to-slate-400 text-slate-900 font-extrabold text-[0.58rem] px-2 py-0.5 rounded-md border border-white dark:border-zinc-950 shadow-md shrink-0 uppercase tracking-widest z-20 select-none transition-transform duration-500 group-hover/column:scale-110 group-hover/column:-rotate-6">
                              2nd
                            </span>
                          </div>
                          <span className="text-[0.8rem] font-black text-slate-800 dark:text-zinc-300 truncate w-full text-center tracking-tight leading-tight transition-colors duration-300 group-hover/column:text-purple-600 dark:group-hover/column:text-purple-300">
                            {leaderboard[1].first_name}
                          </span>
                          <div className="mt-2 flex items-center gap-1 bg-slate-100 dark:bg-purple-950/40 border border-purple-500/10 dark:border-white/5 rounded-full px-3 py-1 text-[0.75rem] font-black text-slate-800 dark:text-purple-300/90 shadow-sm shrink-0 transition-transform duration-500 group-hover/column:scale-105">
                            <MinimalHourIcon className="w-4 h-4 text-purple-600 dark:text-purple-300/80" />
                            <span>{formatLeaderboardTime(leaderboard[1].total_hours)}</span>
                          </div>
                          {/* Podium Pillar */}
                          <div className="w-full bg-gradient-to-t from-slate-200 to-slate-100 dark:from-zinc-950 dark:via-[#1c1917]/80 dark:to-zinc-900/60 h-28 rounded-t-xl mt-3.5 relative overflow-hidden flex flex-col justify-end pb-3 border-t border-slate-300/30 dark:border-white/5 animate-grow-podium shadow-lg shadow-black/5 hover:shadow-purple-500/10 transition-all duration-300">
                            {/* Sleek metallic top shelf border */}
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-slate-400 via-slate-100 to-slate-400 shadow-[0_1px_4px_rgba(255,255,255,0.15)] z-20" />
                            {/* Vertical Glowing Light Stripe */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-full bg-gradient-to-b from-purple-400/35 to-transparent blur-[0.5px]" />
                            <span className="text-6xl font-extrabold bg-gradient-to-b from-slate-400/20 to-transparent bg-clip-text text-transparent absolute inset-0 flex items-center justify-center select-none pointer-events-none mt-2 font-sans">2</span>
                          </div>
                        </div>
                      )}

                      {/* Rank 1 (Center Podium - Highest) */}
                      {leaderboard[0] && (
                        <div className="flex flex-col items-center flex-1 min-w-0 group/column cursor-pointer transition-all duration-500 ease-out hover:-translate-y-4 z-10" style={{ animationDelay: '0.1s' }}>
                          {/* Avatar block */}
                          <div className="relative mb-4">
                            {/* Glowing halo */}
                            <div className="absolute -inset-2 bg-amber-400/25 rounded-full blur-xs pointer-events-none group-hover/column:scale-110 transition-transform duration-500" />
                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 to-[#ff9100] border-2 border-amber-400 dark:border-amber-400/80 shadow-lg shadow-amber-500/30 overflow-hidden flex items-center justify-center shrink-0 relative z-10 transition-transform duration-500 ease-out group-hover/column:scale-105 group-hover/column:rotate-2">
                              {leaderboard[0].profile_picture ? (
                                <img src={leaderboard[0].profile_picture} alt="Rank 1" className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-white font-black text-2xl uppercase">{leaderboard[0].first_name[0] || 'C'}</span>
                              )}
                            </div>
                            {/* Floating Golden Rank Crest Badge */}
                            <span className="absolute -top-1.5 -right-1.5 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-purple-950 font-black text-[0.62rem] px-2 py-0.5 rounded-md border border-white dark:border-purple-950 shadow-md shrink-0 uppercase tracking-widest z-20 select-none transition-transform duration-500 group-hover/column:scale-115 group-hover/column:rotate-6">
                              1st
                            </span>
                          </div>
                          <span className="text-sm md:text-base font-black text-[#3c096c] dark:text-[#ff9100] truncate w-full text-center tracking-tight leading-tight transition-all duration-300 group-hover/column:scale-105">
                            {leaderboard[0].first_name}
                          </span>
                          <div className="mt-2 flex items-center gap-1.5 bg-amber-400 text-[#3c096c] dark:bg-amber-400/10 dark:text-amber-400 rounded-full px-3.5 py-1 text-[0.82rem] font-black tracking-tight shrink-0 shadow-sm shadow-amber-400/10 transition-transform duration-500 group-hover/column:scale-105">
                            <MinimalHourIcon className="w-4.5 h-4.5 text-[#3c096c] dark:text-amber-400" />
                            <span>{formatLeaderboardTime(leaderboard[0].total_hours)}</span>
                          </div>
                          {/* Podium Pillar */}
                          <div className="w-full bg-gradient-to-t from-slate-300 to-slate-200 dark:from-[#1b0a32] dark:via-[#260e4a] dark:to-[#10002b]/60 h-36 rounded-t-xl mt-3.5 relative overflow-hidden flex flex-col justify-end pb-4 border-t border-amber-500/30 dark:border-amber-400/15 animate-grow-podium shadow-xl shadow-amber-900/5 dark:shadow-none hover:shadow-amber-500/10 transition-all duration-300">
                            {/* Sleek metallic top gold shelf border */}
                            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-amber-300 to-amber-500 shadow-[0_2px_8px_rgba(251,191,36,0.35)] z-20" />
                            {/* Vertical Glowing Light Stripe */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[3px] bg-gradient-to-b from-amber-400/50 to-transparent h-full blur-[0.5px]" />
                            <span className="text-7xl font-extrabold bg-gradient-to-b from-amber-400/20 to-transparent bg-clip-text text-transparent absolute inset-0 flex items-center justify-center select-none pointer-events-none mt-2 font-sans">1</span>
                          </div>
                        </div>
                      )}

                      {/* Rank 3 (Right Podium) */}
                      {leaderboard[2] && (
                        <div className="flex flex-col items-center flex-1 min-w-0 group/column cursor-pointer transition-all duration-500 ease-out hover:-translate-y-3" style={{ animationDelay: '0.3s' }}>
                          {/* Avatar block */}
                          <div className="relative mb-3.5">
                            {/* Halo Glow */}
                            <div className="absolute -inset-1 bg-amber-700/10 rounded-full blur-xs pointer-events-none group-hover/column:scale-110 transition-transform duration-500" />
                            <div className="w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-950/10 border-2 border-amber-700/30 overflow-hidden flex items-center justify-center shrink-0 transition-transform duration-500 ease-out group-hover/column:scale-105 group-hover/column:rotate-2 relative z-10">
                              {leaderboard[2].profile_picture ? (
                                <img src={leaderboard[2].profile_picture} alt="Rank 3" className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-amber-800 dark:text-amber-500 font-black text-base uppercase">{leaderboard[2].first_name[0] || 'S'}</span>
                              )}
                            </div>
                            {/* Floating Bronze Rank Crest Badge */}
                            <span className="absolute -top-1 -right-1 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700 text-white font-extrabold text-[0.58rem] px-1.5 py-0.5 rounded-md border border-white dark:border-amber-950 shadow-md shrink-0 uppercase tracking-widest z-20 select-none transition-transform duration-500 group-hover/column:scale-110 group-hover/column:rotate-6">
                              3rd
                            </span>
                          </div>
                          <span className="text-[0.8rem] font-black text-slate-800 dark:text-[#ff9100]/80 truncate w-full text-center tracking-tight leading-tight transition-colors duration-300 group-hover/column:text-[#ff9100] dark:group-hover/column:text-[#ff9100]/90">
                            {leaderboard[2].first_name}
                          </span>
                          <div className="mt-2 flex items-center gap-1 bg-slate-100 dark:bg-purple-950/40 border border-purple-500/10 dark:border-white/5 rounded-full px-3 py-1 text-[0.75rem] font-black text-slate-800 dark:text-purple-300/90 shadow-sm shrink-0 transition-transform duration-500 group-hover/column:scale-105">
                            <MinimalHourIcon className="w-4 h-4 text-purple-600 dark:text-purple-300/80" />
                            <span>{formatLeaderboardTime(leaderboard[2].total_hours)}</span>
                          </div>
                          {/* Podium Pillar */}
                          <div className="w-full bg-gradient-to-t from-slate-200/90 to-slate-100/90 dark:from-zinc-950 dark:via-[#1c0c1e]/80 dark:to-zinc-900/40 h-20 rounded-t-xl mt-3.5 relative overflow-hidden flex flex-col justify-end pb-2 border-t border-amber-700/20 dark:border-white/5 animate-grow-podium shadow-lg shadow-black/5 hover:shadow-[#ff9100]/10 transition-all duration-300">
                            {/* Sleek metallic top copper shelf border */}
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-700 via-amber-500 to-amber-800 shadow-[0_1px_4px_rgba(245,158,11,0.15)] z-20" />
                            {/* Vertical Glowing Light Stripe */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-full bg-gradient-to-b from-[#ff9100]/30 to-transparent blur-[0.5px]" />
                            <span className="text-5xl font-extrabold bg-gradient-to-b from-amber-700/20 to-transparent bg-clip-text text-transparent absolute inset-0 flex items-center justify-center select-none pointer-events-none mt-1 font-sans">3</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* LIST SECTION FOR RANKS 4 AND 5 */}
                    <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-purple-500/5 dark:border-white/5">
                      {leaderboard.slice(3, 5).map((student, idx) => {
                        const rank = idx + 4;
                        return (
                          <div
                            key={student.id || rank}
                            className="flex items-center justify-between bg-slate-50 dark:bg-black/25 border border-purple-500/5 dark:border-white/5 rounded-xl p-3 hover:scale-[1.01] hover:bg-slate-100/70 dark:hover:bg-white/5 transition-all duration-200"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-[0.7rem] font-black text-slate-400 dark:text-purple-400/60 w-4.5 text-center shrink-0">
                                {rank}
                              </span>
                              <div className="w-9 h-9 rounded-full bg-purple-500/10 dark:bg-purple-400/5 border border-purple-500/15 overflow-hidden flex items-center justify-center font-black text-xs uppercase shadow-inner shrink-0 text-[#ff9100]">
                                {student.profile_picture ? (
                                  <img src={student.profile_picture} alt={`Rank ${rank}`} className="w-full h-full object-cover" />
                                ) : (
                                  student.first_name[0] || 'S'
                                )}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="text-xs font-black text-slate-800 dark:text-white leading-tight truncate">
                                  {student.first_name} {student.last_name ? student.last_name[0] + '.' : ''}
                                </span>
                                <span className="text-[0.58rem] text-slate-400 dark:text-purple-300/50 font-bold uppercase tracking-wider mt-0.5">
                                  {student.course} · {student.total_sessions || 0} sessions
                                </span>
                              </div>
                            </div>

                            <div className="bg-slate-100 dark:bg-purple-950/40 border border-purple-500/10 dark:border-white/5 rounded-full px-2.5 py-1 text-[0.72rem] font-black text-slate-800 dark:text-purple-300/90 tracking-tight shrink-0 flex items-center gap-1 shadow-xs">
                              <MinimalHourIcon className="w-3.5 h-3.5 text-purple-600 dark:text-purple-300/80" />
                              <span>{formatLeaderboardTime(student.total_hours)}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              {/* Leaderboard Footer */}
              <div className="px-6 py-4 bg-purple-50/30 dark:bg-white/1 border-t border-purple-500/5 dark:border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                  </span>
                  <span className="text-[0.65rem] text-slate-400 dark:text-purple-300/80 font-bold uppercase tracking-wider">
                    Realtime System
                  </span>
                </div>
                <span className="text-[0.65rem] font-black text-[#ff9100] uppercase tracking-wider">
                  Top Sit-Inners
                </span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─── WHY SIT-INIT (FEATURES) ─── */}
      <section className="bg-[#3c096c] dark:bg-[#150527] dark:border dark:border-[#7b2cbf]/25 py-20 px-6 rounded-3xl mx-6 mb-10 transition-all duration-300">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-[#ff9100] text-xs font-bold uppercase tracking-widest">Why Sit-inIT?</span>
            <h2 className="text-3xl lg:text-4xl font-black text-white mt-3 tracking-tight">
              Everything you need to find a seat
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FEATURES.map(({ Icon, title, desc }) => (
              <div key={title} className="bg-white/5 border border-white/10 rounded-2xl p-7 hover:bg-white/10 hover:-translate-y-1 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-[#ff9100]/20 flex items-center justify-center mb-5">
                  <Icon />
                </div>
                <h3 className="text-white font-bold text-lg mb-2">{title}</h3>
                <p className="text-purple-300 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── ABOUT SECTION ─── */}
      <section id="about" className="max-w-6xl mx-auto px-6 py-20 border-t border-[#3c096c]/10 dark:border-white/10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

          {/* Left Column: Visual Card and metrics (col-span-5) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="bg-white/70 dark:bg-white/5 backdrop-blur-xl border border-gray-150 dark:border-white/10 p-8 rounded-3xl shadow-xl shadow-purple-900/5 dark:shadow-none relative overflow-hidden">
              <span className="text-[#ff9100] text-xs font-bold uppercase tracking-widest block mb-2">Our Mission</span>
              <h3 className="text-2xl font-black text-[#1a0030] dark:text-white leading-tight mb-4">Empowering the Next Generation of Tech Leaders</h3>
              <p className="text-gray-500 dark:text-purple-200 text-sm leading-relaxed mb-6">
                We believe that learning is hands-on. By removing laboratory check-in bottlenecks, students can fully focus on building, coding, and mastering complex technologies.
              </p>

              {/* Mini stats grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#3c096c]/05 dark:bg-white/5 border border-[#3c096c]/10 dark:border-white/10 p-4 rounded-2xl">
                  <div className="text-xl font-extrabold text-[#3c096c] dark:text-[#ff9100]">98%</div>
                  <div className="text-[0.62rem] uppercase tracking-wider text-gray-400 dark:text-purple-300 font-bold mt-1">Check-in Efficiency</div>
                </div>
                <div className="bg-[#ff9100]/05 dark:bg-white/5 border border-[#ff9100]/10 dark:border-white/10 p-4 rounded-2xl">
                  <div className="text-xl font-extrabold text-[#ff9100] dark:text-white">Instant</div>
                  <div className="text-[0.62rem] uppercase tracking-wider text-gray-400 dark:text-purple-300 font-bold mt-1">Availability Sync</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Text & Values (col-span-7) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div>
              <span className="text-[#ff9100] text-xs font-bold uppercase tracking-widest">About the Ecosystem</span>
              <h2 className="text-3xl lg:text-4xl font-black text-[#1a0030] dark:text-white tracking-tight mt-2 mb-4">
                Redefining How Students Access Laboratories
              </h2>
              <p className="text-gray-500 dark:text-purple-200 leading-relaxed text-sm">
                The College of Computer Studies (CCS) laboratory ecosystem is designed to foster seamless access to our high-performance computing labs. Sit-inIT was built from the ground up to solve the daily student challenge of finding vacant computers for programming practice, classroom assignments, and research.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex gap-4">
                <div className="w-6 h-6 rounded-full bg-[#ff9100]/10 text-[#ff9100] flex items-center justify-center shrink-0 mt-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#1a0030] dark:text-white">Streamlined Digital Queue</h4>
                  <p className="text-xs text-gray-500 dark:text-purple-200 mt-1 leading-relaxed">No more waiting in long physical lines. Log into your dashboard, pick an open seat, scan, and start learning immediately.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-6 h-6 rounded-full bg-[#3c096c]/10 text-[#3c096c] dark:bg-white/10 dark:text-[#ff9100] flex items-center justify-center shrink-0 mt-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#1a0030] dark:text-white">Live Capacity Tracking</h4>
                  <p className="text-xs text-gray-500 dark:text-purple-200 mt-1 leading-relaxed">Our live seat tracker displays real-time laboratory room usage, protecting classrooms from overcrowding and preserving silence.</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ─── HELP & FAQS (VIOLET BACKGROUND) ─── */}
      <section id="faqs" className="bg-[#3c096c] dark:bg-[#150527] dark:border dark:border-[#7b2cbf]/25 py-20 px-6 rounded-3xl mx-6 mb-10 text-white transition-all duration-300">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

            {/* LEFT COLUMN: Help Desk / Resources (col-span-5) */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              <div>
                <span className="text-[#ff9100] text-xs font-bold uppercase tracking-widest">Support Center</span>
                <h2 className="text-3xl lg:text-4xl font-black text-white tracking-tight mt-2 mb-4">
                  Need Some Help?
                </h2>
                <p className="text-purple-200 leading-relaxed text-sm">
                  Quickly resolve your queries or browse through frequently asked questions. Our lab supervisors are also available at the physical desk in the CCS department floor.
                </p>
              </div>

              {/* Resources Cards */}
              <div className="flex flex-col gap-4">
                <div className="bg-white/5 border border-white/10 p-5 rounded-2xl flex items-start gap-4 hover:bg-white/10 hover:-translate-y-0.5 transition-all duration-300">
                  <div className="w-10 h-10 rounded-xl bg-[#ff9100]/20 text-[#ff9100] flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 4a2 2 0 00-2 2v3a2 2 0 002 2h3a2 2 0 002-2V9a2 2 0 00-2-2h-3z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">Laboratory Rules</h4>
                    <p className="text-xs text-purple-200 mt-1 leading-relaxed">Read our comprehensive guide on laboratory decorum, clean workstation guidelines, and system policies.</p>
                  </div>
                </div>

                <div className="bg-white/5 border border-white/10 p-5 rounded-2xl flex items-start gap-4 hover:bg-white/10 hover:-translate-y-0.5 transition-all duration-300">
                  <div className="w-10 h-10 rounded-xl bg-[#ff9100]/20 text-[#ff9100] flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">Supervisor Assistance</h4>
                    <p className="text-xs text-purple-200 mt-1 leading-relaxed">Have a hardware issue or a locked account? Reach out to the supervisor stationed at Room 524 for hands-on troubleshooting.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: FAQ Accordions (col-span-7) */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              {FAQS.map((faq, idx) => {
                const isOpen = openFaqIdx === idx
                return (
                  <div
                    key={idx}
                    className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden transition-all duration-300"
                  >
                    <button
                      onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                      className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-white/10 transition-colors"
                    >
                      <span className="font-bold text-white text-sm md:text-base pr-4">{faq.q}</span>
                      <span className={`w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[#ff9100] transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-180' : ''}`}>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </span>
                    </button>

                    <div
                      className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-40 border-t border-white/10 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
                        }`}
                    >
                      <div className="px-6 py-5 text-xs md:text-sm text-purple-200 leading-relaxed">
                        {faq.a}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS SECTION ─── */}
      <section
        id="testimonials"
        ref={testimonialsRef}
        style={{
          opacity: testimonialsProgress,
          transform: `scale(${0.9 + 0.1 * testimonialsProgress}) translateY(${(1 - testimonialsProgress) * -30}px)`,
          transformOrigin: 'top center',
          transition: 'transform 0.15s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.15s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        className="w-full py-20 border-t border-purple-500/10 dark:border-white/10 overflow-hidden"
      >
        <div className="max-w-6xl mx-auto px-6 text-center mb-16">
          <span className="text-[#ff9100] text-xs font-black uppercase tracking-widest">Student Testimonials</span>
          <h2 className="text-4xl font-extrabold tracking-tight text-[#1a0030] dark:text-white mt-3 mb-4">
            Loved by College of Computer Studies Students
          </h2>
          <p className="text-gray-500 dark:text-purple-200/60 max-w-xl mx-auto text-sm leading-relaxed">
            Real feedback and ratings submitted by CCS students right after completing their laboratory sit-in sessions.
          </p>
        </div>

        {/* Testimonials List */}
        {(() => {
          if (testimonials.length === 0) {
            return (
              <div className="text-center py-16 bg-white/50 dark:bg-[#140828]/20 backdrop-blur-md rounded-3xl border border-purple-500/10 max-w-xl mx-auto px-6 animate-fade-in">
                <div className="w-16 h-16 rounded-2xl bg-amber-400/10 text-amber-500 flex items-center justify-center mx-auto mb-5 shadow-inner">
                  <svg className="w-8 h-8 fill-amber-400/20 stroke-amber-500" viewBox="0 0 24 24" strokeWidth={1.8}>
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                  </svg>
                </div>
                <h3 className="text-lg font-black text-[#1a0030] dark:text-white uppercase tracking-wider mb-2">No Reviews Found</h3>
                <p className="text-gray-500 dark:text-purple-200/60 text-xs md:text-sm leading-relaxed mb-6">
                  There are no testimonials recorded yet. Be the first to share your experience!
                </p>
              </div>
            );
          }

          // Double or repeat items to support infinite scroll loop seamlessly (minimum 8 cards total)
          const repeats = Math.ceil(8 / testimonials.length);
          const marqueeItems = Array(repeats).fill(testimonials).flat();

          return (
            <div className="relative w-[90%] mx-auto overflow-hidden py-4 select-none
              before:absolute before:left-0 before:top-0 before:bottom-0 before:w-24 before:bg-gradient-to-r before:from-white dark:before:from-[#0d041f] before:to-transparent before:z-10
              after:absolute after:right-0 after:top-0 after:bottom-0 after:w-24 after:bg-gradient-to-l after:from-white dark:after:from-[#0d041f] after:to-transparent after:z-10"
            >
              {/* The scrolling track */}
              <div className="flex gap-6 animate-marquee hover:[animation-play-state:paused]">
                {marqueeItems.map((t, idx) => {
                  const itemIndex = idx % testimonials.length;
                  const identifier = t.record_id ? `real_${t.record_id}` : `fallback_${itemIndex}`;
                  const isAlreadyLiked = likedIds.includes(identifier);

                  return (
                    <div
                      key={`${t.id || idx}-${idx}`}
                      className="w-[420px] md:w-[480px] p-6 flex flex-col justify-between gap-5 relative overflow-hidden rounded-[1.8rem] bg-gradient-to-b from-white/70 to-white/30 dark:from-[#1c0c3a]/50 dark:to-[#10002b]/30 backdrop-blur-lg border border-white/20 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:border-[#ff9100]/30 hover:shadow-lg hover:shadow-[#ff9100]/5 transition-all duration-300 shrink-0 group/card"
                    >
                      {/* Decorative Ambient Radial Glow */}
                      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#ff9100]/5 to-[#3c096c]/0 rounded-full blur-xl pointer-events-none group-hover/card:from-[#ff9100]/10 transition-all duration-300" />

                      {/* Header: Profile & Stars */}
                      <div className="flex items-start justify-between gap-3 relative z-10">
                        <div className="flex items-center gap-3">
                          {/* Avatar */}
                          <div className="w-11 h-11 rounded-full border-2 border-white dark:border-[#3c096c]/50 shadow-sm overflow-hidden shrink-0">
                            {t.profile_picture ? (
                              <img src={t.profile_picture} alt={t.first_name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-[#3c096c] to-[#ff9100] text-white flex items-center justify-center font-black text-sm uppercase">
                                {t.first_name[0] || 'S'}
                              </div>
                            )}
                          </div>
                          {/* Info */}
                          <div className="min-w-0">
                            <h4 className="text-xs font-black text-[#1a0030] dark:text-white uppercase tracking-wider truncate">
                              {t.first_name} {t.last_name ? t.last_name[0] + '.' : ''}
                            </h4>
                            <div className="flex items-center gap-1.5 mt-0.5 text-[0.6rem] font-bold text-gray-400 dark:text-purple-300/60">
                              <span className="uppercase tracking-widest">{t.course}</span>
                              <span className="w-0.5 h-0.5 rounded-full bg-gray-300 dark:bg-purple-800 shrink-0" />
                              <span className="text-[#ff9100] uppercase tracking-widest">Verified</span>
                            </div>
                          </div>
                        </div>

                        {/* Stars */}
                        <div className="flex items-center gap-0.5 text-amber-500 shrink-0 mt-1">
                          {Array.from({ length: t.rating }).map((_, i) => (
                            <svg key={i} className="w-3.5 h-3.5 fill-amber-400 stroke-amber-500" viewBox="0 0 24 24">
                              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                            </svg>
                          ))}
                        </div>
                      </div>

                      {/* Body: Feedback Text */}
                      <div className="relative z-10 flex-1">
                        <span className="text-3xl text-purple-200 dark:text-purple-500/20 font-serif absolute -top-3.5 -left-1 select-none pointer-events-none">“</span>
                        <p className="text-[0.85rem] text-gray-500 dark:text-purple-200/90 leading-relaxed font-semibold italic pl-4">
                          {t.feedback}
                        </p>
                      </div>

                      {/* Footer: Date & Upvote Pill */}
                      <div className="flex items-center justify-between gap-3 pt-3 border-t border-purple-500/5 dark:border-white/5 relative z-10">
                        <span className="text-[0.62rem] font-bold text-gray-400 dark:text-purple-300/40 uppercase tracking-widest">
                          {t.date || 'May 2026'} · {t.room || 'Verified Lab'}
                        </span>

                        {/* Interactive Like Pill Button */}
                        <button
                          disabled={isAlreadyLiked}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isAlreadyLiked) handleLikeTestimonial(t.record_id, itemIndex);
                          }}
                          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[0.68rem] font-black tracking-wide transition-all duration-200 ${isAlreadyLiked
                            ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20 cursor-default'
                            : 'bg-[#ff9100]/10 hover:bg-[#ff9100]/20 text-[#ff9100] border border-transparent hover:border-[#ff9100]/25 cursor-pointer hover:scale-105 active:scale-95'
                            }`}
                          title={isAlreadyLiked ? "Testimonial Liked" : "Like Testimonial"}
                        >
                          <svg
                            className={`w-3.5 h-3.5 transition-colors ${isAlreadyLiked ? 'fill-rose-500 stroke-rose-600' : 'fill-amber-500 stroke-amber-600'}`}
                            viewBox="0 0 24 24"
                          >
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                          </svg>
                          <span>{t.likes || 0}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </section>


      {/* ─── FOOTER ─── */}
      <footer className="bg-[#3c096c] px-10 py-5 rounded-3xl mx-6 mb-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <img src={ccsLogo} alt="CCS" className="w-7 h-7 rounded-md border border-white/20" />
            <span className="text-white font-black tracking-wider text-lg">Sit-inIT</span>
          </div>
          <p className="text-purple-300 text-xs text-center">
            © {new Date().getFullYear()} College of Computer Studies · Sit-inIT Monitoring System
          </p>
          <div className="flex gap-6 text-purple-300 text-sm">
            <a href="#" className="hover:text-[#ff9100] transition-colors">Privacy</a>
            <a href="#" className="hover:text-[#ff9100] transition-colors">Terms</a>
            <a href="#" className="hover:text-[#ff9100] transition-colors">Contact</a>
          </div>
        </div>
      </footer>

    </div>
  )
}