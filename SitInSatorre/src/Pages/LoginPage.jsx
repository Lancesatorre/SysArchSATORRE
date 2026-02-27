import React from 'react'
import { Link } from 'react-router-dom';

export default function LoginPage() {
  return (
    <div className='min-h-screen bg-gradient-to-br flex flex-row-2  from-gray-400 to-white'>
    
    <div className=' bg-gradient-to-br flex flex-row-2 rounded-r-full shadow-[10px_0px_15px_-5px_rgba(0,0,0,0.1)] tracking-widest items-center justify-center from-white to-[#0F2854] min-h-screen w-[60%] '>
        <h1 className='text-9xl'>SitInit</h1>

    </div>
    <div className='flex justify-center items-center flex-col w-[40%]'>
      <div className='min-h-auto w-[35vh] bg-white flex justify-start items-center rounded-3xl shadow-xl p-10 flex-col'>
        <h1 className='text-2xl tracking-wider font-bold mb-5'>LOGIN</h1>
        <hr className='w-full border-t border-gray-300'/>
        
        <div className='flex flex-col gap-1 w-[30vh] mt-10'>
            <label htmlFor="">Email: </label>
            <input
                    name="email"
                    type="email"
                    className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="you@example.com"
                  />

            <label htmlFor="" className='mt-3'>Password: </label>
            <input
                    name="password"
                    type="password"
                    className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="••••••••"
                  />
            <Link 
                to="/" 
                className='text-sm text-blue-500 hover:underline cursor-pointer'
              >
                Forgot password?
              </Link>
            <button className='bg-[#0F2854] text-white px-3 py-2 rounded-xl font-bold hover:bg-[#4988C4] transition duration-300 mt-5'>Login</button>
        </div>
      </div>
    </div>
        
    </div>
  )
}
