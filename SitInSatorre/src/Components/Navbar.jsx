import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom' 
import ccsLogo from '../assets/ccsmainlogo.png';
import { authService } from '../services/authService';
import LoadingOverlay from './LoadingOverlay';

export default function Navbar() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  const profileRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    setIsLoggedIn(authService.isLoggedIn());
    if (authService.isLoggedIn()) {
      setUser(authService.getUser());
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotificationOpen(false);
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

  return (
    <>
      {logoutLoading && <LoadingOverlay message="Logging out..." />}
      <nav className='min-h-[5vh] mx-40 bg-[#3c096c] flex justify-between shadow-2xl items-center rounded-4xl px-15 mb-5 border border-gray-900'>
        <div className='flex items-center justify-center flex-row gap-3'>
          <img src={ccsLogo} alt="CCS Logo" className='rounded-md h-8 w-8 border border-[#240046]'/>
          <h1 className='font-bold text-lg text-white tracking-wider'>
            <Link to="/" className='text-white hover:text-[#ff9100] transition duration-300'>Sit-inIT</Link> 
          </h1>
        </div>

        <div className='flex gap-4 justify-center items-center'>
          {!isLoggedIn ? (
            <>
              <div className='text-white flex justify-center items-center gap-10'>
                <Link to="/" className='hover:text-[#ff9100] transition duration-300'>Home</Link>
                <Link to="/about" className='hover:text-[#ff9100] transition duration-300'>About</Link>
                 
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
              <div className='text-white flex justify-center items-center gap-8 py-4'>
                <Link to="/student/dashboard" className='hover:text-[#ff9100] transition duration-300'>Home</Link>
                <Link to="/student/history" className='hover:text-[#ff9100] transition duration-300'>History</Link>
                <Link to="/student/reservation" className='hover:text-[#ff9100] transition duration-300'>Reservation</Link>

                {/* Notification Dropdown */}
                <div ref={notifRef} className='relative'>
                  <button 
                    onClick={() => setNotificationOpen(!notificationOpen)}
                    className='hover:text-[#ff9100] transition duration-300 flex items-center gap-2 relative'
                  >
                    Notifications
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${notificationOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    <span className='absolute -top-3 -right-3 w-5 h-5 bg-[#ff9100] text-white text-xs font-bold rounded-full flex items-center justify-center'>3</span>
                  </button>

                  {notificationOpen && (
                    <div className='absolute right-0 top-full mt-2 w-72 bg-white rounded-lg shadow-xl z-50 border border-[#3c096c] overflow-hidden'>
                      <div className='bg-linear-to-r from-[#3c096c] to-[#9d4edd] px-4 py-3 text-white font-bold'>Notifications</div>
                      <div className='max-h-96 overflow-y-auto'>
                        <div className='px-4 py-3 border-b border-gray-200 hover:bg-gray-50 transition cursor-pointer'>
                          <p className='font-semibold text-[#3c096c] text-sm'>Lab Maintenance</p>
                          <p className='text-xs text-gray-600 mt-1'>Lab A will be closed on March 25-26</p>
                          <span className='text-xs text-gray-400 mt-1 inline-block'>5 minutes ago</span>
                        </div>
                        <div className='px-4 py-3 border-b border-gray-200 hover:bg-gray-50 transition cursor-pointer'>
                          <p className='font-semibold text-[#3c096c] text-sm'>Reservation Confirmed</p>
                          <p className='text-xs text-gray-600 mt-1'>Your lab reservation for today has been confirmed</p>
                          <span className='text-xs text-gray-400 mt-1 inline-block'>2 hours ago</span>
                        </div>
                        <div className='px-4 py-3 hover:bg-gray-50 transition cursor-pointer'>
                          <p className='font-semibold text-[#3c096c] text-sm'>New Announcement</p>
                          <p className='text-xs text-gray-600 mt-1'>Check the latest rules and regulations update</p>
                          <span className='text-xs text-gray-400 mt-1 inline-block'>1 day ago</span>
                        </div>
                      </div>
                      <div className='bg-gray-50 px-4 py-2 text-center border-t border-gray-200'>
                        <Link to="/student/notifications" className='text-[#3c096c] font-semibold text-sm hover:text-[#ff9100] transition'>View All</Link>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div ref={profileRef} className='relative ml-2'>
                {/* Avatar trigger */}
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
                    width: '224px',
                    background: '#140828',
                    border: '1px solid rgba(157,78,221,0.25)',
                    borderRadius: '14px',
                    overflow: 'hidden',
                    zIndex: 99,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                  }}>

                    {/* User info header */}
                    <div style={{
                      padding: '14px 16px 12px',
                      borderBottom: '1px solid rgba(157,78,221,0.15)',
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
                        {/* Online dot */}
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

                    {/* Menu items */}
                    <div style={{ padding: '6px' }}>
                      <ProfileMenuItem to="/student/profile" icon={
                        <svg viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" clipRule="evenodd"/></svg>
                      } onClick={() => setProfileOpen(false)}>Profile</ProfileMenuItem>

                      <ProfileMenuItem to="/settings" icon={
                        <svg viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M11.078 2.25c-.917 0-1.699.663-1.85 1.567L9.05 4.889c-.02.12-.115.26-.297.348a7.493 7.493 0 0 0-.986.57c-.166.115-.334.126-.45.083L6.3 5.508a1.875 1.875 0 0 0-2.282.819l-.922 1.597a1.875 1.875 0 0 0 .432 2.385l.84.692c.095.078.17.229.154.43a7.598 7.598 0 0 0 0 1.139c.015.2-.059.352-.153.43l-.841.692a1.875 1.875 0 0 0-.432 2.385l.922 1.597a1.875 1.875 0 0 0 2.282.818l1.019-.382c.115-.043.283-.031.45.082.312.214.641.405.985.57.182.088.277.228.297.35l.178 1.071c.151.904.933 1.567 1.85 1.567h1.844c.916 0 1.699-.663 1.85-1.567l.178-1.072c.02-.12.114-.26.297-.349.344-.165.673-.356.985-.57.167-.114.335-.125.45-.082l1.02.382a1.875 1.875 0 0 0 2.28-.819l.923-1.597a1.875 1.875 0 0 0-.432-2.385l-.84-.692c-.095-.078-.17-.229-.154-.43a7.614 7.614 0 0 0 0-1.139c-.016-.2.059-.352.153-.43l.84-.692c.708-.582.891-1.59.433-2.385l-.922-1.597a1.875 1.875 0 0 0-2.282-.818l-1.02.382c-.114.043-.282.031-.449-.083a7.49 7.49 0 0 0-.985-.57c-.183-.087-.277-.227-.297-.348l-.179-1.072a1.875 1.875 0 0 0-1.85-1.567h-1.843ZM12 15.75a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5Z" clipRule="evenodd"/></svg>
                      } onClick={() => setProfileOpen(false)}>Settings</ProfileMenuItem>

                      {/* Separator */}
                      <div style={{ height: '1px', background: 'rgba(157,78,221,0.12)', margin: '4px 0' }} />

                      {/* Logout — red */}
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

                    {/* Footer */}
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