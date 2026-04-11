import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '../services/authService'

const Ico = ({ d, d2, cls = 'w-4 h-4' }) => (
  <svg className={cls} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    {d2 && <path strokeLinecap="round" strokeLinejoin="round" d={d2} />}
  </svg>
)
const IcoSearch = ({ cls = 'w-4 h-4' }) => <Ico cls={cls} d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
const IcoEdit = ({ cls = 'w-4 h-4' }) => <Ico cls={cls} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
const IcoTrash = ({ cls = 'w-4 h-4' }) => <Ico cls={cls} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
const IcoCheck = ({ cls = 'w-4 h-4' }) => <Ico cls={cls} d="M5 13l4 4L19 7" />
const IcoX = ({ cls = 'w-4 h-4' }) => <Ico cls={cls} d="M6 18L18 6M6 6l12 12" />
const PAGE_SIZE = 8

const formatDate = (v) => {
  if (!v) return '—'
  const d = new Date(String(v).replace(' ', 'T'))
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('en-US', { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function AnnouncementRecords() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [records, setRecords] = useState([])
  const [keyword, setKeyword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [editModal, setEditModal] = useState({ open: false, id: 0, title: '', message: '', tag: 'General' })
  const [page, setPage] = useState(1)

  const loadRecords = async () => {
    const rows = await authService.adminAnnouncementRecords()
    setRecords(rows)
  }

  useEffect(() => {
    const u = authService.getUser?.() || null
    if (!u || u.role !== 'admin') {
      navigate('/login')
      return
    }

    ;(async () => {
      try {
        await loadRecords()
      } catch (err) {
        setError(err.message || 'Failed to load announcement records')
      } finally {
        setLoading(false)
      }
    })()
  }, [navigate])

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase()
    if (!q) return records
    return records.filter((r) =>
      String(r.title || '').toLowerCase().includes(q) ||
      String(r.message || '').toLowerCase().includes(q) ||
      String(r.tag || '').toLowerCase().includes(q)
    )
  }, [records, keyword])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pagedRecords = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  useEffect(() => {
    setPage(1)
  }, [keyword])

  useEffect(() => {
    setPage((prev) => Math.min(prev, totalPages))
  }, [totalPages])

  const withBusy = async (fn, okMsg) => {
    try {
      setBusy(true)
      setError('')
      setSuccess('')
      await fn()
      if (okMsg) setSuccess(okMsg)
    } catch (err) {
      setError(err.message || 'Action failed')
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async (id) => {
    await withBusy(async () => {
      await authService.adminDeleteAnnouncement(id)
      await loadRecords()
    }, 'Announcement deleted successfully.')
  }

  const handleUpdate = async () => {
    if (!editModal.id) return
    if (!editModal.title.trim() || !editModal.message.trim()) {
      setError('Title and message are required.')
      return
    }

    await withBusy(async () => {
      await authService.adminUpdateAnnouncement({
        id: editModal.id,
        title: editModal.title.trim(),
        message: editModal.message.trim(),
        tag: editModal.tag,
      })
      setEditModal({ open: false, id: 0, title: '', message: '', tag: 'General' })
      await loadRecords()
    }, 'Announcement updated successfully.')
  }

  if (loading) return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-4 border-[#3c096c]/20 border-t-[#3c096c] animate-spin" />
        <p className="text-sm font-semibold text-gray-400">Loading announcement records...</p>
      </div>
    </div>
  )

  return (
    <div className="py-6 px-2">
      <div className="max-w-380 mx-auto flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[0.62rem] font-black uppercase tracking-[0.2em] text-[#3c096c]/40 mb-1">ADMIN</p>
            <h1 className="text-4xl font-black text-[#1a0030] tracking-tight">Announcement Records</h1>
          </div>
          <span className="text-xs font-bold text-gray-400 bg-white border border-gray-100 px-3 py-1.5 rounded-full shadow-sm">
            {filtered.length} record{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="relative">
            <IcoSearch cls="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Search title, message, category..."
              className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl pl-10 pr-4 py-3 text-sm font-semibold text-gray-700 focus:outline-none focus:border-[#3c096c] focus:bg-white transition-all"
            />
          </div>
        </div>

        {error && <div className="text-sm font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</div>}
        {success && <div className="flex items-center gap-2 text-sm font-semibold text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3"><IcoCheck cls="w-4 h-4" />{success}</div>}

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-225 text-sm">
              <thead>
                <tr>
                  {['Title', 'Message', 'Category', 'Created', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-5 py-3.5 text-[0.6rem] font-black uppercase tracking-[0.14em] text-gray-400 bg-gray-50 border-b border-gray-100 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={5} className="px-5 py-10 text-center text-gray-400 font-medium">No announcements found.</td></tr>
                ) : pagedRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-3.5 border-b border-gray-50 font-bold text-[#1a0030]">{r.title}</td>
                    <td className="px-5 py-3.5 border-b border-gray-50 text-gray-600 max-w-85">
                      <p className="line-clamp-2">{r.message}</p>
                    </td>
                    <td className="px-5 py-3.5 border-b border-gray-50">
                      <span className="text-xs font-bold text-[#3c096c] bg-[#3c096c]/08 border border-[#3c096c]/15 px-2 py-1 rounded-full">{r.tag}</span>
                    </td>
                    <td className="px-5 py-3.5 border-b border-gray-50 text-xs text-gray-500">{formatDate(r.created_at)}</td>
                    <td className="px-5 py-3.5 border-b border-gray-50">
                      <div className="flex items-center gap-2">
                        <button
                          disabled={busy}
                          onClick={() => setEditModal({ open: true, id: r.id, title: r.title || '', message: r.message || '', tag: r.tag || 'General' })}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#3c096c]/20 text-[#3c096c] text-xs font-bold hover:bg-[#3c096c]/05 hover:border-[#3c096c]/40 disabled:opacity-50 transition-colors"
                        >
                          <IcoEdit cls="w-3.5 h-3.5" /> Edit
                        </button>
                        <button
                          disabled={busy}
                          onClick={() => handleDelete(r.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 text-red-500 text-xs font-bold hover:bg-red-50 disabled:opacity-50 transition-colors"
                        >
                          <IcoTrash cls="w-3.5 h-3.5" /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filtered.length > PAGE_SIZE && (
            <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-400">Page {page} of {totalPages}</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-bold text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-bold text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {editModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={(e) => e.target === e.currentTarget && setEditModal({ open: false, id: 0, title: '', message: '', tag: 'General' })}>
          <div className="absolute inset-0 bg-[#1a0030]/60 backdrop-blur-sm" />
          <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="h-1 w-full bg-linear-to-r from-[#ff9100] via-violet-400 to-[#3c096c]" />
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-black text-[#1a0030] text-base">Edit Announcement</h3>
              <button onClick={() => setEditModal({ open: false, id: 0, title: '', message: '', tag: 'General' })} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
                <IcoX cls="w-4 h-4" />
              </button>
            </div>
            <div className="px-6 py-5 flex flex-col gap-3">
              <input
                value={editModal.title}
                onChange={(e) => setEditModal((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Title"
                className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-gray-700 focus:outline-none focus:border-[#3c096c]"
              />
              <select
                value={editModal.tag}
                onChange={(e) => setEditModal((prev) => ({ ...prev, tag: e.target.value }))}
                className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-gray-700 focus:outline-none focus:border-[#3c096c]"
              >
                <option value="General">General</option>
                <option value="Academic">Academic</option>
                <option value="System">System</option>
              </select>
              <textarea
                rows={6}
                value={editModal.message}
                onChange={(e) => setEditModal((prev) => ({ ...prev, message: e.target.value }))}
                placeholder="Message"
                className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-3.5 py-2.5 text-sm font-medium text-gray-700 resize-y focus:outline-none focus:border-[#3c096c]"
              />
            </div>
            <div className="px-6 pb-5 flex justify-end gap-2">
              <button onClick={() => setEditModal({ open: false, id: 0, title: '', message: '', tag: 'General' })} className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-500 hover:bg-gray-50 transition-colors">Cancel</button>
              <button disabled={busy} onClick={handleUpdate} className="px-4 py-2.5 rounded-xl bg-[#3c096c] text-white text-sm font-bold hover:bg-[#5a189a] disabled:opacity-60 transition-colors">{busy ? 'Saving...' : 'Save Changes'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
