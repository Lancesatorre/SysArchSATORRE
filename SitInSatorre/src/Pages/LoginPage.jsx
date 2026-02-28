import React from 'react'
import { Link } from 'react-router-dom';
import ccsLogo from '../assets/ccsmainlogo.png';

export default function LoginPage() {
  return (
    <div className='min-h-screen bg-gradient-to-br flex flex-row-2  from-gray-400 to-white'>
    
    <div className=' bg-gradient-to-br flex flex-row-2 rounded-r-full shadow-[10px_0px_15px_-5px_rgba(0,0,0,0.3)] tracking-widest items-center justify-start from-[#ff9e00] to-[#3c096c] min-h-screen w-[60%] pl-35 pr-20'>
    <div className='flex justify-center items-center gap-10'>
       
      <img src={ccsLogo} alt="" className='rounded-[10vh] h-[35vh] w-[35vh] shadow-xl border-2 border-[#240046]'/> 

      <div className='flex flex-col gap-2'>

        <span className='text-white text-6xl font-black tracking-widest drop-shadow-lg'>SitInit</span>
      <span className='text-2xl text-[#ff8500] font-bold'>College of Computer Studies Sit-in <br /> Monitoring System</span>
      </div>

       </div>

    </div>
    <div className='flex justify-center items-center flex-col w-[40%]'>
      <div className='min-h-auto w-[40vh] bg-white flex justify-start items-center rounded-3xl shadow-xl p-10 flex-col'>
        <h1 className='text-2xl text-[#3c096c] tracking-wider font-bold mb-5'>LOGIN</h1>
        <hr className='w-full border-t border-[#3c096c]'/>
        
        <div className='flex flex-col gap-1 w-[35vh] mt-10 '>
            <label htmlFor="" className='text-sm'>ID Number: </label>
            <input
                    name="username"
                    type="username"
                    className="w-full border border-gray-200  rounded-lg px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#9d4edd] focus:bg-white transition"
                    placeholder="Enter a valid id number"
                  />

            <label htmlFor="" className='mt-3 text-sm'>Password: </label>
            <input
                    name="password"
                    type="password"
                    className="w-full border border-gray-200  rounded-lg px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#9d4edd] focus:bg-white transition"
                    placeholder="••••••••"
                  />
            <Link 
                to="/" 
                className='text-sm text-[#3c096c] hover:underline cursor-pointer'
              >
                Forgot password?
              </Link>
            <button className='bg-[#3c096c] text-white px-3 py-2 rounded-xl font-bold hover:bg-[#9d4edd] transition duration-300 mt-7'>Login</button>
        
            <span className='text-sm text-center mt-3 text-gray-600'>Don't have an account? <Link className='font-semibold hover:underline cursor-pointer text-[#3c096c]'to="/signup" >Register</Link>  </span>        
          </div>
      </div>
    </div>
        
    </div>
  )
}
