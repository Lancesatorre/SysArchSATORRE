import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '../services/authService'

const Ico = ({ d, d2, cls = 'w-4 h-4' }) => (
  <svg className={cls} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    {d2 && <path strokeLinecap="round" strokeLinejoin="round" d={d2} />}
  </svg>
)
const IcoMegaphone = ({ cls = 'w-4 h-4' }) => <Ico cls={cls} d="M11 5.882a1 1 0 01.553-.894l6-3A1 1 0 0119 2.882V14a1 1 0 01-1.447.894l-6-3A1 1 0 0111 11.999V5.882z" d2="M5 10h6M5 14h2m-1 0v5" />
const IcoTag = ({ cls = 'w-4 h-4' }) => <Ico cls={cls} d="M7 7h.01M3 11l7.586 7.586a2 2 0 002.828 0l6.172-6.172a2 2 0 000-2.828L12 2H4a1 1 0 00-1 1v8z" />
const IcoCheck = ({ cls = 'w-4 h-4' }) => <Ico cls={cls} d="M5 13l4 4L19 7" />
const IcoWarning = ({ cls = 'w-4 h-4' }) => <Ico cls={cls} d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />

export default function CreateAnnouncement() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [tag, setTag] = useState('General')
  const [submitting, setSubmitting] = useState(false)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    const u = authService.getUser?.() || null
    if (!u || u.role !== 'admin') {
      navigate('/login')
    }
  }, [navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setNotice('')

    if (!title.trim() || !message.trim()) {
      setNotice('Title and message are required.')
      return
    }

    setSubmitting(true)
    try {
      await authService.adminCreateAnnouncement({
        title: title.trim(),
        message: message.trim(),
        tag,
      })
      setTitle('')
      setMessage('')
      setTag('General')
      setNotice('Announcement posted successfully.')
    } catch (error) {
      setNotice(error.message || 'Failed to post announcement.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="py-6 px-2 lg:px-4">
      <div className="max-w-4xl mx-auto flex flex-col gap-6 sm:gap-8">

        {/* ── IMMERSIVE HEADER BANNER ── */}
        <div className="bg-[#3c096c] rounded-3xl overflow-hidden shadow-xl shadow-[#3c096c]/25 relative">
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)', backgroundSize: '12px 12px' }} />
          <div className="absolute -top-16 right-48 w-64 h-64 rounded-full bg-[#ff9100]/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 left-1/3 w-80 h-40 rounded-full bg-violet-500/08 blur-3xl pointer-events-none" />
          <div className="h-1.5 w-full bg-linear-to-r from-[#ff9100] via-violet-400 to-[#3c096c]" />

          <div className="relative px-6 sm:px-8 py-7 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <p className="text-purple-200/60 text-[0.62rem] font-black uppercase tracking-[0.25em] mb-1.5">Communications</p>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-none uppercase">Create Announcement</h1>
              <p className="text-xs text-purple-200/70 font-medium mt-2.5 max-w-lg leading-relaxed">
                Broadcast system updates, academic policies, or general announcements to all students via the portal.
              </p>
            </div>

            <div className="flex items-center gap-3 bg-white/10 border border-white/15 rounded-2xl p-3 shrink-0 backdrop-blur-xs">
              <span className="p-2.5 bg-white/10 text-white rounded-xl">
                <IcoMegaphone cls="w-5 h-5 stroke-[2.5]" />
              </span>
              <div className="text-left">
                <p className="text-[0.62rem] text-purple-200/50 font-black uppercase tracking-widest leading-none">Status</p>
                <div className="mt-1.5">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-500/20 border border-green-500/35 text-green-300 rounded-full text-[0.68rem] font-black uppercase tracking-wider shadow-sm">
                    System Active
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── CREATE FORM CONTAINER ── */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-xs flex flex-col gap-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              <div className="col-span-1 md:col-span-2">
                <label className="text-[0.68rem] font-black text-gray-400 uppercase tracking-widest block mb-2 pl-1">
                  Announcement Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="E.g., System Maintenance Update"
                  className="w-full bg-gray-50/50 border-2 border-gray-150 rounded-2xl px-5 py-3.5 text-sm font-semibold text-[#1a0030] placeholder-gray-300 focus:outline-none focus:border-[#3c096c]/25 focus:bg-white transition-all shadow-inner"
                />
              </div>

              <div className="col-span-1 md:col-span-2">
                <label className="text-[0.68rem] font-black text-gray-400 uppercase tracking-widest block mb-2 pl-1">
                  Category / Tag
                </label>
                <select
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  className="w-full bg-gray-50/50 border-2 border-gray-150 rounded-2xl px-5 py-3.5 text-sm font-semibold text-[#1a0030] focus:outline-none focus:border-[#3c096c]/25 focus:bg-white transition-all shadow-inner appearance-none cursor-pointer"
                >
                  <option value="General">General</option>
                  <option value="Academic">Academic</option>
                  <option value="System">System</option>
                  <option value="Updates">Updates</option>
                  <option value="Exams">Exams</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Rules">Rules</option>
                </select>
              </div>

              <div className="col-span-1 md:col-span-2">
                <label className="text-[0.68rem] font-black text-gray-400 uppercase tracking-widest block mb-2 pl-1">
                  Announcement Message
                </label>
                <textarea
                  rows={8}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write the full details of the announcement here..."
                  className="w-full bg-gray-50/50 border-2 border-gray-150 rounded-2xl px-5 py-4 text-sm font-medium text-[#1a0030] placeholder-gray-300 resize-y focus:outline-none focus:border-[#3c096c]/25 focus:bg-white transition-all shadow-inner leading-relaxed"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-2 border-t border-dashed border-gray-150 pt-6">
              <div className="w-full sm:w-auto">
                {notice && (
                  <div className={`flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-bold ${notice.includes('successfully') ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
                    {notice.includes('successfully') ? <IcoCheck cls="w-4 h-4 shrink-0" /> : <IcoWarning cls="w-4 h-4 shrink-0" />}
                    <p>{notice}</p>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#3c096c] hover:bg-[#240046] text-white text-xs font-black uppercase tracking-widest rounded-2xl px-8 py-4 shadow-md shadow-[#3c096c]/20 hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all duration-150 disabled:bg-gray-100 disabled:text-gray-400 disabled:shadow-none disabled:scale-100"
              >
                <IcoMegaphone cls="w-4 h-4" />
                {submitting ? 'Broadcasting...' : 'Broadcast Announcement'}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  )
}
