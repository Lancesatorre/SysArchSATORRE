import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '../services/authService'
import LoadingScreen from '../components/LoadingScreen'

const Ico = ({ d, d2, cls = 'w-4 h-4' }) => (
  <svg className={cls} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    {d2 && <path strokeLinecap="round" strokeLinejoin="round" d={d2} />}
  </svg>
)
const IcoClipboard = ({ cls = 'w-4 h-4' }) => <Ico cls={cls} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
const IcoRefresh   = ({ cls = 'w-4 h-4' }) => <Ico cls={cls} d="M4 4v5h5M20 20v-5h-5M4 9a9 9 0 0114.5-5.2M20 15a9 9 0 01-14.5 5.2" />
const PAGE_SIZE = 8


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

export default function SitInRecords() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [records, setRecords] = useState([])
  const [search, setSearch]   = useState('')
  const [error, setError]     = useState('')
  const [page, setPage]       = useState(1)

  const filteredRecords = records.filter(r => {
    const q = search.trim().toLowerCase()
    if (!q) return true

    const fullName = `${r.first_name || ''} ${r.last_name || ''}`.toLowerCase()
    const studentId = String(r.student_id_number || '').toLowerCase()
    const room = String(r.room || '').toLowerCase()
    const purpose = String(r.purpose || '').toLowerCase()

    return fullName.includes(q) || studentId.includes(q) || room.includes(q) || purpose.includes(q)
  })

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / PAGE_SIZE))
  const pagedRecords = filteredRecords.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const load = async () => {
    const list = await authService.adminSitInRecords()
    setRecords(list)
  }

  useEffect(() => {
    const u = authService.getUser?.() || null
    if (!u || u.role !== 'admin') { navigate('/login'); return }
    ;(async () => {
      try { await load() }
      catch (err) { setError(err.message || 'Failed to load sit-in records') }
      finally { setLoading(false) }
    })()
  }, [navigate])

  useEffect(() => {
    setPage(1)
  }, [search])

  useEffect(() => {
    setPage((prev) => Math.min(prev, totalPages))
  }, [totalPages])

  if (loading) return <LoadingScreen message="Loading records..." />

  return (
    <div className="py-6 px-2 min-h-auto">
      <div className="max-w-[95rem] mx-auto flex flex-col gap-4">

        {/* ── Page header ── */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[0.62rem] font-black uppercase tracking-[0.2em] text-[#3c096c]/40 mb-1">Sit In / Records</p>
            <h1 className="text-4xl font-black text-[#1a0030] tracking-tight">Sit-in Records</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-400 bg-white border border-gray-100 px-3 py-1.5 rounded-full shadow-sm">
              {filteredRecords.length} / {records.length} record{records.length !== 1 ? 's' : ''}
            </span>
            <button
              onClick={async () => { setError(''); try { await load() } catch (e) { setError(e.message) } }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-gray-100 shadow-sm text-xs font-bold text-gray-500 hover:border-[#3c096c]/30 hover:text-[#3c096c] transition-colors"
            >
              <IcoRefresh cls="w-3.5 h-3.5" />
              Refresh
            </button>
          </div>
        </div>

        {/* ── Alert ── */}
        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <div className="w-5 h-5 rounded-full bg-red-100 border border-red-300 flex items-center justify-center flex-shrink-0">
              <span className="text-red-500 text-[0.6rem] font-black">!</span>
            </div>
            <p className="text-sm font-semibold text-red-600">{error}</p>
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
                  {['Record ID', 'Session ID', 'Student', 'Room', 'PC No.', 'Purpose', 'Started', 'Ended', 'Duration', 'Ended By'].map(h => (
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
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-5 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <IcoClipboard cls="w-8 h-8 text-gray-200" />
                        <p className="text-sm text-gray-400 font-medium">
                          {records.length === 0 ? 'No sit-in records yet' : 'No matching student/record found'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : pagedRecords.map((r, idx) => (
                  <tr key={r.id} className="hover:bg-gray-50/60 transition-colors">

                    {/* Record ID */}
                    <td className="px-5 py-3.5 border-b border-gray-50">
                      <span className="text-xs font-black text-[#3c096c] bg-[#3c096c]/08 border border-[#3c096c]/15 px-2.5 py-1 rounded-full">
                        {(page - 1) * PAGE_SIZE + idx + 1}
                      </span>
                    </td>

                    {/* Session ID */}
                    <td className="px-5 py-3.5 border-b border-gray-50">
                      <span className="text-xs font-bold text-gray-500 bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-full">
                        #{r.session_id}
                      </span>
                    </td>

                    {/* Student — avatar + name + ID number */}
                    <td className="px-5 py-3.5 border-b border-gray-50">
                      <div className="flex items-center gap-3">
                        <Avatar student={r} size="md" />
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-700 truncate">
                            {`${r.first_name || ''} ${r.last_name || ''}`.trim()}
                          </p>
                          <p className="text-[0.68rem] font-mono text-gray-400 truncate">
                            {r.student_id_number}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Room */}
                    <td className="px-5 py-3.5 border-b border-gray-50">
                      {r.room
                        ? <span className="text-xs font-bold text-[#3c096c] bg-[#3c096c]/08 border border-[#3c096c]/15 px-2 py-0.5 rounded-full">{r.room}</span>
                        : <span className="text-xs text-gray-400">—</span>
                      }
                    </td>

                    {/* PC No */}
                    <td className="px-5 py-3.5 border-b border-gray-50">
                      {r.pc_number ? (
                        <span className="bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded-lg border border-gray-150 text-xs font-semibold">
                          {r.pc_number.replace('PC-', '')}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs font-semibold">—</span>
                      )}
                    </td>

                    {/* Purpose */}
                    <td className="px-5 py-3.5 border-b border-gray-50 text-xs text-gray-500 max-w-[180px] truncate">
                      {r.purpose || '—'}
                    </td>

                    {/* Started */}
                    <td className="px-5 py-3.5 border-b border-gray-50 text-xs text-gray-500 whitespace-nowrap">
                      {new Date(r.started_at).toLocaleString()}
                    </td>

                    {/* Ended */}
                    <td className="px-5 py-3.5 border-b border-gray-50 text-xs text-gray-500 whitespace-nowrap">
                      {new Date(r.ended_at).toLocaleString()}
                    </td>

                    {/* Duration */}
                    <td className="px-5 py-3.5 border-b border-gray-50">
                      <span className="text-xs font-black text-[#ff9100] bg-[#ff9100]/08 border border-[#ff9100]/20 px-2.5 py-1 rounded-full">
                        {r.duration_minutes} min
                      </span>
                    </td>

                    {/* Ended By */}
                    <td className="px-5 py-3.5 border-b border-gray-50">
                      <span className="text-xs font-semibold text-gray-600 capitalize">
                        {r.ended_by || 'Admin'}
                      </span>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredRecords.length > PAGE_SIZE && (
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
    </div>
  )
}