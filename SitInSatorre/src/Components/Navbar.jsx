import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom' 
import ccsLogo from '../assets/ccsmainlogo.png';
import { authService } from '../services/authService';
import LoadingOverlay from './LoadingOverlay';

export default function Navbar() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    setIsLoggedIn(authService.isLoggedIn());
    if (authService.isLoggedIn()) {
      setUser(authService.getUser());
    }
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
  const displayName = user?.role === 'admin' ? 'ADMIN' : (user?.first_name || 'Profile');

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
                    <Link to="/community/forums" className='block px-4 py-3 text-[#3c096c] font-medium hover:bg-[#3c096c] hover:text-white transition duration-300'>
                        Forums
                    </Link>
                    <Link to="/community/events" className='block px-4 py-3 text-[#3c096c] font-medium hover:bg-[#3c096c] hover:text-white transition duration-300'>
                        Events
                    </Link>
                    <Link to="/community/members" className='block px-4 py-3 text-[#3c096c] font-medium hover:bg-[#3c096c] hover:text-white transition duration-300'>
                        Members
                    </Link>
                </div>
            </div>
        </div>
              </>
            ) : (
              <>
                <div className='text-white flex justify-center items-center gap-8'>
                  {/* Home Link */}
                  <Link to="/student/dashboard" className='hover:text-[#ff9100] transition duration-300'>
                    Home
                  </Link>

                  {/* History Link */}
                  <Link to="/student/history" className='hover:text-[#ff9100] transition duration-300'>
                    History
                  </Link>

                  {/* Reservation Link */}
                  <Link to="/student/reservation" className='hover:text-[#ff9100] transition duration-300'>
                    Reservation
                  </Link>

                  {/* Notification Dropdown */}
                  <div className='relative'>
                    <button 
                      onClick={() => setNotificationOpen(!notificationOpen)}
                      className='hover:text-[#ff9100] transition duration-300 flex items-center gap-2 relative'
                    >
                      Notifications
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${notificationOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                      {/* Notification badge */}
                      <span className='absolute -top-3 -right-3 w-5 h-5 bg-[#ff9100] text-white text-xs font-bold rounded-full flex items-center justify-center'>3</span>
                    </button>

                    {/* Notification Dropdown Menu */}
                    {notificationOpen && (
                      <div className='absolute right-0 top-full mt-2 w-72 bg-white rounded-lg shadow-xl z-50 border border-[#3c096c] overflow-hidden'>
                        <div className='bg-linear-to-r from-[#3c096c] to-[#9d4edd] px-4 py-3 text-white font-bold'>
                          Notifications
                        </div>
                        <div className='max-h-96 overflow-y-auto'>
                          {/* Notification 1 */}
                          <div className='px-4 py-3 border-b border-gray-200 hover:bg-gray-50 transition cursor-pointer'>
                            <p className='font-semibold text-[#3c096c] text-sm'>Lab Maintenance</p>
                            <p className='text-xs text-gray-600 mt-1'>Lab A will be closed on March 25-26</p>
                            <span className='text-xs text-gray-400 mt-1 inline-block'>5 minutes ago</span>
                          </div>

                          {/* Notification 2 */}
                          <div className='px-4 py-3 border-b border-gray-200 hover:bg-gray-50 transition cursor-pointer'>
                            <p className='font-semibold text-[#3c096c] text-sm'>Reservation Confirmed</p>
                            <p className='text-xs text-gray-600 mt-1'>Your lab reservation for today has been confirmed</p>
                            <span className='text-xs text-gray-400 mt-1 inline-block'>2 hours ago</span>
                          </div>

                          {/* Notification 3 */}
                          <div className='px-4 py-3 hover:bg-gray-50 transition cursor-pointer'>
                            <p className='font-semibold text-[#3c096c] text-sm'>New Announcement</p>
                            <p className='text-xs text-gray-600 mt-1'>Check the latest rules and regulations update</p>
                            <span className='text-xs text-gray-400 mt-1 inline-block'>1 day ago</span>
                          </div>
                        </div>
                        <div className='bg-gray-50 px-4 py-2 text-center border-t border-gray-200'>
                          <Link to="/student/notifications" className='text-[#3c096c] font-semibold text-sm hover:text-[#ff9100] transition'>
                            View All
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* User Profile Dropdown */}
                <div className='relative group py-4'>
                  <span className='cursor-pointer text-white hover:text-[#ff9100] transition duration-300 flex items-center gap-2'>
                    {displayName}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>

                  <div className='absolute right-0 top-full mt-0 hidden w-40 bg-white rounded-md shadow-lg group-hover:block z-50 overflow-hidden border border-[#3c096c]'>
                    <Link to="/student/profile" className='block px-4 py-3 text-[#3c096c] font-medium hover:bg-[#3c096c] hover:text-white transition duration-300'>
                      Profile
                    </Link>
                    <Link to="/settings" className='block px-4 py-3 text-[#3c096c] font-medium hover:bg-[#3c096c] hover:text-white transition duration-300'>
                      Settings
                    </Link>
                    <button onClick={handleLogout} className='w-full text-left px-4 py-3 text-[#3c096c] font-medium hover:bg-[#3c096c] hover:text-white transition duration-300'>
                      Logout
                    </button>
                  </div>
                </div>
              </>
            )}
        </div>
    </nav>
    </>
  )
}