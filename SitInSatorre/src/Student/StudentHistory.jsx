import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '../services/authService'
import LoadingScreen from '../components/LoadingScreen'

const formatDateTime = (value) => {
  if (!value) return '—'
  const d = new Date(String(value).replace(' ', 'T'))
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

const formatDuration = (minutes) => {
  const total = Number(minutes || 0)
  const h = Math.floor(total / 60)
  const m = total % 60
  if (h <= 0) return `${m}m`
  if (m <= 0) return `${h}h`
  return `${h}h ${m}m`
}

const STATUS_CLASS = {
  Completed: 'bg-[#ff9100]/20 text-[#ff9100] border-[#ff9100]',
}
const PAGE_SIZE = 8
const hasAdminFeedback = (row) => String(row?.admin_feedback || '').trim() !== ''

export default function StudentHistory() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [records, setRecords] = useState([])
  const [studentIdNumber, setStudentIdNumber] = useState('')
  const [feedbackModal, setFeedbackModal] = useState({ open: false, record: null })
  const [page, setPage] = useState(1)

  const refreshHistoryData = async (idNumber, showError = false) => {
    if (!idNumber) return

    try {
      const rows = await authService.fetchStudentHistory(idNumber)
      setRecords(Array.isArray(rows) ? rows : [])
      setError('')
    } catch (err) {
      if (showError) {
        setError(err?.message || 'Failed to load history')
        setRecords([])
      }
    }
  }

  useEffect(() => {
    const load = async () => {
      const user = authService.getUser?.() || null
      if (!user?.id_number || user?.role !== 'student') {
        navigate('/login')
        return
      }
      setStudentIdNumber(user.id_number)

      try {
        await refreshHistoryData(user.id_number, true)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [navigate])

  useEffect(() => {
    if (!studentIdNumber) return undefined

    let cancelled = false

    const refresh = async () => {
      if (cancelled) return
      await refreshHistoryData(studentIdNumber)
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
  }, [studentIdNumber])

  const summary = useMemo(() => {
    const total = records.length
    const minutes = records.reduce((sum, row) => sum + Number(row.duration_minutes || 0), 0)
    const thisMonth = records.filter(row => {
      const d = new Date(String(row.started_at || '').replace(' ', 'T'))
      if (Number.isNaN(d.getTime())) return false
      const now = new Date()
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    }).length
    return { total, minutes, thisMonth }
  }, [records])

  const totalPages = Math.max(1, Math.ceil(records.length / PAGE_SIZE))
  const pagedRecords = records.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  useEffect(() => {
    setPage((prev) => Math.min(prev, totalPages))
  }, [totalPages])

  const openFeedbackModal = (row) => {
    if (!row || row.status === 'Active' || Number(row.id || 0) <= 0) return
    setFeedbackModal({
      open: true,
      record: row,
    })
  }

  const closeFeedbackModal = () => {
    setFeedbackModal({ open: false, record: null })
  }

  if (loading) return <LoadingScreen message="Loading sit-in history..." />

  return (
    <div className="pt-2 sm:pt-3 pb-4 sm:pb-6 px-1 sm:px-2 bg-transparent">
      <div className="max-w-380 mx-auto w-full flex flex-col gap-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-[0.62rem] font-black uppercase tracking-[0.2em] text-[#3c096c]/50">Student</p>
            <h1 className="text-3xl sm:text-4xl font-black text-[#1a0030] tracking-tight">Sit-in History</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
            <p className="text-[0.58rem] font-black uppercase tracking-widest text-gray-400">Total Sessions</p>
            <p className="text-3xl font-black text-[#3c096c] mt-1">{summary.total}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
            <p className="text-[0.58rem] font-black uppercase tracking-widest text-gray-400">This Month</p>
            <p className="text-3xl font-black text-[#ff9100] mt-1">{summary.thisMonth}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
            <p className="text-[0.58rem] font-black uppercase tracking-widest text-gray-400">Total Time</p>
            <p className="text-3xl font-black text-[#1a0030] mt-1">{formatDuration(summary.minutes)}</p>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 sm:px-5 py-3 border-b border-gray-100">
            <p className="text-sm font-bold text-[#1a0030]">Session Records</p>
          </div>

          {error ? (
            <div className="p-5 text-sm text-red-500">{error}</div>
          ) : records.length === 0 ? (
            <div className="p-5 text-sm text-gray-400">No history records found.</div>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full min-w-225 text-left">
                  <thead className="bg-gray-50 text-[0.64rem] uppercase tracking-wider text-gray-500">
                    <tr>
                      <th className="px-4 py-3">Room</th>
                      <th className="px-4 py-3">Purpose</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Admin Feedback</th>
                      <th className="px-4 py-3">Started</th>
                      <th className="px-4 py-3">Ended</th>
                      <th className="px-4 py-3">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedRecords.map((row, idx) => (
                      <tr key={row.history_key || row.id || idx} className="border-t border-gray-100">
                        <td className="px-4 py-3 text-sm font-semibold text-[#1a0030]">{row.room || '—'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{row.purpose || '—'}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-bold ${STATUS_CLASS[row.status] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                            {row.status || 'Completed'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {row.status === 'Active' ? (
                            <span className="text-xs font-semibold text-gray-400">—</span>
                          ) : !hasAdminFeedback(row) ? (
                            <span className="text-xs font-semibold text-gray-400">No feedback</span>
                          ) : (
                            <button
                              onClick={() => openFeedbackModal(row)}
                              className="text-xs font-bold px-3 py-1.5 rounded-lg border border-[#3c096c]/20 text-[#3c096c] hover:bg-[#3c096c]/5 transition-colors"
                            >
                              View
                            </button>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{formatDateTime(row.started_at)}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{row.status === 'Active' ? 'In Progress' : formatDateTime(row.ended_at)}</td>
                        <td className="px-4 py-3 text-sm font-bold text-[#3c096c]">{formatDuration(row.duration_minutes)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden p-3 flex flex-col gap-2.5">
                {pagedRecords.map((row, idx) => (
                  <div key={row.history_key || row.id || idx} className="border border-gray-100 rounded-xl p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-bold text-[#1a0030]">{row.room || 'Unspecified Room'}</p>
                      <span className="text-[0.68rem] font-bold text-[#3c096c] bg-[#3c096c]/08 border border-[#3c096c]/15 px-2 py-0.5 rounded-full">
                        {formatDuration(row.duration_minutes)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{row.purpose || 'No purpose provided'}</p>
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[0.68rem] font-bold ${STATUS_CLASS[row.status] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                        {row.status || 'Completed'}
                      </span>
                    </div>
                    <p className="text-[0.7rem] text-gray-400 mt-2">Start: {formatDateTime(row.started_at)}</p>
                    <p className="text-[0.7rem] text-gray-400">End: {row.status === 'Active' ? 'In Progress' : formatDateTime(row.ended_at)}</p>
                    {row.status !== 'Active' && hasAdminFeedback(row) && (
                      <button
                        onClick={() => openFeedbackModal(row)}
                        className="mt-2 text-xs font-bold px-3 py-1.5 rounded-lg border border-[#3c096c]/20 text-[#3c096c] hover:bg-[#3c096c]/5 transition-colors"
                      >
                        View Admin Feedback
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {records.length > PAGE_SIZE && (
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
            </>
          )}
        </div>

        {feedbackModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={(e) => e.target === e.currentTarget && closeFeedbackModal()}>
            <div className="absolute inset-0 bg-[#1a0030]/60 backdrop-blur-sm" />
            <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl shadow-[#3c096c]/25 overflow-hidden">
              <div className="h-1 w-full bg-linear-to-r from-[#ff9100] via-violet-400 to-[#3c096c]" />
              <div className="px-6 py-5 border-b border-gray-100">
                <h3 className="text-lg font-black text-[#1a0030]">Session Feedback</h3>
                <p className="text-xs text-gray-400 mt-1">
                  Session #{feedbackModal.record?.session_id || feedbackModal.record?.id} · {feedbackModal.record?.room || 'No room'}
                </p>
              </div>
              <div className="px-6 py-5">
                <label className="block text-[0.62rem] font-black uppercase tracking-[0.14em] text-gray-400">Admin feedback</label>
                <div className="mt-2 w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-3.5 py-3 text-sm font-semibold text-gray-700 min-h-28 whitespace-pre-wrap">
                  {String(feedbackModal.record?.admin_feedback || '').trim() || 'No feedback provided by admin.'}
                </div>
              </div>
              <div className="px-6 pb-5 flex justify-end gap-2">
                <button
                  onClick={closeFeedbackModal}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-bold text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
