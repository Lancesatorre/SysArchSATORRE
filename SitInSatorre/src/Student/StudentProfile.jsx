import React, { useState, useEffect, useRef } from 'react'
import { authService } from '../services/authService'
import { useNavigate } from 'react-router-dom'
import LoadingScreen from '../components/LoadingScreen'

// ── Icons ──────────────────────────────────────────────
const Ico = ({ d, d2, extra = '' }) => (
  <svg className={`w-4 h-4 ${extra}`} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    {d2 && <path strokeLinecap="round" strokeLinejoin="round" d={d2} />}
  </svg>
)
const IcoUser = ({ e = '' }) => <Ico extra={e} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
const IcoMail = ({ e = '' }) => <Ico extra={e} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
const IcoGrad = ({ e = '' }) => <Ico extra={e} d="M12 14l9-5-9-5-9 5 9 5z" d2="M12 14l6.16-3.422A12.083 12.083 0 0112 21a12.083 12.083 0 01-6.16-10.422L12 14z" />
const IcoCal = ({ e = '' }) => (
  <svg className={`w-4 h-4 ${e}`} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <rect x="3" y="4" width="18" height="18" rx="2" strokeLinecap="round" strokeLinejoin="round" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 2v4M8 2v4M3 10h18" />
  </svg>
)
const IcoEdit = ({ e = '' }) => <Ico extra={e} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
const IcoCheck = ({ e = '' }) => <Ico extra={e} d="M5 13l4 4L19 7" />
const IcoX = ({ e = '' }) => <Ico extra={e} d="M6 18L18 6M6 6l12 12" />
const IcoID = ({ e = '' }) => <Ico extra={e} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
const IcoCamera = ({ e = '' }) => <Ico extra={e} d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" d2="M12 17a4 4 0 100-8 4 4 0 000 8z" />
const IcoUpload = ({ e = '' }) => <Ico extra={e} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
const IcoPin = ({ e = '' }) => <Ico extra={e} d="M12 21s-8-7.5-8-12a8 8 0 1116 0c0 4.5-8 12-8 12z" d2="M12 9m-2.5 0a2.5 2.5 0 105 0 2.5 2.5 0 00-5 0" />
const IcoShield = ({ e = '' }) => <Ico extra={e} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
const IcoClock = ({ e = '' }) => <Ico extra={e} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
const IcoMonitor = ({ e = '' }) => <Ico extra={e} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
const IcoBook = ({ e = '' }) => <Ico extra={e} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
const IcoActivity = ({ e = '' }) => <Ico extra={e} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />

const PRESET_AVATARS = [
  { name: 'Preset 1', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80' },
  { name: 'Preset 2', url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80' },
  { name: 'Preset 3', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80' },
  { name: 'Preset 4', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80' },
  { name: 'Preset 5', url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80' },
  { name: 'Preset 6', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80' },
];

// ── Field ──────────────────────────────────────────────
function Field({ label, value, name, editing, formData, onChange, readOnly = false, icon }) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[0.6rem] font-black uppercase tracking-[0.15em] text-gray-400">{label}</p>
      {editing && !readOnly ? (
        <div className="relative">
          {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-35">{icon}</div>}
          <input type="text" value={formData[name] || ''} onChange={e => onChange(name, e.target.value)}
            className={`w-full bg-white border-2 border-gray-100 rounded-xl py-2.5 text-sm font-semibold text-gray-700 focus:outline-none focus:border-[#3c096c] transition-all shadow-sm ${icon ? 'pl-9 pr-3' : 'px-3'}`} />
        </div>
      ) : (
        <div className="flex items-center gap-2">
          {icon && <div className="opacity-30 flex-shrink-0">{icon}</div>}
          <p className="text-sm font-semibold text-gray-700">{value || '—'}</p>
        </div>
      )}
    </div>
  )
}

// ── Section ────────────────────────────────────────────
function Section({ icon, title, badge, editing = false, children }) {
  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all duration-200 ${editing ? 'border-[#3c096c]/20 shadow-md shadow-[#3c096c]/08' : 'border-gray-100'}`}>
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-50">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${editing ? 'bg-[#3c096c] shadow-md shadow-[#3c096c]/25' : 'bg-[#3c096c]/08'}`}>
          {React.cloneElement(icon, { e: editing ? 'text-white' : icon.props.e })}
        </div>
        <h3 className="font-black text-[#1a0030] text-sm tracking-tight">{title}</h3>
        {badge && <span className="ml-auto text-[0.58rem] font-bold uppercase tracking-widest text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">{badge}</span>}
        {editing && <span className="ml-auto text-[0.58rem] font-bold uppercase tracking-widest text-[#3c096c] bg-[#3c096c]/08 border border-[#3c096c]/15 px-2.5 py-1 rounded-full">Editing</span>}
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  )
}

export default function StudentProfile() {
  const navigate = useNavigate()
  const fileRef = useRef(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setEditing] = useState(false)
  const [formData, setFormData] = useState({})
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [photoPreview, setPhotoPreview] = useState(null)
  const [photoDragging, setPhotoDragging] = useState(false)
  const [savingLoading, setSavingLoading] = useState(false)

  useEffect(() => {
    const u = authService.getUser?.() || {}
    if (!u.id_number) { navigate('/login'); return }
    const data = {
      first_name: u.first_name || '',
      last_name: u.last_name || '',
      middle_name: u.middle_name || '',
      email: u.email || '',
      course: u.course || 'BSIT',
      year_level: u.year_level || u.course_level || 4,
      address: u.address || '',
      id_number: u.id_number || '',
      role: u.role || 'student',
      photo: u.photo || u.profile_picture || null,
      password: '',
      confirmPassword: '',
    }
    setUser(data); setFormData(data); setLoading(false)
    if (data.photo) setPhotoPreview(data.photo)
  }, [navigate])



  const onChange = (name, val) => setFormData(p => ({ ...p, [name]: val }))
  const handlePhotoFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = (e) => setPhotoPreview(e.target.result)
    reader.readAsDataURL(file)
  }
  const onFileChange = (e) => handlePhotoFile(e.target.files[0])
  const onDrop = (e) => { e.preventDefault(); setPhotoDragging(false); handlePhotoFile(e.dataTransfer.files[0]) }
  const onDragOver = (e) => { e.preventDefault(); setPhotoDragging(true) }
  const onDragLeave = () => setPhotoDragging(false)
  const removePhoto = () => { setPhotoPreview(null); if (fileRef.current) fileRef.current.value = '' }

  const handleSave = async () => {
    try {
      setSaveError(''); setSavingLoading(true)

      // Email Validation
      if (formData.email) {
        if (!formData.email.trim()) {
          setSaveError('Email Address cannot be empty');
          setSavingLoading(false);
          return;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email.trim())) {
          setSaveError('Invalid email address format');
          setSavingLoading(false);
          return;
        }
      }

      // Password Validation
      if (formData.password || formData.confirmPassword) {
        if (formData.password !== formData.confirmPassword) {
          setSaveError('Passwords do not match');
          setSavingLoading(false);
          return;
        }
        if (formData.password.length < 6) {
          setSaveError('Password must be at least 6 characters long');
          setSavingLoading(false);
          return;
        }
      }

      const response = await authService.updateProfile({
        idNumber: user.id_number,
        firstName: formData.first_name,
        lastName: formData.last_name,
        middleName: formData.middle_name,
        address: formData.address,
        photo: photoPreview,
        email: formData.email,
        password: formData.password || "",
      })
      const updated = response?.user ? { ...user, ...response.user, photo: photoPreview } : { ...formData, photo: photoPreview }
      const updatedWithNoPassword = { ...updated, password: '', confirmPassword: '' }
      setUser(updated); setFormData(updatedWithNoPassword)
      window.dispatchEvent(new Event('storage'))
      setEditing(false); setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      setSaveError(err.message || 'Failed to save profile changes')
    } finally { setSavingLoading(false) }
  }
  const handleCancel = () => { setFormData({ ...user, password: '', confirmPassword: '' }); setPhotoPreview(user?.photo || null); setEditing(false) }
  const hasChanges = ['first_name', 'last_name', 'middle_name', 'address', 'email'].some(k => (formData?.[k] ?? '') !== (user?.[k] ?? '')) || photoPreview !== (user?.photo || null) || (formData.password && formData.password !== '')

  if (loading) return <LoadingScreen message="Loading profile..." />
  if (!user) return <div className="min-h-[85vh] flex items-center justify-center"><p className="text-sm font-semibold text-red-500">Error loading profile.</p></div>

  const displayName = `${user.first_name} ${user.last_name}`.trim()
  const initials = `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase() || 'S'

  return (
    <div className="min-h-[85vh] py-6 px-2">
      <div className="max-w-[92rem] mx-auto flex flex-col gap-5">

        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-[#3c096c]/40 mb-1">Account</p>
            <h1 className="text-4xl font-black text-[#1a0030] tracking-tight">My Profile</h1>
          </div>
          <div className="flex items-center gap-3">
            {saved && (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-green-600 bg-green-50 border border-green-200 px-3 py-1.5 rounded-full">
                <IcoCheck e="w-3 h-3 text-green-500" /> Changes saved!
              </span>
            )}
            {saveError && <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-3 py-1.5 rounded-full">{saveError}</span>}
            {isEditing ? (
              <>
                <button onClick={handleCancel} className="flex items-center gap-1.5 text-sm font-bold text-gray-500 border border-gray-200 bg-white px-4 py-2 rounded-xl hover:bg-gray-50 transition">
                  <IcoX /> Discard
                </button>
                <button onClick={handleSave} disabled={!hasChanges || savingLoading}
                  className={`flex items-center gap-1.5 text-sm font-bold px-5 py-2 rounded-xl transition ${hasChanges && !savingLoading ? 'text-white bg-[#3c096c] hover:bg-[#5a189a] shadow-lg shadow-[#3c096c]/25' : 'text-gray-400 bg-gray-100 cursor-not-allowed'}`}>
                  {savingLoading
                    ? <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
                    : <><IcoCheck e={hasChanges ? 'text-white' : ''} /> Save Changes</>}
                </button>
              </>
            ) : (
              <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 text-sm font-bold text-white bg-[#3c096c] px-5 py-2 rounded-xl hover:bg-[#5a189a] shadow-lg shadow-[#3c096c]/25 transition">
                <IcoEdit e="text-white" /> Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* ── MAIN GRID ── */}
        <div className="grid grid-cols-12 gap-5 items-start">

          {/* ── LEFT ── */}
          <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">

            {/* Profile card */}
            <div className="bg-[#3c096c] rounded-2xl overflow-hidden shadow-xl shadow-[#3c096c]/25 relative">
              <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)', backgroundSize: '10px 10px' }} />
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-[#ff9100]/15 blur-3xl pointer-events-none" />
              <div className="h-1 w-full bg-gradient-to-r from-[#ff9100] via-violet-400 to-transparent" />
              <div className="relative px-6 pt-7 pb-6 flex flex-col items-center gap-4">
                {/* Avatar */}
                <div className="relative group">
                  <div className="w-60 h-60 rounded-full bg-[#ff9100] flex items-center justify-center shadow-2xl shadow-[#ff9100]/40 ring-4 ring-white/10 overflow-hidden">
                    {photoPreview ? <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" /> : <span className="text-white font-black text-4xl">{initials}</span>}
                  </div>
                  {isEditing && (
                    <>
                      <button onClick={() => fileRef.current?.click()} className="absolute inset-0 rounded-full bg-black/55 flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-all cursor-pointer">
                        <IcoCamera e="w-5 h-5 text-white" />
                        <span className="text-[0.6rem] font-bold text-white">Change</span>
                      </button>
                      <div className="absolute -bottom-1.5 -right-1.5 w-10 h-10 rounded-full bg-[#ff9100] border-2 border-[#3c096c] flex items-center justify-center shadow-md">
                        <IcoCamera e="w-3 h-3 text-white" />
                      </div>
                    </>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" onChange={onFileChange} className="hidden" />

                <div className="text-center">
                  <h2 className="text-xl font-black text-white leading-tight">{displayName}</h2>
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <span className="text-[0.6rem] font-black uppercase tracking-[0.18em] bg-white/10 border border-white/15 text-white/70 px-3 py-1 rounded-full">{user.role}</span>

                  </div>
                </div>
                <div className="w-full h-px bg-white/08" />
                <div className="w-full flex items-center justify-between">
                  <span className="text-[0.58rem] font-black uppercase tracking-widest text-white/35">Student ID</span>
                  <span className="font-mono text-sm font-bold text-[#ff9100] tracking-wider">{user.id_number}</span>
                </div>
                <div className="w-full flex items-center gap-2">
                  <IcoMail e="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
                  <span className="text-xs text-white/50 font-medium truncate">{user.email}</span>
                </div>
              </div>
            </div>

            {isEditing && (
              <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col gap-5 animate-fade-in">
                <div>
                  <h3 className="font-black text-[#1a0030] text-lg tracking-tight mb-1">Suggested Avatars</h3>
                  <p className="text-[0.72rem] text-gray-500 font-semibold leading-relaxed">
                    Choose a preset below to instantly update and personalize your profile picture.
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-4 justify-items-center">
                  {PRESET_AVATARS.map((av, idx) => {
                    const isSelected = photoPreview === av.url;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setPhotoPreview(av.url)}
                        className={`relative w-20 h-20 rounded-full overflow-hidden border-2 hover:scale-105 active:scale-95 transition-all duration-300 ${isSelected ? 'border-[#ff9100] ring-4 ring-[#ff9100]/25' : 'border-gray-100'
                          }`}
                      >
                        <img src={av.url} alt={av.name} className="w-full h-full object-cover" />
                        {isSelected && (
                          <div className="absolute inset-0 bg-[#ff9100]/20 flex items-center justify-center">
                            <span className="w-6 h-6 rounded-full bg-[#ff9100] flex items-center justify-center shadow-md">
                              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={4} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            </span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {!isEditing && (
              <>
                {/* Course + Year */}
                <div className="grid grid-cols-2 gap-3 animate-fade-in">
                  <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm shadow-[#ff9100]/20 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-1.5 text-gray-400 mb-3">
                      <IcoGrad e="w-3.5 h-3.5" />
                      <span className="text-[0.58rem] font-black uppercase tracking-widest">Course</span>
                    </div>
                    <p className="text-3xl font-black text-[#3c096c]">{user.course}</p>
                  </div>
                  <div className="bg-white rounded-2xl p-5 shadow-sm shadow-[#ff9100]/20 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-1.5 text-gray-400 mb-3">
                      <IcoCal e="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-[0.58rem] font-black uppercase tracking-widest">Year</span>
                    </div>
                    <p className="text-3xl font-black text-[#3c096c]">{user.year_level}</p>
                    <p className="text-[0.6rem] text-gray-400 mt-0.5 font-medium">Level</p>
                  </div>
                </div>

                {/* Account status */}
                <div className="bg-white border border-gray-100 rounded-2xl px-5 py-4 shadow-sm flex items-center justify-between animate-fade-in">
                  <div className="flex items-center gap-2">
                    <IcoShield e="w-4 h-4 text-[#3c096c]/40" />
                    <span className="text-[0.62rem] font-black uppercase tracking-widest text-gray-400">Account Status</span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-green-600 bg-green-50 border border-green-200 px-3 py-1.5 rounded-full">
                    Active
                  </span>
                </div>
              </>
            )}


          </div>

          {/* ── RIGHT ── */}
          <div className="col-span-12 lg:col-span-8 flex flex-col gap-4">

            {/* Personal */}
            <Section icon={<IcoUser e="text-[#3c096c]" />} title="Personal Information" editing={isEditing}>
              <div className="grid grid-cols-3 gap-5">
                <Field label="First Name" value={user.first_name} name="first_name" editing={isEditing} formData={formData} onChange={onChange} icon={<IcoUser e="w-3.5 h-3.5 text-gray-500" />} />
                <Field label="Last Name" value={user.last_name} name="last_name" editing={isEditing} formData={formData} onChange={onChange} icon={<IcoUser e="w-3.5 h-3.5 text-gray-500" />} />
                <Field label="Middle Name" value={user.middle_name} name="middle_name" editing={isEditing} formData={formData} onChange={onChange} icon={<IcoUser e="w-3.5 h-3.5 text-gray-500" />} />
              </div>
            </Section>

            {/* Contact */}
            <Section icon={<IcoMail e="text-[#3c096c]" />} title="Contact Information" editing={isEditing}>
              <div className="grid grid-cols-2 gap-5">
                <Field label="Email Address" value={user.email} name="email" editing={isEditing} formData={formData} onChange={onChange} icon={<IcoMail e="w-3.5 h-3.5 text-gray-500" />} />
                <Field label="Address" value={user.address} name="address" editing={isEditing} formData={formData} onChange={onChange} icon={<IcoPin e="w-3.5 h-3.5 text-gray-500" />} />
              </div>
            </Section>

            {/* Security */}
            <Section icon={<IcoShield e="text-[#3c096c]" />} title="Security & Password" editing={isEditing}>
              {isEditing ? (
                <div className="grid grid-cols-2 gap-5">
                  <div className="flex flex-col gap-1.5">
                    <p className="text-[0.6rem] font-black uppercase tracking-[0.15em] text-gray-400">New Password</p>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-35">
                        <IcoShield e="w-3.5 h-3.5 text-gray-500" />
                      </div>
                      <input type="password" placeholder="Leave blank to keep current" value={formData.password || ''} onChange={e => onChange('password', e.target.value)}
                        className="w-full bg-white border-2 border-gray-100 rounded-xl py-2.5 text-sm font-semibold text-gray-700 focus:outline-none focus:border-[#3c096c] transition-all shadow-sm pl-9 pr-3" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <p className="text-[0.6rem] font-black uppercase tracking-[0.15em] text-gray-400">Confirm Password</p>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-35">
                        <IcoShield e="w-3.5 h-3.5 text-gray-500" />
                      </div>
                      <input type="password" placeholder="Confirm new password" value={formData.confirmPassword || ''} onChange={e => onChange('confirmPassword', e.target.value)}
                        className="w-full bg-white border-2 border-gray-100 rounded-xl py-2.5 text-sm font-semibold text-gray-700 focus:outline-none focus:border-[#3c096c] transition-all shadow-sm pl-9 pr-3" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-5">
                  <div className="flex flex-col gap-1.5">
                    <p className="text-[0.6rem] font-black uppercase tracking-[0.15em] text-gray-400">Password</p>
                    <div className="flex items-center gap-2">
                      <IcoShield e="w-3.5 h-3.5 text-gray-400" />
                      <p className="text-sm font-semibold text-gray-700">••••••••••••</p>
                    </div>
                  </div>
                </div>
              )}
            </Section>

            {/* Additional */}
            <Section icon={<IcoID e="text-[#3c096c]" />} title="Additional Details" badge="Read only">
              <div className="grid grid-cols-2 gap-5">
                <div className="flex flex-col gap-2">
                  <p className="text-[0.6rem] font-black uppercase tracking-widest text-gray-400">Student ID Number</p>
                  <div className="inline-flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 w-fit">
                    <IcoID e="w-3.5 h-3.5 text-gray-400" />
                    <span className="font-mono text-sm font-bold text-gray-700 tracking-wider">{user.id_number || '—'}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <p className="text-[0.6rem] font-black uppercase tracking-widest text-gray-400">System Role</p>
                  <span className="inline-flex items-center gap-2 text-xs font-bold text-[#3c096c] bg-[#3c096c]/08 border border-[#3c096c]/15 px-4 py-2.5 rounded-xl w-fit capitalize">
                    <IcoUser e="w-3.5 h-3.5 text-[#3c096c]" />{user.role}
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