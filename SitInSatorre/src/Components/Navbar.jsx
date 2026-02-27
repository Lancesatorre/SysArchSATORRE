import React from 'react'
import { Link } from 'react-router-dom' // 1. Import Link

export default function Navbar() {
  return (
    <nav className='min-h-[5vh] mx-50 bg-[#0F2854] flex justify-between shadow-xl items-center rounded-3xl px-10 mb-5'>
        <h1 className='font-bold text-lg text-white tracking-wider'>
          <Link to="/">SitInit</Link> {/* Good practice to link the logo to home */}
        </h1>

        <div className='flex gap-4 justify-center items-center'>
            {/* 2. Change button to Link and add the 'to' prop */}
            <Link 
              to="/login" 
              className='text-white px-4 py-2'
            >
              Login
            </Link>

            <Link 
              to="/signup" 
              className='bg-white text-[#0F2854] px-3 py-1 rounded-full font-bold hover:bg-gray-100 transition duration-300'
            >
              Sign Up
            </Link>
        </div>
    </nav>
  )
}