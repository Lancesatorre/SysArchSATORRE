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
    <div className="py-6 px-2">
      <div className="max-w-380 mx-auto flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[0.62rem] font-black uppercase tracking-[0.2em] text-[#3c096c]/40 mb-1">ADMIN</p>
            <h1 className="text-4xl font-black text-[#1a0030] tracking-tight">Create Announcement</h1>
          </div>
          <span className="inline-flex items-center gap-2 text-xs font-bold text-gray-400 bg-white border border-gray-100 px-3 py-1.5 rounded-full shadow-sm">
            <IcoMegaphone cls="w-3.5 h-3.5" /> Student Notifications
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-[0.6rem] font-black uppercase tracking-[0.14em] text-gray-400 mb-1.5">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter announcement title"
                className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-gray-700 focus:outline-none focus:border-[#3c096c] focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-[0.6rem] font-black uppercase tracking-[0.14em] text-gray-400 mb-1.5">Category</label>
              <select
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-gray-700 focus:outline-none focus:border-[#3c096c] focus:bg-white transition-all"
              >
                <option value="General">General</option>
                <option value="Academic">Academic</option>
                <option value="System">System</option>
              </select>
            </div>

            <div>
              <label className="block text-[0.6rem] font-black uppercase tracking-[0.14em] text-gray-400 mb-1.5">Message</label>
              <textarea
                rows={7}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write announcement details..."
                className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-3.5 py-2.5 text-sm font-medium text-gray-700 resize-y focus:outline-none focus:border-[#3c096c] focus:bg-white transition-all"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#3c096c] bg-[#3c096c]/08 border border-[#3c096c]/15 px-2 py-1 rounded-full">
                <IcoTag cls="w-3.5 h-3.5" /> {tag}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 bg-[#ff9100] text-white text-sm font-bold rounded-xl px-5 py-2.5 hover:bg-orange-400 shadow-sm shadow-[#ff9100]/25 hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:translate-y-0"
              >
                <IcoMegaphone cls="w-4 h-4" />
                {submitting ? 'Posting...' : 'Post Announcement'}
              </button>
            </div>

            {notice && (
              <div className={`flex items-center gap-2 rounded-xl px-4 py-3 ${notice.includes('successfully') ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-600'}`}>
                {notice.includes('successfully') ? <IcoCheck cls="w-4 h-4" /> : <IcoWarning cls="w-4 h-4" />}
                <p className="text-sm font-semibold">{notice}</p>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}
