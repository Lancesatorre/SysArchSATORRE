import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authService } from '../services/authService'

const Ico = ({ d, d2, cls = 'w-4 h-4' }) => (
  <svg className={cls} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    {d2 && <path strokeLinecap="round" strokeLinejoin="round" d={d2} />}
  </svg>
)
const IcoUsers    = ({ cls='w-4 h-4' }) => <Ico cls={cls} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0"/>
const IcoPlay     = ({ cls='w-4 h-4' }) => <Ico cls={cls} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" d2="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
const IcoList     = ({ cls='w-4 h-4' }) => <Ico cls={cls} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
const IcoClock    = ({ cls='w-4 h-4' }) => <Ico cls={cls} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
const IcoSearch   = ({ cls='w-4 h-4' }) => <Ico cls={cls} d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z"/>
const IcoShield   = ({ cls='w-4 h-4' }) => <Ico cls={cls} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
const IcoChevron  = ({ cls='w-4 h-4' }) => <Ico cls={cls} d="M9 5l7 7-7 7"/>
const IcoMonitor  = ({ cls='w-4 h-4' }) => <Ico cls={cls} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
const IcoActivity = ({ cls='w-4 h-4' }) => <Ico cls={cls} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>

export default function AdminOverview() {
  const navigate = useNavigate()
  const [stats, setStats]     = useState({ active: 0, records: 0 })
  const [loading, setLoading] = useState(true)

  const user     = authService.getUser?.() || {}
  const initials = `${user.first_name?.[0]||'A'}${user.last_name?.[0]||''}`.toUpperCase()
  const now      = new Date()
  const hour     = now.getHours()

  useEffect(() => {
    const u = authService.getUser?.() || null
    if (!u || u.role !== 'admin') { navigate('/login'); return }
    const load = async () => {
      try {
        const [sessionsRes, recordsRes] = await Promise.allSettled([
          authService.adminCurrentSessions?.() || Promise.resolve([]),
          authService.adminSitInRecords?.() || Promise.resolve([]),
        ])

        const sessions = sessionsRes.status === 'fulfilled' && Array.isArray(sessionsRes.value)
          ? sessionsRes.value
          : []
        const records = recordsRes.status === 'fulfilled' && Array.isArray(recordsRes.value)
          ? recordsRes.value
          : []

        setStats({ active: sessions.length, records: records.length })
      } catch (_) {}
      finally { setLoading(false) }
    }
    load()
  }, [navigate])

  const LABS = [
    { id:'524', floor:'5F', status:'open' },
    { id:'526', floor:'5F', status:'busy' },
    { id:'528', floor:'5F', status:'open' },
    { id:'530', floor:'5F', status:'open' },
    { id:'532', floor:'5F', status:'busy' },
    { id:'534', floor:'5F', status:'closed' },
    { id:'536', floor:'5F', status:'open' },
    { id:'538', floor:'5F', status:'open' },
  ]

  return (
    <div className="pt-2 sm:pt-3 pb-4 sm:pb-6 px-1 sm:px-2 min-h-[calc(100vh-7rem)] flex">
      <div className="max-w-380 mx-auto w-full flex flex-col gap-6 flex-1">

        {/* ── HEADER BANNER ── */}
        <div className="bg-[#3c096c] rounded-2xl overflow-hidden shadow-xl shadow-[#3c096c]/20 relative">
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage:'repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)', backgroundSize:'12px 12px' }}/>
          <div className="absolute -top-16 right-32 w-64 h-64 rounded-full bg-[#ff9100]/10 blur-3xl pointer-events-none"/>
          <div className="h-1.5 w-full bg-linear-to-r from-[#ff9100] via-violet-400 to-[#3c096c]"/>
          <div className="relative px-4 sm:px-6 lg:px-8 py-5 sm:py-7 flex items-center justify-between gap-6 flex-wrap">
            <div className="flex items-center gap-5">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <IcoShield cls="w-3 h-3 text-[#ff9100]"/>
                  <p className="text-[#ff9100] text-[0.58rem] font-black uppercase tracking-[0.22em]">Administrator</p>
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-none">Dashboard</h1>
                <p className="text-white/40 text-xs mt-1.5">Here's a snapshot of the sit-in system.</p>
              </div>
            </div>
            <div className="flex items-end gap-2 flex-col">
              <span className="flex items-center gap-2 bg-white/08 border border-white/10 rounded-full px-4 py-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"/>
                <span className="text-xs font-semibold text-white/70">System Online</span>
              </span>
              <span className="bg-white/08 border border-white/10 rounded-xl px-4 py-2 text-xs font-bold text-white/60">
                {now.toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' })}
              </span>
            </div>
          </div>
        </div>

        {/* ── STAT ROW ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label:'Active Sessions', value: loading ? '—' : stats.active,  icon:<IcoPlay/>,    accent:true  },
            { label:'Total Records',   value: loading ? '—' : stats.records, icon:<IcoList/>,    orange:true  },
            { label:'Total Labs',      value:'8',                             icon:<IcoMonitor/>, accent:false },
            { label:'Total Seats',     value:'316',                           icon:<IcoUsers/>,   accent:false },
          ].map(({ label, value, icon, accent, orange }) => (
            <div key={label} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                orange ? 'bg-[#ff9100]/10' : accent ? 'bg-[#3c096c]/08' : 'bg-gray-100'
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

          {/* ── LEFT: Quick Actions ── */}
          <div className="col-span-12 lg:col-span-5 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 bg-[#3c096c] rounded-full"/>
              <h2 className="font-black text-[#1a0030] text-base tracking-tight">Quick Actions</h2>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
              {[
                { to:'/admin/search-student', icon:<IcoSearch/>,   label:'Search & Manage Students', desc:'Find students and initiate sit-in sessions', primary:true },
                { to:'/admin/current-sessions', icon:<IcoClock/>,    label:'Current Sessions',          desc:'Monitor active sit-in sessions in real time' },
                { to:'/admin/sit-in-records', icon:<IcoList/>,     label:'Sit-in Records',            desc:'Browse the complete session history' },
                { to:'/admin/create-announcement', icon:<IcoActivity/>, label:'Create Announcement',  desc:'Post notifications for student accounts' },
              ].map(({ to, icon, label, desc, primary }, i, arr) => (
                <Link key={label} to={to}
                  className={`group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-gray-50 ${i < arr.length-1 ? 'border-b border-gray-50' : ''}`}>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                    primary ? 'bg-[#3c096c]' : 'bg-gray-100 group-hover:bg-[#3c096c]/08'
                  }`}>
                    {React.cloneElement(icon, { cls: `w-4 h-4 ${primary ? 'text-white' : 'text-gray-500 group-hover:text-[#3c096c]'}` })}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[#1a0030]">{label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                  </div>
                  <IcoChevron cls="w-4 h-4 text-gray-300 flex-shrink-0 group-hover:text-[#3c096c] group-hover:translate-x-0.5 transition-all"/>
                </Link>
              ))}
            </div>

          </div>

          {/* ── RIGHT ── */}
          <div className="col-span-12 lg:col-span-7 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 bg-[#ff9100] rounded-full"/>
              <h2 className="font-black text-[#1a0030] text-base tracking-tight">System Overview</h2>
            </div>

            {/* Mini stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <p className="text-[0.6rem] font-black uppercase tracking-[0.14em] text-gray-400">Live Sessions</p>
                  <span className="flex items-center gap-1 text-[0.58rem] font-bold text-green-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"/>Live
                  </span>
                </div>
                <p className="text-4xl font-black text-[#3c096c] leading-none">{loading ? '—' : stats.active}</p>
                <Link to="/admin/current-sessions" className="text-xs font-bold text-gray-400 hover:text-[#3c096c] transition-colors flex items-center gap-1">
                  View sessions <IcoChevron cls="w-3 h-3"/>
                </Link>
              </div>
              <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 flex flex-col gap-3">
                <p className="text-[0.6rem] font-black uppercase tracking-[0.14em] text-gray-400">Archived Records</p>
                <p className="text-4xl font-black text-[#ff9100] leading-none">{loading ? '—' : stats.records}</p>
                <Link to="/admin/sit-in-records" className="text-xs font-bold text-gray-400 hover:text-[#3c096c] transition-colors flex items-center gap-1">
                  View records <IcoChevron cls="w-3 h-3"/>
                </Link>
              </div>
            </div>

            {/* Lab grid */}
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#3c096c]/08 flex items-center justify-center">
                    <IcoMonitor cls="w-3.5 h-3.5 text-[#3c096c]"/>
                  </div>
                  <h3 className="font-black text-[#1a0030] text-sm">CCS Laboratories</h3>
                </div>
                <span className="text-[0.58rem] font-bold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">8 Labs</span>
              </div>

              <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {LABS.map(lab => (
                  <div key={lab.id} className={`rounded-xl px-3 py-2.5 flex flex-col items-center gap-1.5 border cursor-default hover:scale-[1.03] transition-transform ${
                    lab.status === 'open'   ? 'bg-gray-50 border-gray-100' :
                    lab.status === 'busy'   ? 'bg-[#ff9100]/06 border-[#ff9100]/20' :
                    'bg-gray-50 border-gray-100 opacity-50'
                  }`}>
                    <p className="text-xs font-black text-[#1a0030]">{lab.id}</p>
                    <p className="text-[0.55rem] text-gray-400 font-medium">{lab.floor}</p>
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      lab.status === 'open'   ? 'bg-green-400 animate-pulse' :
                      lab.status === 'busy'   ? 'bg-[#ff9100] animate-pulse' :
                      'bg-gray-300'
                    }`}/>
                  </div>
                ))}
              </div>

              <div className="px-5 pb-4 flex items-center gap-5">
                {[['bg-green-400','Open'],['bg-[#ff9100]','In Use'],['bg-gray-300','Closed']].map(([c,l]) => (
                  <div key={l} className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${c}`}/>
                    <span className="text-[0.58rem] font-semibold text-gray-400">{l}</span>
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