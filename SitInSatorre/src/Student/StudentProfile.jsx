import React, { useState, useEffect } from 'react'
import { authService } from '../services/authService'
import { useNavigate } from 'react-router-dom'

// ── Icons ──────────────────────────────────────────────
const Ico = ({ d, d2, extra = '' }) => (
  <svg className={`w-4 h-4 ${extra}`} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    {d2 && <path strokeLinecap="round" strokeLinejoin="round" d={d2} />}
  </svg>
)

const IcoUser     = ({ e = '' }) => <Ico extra={e} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
const IcoMail     = ({ e = '' }) => <Ico extra={e} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
const IcoPin      = ({ e = '' }) => <Ico extra={e} d="M12 21s-8-7.5-8-12a8 8 0 1116 0c0 4.5-8 12-8 12z" d2="M12 9m-2.5 0a2.5 2.5 0 105 0 2.5 2.5 0 00-5 0" />
const IcoGrad     = ({ e = '' }) => <Ico extra={e} d="M12 14l9-5-9-5-9 5 9 5z" d2="M12 14l6.16-3.422A12.083 12.083 0 0112 21a12.083 12.083 0 01-6.16-10.422L12 14z" />
const IcoCal      = ({ e = '' }) => (
  <svg className={`w-4 h-4 ${e}`} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <rect x="3" y="4" width="18" height="18" rx="2" strokeLinecap="round" strokeLinejoin="round" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 2v4M8 2v4M3 10h18" />
  </svg>
)
const IcoEdit = ({ e = '' }) => <Ico extra={e} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
const IcoCheck= ({ e = '' }) => <Ico extra={e} d="M5 13l4 4L19 7" />
const IcoX    = ({ e = '' }) => <Ico extra={e} d="M6 18L18 6M6 6l12 12" />
const IcoID   = ({ e = '' }) => <Ico extra={e} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />

// ── Field component ─────────────────────────────────────
function Field({ label, value, name, editing, formData, onChange, readOnly = false }) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[0.6rem] font-black uppercase tracking-[0.15em] text-gray-400">{label}</p>
      {editing && !readOnly ? (
        <input
          type="text"
          value={formData[name] || ''}
          onChange={e => onChange(name, e.target.value)}
          className="w-full bg-white border border-[#3c096c]/20 rounded-lg px-3 py-2 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#3c096c]/30 focus:border-[#3c096c] transition"
        />
      ) : (
        <p className="text-sm font-semibold text-gray-700">{value || '—'}</p>
      )}
    </div>
  )
}

// ── Section wrapper ──────────────────────────────────────
function Section({ icon, title, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-50">
        <div className="w-8 h-8 rounded-lg bg-[#3c096c]/08 flex items-center justify-center">
          {icon}
        </div>
        <h3 className="font-black text-[#1a0030] text-sm tracking-tight">{title}</h3>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  )
}

// ── Main component ───────────────────────────────────────
export default function StudentProfile() {
  const navigate = useNavigate()
  const [user, setUser]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [isEditing, setEditing] = useState(false)
  const [formData, setFormData] = useState({})
  const [saved, setSaved]       = useState(false)
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    const u = authService.getUser?.() || {}
    if (!u.id_number) { navigate('/login'); return }
    const data = {
      first_name:  u.first_name  || '',
      last_name:   u.last_name   || '',
      middle_name: u.middle_name || '',
      email:       u.email       || '',
      course:      u.course      || 'BSIT',
      year_level:  u.year_level  || u.course_level || 4,
      address:     u.address     || '',
      id_number:   u.id_number   || '',
      role:        u.role        || 'student',
    }
    setUser(data)
    setFormData(data)
    setLoading(false)
  }, [navigate])

  const onChange = (name, val) => setFormData(p => ({ ...p, [name]: val }))

  const handleSave = async () => {
    try {
      setSaveError('')

      const response = await authService.updateProfile({
        idNumber: user.id_number,
        firstName: formData.first_name,
        lastName: formData.last_name,
        middleName: formData.middle_name,
        address: formData.address,
      })

      const updatedUser = response?.user
        ? {
            ...user,
            ...response.user,
          }
        : formData

      setUser(updatedUser)
      setFormData(updatedUser)
      setEditing(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      setSaveError(err.message || 'Failed to save profile changes')
    }
  }

  const handleCancel = () => {
    setFormData(user)
    setEditing(false)
  }

  if (loading) return (
    <div className="min-h-[85vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-4 border-[#3c096c]/20 border-t-[#3c096c] animate-spin" />
        <p className="text-sm font-semibold text-gray-500">Loading profile...</p>
      </div>
    </div>
  )

  if (!user) return (
    <div className="min-h-[85vh] flex items-center justify-center">
      <p className="text-sm font-semibold text-red-500">Error loading profile.</p>
    </div>
  )

  const displayName = `${user.first_name} ${user.last_name}`.trim()
  const initials    = `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase() || 'S'
  const hasProfileChanges = ['first_name', 'last_name', 'middle_name', 'address']
    .some((key) => (formData?.[key] ?? '') !== (user?.[key] ?? ''))

  return (
    <div className="min-h-[85vh] py-6 px-2">
      <div className="max-w-[92rem] mx-auto flex flex-col gap-5">

        {/* ── Page title row ── */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-[#3c096c]/50 mb-1">Account</p>
            <h1 className="text-4xl font-black text-[#1a0030] tracking-tight">My Profile</h1>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            {saved && (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-green-600 bg-green-50 border border-green-200 px-3 py-1.5 rounded-full">
                <IcoCheck e="text-green-500" /> Saved
              </span>
            )}
            {saveError && (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-3 py-1.5 rounded-full">
                {saveError}
              </span>
            )}
            {isEditing ? (
              <>
                <button onClick={handleCancel}
                  className="flex items-center gap-1.5 text-sm font-bold text-gray-500 border border-gray-200 bg-white px-4 py-2 rounded-xl hover:bg-gray-50 transition">
                  <IcoX /> Cancel
                </button>
                <button onClick={handleSave}
                  disabled={!hasProfileChanges}
                  className={`flex items-center gap-1.5 text-sm font-bold px-5 py-2 rounded-xl transition ${
                    hasProfileChanges
                      ? 'text-white bg-[#3c096c] hover:bg-[#5a189a] shadow-md shadow-[#3c096c]/25'
                      : 'text-gray-400 bg-gray-200 cursor-not-allowed'
                  }`}>
                  <IcoCheck e="text-white" /> Save Changes
                </button>
              </>
            ) : (
              <button onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 text-sm font-bold text-white bg-[#3c096c] px-5 py-2 rounded-xl hover:bg-[#5a189a] shadow-md shadow-[#3c096c]/25 transition">
                <IcoEdit e="text-white" /> Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* ── Two-column layout ── */}
        <div className="grid grid-cols-12 gap-5 items-start">

          {/* ── LEFT: Identity sidebar ── */}
          <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">

            {/* Avatar card */}
            <div className="bg-[#3c096c] rounded-2xl overflow-hidden shadow-lg shadow-[#3c096c]/20">
              {/* Subtle diagonal texture */}
              <div className="relative px-6 pt-8 pb-6 flex flex-col items-center gap-4">
                <div className="absolute inset-0 opacity-5"
                  style={{ backgroundImage: 'repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)', backgroundSize: '10px 10px' }} />

                {/* Avatar circle */}
                <div className="relative z-10 w-24 h-24 rounded-2xl bg-[#ff9100] flex items-center justify-center shadow-xl">
                  <span className="text-white font-black text-4xl">{initials}</span>
                </div>

                {/* Name + role */}
                <div className="relative z-10 text-center">
                  <h2 className="text-xl font-black text-white leading-tight">{displayName}</h2>
                  <span className="inline-block mt-2 text-[0.6rem] font-black uppercase tracking-[0.18em] bg-white/15 border border-white/20 text-white/80 px-3 py-1 rounded-full">
                    {user.role}
                  </span>
                </div>

                {/* Divider */}
                <div className="relative z-10 w-full h-px bg-white/10" />

                {/* ID number */}
                <div className="relative z-10 w-full flex items-center justify-between">
                  <span className="text-[0.6rem] font-black uppercase tracking-widest text-white/40">Student ID</span>
                  <span className="font-mono text-sm font-bold text-white/80">{user.id_number}</span>
                </div>
              </div>
            </div>

            {/* Academic stat cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
                <div className="flex items-center gap-1.5 text-gray-400 mb-3">
                  <IcoGrad e="w-3.5 h-3.5" />
                  <span className="text-[0.58rem] font-black uppercase tracking-widest">Course</span>
                </div>
                <p className="text-3xl font-black text-[#3c096c]">{user.course}</p>
              </div>
              <div className="bg-white rounded-xl p-5 shadow-sm">
                <div className="flex items-center gap-1.5 text-gray-400 mb-3">
                  <IcoCal e="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-[0.58rem] font-black uppercase tracking-widest">Year</span>
                </div>
                <p className="text-3xl font-black text-[#3c096c]">{user.year_level}</p>
                <p className="text-[0.6rem] text-[#3c096c]/60 mt-0.5">Level</p>
              </div>
            </div>

            {/* Status */}
            <div className="bg-white border border-gray-100 rounded-xl px-5 py-4 shadow-sm flex items-center justify-between">
              <span className="text-[0.62rem] font-black uppercase tracking-widest text-gray-400">Account Status</span>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-green-600 bg-green-50 border border-green-200 px-3 py-1.5 rounded-full">
              
                Active
              </span>
            </div>
          </div>

          {/* ── RIGHT: Info sections ── */}
          <div className="col-span-12 lg:col-span-8 flex flex-col gap-4">

            {/* Personal Information */}
            <Section icon={<IcoUser e="text-[#3c096c]" />} title="Personal Information">
              <div className="grid grid-cols-3 gap-5">
                <Field label="First Name"  value={user.first_name}  name="first_name"  editing={isEditing} formData={formData} onChange={onChange} />
                <Field label="Last Name"   value={user.last_name}   name="last_name"   editing={isEditing} formData={formData} onChange={onChange} />
                <Field label="Middle Name" value={user.middle_name} name="middle_name" editing={isEditing} formData={formData} onChange={onChange} />
              </div>
            </Section>

            {/* Contact Information */}
            <Section icon={<IcoMail e="text-[#3c096c]" />} title="Contact Information">
              <div className="grid grid-cols-2 gap-5">
                <Field label="Email Address" value={user.email}   name="email"   editing={isEditing} formData={formData} onChange={onChange} readOnly />
                <Field label="Address"       value={user.address} name="address" editing={isEditing} formData={formData} onChange={onChange} />
              </div>
            </Section>

            {/* Academic Information */}
            <Section icon={<IcoGrad e="text-[#3c096c]" />} title="Academic Information">
              <div className="grid grid-cols-3 gap-4">
                {/* Course */}
                <div className="bg-[#3c096c]/05 border border-[#3c096c]/12 rounded-xl p-5">
                  <p className="text-[0.6rem] font-black uppercase tracking-widest text-gray-400 mb-2">Course</p>
                  <p className="text-xl font-black text-[#3c096c]">{user.course}</p>
                </div>
                {/* Year */}
                <div className="bg-[#ff9100]/08 border border-[#ff9100]/20 rounded-xl p-5">
                  <p className="text-[0.6rem] font-black uppercase tracking-widest text-gray-400 mb-2">Year Level</p>
                  <p className="text-xl font-black text-[#ff9100]">{user.year_level} <span className="text-sm font-semibold text-gray-500">Year</span></p>
                </div>
                {/* Status */}
                <div className="bg-green-50 border border-green-100 rounded-xl p-5">
                  <p className="text-[0.6rem] font-black uppercase tracking-widest text-gray-400 mb-2">Status</p>
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-green-600 bg-green-100 px-3 py-1.5 rounded-full">
                    Active
                  </span>
                </div>
              </div>
            </Section>

            {/* Additional Details */}
            <Section icon={<IcoID e="text-[#3c096c]" />} title="Additional Details">
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <p className="text-[0.6rem] font-black uppercase tracking-widest text-gray-400 mb-1.5">Student ID Number</p>
                  <p className="text-sm font-bold text-gray-700 font-mono bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 inline-block">{user.id_number || '—'}</p>
                </div>
                <div>
                  <p className="text-[0.6rem] font-black uppercase tracking-widest text-gray-400 mb-1.5">Role</p>
                  <span className="inline-block text-xs font-bold text-[#3c096c] bg-[#3c096c]/08 border border-[#3c096c]/15 px-4 py-2 rounded-full capitalize">
                    {user.role}
                  </span>
                </div>
              </div>
            </Section>

          </div>
        </div>
      </div>
    </div>
  )
}