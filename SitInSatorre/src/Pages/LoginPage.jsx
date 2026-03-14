import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom';
import ccsLogo from '../assets/ccsmainlogo.png';
import { authService } from '../services/authService';

export default function LoginPage() {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({
    idNumber: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [highlightAllFields, setHighlightAllFields] = useState(false);

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
    setError('');
    setPasswordError('');
    setHighlightAllFields(false);
  };

  const baseInputClass =
    'w-full rounded-lg px-3 py-3 text-sm focus:outline-none focus:ring-2 transition';

  const getInputClass = (field) => {
    const hasError = highlightAllFields || (field === 'password' && passwordError);
    const colorClasses = hasError
      ? 'border border-red-500 focus:border-red-500 focus:ring-red-500'
      : 'border border-gray-200 focus:border-[#9d4edd] focus:ring-[#9d4edd]';
    return `${baseInputClass} ${colorClasses}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!credentials.idNumber || !credentials.password) {
      setError('ID number and password are required');
      return;
    }

    setPasswordError('');
    setHighlightAllFields(false);
    setLoading(true);

    try {
      const response = await authService.login(credentials);
      setPasswordError('');
      setHighlightAllFields(false);
      // Redirect to dashboard or home page
      navigate('/');
    } catch (err) {
      const errorMsg = err.message || 'Login failed. Please try again.';
      if (errorMsg.includes('Invalid password')) {
        setPasswordError(errorMsg);
        setHighlightAllFields(false);
        setError('');
      } else if (errorMsg.includes('User not found')) {
        setPasswordError('Student ID does not exist');
        setHighlightAllFields(true);
        setError('');
      } else {
        setError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen bg-linear-to-br flex flex-row-2 from-gray-400 to-white'>
      
      <div className='bg-linear-to-br flex flex-row-2 rounded-r-full shadow-[10px_0px_15px_-5px_rgba(0,0,0,0.3)] tracking-widest items-center justify-start from-[#ff9e00] to-[#3c096c] min-h-screen w-[60%] pl-35 pr-20'>
        <div className='flex justify-center items-center gap-10'>
          <img src={ccsLogo} alt="CCS Logo" className='rounded-[10vh] h-[35vh] w-[35vh] shadow-xl border-2 border-[#240046]'/> 

          <div className='flex flex-col gap-2'>
            <span className='text-white text-6xl font-black tracking-widest drop-shadow-lg'>Sit-inIT</span>
            <span className='text-2xl text-[#ff8500] font-bold'>College of Computer Studies Sit-in <br /> Monitoring System</span>
          </div>
        </div>
      </div>

      <div className='flex justify-center items-center flex-col w-[40%]'>
        <div className='min-h-auto w-[40vh] bg-white flex justify-start items-center rounded-3xl shadow-xl p-10 flex-col'>
          <h1 className='text-2xl text-[#3c096c] tracking-wider font-bold mb-5'>LOGIN</h1>
          <hr className='w-full border-t border-[#3c096c]'/>
          
          {error && (
            <div className="w-[35vh] mt-5 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className='flex flex-col gap-1 w-[35vh] mt-10'>
            <label htmlFor="idNumber" className='text-sm'>Student ID: </label>
            <input
              id="idNumber"
              name="idNumber"
              type="text"
              value={credentials.idNumber}
              onChange={handleChange}
              className={getInputClass('idNumber')}
              placeholder="Enter your student ID"
            />

            <label htmlFor="password" className='mt-3 text-sm'>Password: </label>
            <input
              id="password"
              name="password"
              type="password"
              value={credentials.password}
              onChange={handleChange}
              className={getInputClass('password')}
              placeholder="••••••••"
            />
            {passwordError && (
              <p className="text-xs text-red-600 mt-1">{passwordError}</p>
            )}
            <Link 
              to="/" 
              className='text-sm text-[#3c096c] hover:underline cursor-pointer'
            >
              Forgot password?
            </Link>
            <button type="submit" disabled={loading} className='bg-[#3c096c] text-white px-3 py-2 rounded-xl font-bold hover:bg-[#9d4edd] transition duration-300 mt-7 disabled:opacity-50 disabled:cursor-not-allowed'>
              {loading ? 'Logging in...' : 'Login'}
            </button>
        
            <span className='text-sm text-center mt-3 text-gray-600'>Don't have an account? <Link className='font-semibold hover:underline cursor-pointer text-[#3c096c]' to="/signup">Register</Link></span>        
          </form>
        </div>
      </div>
    </div>
  )
}
