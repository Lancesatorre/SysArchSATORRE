import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom' 
import ccsLogo from '../assets/ccsmainlogo.png';
import { authService } from '../services/authService';

export default function Navbar() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if user is logged in
    setIsLoggedIn(authService.isLoggedIn());
    if (authService.isLoggedIn()) {
      setUser(authService.getUser());
    }
  }, []);

  const handleLogout = () => {
    authService.logout();
    setIsLoggedIn(false);
    setUser(null);
    navigate('/login');
  };
  const displayName = user?.role === 'admin' ? 'ADMIN' : (user?.first_name || 'Profile');

  return (
    <nav className='min-h-[5vh] mx-50 bg-[#3c096c] flex justify-between shadow-2xl items-center rounded-4xl px-10 mb-5 border border-gray-900'>
        <div className='flex items-center justify-center flex-row gap-3'>
            <img src={ccsLogo} alt="CCS Logo" className='rounded-md h-8 w-8 border border-[#240046]'/>
            <h1 className='font-bold text-lg text-white tracking-wider'>
              <Link to="/" className='text-white hover:text-[#ff9100] transition duration-300'>Sit-inIT</Link> 
            </h1>
        </div>

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

        <div className='flex gap-4 justify-center items-center'>
            {!isLoggedIn ? (
              <>
                <Link 
                  to="/login" 
                  className='text-white px-4 py-2 hover:text-[#ff9100] transition duration-300'
                >
                  Login
                </Link>

                <Link 
                  to="/signup" 
                  className='bg-[#ff9100] text-[#3c096c] px-3 py-1 rounded-full font-bold hover:bg-gray-100 transition duration-300'
                >
                  Sign Up
                </Link>
              </>
            ) : (
              <>
                <div className='relative group py-4'>
                  <span className='cursor-pointer text-white hover:text-[#ff9100] transition duration-300 flex items-center gap-2'>
                    {displayName}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>

                  <div className='absolute right-0 top-full mt-0 hidden w-40 bg-white rounded-md shadow-lg group-hover:block z-50 overflow-hidden border border-[#3c096c]'>
                    <Link to="/profile" className='block px-4 py-3 text-[#3c096c] font-medium hover:bg-[#3c096c] hover:text-white transition duration-300'>
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
  )
}