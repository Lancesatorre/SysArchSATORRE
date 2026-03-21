import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '../services/authService'

// ── Icons ──────────────────────────────────────────────
const Ico = ({ d, d2, cls = 'w-4 h-4' }) => (
  <svg className={cls} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    {d2 && <path strokeLinecap="round" strokeLinejoin="round" d={d2} />}
  </svg>
)
const IcoSearch  = ({ cls='w-4 h-4' }) => <Ico cls={cls} d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z"/>
const IcoEdit    = ({ cls='w-4 h-4' }) => <Ico cls={cls} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
const IcoTrash   = ({ cls='w-4 h-4' }) => <Ico cls={cls} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
const IcoPlay    = ({ cls='w-4 h-4' }) => <Ico cls={cls} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" d2="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
const IcoX       = ({ cls='w-4 h-4' }) => <Ico cls={cls} d="M6 18L18 6M6 6l12 12"/>
const IcoCheck   = ({ cls='w-4 h-4' }) => <Ico cls={cls} d="M5 13l4 4L19 7"/>
const IcoUser    = ({ cls='w-4 h-4' }) => <Ico cls={cls} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
const IcoWarning = ({ cls='w-4 h-4' }) => <Ico cls={cls} d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>

const initialSitInModal = { open: false, student: null, room: '', purpose: '' }
const initialEditModal  = { open: false, student: null, first_name:'', last_name:'', middle_name:'', course:'', year_level:'', address:'', available_sessions:'' }

// ── Avatar: shows profile_picture if available, else initials ──
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

// ── Reusable field ─────────────────────────────────────
function MField({ label, value, onChange, placeholder, type='text', min, span=false }) {
  return (
    <div className={span ? 'md:col-span-2' : ''}>
      <label className="block text-[0.6rem] font-black uppercase tracking-[0.14em] text-gray-400 mb-1.5">{label}</label>
      <input
        type={type} min={min}
        value={value} onChange={onChange}
        placeholder={placeholder}
        className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-gray-700 focus:outline-none focus:border-[#3c096c] focus:bg-white transition-all"
      />
    </div>
  )
}

// ── Modal shell ────────────────────────────────────────
function Modal({ title, subtitle, icon, onClose, children, footer }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="absolute inset-0 bg-[#1a0030]/60 backdrop-blur-sm"/>
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl shadow-[#3c096c]/25 overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-[#ff9100] via-violet-400 to-[#3c096c]"/>
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#3c096c]/08 flex items-center justify-center flex-shrink-0">
              {icon}
            </div>
            <div>
              <h3 className="font-black text-[#1a0030] text-base">{title}</h3>
              {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
            <IcoX cls="w-4 h-4"/>
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
        {footer && <div className="px-6 pb-5 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  )
}

// ── Danger confirm modal ───────────────────────────────
function DangerModal({ student, onConfirm, onClose, busy }) {
  if (!student) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="absolute inset-0 bg-[#1a0030]/60 backdrop-blur-sm"/>
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl shadow-black/20 overflow-hidden">
        <div className="h-1 w-full bg-red-500"/>
        <div className="p-6 flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-red-50 border-2 border-red-100 flex items-center justify-center">
            <IcoWarning cls="w-6 h-6 text-red-500"/>
          </div>
          <div>
            <h3 className="font-black text-[#1a0030] text-base">Delete Student?</h3>
            <p className="text-sm text-gray-500 mt-1.5">
              This will permanently delete <span className="font-bold text-[#1a0030]">{student.first_name} {student.last_name}</span> ({student.id_number}). This action cannot be undone.
            </p>
          </div>
          <div className="flex gap-2 w-full">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-500 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button onClick={onConfirm} disabled={busy}
              className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-500 disabled:opacity-50 transition-colors">
              {busy ? 'Deleting...' : 'Yes, Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SearchStudent() {
  const navigate = useNavigate()
  const [loading, setLoading]   = useState(true)
  const [busy, setBusy]         = useState(false)
  const [keyword, setKeyword]   = useState('')
  const [students, setStudents] = useState([])
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState('')

  const [sitInModal, setSitInModal]     = useState(initialSitInModal)
  const [editModal, setEditModal]       = useState(initialEditModal)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const loadStudents = async () => setStudents(await authService.adminListStudents())

  useEffect(() => {
    const u = authService.getUser?.() || null
    if (!u || u.role !== 'admin') { navigate('/login'); return }
    ;(async () => {
      try { await loadStudents() }
      catch (err) { setError(err.message || 'Failed to load students') }
      finally { setLoading(false) }
    })()
  }, [navigate])

  const filteredStudents = useMemo(() => {
    const q = keyword.trim().toLowerCase()
    if (!q) return students
    return students.filter(s => {
      const full = `${s.first_name||''} ${s.last_name||''}`.toLowerCase()
      return String(s.id_number||'').toLowerCase().includes(q) ||
             String(s.first_name||'').toLowerCase().includes(q) ||
             String(s.last_name||'').toLowerCase().includes(q) ||
             full.includes(q)
    })
  }, [students, keyword])

  const withBusy = async (fn, msg) => {
    try { setBusy(true); setError(''); setSuccess(''); await fn(); if (msg) setSuccess(msg) }
    catch (err) { setError(err.message || 'Action failed') }
    finally { setBusy(false) }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    await withBusy(async () => {
      await authService.adminDeleteStudent(deleteTarget.id)
      await loadStudents()
      setDeleteTarget(null)
    }, 'Student deleted successfully.')
  }

  const openEditModal = s => setEditModal({
    open:true, student:s,
    first_name:s.first_name||'', last_name:s.last_name||'', middle_name:s.middle_name||'',
    course:s.course||'', year_level:String(s.year_level??''), address:s.address||'',
    available_sessions:String(s.available_sessions??0),
  })

  const handleSaveEdit = async () => {
    if (!editModal.student) return
    await withBusy(async () => {
      await authService.adminUpdateStudent({
        id: editModal.student.id,
        first_name: editModal.first_name, last_name: editModal.last_name,
        middle_name: editModal.middle_name, course: editModal.course,
        year_level: Number(editModal.year_level||0), address: editModal.address,
        available_sessions: Number(editModal.available_sessions||0),
      })
      setEditModal(initialEditModal)
      await loadStudents()
    }, 'Student updated successfully.')
  }

  const handleInitiateSitIn = async () => {
    if (!sitInModal.student) return
    if (!sitInModal.room.trim() || !sitInModal.purpose.trim()) {
      setError('Room and purpose are required.'); return
    }
    await withBusy(async () => {
      await authService.adminStartSession(sitInModal.student.id_number, sitInModal.room.trim(), sitInModal.purpose.trim())
      setSitInModal(initialSitInModal)
      await loadStudents()
    }, `Sit-in started for ${sitInModal.student.id_number}.`)
  }

  if (loading) return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-4 border-[#3c096c]/20 border-t-[#3c096c] animate-spin"/>
        <p className="text-sm font-semibold text-gray-400">Loading students...</p>
      </div>
    </div>
  )

  return (
    <div className="py-6 px-2 min-h-screen">
      <div className="max-w-[95rem] mx-auto flex flex-col gap-4">

        {/* ── Page header ── */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[0.62rem] font-black uppercase tracking-[0.2em] text-[#3c096c]/40 mb-1">SIT IN</p>
            <h1 className="text-4xl font-black text-[#1a0030] tracking-tight">Search Students</h1>
          </div>
          <span className="text-xs font-bold text-gray-400 bg-white border border-gray-100 px-3 py-1.5 rounded-full shadow-sm">
            {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* ── Search bar ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="relative">
            <IcoSearch cls="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"/>
            <input
              type="text" value={keyword}
              onChange={e=>{ setKeyword(e.target.value); setSuccess('') }}
              placeholder="Search by student ID, name..."
              className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl pl-10 pr-4 py-3 text-sm font-semibold text-gray-700 focus:outline-none focus:border-[#3c096c] focus:bg-white transition-all"
            />
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
            <IcoCheck cls="w-4 h-4 text-green-500 flex-shrink-0"/>
            <p className="text-sm font-semibold text-green-700">{success}</p>
          </div>
        )}

        {/* ── Table ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr>
                  {['Student ID','Full Name','Course / Year','Available Sessions','Actions'].map(h => (
                    <th key={h} className="text-left px-5 py-3.5 text-[0.6rem] font-black uppercase tracking-[0.14em] text-gray-400 bg-gray-50 border-b border-gray-100 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <IcoUser cls="w-8 h-8 text-gray-200"/>
                        <p className="text-sm text-gray-400 font-medium">No students found</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredStudents.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50/60 transition-colors">
                    {/* Student ID */}
                    <td className="px-5 py-3.5 border-b border-gray-50 font-mono font-bold text-sm text-gray-700">
                      {s.id_number}
                    </td>

                    {/* ── Full Name with avatar ── */}
                    <td className="px-5 py-3.5 border-b border-gray-50">
                      <div className="flex items-center gap-3">
                        <Avatar student={s} size="md" />
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-700 truncate">
                            {s.first_name} {s.last_name}
                          </p>
                          {s.middle_name && (
                            <p className="text-[0.68rem] text-gray-400 truncate">{s.middle_name}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Course / Year */}
                    <td className="px-5 py-3.5 border-b border-gray-50">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="text-xs font-bold text-[#3c096c] bg-[#3c096c]/08 border border-[#3c096c]/15 px-2 py-0.5 rounded-full">{s.course}</span>
                        <span className="text-xs text-gray-400">Yr {s.year_level}</span>
                      </span>
                    </td>

                    {/* Available Sessions */}
                    <td className="px-5 py-3.5 border-b border-gray-50">
                      <span className={`text-xs font-black px-2.5 py-1 rounded-full border ${
                        Number(s.available_sessions) > 0
                          ? 'bg-green-50 text-green-600 border-green-200'
                          : 'bg-red-50 text-red-500 border-red-200'
                      }`}>
                        {s.available_sessions} left
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 border-b border-gray-50">
                      <div className="flex items-center gap-2">
                        <button onClick={()=>openEditModal(s)} disabled={busy}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#3c096c]/20 text-[#3c096c] text-xs font-bold hover:bg-[#3c096c]/05 hover:border-[#3c096c]/40 disabled:opacity-50 transition-colors">
                          <IcoEdit cls="w-3.5 h-3.5"/> Edit
                        </button>
                        <button onClick={()=>setDeleteTarget(s)} disabled={busy}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 text-red-500 text-xs font-bold hover:bg-red-50 disabled:opacity-50 transition-colors">
                          <IcoTrash cls="w-3.5 h-3.5"/> Delete
                        </button>
                        <button onClick={()=>setSitInModal({open:true,student:s,room:'',purpose:''})}
                          disabled={busy || Number(s.available_sessions) <= 0}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#ff9100] text-white text-xs font-bold hover:bg-orange-400 shadow-sm shadow-[#ff9100]/25 hover:-translate-y-0.5 disabled:opacity-50 disabled:translate-y-0 transition-all">
                          <IcoPlay cls="w-3.5 h-3.5"/> Initiate Sit-in
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── SIT-IN MODAL ── */}
      {sitInModal.open && (
        <Modal
          title="Initiate Sit-in"
          subtitle={`${sitInModal.student?.first_name} ${sitInModal.student?.last_name} · ${sitInModal.student?.id_number}`}
          icon={<IcoPlay cls="w-4 h-4 text-[#ff9100]"/>}
          onClose={()=>setSitInModal(initialSitInModal)}
          footer={
            <>
              <button onClick={()=>setSitInModal(initialSitInModal)}
                className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-500 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleInitiateSitIn} disabled={busy}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#ff9100] text-white text-sm font-bold hover:bg-orange-400 shadow-md shadow-[#ff9100]/25 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:translate-y-0">
                <IcoPlay cls="w-3.5 h-3.5 text-white"/>
                {busy ? 'Starting...' : 'Start Sit-in'}
              </button>
            </>
          }
        >
          <div className="flex flex-col gap-4">
            {/* Student info strip with avatar */}
            <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
              <Avatar student={sitInModal.student} size="lg" />
              <div>
                <p className="text-sm font-bold text-[#1a0030]">{sitInModal.student?.first_name} {sitInModal.student?.last_name}</p>
                <p className="text-xs text-gray-400">{sitInModal.student?.id_number} · {sitInModal.student?.course} Yr {sitInModal.student?.year_level}</p>
              </div>
              <span className="ml-auto text-xs font-black text-green-600 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
                {sitInModal.student?.available_sessions} sessions left
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[0.6rem] font-black uppercase tracking-[0.14em] text-gray-400">Room</label>
              <input type="text" value={sitInModal.room}
                onChange={e=>setSitInModal(p=>({...p,room:e.target.value}))}
                placeholder="e.g. Lab 524"
                className="bg-gray-50 border-2 border-gray-100 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-gray-700 focus:outline-none focus:border-[#3c096c] focus:bg-white transition-all"/>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[0.6rem] font-black uppercase tracking-[0.14em] text-gray-400">Purpose</label>
              <textarea value={sitInModal.purpose}
                onChange={e=>setSitInModal(p=>({...p,purpose:e.target.value}))}
                placeholder="Describe the purpose of this sit-in session..."
                rows={3}
                className="bg-gray-50 border-2 border-gray-100 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-gray-700 focus:outline-none focus:border-[#3c096c] focus:bg-white transition-all resize-none"/>
            </div>
          </div>
        </Modal>
      )}

      {/* ── EDIT MODAL ── */}
      {editModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={e=>e.target===e.currentTarget&&setEditModal(initialEditModal)}>
          <div className="absolute inset-0 bg-[#1a0030]/60 backdrop-blur-sm"/>
          <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl shadow-[#3c096c]/25 overflow-hidden">
            <div className="h-1 w-full bg-gradient-to-r from-[#ff9100] via-violet-400 to-[#3c096c]"/>
            <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-gray-50">
              <div className="flex items-center gap-3">
                {/* Avatar in edit modal header */}
                <Avatar student={editModal.student} size="md" />
                <div>
                  <h3 className="font-black text-[#1a0030] text-base">Edit Student</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{editModal.student?.id_number}</p>
                </div>
              </div>
              <button onClick={()=>setEditModal(initialEditModal)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
                <IcoX cls="w-4 h-4"/>
              </button>
            </div>

            <div className="px-6 py-5">
              <div className="grid grid-cols-2 gap-4">
                <MField label="First Name"          value={editModal.first_name}          onChange={e=>setEditModal(p=>({...p,first_name:e.target.value}))}          placeholder="First name"/>
                <MField label="Last Name"           value={editModal.last_name}           onChange={e=>setEditModal(p=>({...p,last_name:e.target.value}))}           placeholder="Last name"/>
                <MField label="Middle Name"         value={editModal.middle_name}         onChange={e=>setEditModal(p=>({...p,middle_name:e.target.value}))}         placeholder="Middle name"/>
                <MField label="Course"              value={editModal.course}              onChange={e=>setEditModal(p=>({...p,course:e.target.value}))}              placeholder="e.g. BSIT"/>
                <MField label="Year Level"          value={editModal.year_level}          onChange={e=>setEditModal(p=>({...p,year_level:e.target.value}))}          type="number" min="1" placeholder="1–5"/>
                <MField label="Available Sessions"  value={editModal.available_sessions}  onChange={e=>setEditModal(p=>({...p,available_sessions:e.target.value}))}  type="number" min="0" placeholder="0"/>
                <MField label="Address"             value={editModal.address}             onChange={e=>setEditModal(p=>({...p,address:e.target.value}))}             placeholder="City, Province" span/>
              </div>
            </div>

            <div className="px-6 pb-5 flex justify-end gap-2">
              <button onClick={()=>setEditModal(initialEditModal)}
                className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-500 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleSaveEdit} disabled={busy}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#3c096c] text-white text-sm font-bold hover:bg-[#5a189a] shadow-md shadow-[#3c096c]/25 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:translate-y-0">
                <IcoCheck cls="w-3.5 h-3.5 text-white"/>
                {busy ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRM ── */}
      {deleteTarget && (
        <DangerModal
          student={deleteTarget}
          onConfirm={handleDeleteConfirm}
          onClose={()=>setDeleteTarget(null)}
          busy={busy}
        />
      )}
    </div>
  )
}