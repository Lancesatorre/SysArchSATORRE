import React, { useState, useEffect } from 'react'
import { authService } from '../services/authService'

const Ico = ({ d, d2, cls = 'w-4 h-4' }) => (
  <svg className={cls} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    {d2 && <path strokeLinecap="round" strokeLinejoin="round" d={d2} />}
  </svg>
)
const IcoCal    = ({ cls='w-4 h-4' }) => (
  <svg className={cls} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <rect x="3" y="4" width="18" height="18" rx="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 2v4M8 2v4M3 10h18"/>
  </svg>
)
const IcoGrad   = ({ cls='w-4 h-4' }) => <Ico cls={cls} d="M12 14l9-5-9-5-9 5 9 5z" d2="M12 14l6.16-3.422A12.083 12.083 0 0112 21a12.083 12.083 0 01-6.16-10.422L12 14z"/>
const IcoMail   = ({ cls='w-4 h-4' }) => <Ico cls={cls} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
const IcoPin    = ({ cls='w-4 h-4' }) => <Ico cls={cls} d="M12 21s-8-7.5-8-12a8 8 0 1116 0c0 4.5-8 12-8 12z" d2="M12 9m-2.5 0a2.5 2.5 0 105 0 2.5 2.5 0 00-5 0"/>
const IcoAlert  = ({ cls='w-4 h-4 text-[#ff9100]' }) => <Ico cls={cls} d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
const IcoBell   = ({ cls='w-4 h-4 text-white' }) => <Ico cls={cls} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
const IcoShield = ({ cls='w-4 h-4 text-white' }) => <Ico cls={cls} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
const IcoUser   = ({ cls='w-4 h-4' }) => <Ico cls={cls} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
const IcoClose  = ({ cls='w-4 h-4' }) => <Ico cls={cls} d="M6 18L18 6M6 6l12 12"/>

const formatAnnouncementDate = (value) => {
  if (!value) return '—'
  const date = new Date(String(value).replace(' ', 'T'))
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
}

const formatAnnouncementDateTime = (value) => {
  if (!value) return '—'
  const date = new Date(String(value).replace(' ', 'T'))
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const RULES = [
  { num:null, text:'To avoid embarrassment and maintain camaraderie with your friends and superiors at our laboratories, please observe the following:' },
  { num:'01', text:'Maintain silence, proper decorum, and discipline inside the laboratory. Mobile phones and personal equipment must be switched off.' },
  { num:'02', text:'Games are not allowed inside the lab — including computer-related, card games, or any games that may disturb lab operations.' },
  { num:'03', text:'Surfing the internet is allowed only with instructor permission. Downloading and installing software are strictly prohibited.' },
]

const TAG_COLORS = {
  General:  'bg-violet-50 text-violet-600 border-violet-200',
  Academic: 'bg-blue-50 text-blue-600 border-blue-200',
  System:   'bg-orange-50 text-orange-600 border-orange-200',
}

export default function Dashboard() {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [announcements, setAnnouncements] = useState([])
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null)

  const refreshDashboardData = async (idNumber) => {
    if (!idNumber) return

    const [notificationsRes, sessionRes] = await Promise.allSettled([
      authService.fetchNotifications(idNumber),
      authService.fetchStudentCurrentSession(idNumber),
    ])

    if (notificationsRes.status === 'fulfilled') {
      const payload = notificationsRes.value
      const rows = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.notifications)
          ? payload.notifications
          : []
      setAnnouncements(rows)
    }

    if (sessionRes.status === 'fulfilled') {
      setUser(prev => ({
        ...prev,
        session: Number(sessionRes.value?.available_sessions ?? prev?.session ?? 0),
        active_session: sessionRes.value?.active_session || null,
      }))
    }
  }

  useEffect(() => {
    const loadDashboard = async () => {
      const u = authService.getUser?.() || {}
      const photo = u.photo || u.profile_picture || null
      setUser({
        first_name: u.first_name || 'Student',
        last_name:  u.last_name  || '',
        course:     u.course     || 'BSIT',
        year_level: u.year_level || u.course_level || 4,
        email:      u.email      || '',
        address:    u.address    || '',
        session:    Number(u.available_sessions ?? u.session ?? 0),
        active_session: null,
        id_number:  u.id_number  || '',
        role:       u.role       || 'student',
        photo,
      })

      try {
        if (u.id_number) {
          await refreshDashboardData(u.id_number)
        } else {
          setAnnouncements([])
        }
      } catch (_) {
        setAnnouncements([])
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [])

  useEffect(() => {
    if (!user?.id_number) return undefined

    let cancelled = false

    const refresh = async () => {
      if (cancelled) return
      try {
        await refreshDashboardData(user.id_number)
      } catch (_) {}
    }

    const intervalId = setInterval(refresh, 10000)

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refresh()
      }
    }

    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      cancelled = true
      clearInterval(intervalId)
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [user?.id_number])

  useEffect(() => {
    if (!selectedAnnouncement) return

    const updated = announcements.find((ann) => String(ann.id) === String(selectedAnnouncement.id))
    if (updated) {
      setSelectedAnnouncement(updated)
    }
  }, [announcements, selectedAnnouncement?.id])

  useEffect(() => {
    if (!selectedAnnouncement) return undefined

    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        setSelectedAnnouncement(null)
      }
    }

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleEsc)

    return () => {
      document.body.style.overflow = originalOverflow
      document.removeEventListener('keydown', handleEsc)
    }
  }, [selectedAnnouncement])

  if (loading) return (
    <div className="min-h-[85vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-4 border-[#3c096c]/20 border-t-[#3c096c] animate-spin"/>
        <p className="text-sm font-semibold text-gray-400">Loading dashboard...</p>
      </div>
    </div>
  )

  if (!user) return <div className="min-h-[85vh] flex items-center justify-center"><p className="text-sm text-red-500">Error.</p></div>

  const displayName = `${user.first_name} ${user.last_name}`.trim()
  const initials    = `${user.first_name?.[0]||''}${user.last_name?.[0]||''}`.toUpperCase() || 'S'

  return (
    <div className="pt-2 sm:pt-3 pb-4 sm:pb-6 px-1 sm:px-2 min-h-[calc(100vh-7rem)] flex">
      <div className="max-w-[95rem] mx-auto w-full flex flex-col gap-6 sm:gap-8 lg:gap-10 flex-1">

        {/* ── GREETING BANNER ── */}
        <div className="bg-[#3c096c] rounded-2xl overflow-hidden shadow-xl shadow-[#3c096c]/25 relative">
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage:'repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)', backgroundSize:'12px 12px' }}/>
          <div className="absolute -top-16 right-48 w-64 h-64 rounded-full bg-[#ff9100]/10 blur-3xl pointer-events-none"/>
          <div className="absolute -bottom-10 left-1/2 w-80 h-40 rounded-full bg-violet-500/08 blur-3xl pointer-events-none"/>
          <div className="h-1.5 w-full bg-gradient-to-r from-[#ff9100] via-violet-400 to-[#3c096c]"/>

          <div className="relative px-4 sm:px-6 lg:px-8 py-5 sm:py-7 flex flex-col lg:flex-row lg:items-center justify-between gap-6 lg:gap-8">

            {/* Left: big photo + identity */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
              {/* ── BIG avatar ── */}
              <div className="relative flex-shrink-0">
                <div className="w-24 h-24 rounded-2xl overflow-hidden bg-[#ff9100] flex items-center justify-center shadow-2xl shadow-[#ff9100]/40 ring-[3px] ring-white/15">
                  {user.photo
                    ? <img src={user.photo} alt={displayName} className="w-full h-full object-cover"/>
                    : (
                      <div className="flex flex-col items-center justify-center gap-1">
                        <span className="text-white font-black text-4xl leading-none">{initials}</span>
                      </div>
                    )
                  }
                </div>
                {/* Active dot */}
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#ff9100] border-2 border-[#3c096c] shadow-md">
                  <span className="absolute inset-0 rounded-full bg-[#ff9100] animate-ping opacity-75"/>
                </div>
              </div>

              {/* Name + meta */}
              <div>
                <p className="text-purple-300/80 text-[0.62rem] font-bold uppercase tracking-[0.22em] mb-2">Welcome back</p>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-none">{displayName}</h1>
                <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                  <span className="text-[0.6rem] font-black uppercase tracking-widest bg-white/10 border border-white/15 text-white/65 px-2.5 py-1 rounded-full">{user.role}</span>
                  <span className="text-[0.62rem] font-mono text-white/35 tracking-widest">{user.id_number}</span>
                </div>
              </div>
            </div>

            {/* Right: stats + session */}
            <div className="w-full lg:w-auto flex flex-wrap items-center gap-3">
                 {/* Session badge */}
              <div className="flex items-center gap-2.5 bg-white/10 border border-white/15 rounded-full px-4 sm:px-5 py-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ff9100] animate-pulse"/>
                <span className="text-sm font-semibold text-white/80">Available Sessions: {user.session}</span>
              </div>
          
            </div>
          </div>
        </div>

        {/* ── MAIN GRID ── */}
        <div className="grid grid-cols-12 gap-4 items-stretch flex-1">

          {/* ── LEFT ── */}
          <div className="col-span-12 lg:col-span-3 flex flex-col gap-4">

            {/* Profile card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col flex-1 min-h-[300px]">

              {/* Info rows */}
              <div className="p-5 flex flex-col gap-4 flex-1">
                <p className="text-[0.56rem] font-black uppercase tracking-[0.2em] text-gray-400">Profile Info</p>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#3c096c]/08 flex items-center justify-center flex-shrink-0">
                    <IcoMail cls="w-3.5 h-3.5 text-[#3c096c]"/>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[0.56rem] font-black uppercase tracking-widest text-gray-400 mb-0.5">Email</p>
                    <p className="text-xs font-semibold text-gray-700 break-all">{user.email||'—'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#3c096c]/08 flex items-center justify-center flex-shrink-0">
                    <IcoPin cls="w-3.5 h-3.5 text-[#3c096c]"/>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[0.56rem] font-black uppercase tracking-widest text-gray-400 mb-0.5">Address</p>
                    <p className="text-xs font-semibold text-gray-700">{user.address||'—'}</p>
                  </div>
                </div>

                <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-[0.56rem] font-black uppercase tracking-widest text-gray-400">Status</span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#ff9100] bg-[#ff9100]/20 border border-[#ff9100] px-2.5 py-1.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#ff9100] animate-pulse"/>Active
                  </span>
                </div>
              </div>
            </div>

            {/* Course + Year */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-1.5 text-gray-400 mb-3">
                  <IcoGrad cls="w-3.5 h-3.5"/>
                  <span className="text-[0.56rem] font-black uppercase tracking-widest">Course</span>
                </div>
                <p className="text-3xl font-black text-[#3c096c] leading-none">{user.course}</p>
              </div>
              <div className="bg-[#ff9100] rounded-2xl p-5 shadow-sm shadow-[#ff9100]/20 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-1.5 text-white/60 mb-3">
                  <IcoCal cls="w-3.5 h-3.5 text-white/60"/>
                  <span className="text-[0.56rem] font-black uppercase tracking-widest text-white/60">Year</span>
                </div>
                <p className="text-3xl font-black text-white leading-none">{user.year_level}</p>
                <p className="text-[0.56rem] text-white/60 mt-1 font-medium">Level</p>
              </div>
            </div>
          </div>

          {/* ── CENTER: Announcements ── */}
          <div className="col-span-12 lg:col-span-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#3c096c] flex items-center justify-center shadow-md shadow-[#3c096c]/25">
                  <IcoBell/>
                </div>
                <h2 className="font-black text-[#1a0030] text-xl tracking-tight">Announcements</h2>
              </div>
              <span className="text-xs font-black uppercase tracking-widest bg-[#ff9100] text-white px-4 py-2 rounded-full shadow-sm shadow-[#ff9100]/30">
                {announcements.length} New
              </span>
            </div>

            <div
              className={`flex flex-col gap-3 ${announcements.length > 3 ? 'overflow-y-auto pr-1 pb-1' : ''}`}
              style={announcements.length > 3 ? { maxHeight: '34.5rem' } : undefined}
            >
              {announcements.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <p className="text-sm text-gray-400 font-medium">No announcements yet.</p>
                </div>
              ) : announcements.map(ann => (
                <button
                  key={ann.id}
                  type="button"
                  onClick={() => setSelectedAnnouncement(ann)}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 flex min-h-43.5 text-left cursor-pointer"
                >
                  <div className="w-1 bg-gradient-to-b from-[#3c096c] to-[#ff9100] flex-shrink-0"/>
                  <div className="flex-1 min-w-0 flex flex-col">
                    <div className="flex items-center justify-between px-5 py-3 border-b border-gray-50 flex-shrink-0">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-[#3c096c] flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-[0.5rem] font-black">CCS</span>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#1a0030]">CCS ADMIN</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-[0.56rem] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${TAG_COLORS[ann.tag]||'bg-gray-50 text-gray-500 border-gray-200'}`}>
                          {ann.tag}
                        </span>
                        <span className="text-[0.6rem] font-semibold text-gray-400 bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-full hidden sm:block">
                          {formatAnnouncementDate(ann.created_at)}
                        </span>
                      </div>
                    </div>
                    <div className="px-5 pt-4 pb-13">
                      <p className="text-sm font-bold text-[#1a0030] mb-1">{ann.title || 'Announcement'}</p>
                      <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">{ann.message}</p>
                      <p className="text-[0.65rem] font-bold uppercase tracking-wider text-[#3c096c]/50 mt-3">Click to view full announcement</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* ── RIGHT: Rules ── */}
          <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#ff9100] flex items-center justify-center shadow-md shadow-[#ff9100]/25">
                <IcoShield/>
              </div>
              <h2 className="font-black text-[#1a0030] text-xl tracking-tight">Rules & Regulations</h2>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col flex-1">
              <div className="bg-[#3c096c] px-6 py-5 relative overflow-hidden flex-shrink-0">
                <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage:'repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)', backgroundSize:'8px 8px' }}/>
                <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-[#ff9100]/15 blur-2xl pointer-events-none"/>
                <p className="text-[#ff9100] text-[0.62rem] font-black uppercase tracking-[0.22em] mb-1.5 relative">University of Cebu</p>
                <p className="text-white font-black text-base leading-snug relative">College of Information &<br/>Computer Studies</p>
              </div>

              <div className="px-5 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center gap-2 flex-shrink-0">
                <IcoShield cls="w-3.5 h-3.5 text-[#3c096c]"/>
                <p className="text-[0.6rem] font-black uppercase tracking-widest text-[#3c096c]">Laboratory Rules</p>
              </div>

              <div className="px-5 py-4 flex flex-col flex-1 justify-between">
                {RULES.map((rule, i) => (
                  <div key={i} className="flex gap-3 items-start py-2">
                    {rule.num ? (
                      <div className="flex-shrink-0 w-6 h-6 rounded-lg bg-[#3c096c] flex items-center justify-center mt-0.5">
                        <span className="text-white text-[0.55rem] font-black">{rule.num}</span>
                      </div>
                    ) : (
                      <div className="flex-shrink-0 w-6 h-6 rounded-lg bg-[#ff9100]/15 flex items-center justify-center mt-0.5">
                        <IcoAlert cls="w-3.5 h-3.5 text-[#ff9100]"/>
                      </div>
                    )}
                    <p className={`text-xs leading-relaxed ${rule.num?'text-gray-600':'text-gray-500 italic'}`}>{rule.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>

      {selectedAnnouncement && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#1a0030]/65 backdrop-blur-[2px] p-4"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedAnnouncement(null)
            }
          }}
        >
          <div className="w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-2xl border border-gray-200 flex flex-col">
            <div className="h-1.5 w-full bg-linear-to-r from-[#3c096c] to-[#ff9100]" />

            <div className="px-5 sm:px-6 py-4 border-b border-gray-100 flex items-start justify-between gap-4">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-[#3c096c] flex items-center justify-center shrink-0">
                  <span className="text-white text-[0.55rem] font-black">CCS</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-black text-[#1a0030] tracking-wide">CCS ADMIN</p>
                  <p className="text-[0.7rem] font-semibold text-gray-400">{formatAnnouncementDateTime(selectedAnnouncement.created_at)}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedAnnouncement(null)}
                className="w-8 h-8 rounded-lg border border-gray-200 text-gray-500 hover:text-[#3c096c] hover:border-[#3c096c]/30 hover:bg-[#3c096c]/5 flex items-center justify-center transition-colors"
                aria-label="Close announcement"
              >
                <IcoClose cls="w-4 h-4" />
              </button>
            </div>

            <div className="px-5 sm:px-6 py-5 overflow-y-auto">
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-[0.58rem] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${TAG_COLORS[selectedAnnouncement.tag]||'bg-gray-50 text-gray-500 border-gray-200'}`}>
                  {selectedAnnouncement.tag || 'General'}
                </span>
              </div>

              <h3 className="text-xl sm:text-2xl font-black text-[#1a0030] leading-tight mb-3 wrap-break-word">
                {selectedAnnouncement.title || 'Announcement'}
              </h3>

              <p className="text-sm sm:text-base text-gray-700 leading-relaxed whitespace-pre-line wrap-break-word">
                {selectedAnnouncement.message || 'No details provided.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}