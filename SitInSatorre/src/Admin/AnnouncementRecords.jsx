import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '../services/authService'
import LoadingScreen from '../Components/LoadingScreen'

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

    ; (async () => {
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

  if (loading) return <LoadingScreen message="Loading announcements..." />

  return (
    <div className="py-6 px-2 lg:px-4">
      <div className="max-w-7xl mx-auto flex flex-col gap-6 sm:gap-8">

        {/* ── IMMERSIVE HEADER BANNER ── */}
        <div className="bg-[#3c096c] rounded-3xl overflow-hidden shadow-xl shadow-[#3c096c]/25 relative">
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)', backgroundSize: '12px 12px' }} />
          <div className="absolute -top-16 right-48 w-64 h-64 rounded-full bg-[#ff9100]/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 left-1/3 w-80 h-40 rounded-full bg-violet-500/08 blur-3xl pointer-events-none" />
          <div className="h-1.5 w-full bg-linear-to-r from-[#ff9100] via-violet-400 to-[#3c096c]" />

          <div className="relative px-6 sm:px-8 py-7 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <p className="text-purple-200/60 text-[0.62rem] font-black uppercase tracking-[0.25em] mb-1.5">Communications</p>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-none uppercase">Announcement Logs</h1>
              <p className="text-xs text-purple-200/70 font-medium mt-2.5 max-w-lg leading-relaxed">
                Review, edit, or remove past announcements broadcasted to the student portal.
              </p>
            </div>

            <div className="flex items-center gap-3 bg-white/10 border border-white/15 rounded-2xl p-3 shrink-0 backdrop-blur-xs">
              <span className="p-2.5 bg-white/10 text-white rounded-xl">
                <IcoSearch cls="w-5 h-5 stroke-[2.5]" />
              </span>
              <div className="text-left">
                <p className="text-[0.62rem] text-purple-200/50 font-black uppercase tracking-widest leading-none">Total Records</p>
                <div className="mt-1.5">
                  <span className="inline-flex items-center px-3 py-1 bg-white/10 border border-white/10 text-white/90 rounded-full text-[0.68rem] font-bold">
                    {filtered.length} Announcements
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── TOOLBAR & SEARCH ── */}
        <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-xs flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:max-w-md">
            <IcoSearch cls="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Search announcements..."
              className="w-full bg-gray-50 border-2 border-gray-150 rounded-2xl pl-11 pr-4 py-3 text-sm font-semibold text-[#1a0030] placeholder-gray-400 focus:outline-none focus:border-[#3c096c]/25 focus:bg-white transition-all shadow-inner"
            />
          </div>
        </div>

        {error && <div className="text-sm font-bold text-red-700 bg-red-50 border border-red-200 rounded-2xl px-4 py-3 shadow-sm">{error}</div>}
        {success && <div className="flex items-center gap-2 text-sm font-bold text-green-700 bg-green-50 border border-green-200 rounded-2xl px-4 py-3 shadow-sm"><IcoCheck cls="w-4 h-4" />{success}</div>}

        {/* ── DATA TABLE ── */}
        <div className="bg-white border border-gray-100 rounded-3xl shadow-xs overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-sm text-left">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-150">
                  {['Title', 'Message', 'Category', 'Broadcasted', 'Actions'].map((h) => (
                    <th key={h} className="px-6 py-4 text-[0.65rem] font-black uppercase tracking-[0.18em] text-gray-400 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400 font-bold text-sm">No announcements match your search.</td></tr>
                ) : pagedRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50/50 transition-colors duration-200 group">
                    <td className="px-6 py-4 text-[#1a0030] font-black">{r.title}</td>
                    <td className="px-6 py-4 text-gray-500 max-w-xs">
                      <p className="line-clamp-2 text-xs font-semibold leading-relaxed">{r.message}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#3c096c]/05 border border-[#3c096c]/15 text-[#3c096c] text-[0.62rem] font-black uppercase tracking-wider">
                        {r.tag}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[0.7rem] font-bold text-gray-400 whitespace-nowrap">
                      {formatDate(r.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          disabled={busy}
                          onClick={() => setEditModal({ open: true, id: r.id, title: r.title || '', message: r.message || '', tag: r.tag || 'General' })}
                          className="flex items-center justify-center w-8 h-8 rounded-xl bg-gray-50 text-gray-500 hover:bg-[#3c096c] hover:text-white border border-gray-200 hover:border-[#3c096c] transition-all disabled:opacity-50 shadow-sm"
                          title="Edit"
                        >
                          <IcoEdit cls="w-4 h-4" />
                        </button>
                        <button
                          disabled={busy}
                          onClick={() => handleDelete(r.id)}
                          className="flex items-center justify-center w-8 h-8 rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white border border-red-200 hover:border-red-500 transition-all disabled:opacity-50 shadow-sm"
                          title="Delete"
                        >
                          <IcoTrash cls="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filtered.length > PAGE_SIZE && (
            <div className="px-6 py-4 border-t border-gray-150 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-[0.65rem] font-black uppercase tracking-widest text-gray-400">
                Page <span className="text-[#3c096c]">{page}</span> of <span className="text-[#3c096c]">{totalPages}</span>
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-xs font-bold text-gray-500 hover:bg-gray-50 hover:text-[#1a0030] shadow-sm transition-all disabled:opacity-40 disabled:hover:bg-white"
                >
                  Prev
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-xs font-bold text-gray-500 hover:bg-gray-50 hover:text-[#1a0030] shadow-sm transition-all disabled:opacity-40 disabled:hover:bg-white"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal (Light Theme) */}
      {editModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={(e) => e.target === e.currentTarget && setEditModal({ open: false, id: 0, title: '', message: '', tag: 'General' })}>
          <div className="absolute inset-0 bg-[#1a0030]/60 backdrop-blur-sm" />
          <div className="relative w-full max-w-xl bg-white border border-gray-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
            <div className="h-1.5 w-full bg-linear-to-r from-[#ff9100] via-[#c77dff] to-[#3c096c]" />
            <div className="flex items-center justify-between px-6 md:px-8 py-5 border-b border-gray-100">
              <h3 className="font-black text-[#1a0030] text-lg tracking-tight uppercase">Edit Announcement</h3>
              <button onClick={() => setEditModal({ open: false, id: 0, title: '', message: '', tag: 'General' })} className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors bg-gray-50">
                <IcoX cls="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 md:px-8 py-6 flex flex-col gap-5 overflow-y-auto max-h-[60vh]">
              <div>
                <label className="block text-[0.65rem] font-black uppercase tracking-widest text-gray-400 mb-2 pl-1">Title</label>
                <input
                  value={editModal.title}
                  onChange={(e) => setEditModal((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Update title..."
                  className="w-full bg-gray-50 border-2 border-gray-150 rounded-2xl px-4 py-3 text-sm font-semibold text-[#1a0030] focus:outline-none focus:border-[#3c096c]/25 focus:bg-white transition-all"
                />
              </div>
              <div>
                <label className="block text-[0.65rem] font-black uppercase tracking-widest text-gray-400 mb-2 pl-1">Category</label>
                <select
                  value={editModal.tag}
                  onChange={(e) => setEditModal((prev) => ({ ...prev, tag: e.target.value }))}
                  className="w-full bg-gray-50 border-2 border-gray-150 rounded-2xl px-4 py-3 text-sm font-semibold text-[#1a0030] focus:outline-none focus:border-[#3c096c]/25 focus:bg-white transition-all appearance-none cursor-pointer"
                >
                  <option value="General">General</option>
                  <option value="Academic">Academic</option>
                  <option value="System">System</option>
                </select>
              </div>
              <div>
                <label className="block text-[0.65rem] font-black uppercase tracking-widest text-gray-400 mb-2 pl-1">Message</label>
                <textarea
                  rows={6}
                  value={editModal.message}
                  onChange={(e) => setEditModal((prev) => ({ ...prev, message: e.target.value }))}
                  placeholder="Update message..."
                  className="w-full bg-gray-50 border-2 border-gray-150 rounded-2xl px-4 py-3 text-sm font-medium text-[#1a0030] resize-y focus:outline-none focus:border-[#3c096c]/25 focus:bg-white transition-all leading-relaxed"
                />
              </div>
            </div>

            <div className="px-6 md:px-8 py-5 bg-gray-50/80 border-t border-gray-150 flex justify-end gap-3">
              <button onClick={() => setEditModal({ open: false, id: 0, title: '', message: '', tag: 'General' })} className="px-5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-bold text-gray-500 hover:bg-gray-50 hover:text-gray-700 shadow-sm transition-colors">
                Cancel
              </button>
              <button disabled={busy} onClick={handleUpdate} className="px-6 py-2.5 rounded-xl bg-[#3c096c] hover:bg-[#240046] text-white text-xs font-black uppercase tracking-widest shadow-md shadow-[#3c096c]/20 hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:scale-100 transition-all">
                {busy ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
