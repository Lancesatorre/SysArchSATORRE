import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import ccsLogo from '../assets/ccsmainlogo.png';
import { authService } from '../services/authService';
import LoadingOverlay from './LoadingOverlay';

const formatNotificationTime = (dateValue) => {
  if (!dateValue) return 'Just now';
  const date = new Date(dateValue.replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return 'Just now';
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hour${diffHr > 1 ? 's' : ''} ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString();
};

// Returns tag icon + color config based on notification tag
const getNotifStyle = (tag = '') => {
  const t = tag.toLowerCase();
  if (t.includes('sit')) return {
    bg: 'rgba(255,145,0,0.15)', stroke: '#ff9100',
    pillBg: 'rgba(255,145,0,0.15)', pillColor: '#ff9100',
    icon: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z',
    icon2: 'M14 2v6h6',
  };
  if (t.includes('reserv')) return {
    bg: 'rgba(74,222,128,0.12)', stroke: '#4ade80',
    pillBg: 'rgba(74,222,128,0.12)', pillColor: '#4ade80',
    icon: 'M22 11.08V12a10 10 0 11-5.93-9.14',
    icon2: 'M22 4L12 14.01l-3-3',
  };
  return {
    bg: 'rgba(100,100,120,0.15)', stroke: '#7b5fa8',
    pillBg: 'rgba(100,100,120,0.15)', pillColor: '#5a3f7a',
    icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
    icon2: null,
  };
};

const NavIcon = ({ d, cls = 'w-4 h-4' }) => (
  <svg className={cls} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
);

// Active-aware nav link
function NavLink({ to, children, onClick }) {
  const { pathname } = useLocation();
  const isActive = pathname === to || pathname.startsWith(to + '/');
  return (
    <Link
      to={to}
      onClick={onClick}
      style={{
        color: isActive ? '#ff9100' : undefined,
        borderBottom: isActive ? '2.5px solid #ff9100 ' : '2.5px solid transparent',
        paddingBottom: '2px',
        fontWeight: isActive ? 0 : undefined,
      }}
      className='hover:text-[#ff9100] transition duration-300 px-3 rounded-2xl'
    >
      {children}
    </Link>
  );
}

export default function Navbar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [sitInOpen, setSitInOpen] = useState(false);
  const [announcementOpen, setAnnouncementOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  const navRef = useRef(null);
  const profileRef = useRef(null);
  const notifRef = useRef(null);
  const sitInRef = useRef(null);
  const announcementRef = useRef(null);

  useEffect(() => {
    setIsLoggedIn(authService.isLoggedIn());
    if (authService.isLoggedIn()) {
      const sessionUser = authService.getUser();
      setUser(sessionUser);
      if (sessionUser?.id_number && sessionUser?.role !== 'admin') {
        loadNotifications(sessionUser);
      }
    }
  }, []);

  const loadNotifications = async (activeUser = user) => {
    if (!activeUser?.id_number) return;
    setNotificationsLoading(true);
    try {
      const rows = await authService.fetchNotifications(activeUser.id_number);
      setNotifications(rows);
    } catch (_) {
      setNotifications([]);
    } finally {
      setNotificationsLoading(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) setMobileMenuOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotificationOpen(false);
      if (sitInRef.current && !sitInRef.current.contains(e.target)) setSitInOpen(false);
      if (announcementRef.current && !announcementRef.current.contains(e.target)) setAnnouncementOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setLogoutLoading(true);
    setTimeout(() => {
      authService.logout();
      setIsLoggedIn(false);
      setUser(null);
      setLogoutLoading(false);
      navigate('/login');
    }, 800);
  };

  const displayName = user
    ? user.role === 'admin'
      ? 'Admin'
      : `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() || 'Student'
    : 'Student';

  const roleLabel = user?.role === 'admin' ? 'Admin' : 'Student';
  const isAdmin = user?.role === 'admin';
  const dashboardPath = user?.role === 'admin' ? '/admin/dashboard' : '/student/dashboard';
  const profilePath = user?.role === 'admin' ? '/admin/dashboard' : '/student/profile';
  const closeMobileMenu = () => setMobileMenuOpen(false);

  // Helper: is a given path or any of its sub-paths active?
  const isPathActive = (to) => pathname === to || pathname.startsWith(to + '/');

  // Dropdown button active style (for Sit In / Announcement / Notifications)
  const dropdownActiveStyle = (subPaths = []) => {
    const active = subPaths.some(isPathActive);
    return {
      color: active ? '#ff9100' : undefined,
      borderBottom: active ? '2.5px solid #ff9100' : '2.5px solid transparent',
      paddingBottom: active ? '2px' : undefined,
      fontWeight: active ? 0 : undefined,
    };
  };

  return (
    <>
      {logoutLoading && <LoadingOverlay message="Logging out..." />}
      <nav ref={navRef} className='relative min-h-[5vh] mx-3 sm:mx-6 lg:mx-16 xl:mx-40 bg-[#3c096c] flex justify-between shadow-md shadow-[#ff9100]/20 items-center rounded-3xl px-4 sm:px-8 lg:px-12 mb-5 py-2'>
        <div className='flex items-center justify-center flex-row gap-3'>
          <img src={ccsLogo} alt="CCS Logo" className='rounded-md h-8 w-8 border border-[#240046]'/>
          <h1 className='font-bold text-lg text-white tracking-wider'>
            <Link to="/" className='text-white hover:text-[#ff9100] transition duration-300'>Sit-inIT</Link>
          </h1>
        </div>

        <div className='hidden md:flex gap-4 justify-center items-center'>
          {!isLoggedIn ? (
            <>
              <div className='text-white flex justify-center items-center gap-10'>
                <NavLink to="/">Home</NavLink>
                <NavLink to="/about">About</NavLink>

                <div className='relative group py-4'>
                  <span className='cursor-pointer hover:text-[#ff9100] transition duration-300 flex items-center gap-1'>
                    Community
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                  <div className='absolute left-20 -translate-x-1/2 top-full mt-0 hidden w-40 bg-white rounded-md shadow-lg group-hover:block z-50 overflow-hidden border border-[#3c096c]'>
                    <Link to="/community/forums" className='block px-4 py-3 text-[#3c096c] font-medium hover:bg-[#3c096c] hover:text-white transition duration-300'>Forums</Link>
                    <Link to="/community/events" className='block px-4 py-3 text-[#3c096c] font-medium hover:bg-[#3c096c] hover:text-white transition duration-300'>Events</Link>
                    <Link to="/community/members" className='block px-4 py-3 text-[#3c096c] font-medium hover:bg-[#3c096c] hover:text-white transition duration-300'>Members</Link>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className='text-white flex justify-center items-center gap-5 py-4'>
                <NavLink to={dashboardPath}>Home</NavLink>

                {user?.role === 'admin' ? (
                  <div ref={sitInRef} className='relative'>
                    <button
                      onClick={() => setSitInOpen(!sitInOpen)}
                      style={dropdownActiveStyle(['/admin/search-student', '/admin/current-sessions', '/admin/sit-in-records'])}
                      className='hover:text-[#ff9100] transition duration-300 flex items-center gap-1 px-3 rounded-2xl'
                    >
                      Sit In
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${sitInOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {sitInOpen && (
                      <div className='absolute left-1/2 -translate-x-1/2 top-full mt-2 w-64 bg-[#140828] rounded-2xl shadow-xl z-50 border border-[#7b2cbf]/45 overflow-hidden'>
                        <div className='px-4 py-3 border-b border-[#7b2cbf]/30 bg-linear-to-r from-[#3c096c] to-[#5a189a]'>
                          <p className='text-[0.65rem] uppercase tracking-widest text-[#e0aaff] font-black'>Sit-in Management</p>
                        </div>
                        <div className='p-2.5 flex flex-col gap-1.5'>
                          {[
                            { to: '/admin/search-student', icon: 'M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z', label: 'Search Student' },
                            { to: '/admin/current-sessions', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', label: 'Current Sessions' },
                            { to: '/admin/sit-in-records', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2z', label: 'Sit-in Records' },
                          ].map(({ to, icon, label }) => (
                            <Link
                              key={to}
                              to={to}
                              onClick={() => setSitInOpen(false)}
                              style={isPathActive(to) ? { background: 'rgba(157,78,221,0.2)', color: '#ff9100', borderLeft: '3px solid #ff9100' } : {}}
                              className='flex items-center gap-2 px-3 py-2.5 rounded-lg text-[#e9d5ff] font-semibold text-sm hover:bg-[#3c096c] hover:text-white transition duration-300'
                            >
                              <NavIcon d={icon} cls='w-4 h-4' />
                              {label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <NavLink to="/student/history">History</NavLink>
                    <NavLink to="/student/reservation">Reservation</NavLink>
                  </>
                )}

                {isAdmin ? (
                  <div ref={announcementRef} className='relative'>
                    <button
                      onClick={() => setAnnouncementOpen(!announcementOpen)}
                      style={dropdownActiveStyle(['/admin/create-announcement', '/admin/announcement-records'])}
                      className='hover:text-[#ff9100] transition duration-300 flex items-center gap-1 px-3 rounded-2xl'
                    >
                      Announcement
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${announcementOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {announcementOpen && (
                      <div className='absolute right-0 top-full mt-2 w-60 bg-[#140828] rounded-2xl shadow-xl z-50 border border-[#7b2cbf]/45 overflow-hidden'>
                        <div className='px-4 py-3 border-b border-[#7b2cbf]/30 bg-linear-to-r from-[#3c096c] to-[#5a189a]'>
                          <p className='text-[0.65rem] uppercase tracking-widest text-[#e0aaff] font-black'>Announcement Menu</p>
                        </div>
                        <div className='p-2.5 flex flex-col gap-1.5'>
                          {[
                            { to: '/admin/create-announcement', icon: 'M12 4v16m8-8H4', label: 'Create Announcement' },
                            { to: '/admin/announcement-records', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2z', label: 'Announcement Records' },
                          ].map(({ to, icon, label }) => (
                            <Link
                              key={to}
                              to={to}
                              onClick={() => setAnnouncementOpen(false)}
                              style={isPathActive(to) ? { background: 'rgba(157,78,221,0.2)', color: '#ff9100', borderLeft: '3px solid #ff9100' } : {}}
                              className='flex items-center gap-2 px-3 py-2.5 rounded-lg text-[#e9d5ff] font-semibold text-sm hover:bg-[#3c096c] hover:text-white transition duration-300'
                            >
                              <NavIcon d={icon} cls='w-4 h-4' />
                              {label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* ── REDESIGNED NOTIFICATIONS DROPDOWN ── */
                  <div ref={notifRef} className='relative'>
                    <button
                      onClick={() => {
                        const next = !notificationOpen;
                        setNotificationOpen(next);
                        if (next) loadNotifications();
                      }}
                      className='hover:text-[#ff9100] transition duration-300 flex items-center gap-2 relative'
                    >
                      Notifications
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${notificationOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                      {notifications.length > 0 && (
                        <span className='absolute -top-3 -right-3 min-w-5 h-5 px-1 bg-[#ff9100] text-white text-xs font-bold rounded-full flex items-center justify-center'>
                          {notifications.length}
                        </span>
                      )}
                    </button>

                    {notificationOpen && (
                      <div className='absolute right-0 top-full mt-2 w-88 bg-[#120723] border border-[#7b2cbf]/40 rounded-2xl overflow-hidden z-50 shadow-2xl shadow-black/40'>
                        <div className='px-4 py-3 bg-linear-to-r from-[#3c096c] to-[#5a189a] border-b border-[#7b2cbf]/30 flex items-center justify-between'>
                          <div className='flex items-center gap-2'>
                            <span className='w-7 h-7 rounded-lg bg-white/10 text-[#e9d5ff] flex items-center justify-center'>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                              </svg>
                            </span>
                            <p className='text-sm font-black text-white'>Notifications</p>
                            {notifications.length > 0 && (
                              <span className='text-[0.62rem] font-black uppercase tracking-wider text-[#ff9100] bg-[#ff9100]/15 border border-[#ff9100]/35 px-2 py-0.5 rounded-full'>
                                {notifications.length} New
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => setNotifications([])}
                            className='text-[0.7rem] font-bold text-[#c77dff] hover:text-[#ff9100] transition'
                          >
                            Mark all read
                          </button>
                        </div>

                        <div className='max-h-90 overflow-y-auto p-2.5 flex flex-col gap-2 bg-[#140828]'>
                          {notificationsLoading && (
                            <div className='px-3 py-4 text-sm text-[#c4b5d8] text-center'>Loading notifications…</div>
                          )}

                          {!notificationsLoading && notifications.length === 0 && (
                            <div className='px-3 py-6 text-sm text-[#9b80b8] text-center'>No notifications yet.</div>
                          )}

                          {!notificationsLoading && notifications.map((item, idx) => {
                            const style = getNotifStyle(item.tag);
                            return (
                              <div
                                key={item.id || idx}
                                className='bg-[#24123f] border border-[#7b2cbf]/25 rounded-xl p-3 flex gap-3 hover:bg-[#2a1547] hover:border-[#c77dff]/45 transition-colors'
                              >
                                <div className='relative shrink-0'>
                                  <div className='w-9 h-9 rounded-lg bg-[#3c096c] text-white text-[0.58rem] font-black flex items-center justify-center'>CCS</div>
                                  <span className='absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#ff9100] border border-[#140828]' />
                                </div>

                                <div className='min-w-0 flex-1'>
                                  <div className='flex items-center justify-between gap-2'>
                                    <p className='text-xs font-black uppercase tracking-wider text-[#e9d5ff]'>CCS ADMIN</p>
                                    <span className='text-[0.64rem] text-[#a78bca] shrink-0'>{formatNotificationTime(item.created_at)}</span>
                                  </div>
                                  <p className='text-sm font-bold text-[#f3e8ff] mt-1 truncate'>{item.title || 'Notification'}</p>
                                  <p className='text-xs text-[#d4c6ea] mt-1 line-clamp-2'>{item.message}</p>
                                  {item.tag && (
                                    <span
                                      className='inline-block mt-1.5 text-[0.62rem] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border'
                                      style={{ background: style.pillBg, color: style.pillColor, borderColor: style.pillColor + '40' }}
                                    >
                                      {item.tag}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <div className='px-4 py-2.5 border-t border-[#7b2cbf]/30 bg-[#120723] text-center'>
                          <button
                            onClick={() => loadNotifications()}
                            className='text-xs font-bold text-[#c77dff] hover:text-[#ff9100] transition'
                          >
                            Refresh
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div ref={profileRef} className='relative ml-2'>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  style={{
                    width: '38px', height: '38px', borderRadius: '10px',
                    background: 'linear-gradient(135deg, #9d4edd, #5a189a)',
                    border: profileOpen ? '1.5px solid #c77dff' : '1.5px solid rgba(199,125,255,0.4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', transition: 'border-color 0.15s', flexShrink: 0,
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#e9d5ff">
                    <path fillRule="evenodd" d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" clipRule="evenodd" />
                  </svg>
                </button>

                {profileOpen && (
                  <div style={{
                    position: 'absolute', right: 0, top: 'calc(100% + 10px)',
                    width: '224px', background: '#140828',
                    border: '1px solid rgba(157,78,221,0.25)', borderRadius: '14px',
                    overflow: 'hidden', zIndex: 99, boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                  }}>
                    <div style={{
                      padding: '14px 16px 12px', borderBottom: '1px solid rgba(157,78,221,0.15)',
                      display: 'flex', alignItems: 'center', gap: '12px',
                    }}>
                      <div style={{ position: 'relative', flexShrink: 0 }}>
                        <div style={{
                          width: '40px', height: '40px', borderRadius: '10px',
                          background: 'linear-gradient(135deg, #9d4edd, #5a189a)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          border: '1.5px solid rgba(199,125,255,0.35)',
                        }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="#e9d5ff">
                            <path fillRule="evenodd" d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <span style={{
                          position: 'absolute', bottom: '-2px', right: '-2px',
                          width: '10px', height: '10px', borderRadius: '50%',
                          background: '#4ade80', border: '2px solid #140828',
                        }} />
                      </div>
                      <div style={{ overflow: 'hidden' }}>
                        <p style={{
                          fontSize: '13.5px', fontWeight: 600, color: '#e9d5ff',
                          margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>{displayName}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '3px' }}>
                          <span style={{
                            fontSize: '10px', fontWeight: 600, color: '#c77dff',
                            background: 'rgba(157,78,221,0.18)', border: '1px solid rgba(157,78,221,0.3)',
                            borderRadius: '20px', padding: '1px 7px',
                          }}>{roleLabel}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ padding: '6px' }}>
                      <ProfileMenuItem to={profilePath} icon={
                        <svg viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" clipRule="evenodd"/></svg>
                      } onClick={() => setProfileOpen(false)}>{user?.role === 'admin' ? 'Dashboard' : 'Profile'}</ProfileMenuItem>

                      <ProfileMenuItem to="/settings" icon={
                        <svg viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M11.078 2.25c-.917 0-1.699.663-1.85 1.567L9.05 4.889c-.02.12-.115.26-.297.348a7.493 7.493 0 0 0-.986.57c-.166.115-.334.126-.45.083L6.3 5.508a1.875 1.875 0 0 0-2.282.819l-.922 1.597a1.875 1.875 0 0 0 .432 2.385l.84.692c.095.078.17.229.154.43a7.598 7.598 0 0 0 0 1.139c.015.2-.059.352-.153.43l-.841.692a1.875 1.875 0 0 0-.432 2.385l.922 1.597a1.875 1.875 0 0 0 2.282.818l1.019-.382c.115-.043.283-.031.45.082.312.214.641.405.985.57.182.088.277.228.297.35l.178 1.071c.151.904.933 1.567 1.85 1.567h1.844c.916 0 1.699-.663 1.85-1.567l.178-1.072c.02-.12.114-.26.297-.349.344-.165.673-.356.985-.57.167-.114.335-.125.45-.082l1.02.382a1.875 1.875 0 0 0 2.28-.819l.923-1.597a1.875 1.875 0 0 0-.432-2.385l-.84-.692c-.095-.078-.17-.229-.154-.43a7.614 7.614 0 0 0 0-1.139c-.016-.2.059-.352.153-.43l.84-.692c.708-.582.891-1.59.433-2.385l-.922-1.597a1.875 1.875 0 0 0-2.282-.818l-1.02.382c-.114.043-.282.031-.449-.083a7.49 7.49 0 0 0-.985-.57c-.183-.087-.277-.227-.297-.348l-.179-1.072a1.875 1.875 0 0 0-1.85-1.567h-1.843ZM12 15.75a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5Z" clipRule="evenodd"/></svg>
                      } onClick={() => setProfileOpen(false)}>Settings</ProfileMenuItem>

                      <div style={{ height: '1px', background: 'rgba(157,78,221,0.12)', margin: '4px 0' }} />

                      <button
                        onClick={handleLogout}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                          padding: '9px 10px', borderRadius: '8px', border: 'none',
                          fontSize: '13px', fontWeight: 500, color: '#f87171',
                          background: 'transparent', cursor: 'pointer', textAlign: 'left',
                          transition: 'background 0.12s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <span style={{ opacity: 0.8, display: 'flex', alignItems: 'center' }}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                            <path fillRule="evenodd" d="M7.5 3.75A1.5 1.5 0 0 0 6 5.25v13.5a1.5 1.5 0 0 0 1.5 1.5h6a1.5 1.5 0 0 0 1.5-1.5V15a.75.75 0 0 1 1.5 0v3.75a3 3 0 0 1-3 3h-6a3 3 0 0 1-3-3V5.25a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3V9A.75.75 0 0 1 15 9V5.25a1.5 1.5 0 0 0-1.5-1.5h-6Zm10.72 4.72a.75.75 0 0 1 1.06 0l3 3a.75.75 0 0 1 0 1.06l-3 3a.75.75 0 1 1-1.06-1.06l1.72-1.72H9a.75.75 0 0 1 0-1.5h10.94l-1.72-1.72a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                          </svg>
                        </span>
                        Log out
                      </button>
                    </div>

                    <div style={{
                      padding: '8px 16px',
                      borderTop: '1px solid rgba(157,78,221,0.12)',
                      fontSize: '11px', color: '#4a3f6b', textAlign: 'center',
                    }}>
                      Sit-inIT · CCS Portal
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className='md:hidden inline-flex items-center justify-center p-2 rounded-lg text-white hover:bg-[#5a189a] transition'
          aria-label='Toggle navigation menu'
        >
          {mobileMenuOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" className='w-6 h-6' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className='w-6 h-6' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 6h16M4 12h16M4 18h16' />
            </svg>
          )}
        </button>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className='md:hidden absolute top-[calc(100%+8px)] left-0 right-0 bg-[#140828] text-white rounded-2xl border border-[#7b2cbf]/45 shadow-xl p-3 z-50'>
            {!isLoggedIn ? (
              <div className='flex flex-col gap-2 text-left'>
                <div className='px-2 py-1 text-[0.62rem] font-black uppercase tracking-wider text-[#c77dff]'>Main</div>
                {[
                  { to: '/', label: 'Home' },
                  { to: '/about', label: 'About' },
                ].map(({ to, label }) => (
                  <Link
                    key={to}
                    to={to}
                    onClick={closeMobileMenu}
                    style={isPathActive(to) ? { color: '#ff9100', background: 'rgba(255,145,0,0.1)', borderColor: 'rgba(255,145,0,0.35)' } : {}}
                    className='px-3 py-2.5 rounded-xl border border-transparent hover:text-[#ff9100] hover:bg-[#3c096c]/35 transition duration-300'
                  >
                    {label}
                  </Link>
                ))}

                <div className='border-t border-[#7b2cbf]/35 my-1' />
                <div className='px-2 py-1 text-[0.62rem] font-black uppercase tracking-wider text-[#c77dff]'>Community</div>
                {[
                  { to: '/community/forums', label: 'Forums' },
                  { to: '/community/events', label: 'Events' },
                  { to: '/community/members', label: 'Members' },
                ].map(({ to, label }) => (
                  <Link
                    key={to}
                    to={to}
                    onClick={closeMobileMenu}
                    style={isPathActive(to) ? { color: '#ff9100', background: 'rgba(255,145,0,0.1)', borderColor: 'rgba(255,145,0,0.35)' } : {}}
                    className='px-3 py-2.5 rounded-xl border border-transparent hover:text-[#ff9100] hover:bg-[#3c096c]/35 transition duration-300'
                  >
                    {label}
                  </Link>
                ))}
              </div>
            ) : (
              <div className='flex flex-col gap-2 text-left'>
                <Link
                  to={dashboardPath} onClick={closeMobileMenu}
                  style={isPathActive(dashboardPath) ? { color: '#ff9100', fontWeight: 600, background: 'rgba(255,145,0,0.1)', borderColor: 'rgba(255,145,0,0.35)' } : {}}
                  className='px-3 py-2.5 rounded-xl border border-transparent hover:text-[#ff9100] hover:bg-[#3c096c]/35 transition duration-300'
                >Home</Link>
                {user?.role === 'admin' ? (
                  <>
                    <div className='px-2 py-1 text-[0.62rem] font-black uppercase tracking-wider text-[#c77dff]'>Sit-In</div>
                    {[
                      { to: '/admin/search-student', label: 'Search Student' },
                      { to: '/admin/current-sessions', label: 'Current Sessions' },
                      { to: '/admin/sit-in-records', label: 'Sit in Records' },
                    ].map(({ to, label }) => (
                      <Link
                        key={to} to={to} onClick={closeMobileMenu}
                        style={isPathActive(to) ? { color: '#ff9100', fontWeight: 600, background: 'rgba(255,145,0,0.1)', borderColor: 'rgba(255,145,0,0.35)' } : {}}
                        className='px-3 py-2.5 rounded-xl border border-transparent hover:text-[#ff9100] hover:bg-[#3c096c]/35 transition duration-300'
                      >{label}</Link>
                    ))}

                    <div className='px-2 pt-2 pb-1 text-[0.62rem] font-black uppercase tracking-wider text-[#c77dff]'>Announcement</div>
                    {[
                      { to: '/admin/create-announcement', label: 'Create Announcement' },
                      { to: '/admin/announcement-records', label: 'Announcement Records' },
                    ].map(({ to, label }) => (
                      <Link
                        key={to} to={to} onClick={closeMobileMenu}
                        style={isPathActive(to) ? { color: '#ff9100', fontWeight: 600, background: 'rgba(255,145,0,0.1)', borderColor: 'rgba(255,145,0,0.35)' } : {}}
                        className='px-3 py-2.5 rounded-xl border border-transparent hover:text-[#ff9100] hover:bg-[#3c096c]/35 transition duration-300'
                      >{label}</Link>
                    ))}
                  </>
                ) : (
                  <>
                    {[
                      { to: '/student/history', label: 'History' },
                      { to: '/student/reservation', label: 'Reservation' },
                    ].map(({ to, label }) => (
                      <Link
                        key={to} to={to} onClick={closeMobileMenu}
                        style={isPathActive(to) ? { color: '#ff9100', fontWeight: 600, background: 'rgba(255,145,0,0.1)', borderColor: 'rgba(255,145,0,0.35)' } : {}}
                        className='px-3 py-2.5 rounded-xl border border-transparent hover:text-[#ff9100] hover:bg-[#3c096c]/35 transition duration-300'
                      >{label}</Link>
                    ))}
                  </>
                )}
                <Link
                  to={profilePath} onClick={closeMobileMenu}
                  style={isPathActive(profilePath) ? { color: '#ff9100', fontWeight: 600, background: 'rgba(255,145,0,0.1)', borderColor: 'rgba(255,145,0,0.35)' } : {}}
                  className='px-3 py-2.5 rounded-xl border border-transparent hover:text-[#ff9100] hover:bg-[#3c096c]/35 transition duration-300'
                >{user?.role === 'admin' ? 'Dashboard' : 'Profile'}</Link>
                <button
                  onClick={() => { closeMobileMenu(); handleLogout(); }}
                  className='text-left px-3 py-2.5 rounded-xl border border-transparent text-red-300 hover:text-red-200 hover:bg-red-500/10 transition duration-300'
                >
                  Log out
                </button>
              </div>
            )}
          </div>
        )}
      </nav>
    </>
  );
}

function ProfileMenuItem({ to, icon, children, onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '9px 10px', borderRadius: '8px',
        fontSize: '13px', fontWeight: 500, color: '#c4b5d8',
        textDecoration: 'none', transition: 'background 0.12s, color 0.12s',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(157,78,221,0.14)'; e.currentTarget.style.color = '#e9d5ff'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#c4b5d8'; }}
    >
      <span style={{ width: '15px', height: '15px', opacity: 0.65, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
        {icon}
      </span>
      {children}
    </Link>
  );
}