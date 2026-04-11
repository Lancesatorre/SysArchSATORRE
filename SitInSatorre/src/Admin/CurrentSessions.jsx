import React, { useEffect, useState } from 'react'

import { useNavigate } from 'react-router-dom'
import { authService } from '../services/authService'

// ── Icons ──────────────────────────────────────────────
const Ico = ({ d, d2, cls = 'w-4 h-4' }) => (
  <svg className={cls} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    {d2 && <path strokeLinecap="round" strokeLinejoin="round" d={d2} />}
  </svg>
)
const IcoWarning  = ({ cls = 'w-4 h-4' }) => <Ico cls={cls} d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
const IcoCheck    = ({ cls = 'w-4 h-4' }) => <Ico cls={cls} d="M5 13l4 4L19 7" />
const IcoStop     = ({ cls = 'w-4 h-4' }) => <Ico cls={cls} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" d2="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
const IcoUsers    = ({ cls = 'w-4 h-4' }) => <Ico cls={cls} d="M17 20h5v-2a4 4 0 00-4-4H4a4 4 0 00-4 4v2h5M12 12a4 4 0 100-8 4 4 0 000 8z" />
const IcoX        = ({ cls = 'w-4 h-4' }) => <Ico cls={cls} d="M6 18L18 6M6 6l12 12" />
const IcoRefresh  = ({ cls = 'w-4 h-4' }) => <Ico cls={cls} d="M4 4v5h5M20 20v-5h-5M4 9a9 9 0 0114.5-5.2M20 15a9 9 0 01-14.5 5.2" />
const PAGE_SIZE = 8

// ── Avatar: profile picture with initials fallback ─────
function Avatar({ student, size = 'md' }) {
  const [imgError, setImgError] = useState(false)
  const sizeClasses = {
    sm: 'w-7 h-7 rounded-lg text-[0.6rem]',
    md: 'w-9 h-9 rounded-xl text-xs',
    lg: 'w-10 h-10 rounded-xl text-sm',
  }
  const initials = `${student?.first_name?.[0] ?? ''}${student?.last_name?.[0] ?? ''}`
  const hasPic = student?.profile_picture && !imgError
  if (hasPic) {
    return (
      <img
        src={student.profile_picture}
        alt={`${student.first_name} ${student.last_name}`}
        onError={() => setImgError(true)}
        className={`${sizeClasses[size]} object-cover flex-shrink-0 border-2 border-white shadow-sm`}
      />
    )
  }
  return (
    <div className={`${sizeClasses[size]} bg-[#3c096c] flex items-center justify-center flex-shrink-0`}>
      <span className="text-white font-black">{initials}</span>
    </div>
  )
}

// ── Danger confirm modal ───────────────────────────────
function EndSessionModal({ session, onConfirm, onClose, busy }) {
  if (!session) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="absolute inset-0 bg-[#1a0030]/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl shadow-black/20 overflow-hidden">
        <div className="h-1 w-full bg-[#3c096c]" />
        <div className="p-6 flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#3c096c]/08 border-2 border-[#3c096c]/15 flex items-center justify-center">
            <IcoStop cls="w-6 h-6 text-[#3c096c]" />
          </div>
          <div>
            <h3 className="font-black text-[#1a0030] text-base">End Session?</h3>
            <p className="text-sm text-gray-500 mt-1.5">
              This will end the sit-in session for{' '}
              <span className="font-bold text-[#1a0030]">
                {session.first_name} {session.last_name}
              </span>{' '}
              and record it in history.
            </p>
          </div>
          {/* Student info strip with avatar */}
          <div className="w-full flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-left">
            <Avatar student={session} size="md" />
            <div className="min-w-0">
              <p className="text-sm font-bold text-[#1a0030] truncate">
                {session.first_name} {session.last_name}
              </p>
              <p className="text-xs text-gray-400 truncate">
                {session.student_id_number} · {session.room || 'No room'} · #{session.id}
              </p>
            </div>
          </div>

          <div className="w-full flex flex-col gap-1.5 text-left">
            <label className="text-[0.6rem] font-black uppercase tracking-[0.14em] text-gray-400">Feedback Notes</label>
            <textarea
              value={session.adminFeedback || ''}
              onChange={(e) => session.onChange?.('adminFeedback', e.target.value)}
              rows={3}
              placeholder="Add a short comment for this session..."
              className="bg-gray-50 border-2 border-gray-100 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-gray-700 focus:outline-none focus:border-[#3c096c] focus:bg-white transition-all resize-none"
            />
          </div>

          <div className="flex gap-2 w-full">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-500 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={busy}
              className="flex-1 py-2.5 rounded-xl bg-[#3c096c] text-white text-sm font-bold hover:bg-[#5a189a] disabled:opacity-50 transition-colors"
            >
              {busy ? 'Ending...' : 'End Session'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CurrentSessions() {
  const navigate = useNavigate()
  const [loading, setLoading]         = useState(true)
  const [busy, setBusy]               = useState(false)
  const [sessions, setSessions]       = useState([])
  const [search, setSearch]           = useState('')
  const [error, setError]             = useState('')
  const [success, setSuccess]         = useState('')
  const [endTarget, setEndTarget]     = useState(null)
  const [page, setPage]               = useState(1)

  const filteredSessions = sessions.filter(s => {
    const q = search.trim().toLowerCase()
    if (!q) return true

    const fullName = `${s.first_name || ''} ${s.last_name || ''}`.toLowerCase()
    const studentId = String(s.student_id_number || '').toLowerCase()
    const room = String(s.room || '').toLowerCase()
    const purpose = String(s.purpose || '').toLowerCase()

    return fullName.includes(q) || studentId.includes(q) || room.includes(q) || purpose.includes(q)
  })

  const totalPages = Math.max(1, Math.ceil(filteredSessions.length / PAGE_SIZE))
  const pagedSessions = filteredSessions.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const load = async () => {
    const list = await authService.adminCurrentSessions()
    setSessions(list)
  }

  useEffect(() => {
    const u = authService.getUser?.() || null
    if (!u || u.role !== 'admin') { navigate('/login'); return }
    ;(async () => {
      try { await load() }
      catch (err) { setError(err.message || 'Failed to load current sessions') }
      finally { setLoading(false) }
    })()
  }, [navigate])

  useEffect(() => {
    setPage(1)
  }, [search])

  useEffect(() => {
    setPage((prev) => Math.min(prev, totalPages))
  }, [totalPages])

  const handleEndConfirm = async () => {
    if (!endTarget) return
    try {
      setBusy(true)
      setError('')
      setSuccess('')
      await authService.adminEndSession(endTarget.id, {
        adminFeedback: endTarget.adminFeedback || '',
      })
      await load()
      setEndTarget(null)
      setSuccess('Session ended and recorded successfully.')
    } catch (err) {
      setError(err.message || 'Failed to end session')
    } finally {
      setBusy(false)
    }
  }

  if (loading) return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-4 border-[#3c096c]/20 border-t-[#3c096c] animate-spin" />
        <p className="text-sm font-semibold text-gray-400">Loading sessions...</p>
      </div>
    </div>
  )

  return (
    <div className="py-6 px-2 min-h-auto">
      <div className="max-w-[95rem] mx-auto flex flex-col gap-4">

        {/* ── Page header ── */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[0.62rem] font-black uppercase tracking-[0.2em] text-[#3c096c]/40 mb-1">Sit In</p>
            <h1 className="text-4xl font-black text-[#1a0030] tracking-tight">Current Sessions</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-400 bg-white border border-gray-100 px-3 py-1.5 rounded-full shadow-sm">
              {filteredSessions.length} / {sessions.length} active session{sessions.length !== 1 ? 's' : ''}
            </span>
            <button
              onClick={async () => { setError(''); setSuccess(''); try { await load() } catch (e) { setError(e.message) } }}
              disabled={busy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-gray-100 shadow-sm text-xs font-bold text-gray-500 hover:border-[#3c096c]/30 hover:text-[#3c096c] disabled:opacity-50 transition-colors"
            >
              <IcoRefresh cls="w-3.5 h-3.5" />
              Refresh
            </button>
          </div>
        </div>

        {/* ── Alerts ── */}
        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <div className="w-5 h-5 rounded-full bg-red-100 border border-red-300 flex items-center justify-center flex-shrink-0">
              <span className="text-red-500 text-[0.6rem] font-black">!</span>
            </div>
            <p className="text-sm font-semibold text-red-600">{error}</p>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
            <IcoCheck cls="w-4 h-4 text-green-500 flex-shrink-0" />
            <p className="text-sm font-semibold text-green-700">{success}</p>
          </div>
        )}

        {/* ── Search ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student name, ID number, room, or purpose"
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3c096c]/20 focus:border-[#3c096c]/30"
          />
        </div>

        {/* ── Table ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-225 text-sm">
              <thead>
                <tr>
                  {['Session ID', 'Student ID', 'Full Name', 'Room', 'Purpose', 'Started At', 'Remaining', 'Actions'].map(h => (
                    <th
                      key={h}
                      className="text-left px-5 py-3.5 text-[0.6rem] font-black uppercase tracking-[0.14em] text-gray-400 bg-gray-50 border-b border-gray-100 whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredSessions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <IcoUsers cls="w-8 h-8 text-gray-200" />
                        <p className="text-sm text-gray-400 font-medium">
                          {sessions.length === 0 ? 'No active sit-in sessions' : 'No matching student/session found'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : pagedSessions.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50/60 transition-colors">
                    {/* Session ID */}
                    <td className="px-5 py-3.5 border-b border-gray-50">
                      <span className="text-xs font-black text-[#3c096c] bg-[#3c096c]/08 border border-[#3c096c]/15 px-2.5 py-1 rounded-full">
                        #{s.id}
                      </span>
                    </td>
                    {/* Student ID */}
                    <td className="px-5 py-3.5 border-b border-gray-50 font-mono font-bold text-sm text-gray-700">
                      {s.student_id_number}
                    </td>
                    {/* Full Name */}
                    <td className="px-5 py-3.5 border-b border-gray-50">
                      <div className="flex items-center gap-3">
                        <Avatar student={s} size="md" />
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-700 truncate">{s.first_name} {s.last_name}</p>
                          {s.middle_name && (
                            <p className="text-[0.68rem] text-gray-400 truncate">{s.middle_name}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    {/* Room */}
                    <td className="px-5 py-3.5 border-b border-gray-50">
                      {s.room
                        ? <span className="text-xs font-bold text-[#3c096c] bg-[#3c096c]/08 border border-[#3c096c]/15 px-2 py-0.5 rounded-full">{s.room}</span>
                        : <span className="text-xs text-gray-400">—</span>
                      }
                    </td>
                    {/* Purpose */}
                    <td className="px-5 py-3.5 border-b border-gray-50">
                      {s.purpose ? (
                        <span className="inline-flex items-center text-xs font-bold text-[#5a189a] bg-[#5a189a]/08 border border-[#5a189a]/15 px-2.5 py-1 rounded-full max-w-45 truncate" title={s.purpose}>
                          {s.purpose}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    {/* Started At */}
                    <td className="px-5 py-3.5 border-b border-gray-50 text-xs text-gray-500 whitespace-nowrap">
                      {new Date(s.started_at).toLocaleString()}
                    </td>
                    {/* Remaining */}
                    <td className="px-5 py-3.5 border-b border-gray-50">
                      <span className={`text-xs font-black px-2.5 py-1 rounded-full border ${
                        Number(s.available_sessions) > 0
                          ? 'bg-green-50 text-green-600 border-green-200'
                          : 'bg-red-50 text-red-500 border-red-200'
                      }`}>
                        {s.available_sessions} left
                      </span>
                    </td>
                    {/* Action */}
                    <td className="px-5 py-3.5 border-b border-gray-50">
                      <button
                        onClick={() => setEndTarget({ ...s, adminFeedback: '' })}
                        disabled={busy}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#3c096c] text-white text-xs font-bold hover:bg-[#5a189a] shadow-sm shadow-[#3c096c]/20 hover:-translate-y-0.5 disabled:opacity-50 disabled:translate-y-0 transition-all"
                      >
                        <IcoStop cls="w-3.5 h-3.5" />
                        End Session
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredSessions.length > PAGE_SIZE && (
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

      {/* ── END SESSION CONFIRM ── */}
      {endTarget && (
        <EndSessionModal
          session={{
            ...endTarget,
            onChange: (field, value) => setEndTarget((prev) => ({ ...prev, [field]: value })),
          }}
          onConfirm={handleEndConfirm}
          onClose={() => setEndTarget(null)}
          busy={busy}
        />
      )}
    </div>
  )
}