import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ccsLogo from '../assets/ccsmainlogo.png'

const LABS = [
  { id: 'Lab 524', floor: '5F', used: 12, seats: 40, status: 'Open' },
  { id: 'Lab 526', floor: '5F', used: 38, seats: 38, status: 'Full' },
  { id: 'Lab 528', floor: '5F', used: 0,  seats: 40, status: 'Open' },
  { id: 'Lab 530', floor: '5F', used: 21, seats: 36, status: 'Open' },
]

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
  { Icon: IconMonitor,  title: 'Real-time Availability', desc: 'See which labs are open or full the moment you check — no guessing.' },
  { Icon: IconUsers,    title: 'Seat Counter',            desc: 'Know exactly how many seats are taken before you walk to the lab.' },
  { Icon: IconCalendar, title: 'Schedule View',           desc: 'Browse class schedules per lab so you can plan your sit-in ahead.' },
]

export default function Landing() {
  const [typed, setTyped]       = useState('')
  const [cursorOn, setCursorOn] = useState(true)
  const [wordIdx, setWordIdx]   = useState(0)
  const [deleting, setDeleting] = useState(false)
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

  return (
    <div className="min-h-screen bg-transparent">

      {/* ─── HERO ─── */}
      <section className="max-w-6xl mx-auto px-6 pt-14 pb-20 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

        {/* LEFT */}
        <div className="flex flex-col">
          <div className="inline-flex items-center gap-2 self-start mb-6 px-4 py-2 rounded-full bg-[#3c096c]/10 border border-[#3c096c]/20">
            <span className="w-2 h-2 rounded-full bg-[#ff9100] animate-ping" />
            <span className="text-[0.68rem] font-bold uppercase tracking-widest text-[#3c096c]">
              Live Lab Status · CCS
            </span>
          </div>

          <h1 className="text-5xl lg:text-6xl font-black leading-tight tracking-tight text-[#1a0030] mb-5">
            Find a Lab<br />
            That's{' '}
            <span className="text-[#ff9100]">{typed}</span>
            <span className={`text-[#3c096c] transition-opacity ${cursorOn ? 'opacity-100' : 'opacity-0'}`}>|</span>
          </h1>

          <p className="text-base text-gray-500 leading-relaxed max-w-md mb-8">
            The{' '}
            <span className="text-[#3c096c] font-semibold">College of Computer Studies</span>{' '}
            sit-in monitoring system. Check real-time lab availability, seat counts,
            and schedules — all in one place.
          </p>

          <div className="flex items-center gap-4 flex-wrap mb-10">
            <Link to="/signup" className="bg-[#ff9100] text-[#3c096c] font-bold px-8 py-3 rounded-full hover:bg-orange-400 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
              Get Started Free →
            </Link>
            <Link to="/login" className="text-[#3c096c] font-semibold px-8 py-3 rounded-full border-2 border-[#3c096c]/30 hover:border-[#3c096c] hover:bg-[#3c096c]/5 transition-all duration-300">
              Log In
            </Link>
          </div>

          <div className="flex items-center gap-8 pt-8 border-t border-[#3c096c]/10">
            {[['8', 'Total Labs'], ['316', 'Total Seats'], ['Live', 'Updates']].map(([n, l], i) => (
              <React.Fragment key={l}>
                {i > 0 && <div className="w-px h-8 bg-[#3c096c]/15" />}
                <div>
                  <div className="text-2xl font-black text-[#3c096c]">{n}</div>
                  <div className="text-[0.65rem] uppercase tracking-widest font-semibold text-gray-400 mt-0.5">{l}</div>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* RIGHT — lab monitor card */}
        <div className="flex justify-center items-center">
          <div className="w-full max-w-sm bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl shadow-[#3c096c]/15 border border-[#3c096c]/10 overflow-hidden">
            <div className="bg-[#3c096c] px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <img src={ccsLogo} alt="CCS" className="w-7 h-7 rounded-md border border-white/20" />
                <div>
                  <div className="text-white font-bold text-sm">Lab Monitor</div>
                  <div className="text-purple-300 text-[0.6rem] uppercase tracking-widest">Live · CCS Building</div>
                </div>
              </div>
              <div className="flex gap-1.5">
                {['bg-red-400', 'bg-yellow-400', 'bg-green-400'].map(c => (
                  <div key={c} className={`w-2.5 h-2.5 rounded-full ${c}`} />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-4 px-5 py-2 bg-gray-50/80 border-b border-gray-100">
              {['Lab', 'Floor', 'Seats', 'Status'].map(h => (
                <span key={h} className="text-[0.6rem] uppercase tracking-widest font-bold text-gray-400">{h}</span>
              ))}
            </div>

            <div className="divide-y divide-gray-50">
              {LABS.map(lab => (
                <div key={lab.id} className="grid grid-cols-4 items-center px-5 py-3 hover:bg-purple-50/50 transition-colors">
                  <span className="text-sm font-bold text-[#1a0030]">{lab.id}</span>
                  <span className="text-xs font-medium text-gray-400">{lab.floor}</span>
                  <div className="flex flex-col gap-1">
                    <span className="text-[0.65rem] text-gray-400">{lab.used}/{lab.seats}</span>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${lab.status === 'Full' ? 'bg-red-400' : 'bg-[#ff9100]'}`}
                        style={{ width: `${Math.round((lab.used / lab.seats) * 100)}%` }}
                      />
                    </div>
                  </div>
                  <span className={`text-[0.65rem] font-bold px-2.5 py-1 rounded-full w-fit ${
                    lab.status === 'Full' ? 'bg-red-100 text-red-600' : 'bg-[#3c096c]/10 text-[#3c096c]'
                  }`}>
                    {lab.status}
                  </span>
                </div>
              ))}
            </div>

            <div className="px-5 py-3 bg-gray-50/80 border-t border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-ping" />
                <span className="text-[0.62rem] text-gray-400 font-medium">Syncing live data...</span>
              </div>
              <span className="text-[0.62rem] font-bold text-[#ff9100] uppercase tracking-wide">CCS Only</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section className="bg-[#3c096c] py-20 px-6 rounded-3xl mx-6 mb-10">
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

      {/* ─── CTA BANNER ─── */}
      <section className="py-16 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl lg:text-4xl font-black text-[#1a0030] tracking-tight mb-4">
            Ready to find your lab?
          </h2>
          <p className="text-gray-500 mb-8 leading-relaxed">
            Create a free account and check which CCS labs are open right now.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link to="/signup" className="bg-[#3c096c] text-white font-bold px-10 py-3.5 rounded-full hover:bg-violet-900 hover:shadow-xl hover:shadow-[#3c096c]/30 hover:-translate-y-0.5 transition-all duration-300">
              Create Free Account
            </Link>
            <Link to="/login" className="text-[#3c096c] font-semibold px-8 py-3.5 rounded-full border-2 border-[#3c096c]/25 hover:border-[#3c096c] transition-all duration-300">
              Log In
            </Link>
          </div>
        </div>
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