import React, { useState, useEffect } from 'react'
import { authService } from '../services/authService'

const ANNOUNCEMENTS = [
  {
    id: 1,
    author: 'CCS Admin',
    date: '2025-Feb-11',
    posted: '2024-May-08',
    message: 'Important Announcement! We are excited to announce the launch of our new website. Explore our latest products and services now!',
  },
]

const RULES = [
  { num: null, text: 'To avoid embarrassment and maintain camaraderie with your friends and superiors at our laboratories, please observe the following:' },
  { num: '01', text: 'Maintain silence, proper decorum, and discipline inside the laboratory. Mobile phones and personal equipment must be switched off.' },
  { num: '02', text: 'Games are not allowed inside the lab — including computer-related, card games, or any games that may disturb lab operations.' },
  { num: '03', text: 'Surfing the internet is allowed only with instructor permission. Downloading and installing software are strictly prohibited.' },
]

const IconGraduate = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422A12.083 12.083 0 0112 21a12.083 12.083 0 01-6.16-10.422L12 14z" />
  </svg>
)
const IconCalendar = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <rect x="3" y="4" width="18" height="18" rx="2" strokeLinecap="round" strokeLinejoin="round" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 2v4M8 2v4M3 10h18" />
  </svg>
)
const IconMail = () => (
  <svg className="w-4 h-4 text-[#3c096c]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
)
const IconLocation = () => (
  <svg className="w-4 h-4 text-[#3c096c]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s-8-7.5-8-12a8 8 0 1116 0c0 4.5-8 12-8 12z" />
    <circle cx="12" cy="9" r="2.5" />
  </svg>
)
const IconAlert = () => (
  <svg className="w-4 h-4 text-[#ff9100]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
  </svg>
)
const IconBell = () => (
  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
)
const IconShield = () => (
  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
)
const IconShieldSm = () => (
  <svg className="w-3.5 h-3.5 text-[#3c096c]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
)

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true)
        // Get user from localStorage first (for immediate display)
        const cachedUser = authService.getUser?.() || {}
        
        console.log('[Dashboard] Cached user data:', cachedUser)
        
        // If user exists in cache, use it
        if (cachedUser.id_number) {
          // Ensure all fields exist, even if empty from backend
          const userWithDefaults = {
            first_name: cachedUser.first_name || 'Student',
            last_name: cachedUser.last_name || '',
            course: cachedUser.course || 'BSIT',
            year_level: cachedUser.year_level || 4,
            email: cachedUser.email || '',
            address: cachedUser.address || '', // This will show '—' if empty
            session: cachedUser.session || 26,
            id_number: cachedUser.id_number || '',
            role: cachedUser.role || 'student',
            middle_name: cachedUser.middle_name || '',
          }
          console.log('[Dashboard] User with defaults:', userWithDefaults)
          setUser(userWithDefaults)
        } else {
          // Fallback to default data
          setUser({
            first_name: 'Student',
            last_name: '',
            course: 'BSIT',
            year_level: 4,
            email: 'student@sit-in.local',
            address: 'Cebu City',
            session: 26,
            id_number: 'N/A',
            role: 'student',
          })
        }
        setError(null)
      } catch (err) {
        setError(err.message)
        // Set default user on error
        setUser({
          first_name: 'Student',
          last_name: '',
          course: 'BSIT',
          year_level: 4,
          email: 'student@sit-in.local',
          address: 'Cebu City',
          session: 26,
          id_number: 'N/A',
          role: 'student',
        })
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full border-4 border-[#3c096c]/20 border-t-[#3c096c] animate-spin"></div>
          <p className="text-gray-600 font-semibold">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-semibold">Error loading user data</p>
          <p className="text-gray-500 text-sm mt-2">{error}</p>
        </div>
      </div>
    )
  }

  const firstName = user.first_name || 'Student'
  const lastName  = user.last_name  || ''
  const displayName = `${firstName} ${lastName}`.trim()
  const initials    = `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase() || 'S'

  return (
    <div className="min-h-[90vh] py-6 px-2">
      <div className="max-w-[95rem] mx-auto flex flex-col gap-5">

        {/* ── GREETING BANNER ── */}
        <div className="bg-[#3c096c] rounded-2xl px-8 py-6 flex items-center justify-between shadow-lg shadow-[#3c096c]/20">
          <div>
            <p className="text-purple-300 text-xs font-semibold uppercase tracking-[0.2em] mb-1.5">Welcome back</p>
            <h1 className="text-4xl font-black text-white tracking-tight leading-none">{displayName}</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-white/10 border border-white/15 rounded-full px-5 py-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-sm font-semibold text-white/80">Session #{user.session || 26}</span>
            </div>
            <div className="w-14 h-14 rounded-xl bg-[#ff9100] flex items-center justify-center shadow-md flex-shrink-0">
              <span className="text-white font-black text-xl">{initials}</span>
            </div>
          </div>
        </div>

        {/* ── BENTO GRID ── */}
        <div className="grid grid-cols-12 gap-4 items-stretch">

          {/* ── LEFT: Profile ── */}
          <div className="col-span-12 lg:col-span-3 flex flex-col gap-4">

            {/* Course + Year */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-2">
                <div className="flex items-center gap-1.5 text-gray-400">
                  <IconGraduate />
                  <span className="text-[0.58rem] font-black uppercase tracking-widest ">Course</span>
                </div>
                <p className="text-3xl font-black text-[#3c096c] leading-none mt-3">{user.course || 'BSIT'}</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-5 flex flex-col gap-2">
                <div className="flex items-center gap-1.5 text-gray-400">
                  <IconCalendar />
                  <span className="text-[0.58rem] font-black uppercase tracking-widest">Year</span>
                </div>
                <p className="text-3xl font-black text-[#3c096c]  leading-none">{user.year_level || 4}</p>
                <p className="text-[0.62rem] text-[#3c096c]/60 font-medium">Level</p>
              </div>
            </div>

            {/* Profile info card — fills remaining height */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex flex-col gap-5 flex-1">
              <p className="text-[0.62rem] font-black uppercase tracking-widest text-gray-400">Profile Info</p>

              <div className="flex flex-col gap-5 flex-1">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#3c096c]/08 flex items-center justify-center flex-shrink-0">
                    <IconMail />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[0.6rem] font-black uppercase tracking-widest text-gray-400 mb-1">Email</p>
                    <p className="text-sm font-semibold text-gray-700 break-all">{user.email || '—'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#3c096c]/08 flex items-center justify-center flex-shrink-0">
                    <IconLocation />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[0.6rem] font-black uppercase tracking-widest text-gray-400 mb-1">Address</p>
                    <p className="text-sm font-semibold text-gray-700">{user.address || '—'}</p>
                  </div>
                </div>
              </div>

              {/* Status footer */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                <span className="text-[0.6rem] font-black uppercase tracking-widest text-gray-400">Status</span>
                <span className="inline-flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-600 text-xs font-bold px-3 py-1.5 rounded-full">
                  Active
                </span>
              </div>
            </div>
          </div>

          {/* ── CENTER: Announcements ── */}
          <div className="col-span-12 lg:col-span-5 flex flex-col gap-4">

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#3c096c] flex items-center justify-center">
                  <IconBell />
                </div>
                <h2 className="font-black text-[#1a0030] text-xl tracking-tight">Announcements</h2>
              </div>
              <span className="text-xs font-black uppercase tracking-widest bg-[#ff9100] text-white px-4 py-2 rounded-full">
                {ANNOUNCEMENTS.length} New
              </span>
            </div>

            <div className="flex flex-col gap-4 flex-1">
              {ANNOUNCEMENTS.map(ann => (
                <div key={ann.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:-translate-y-0.5 transition-all duration-200 flex">
                  <div className="w-1 bg-gradient-to-b from-[#3c096c] to-[#ff9100] flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#3c096c] flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-[0.55rem] font-black">CCS</span>
                        </div>
                        <div>
                          <p className="text-base font-bold text-[#1a0030]">{ann.author}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{ann.date}</p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-gray-400 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-full">
                        {ann.posted}
                      </span>
                    </div>
                    <div className="px-6 py-5">
                      <p className="text-base text-gray-600 leading-relaxed">{ann.message}</p>
                    </div>
                  </div>
                </div>
              ))}

              {ANNOUNCEMENTS.length === 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center flex-1 flex flex-col items-center justify-center">
                  <IconBell />
                  <p className="text-sm text-gray-400 mt-3">No announcements yet.</p>
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT: Rules ── */}
          <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">

            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#ff9100] flex items-center justify-center">
                <IconShield />
              </div>
              <h2 className="font-black text-[#1a0030] text-xl tracking-tight">Rules & Regulations</h2>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col flex-1">

              {/* Institution */}
              <div className="bg-[#3c096c] px-6 py-6 relative overflow-hidden">
                <div className="absolute inset-0 opacity-5"
                  style={{ backgroundImage: 'repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)', backgroundSize: '8px 8px' }} />
                <p className="text-[#ff9100] text-[0.65rem] font-black uppercase tracking-[0.2em] mb-1.5 relative">University of Cebu</p>
                <p className="text-white font-black text-lg leading-snug relative">
                  College of Information &<br />Computer Studies
                </p>
              </div>

              {/* Sub label */}
              <div className="px-6 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                <IconShieldSm />
                <p className="text-[0.62rem] font-black uppercase tracking-widest text-[#3c096c]">Laboratory Rules</p>
              </div>

              {/* Rules */}
              <div className="px-6 py-6 flex flex-col gap-5 flex-1">
                {RULES.map((rule, i) => (
                  <div key={i} className="flex gap-3.5 items-start">
                    {rule.num ? (
                      <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-[#3c096c] flex items-center justify-center mt-0.5">
                        <span className="text-white text-[0.58rem] font-black">{rule.num}</span>
                      </div>
                    ) : (
                      <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-[#ff9100]/15 flex items-center justify-center mt-0.5">
                        <IconAlert />
                      </div>
                    )}
                    <p className={`text-sm leading-relaxed ${rule.num ? 'text-gray-600' : 'text-gray-500 italic'}`}>
                      {rule.text}
                    </p>
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