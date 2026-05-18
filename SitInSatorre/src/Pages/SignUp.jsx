import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ccsLogo from '../assets/ccsmainlogo.png';
import { authService } from '../services/authService';
import LoadingScreen from '../Components/LoadingScreen';

export default function SignUp() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    idNumber: '', lastName: '', firstName: '', middleName: '',
    courseLevel: '1', password: '', repeatPassword: '',
    email: '', course: 'BSIT', address: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState({
    idNumber: '', firstName: '', lastName: '', email: '', password: '', repeatPassword: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'idNumber' && value && !/^\d+$/.test(value)) {
      setFieldErrors((prev) => ({ ...prev, idNumber: 'Student ID must contain numbers only' }));
      return;
    }
    setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    setForm({ ...form, [name]: value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const requiredFields = [
      { name: 'idNumber', label: 'Student ID' },
      { name: 'firstName', label: 'First Name' },
      { name: 'lastName', label: 'Last Name' },
      { name: 'email', label: 'Email' },
      { name: 'password', label: 'Password' },
      { name: 'repeatPassword', label: 'Confirm Password' },
    ];

    const errors = {};
    requiredFields.forEach((field) => {
      if (!form[field.name]?.toString().trim()) errors[field.name] = `${field.label} is required`;
    });
    if (Object.keys(errors).length) { setFieldErrors((prev) => ({ ...prev, ...errors })); return; }
    if (form.idNumber.length !== 8) { setFieldErrors((prev) => ({ ...prev, idNumber: 'Student ID must be exactly 8 digits' })); return; }
    if (!/^[0-9]+$/.test(form.idNumber)) { setFieldErrors((prev) => ({ ...prev, idNumber: 'Student ID must contain numbers only' })); return; }
    setFieldErrors({ idNumber: '', firstName: '', lastName: '', email: '', password: '', repeatPassword: '' });
    if (form.password !== form.repeatPassword) { setFieldErrors((prev) => ({ ...prev, repeatPassword: 'Passwords do not match' })); return; }
    if (form.password.length < 6) { setFieldErrors((prev) => ({ ...prev, password: 'Password must be at least 6 characters' })); return; }

    setLoading(true);
    try {
      await authService.register({
        idNumber: form.idNumber, firstName: form.firstName, lastName: form.lastName,
        middleName: form.middleName, email: form.email, password: form.password,
        course: form.course, courseLevel: parseInt(form.courseLevel), address: form.address,
      });
      setSuccess('Registration successful! Redirecting to login...');
      await new Promise((resolve) => setTimeout(resolve, 2000));
      navigate('/login');
    } catch (err) {
      let errorMsg = err.message || 'Registration failed. Please try again.';
      let fieldError = '';
      if (errorMsg.includes('Duplicate entry')) {
        if (errorMsg.includes("'id_number'")) { fieldError = 'Student ID already exists.'; setFieldErrors((prev) => ({ ...prev, idNumber: fieldError })); }
        else if (errorMsg.includes('email')) { fieldError = 'Email already exists.'; setFieldErrors((prev) => ({ ...prev, email: fieldError })); }
      }
      if (!fieldError) setError(errorMsg);
      else setError('');
      setLoading(false);
    }
  };

  const baseInputClass = 'w-full bg-gray-50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 transition';

  const getInputClass = (fieldName) => {
    const hasError = fieldErrors[fieldName];
    const borderClass = hasError
      ? 'border-2 border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 text-red-900 bg-red-50/30'
      : 'border border-gray-200 focus:border-[#3c096c] focus:ring-2 focus:ring-[#3c096c]/20';
    return `${baseInputClass} ${borderClass} focus:bg-white`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-400 to-white flex items-center justify-center py-10 px-4 relative">
      {loading && (
        <div className="fixed inset-0 bg-white/75 backdrop-blur-md z-50 flex items-center justify-center animate-fade-in">
          <LoadingScreen message="Creating your account..." />
        </div>
      )}
      <div className="w-full max-w-2xl animate-page-entrance">

        {/* Header row with back button */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <img src={ccsLogo} alt="CCS Logo" className="h-14 w-14 rounded-xl shadow-md border border-[#240046]" />
            <div>
              <h1 className="tracking-wider text-2xl font-black text-[#3c096c] leading-tight">Sit-inIT</h1>
              <p className="text-sm text-gray-700 tracking-wide">College of Computer Studies Sit-in Monitoring System</p>
            </div>
          </div>

          {/* ← Back to Home button */}
          <Link
            to="/"
            className="flex items-center gap-2 text-sm font-semibold text-[#3c096c] border-2 border-[#3c096c]/25 px-4 py-2 rounded-full hover:border-[#3c096c] hover:bg-[#3c096c]/5  transition duration-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </Link>
        </div>

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="h-2 w-full bg-[#3c096c]" />

          <div className="p-8">
            <div className="mb-6">
              <h2 className="text-3xl font-black text-gray-800 tracking-tight">Create Account</h2>
              <p className="text-sm text-gray-400 mt-1">Fill in the details below to register</p>
            </div>

            {error && <span className="block text-xs font-bold mb-4 animate-fadeIn" style={{ color: '#ef4444' }}>{error}</span>}
            {success && <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 mb-4">{success}</div>}

            <form onSubmit={handleSubmit} className="space-y-5">

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">ID Number</label>
                <input name="idNumber" type="text" value={form.idNumber} onChange={handleChange}
                  className={getInputClass('idNumber')} placeholder="e.g. 23765142" maxLength={8} />
                {fieldErrors.idNumber && <span className="block text-xs mt-1 animate-fadeIn" style={{ color: '#ef4444' }}>{fieldErrors.idNumber}</span>}
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[['lastName', 'Last Name', 'Last name'], ['firstName', 'First Name', 'First name'], ['middleName', 'Middle Name', 'Middle name']].map(([name, label, placeholder]) => (
                  <div key={name} className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</label>
                    <input name={name} type="text" value={form[name]} onChange={handleChange}
                      className={getInputClass(name)} placeholder={placeholder} />
                    {fieldErrors[name] && <span className="block text-xs mt-1 animate-fadeIn" style={{ color: '#ef4444' }}>{fieldErrors[name]}</span>}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Course</label>
                  <select name="course" value={form.course} onChange={handleChange} className={getInputClass('course')}>
                    <option value="">Select a Course</option>
                    {[['BSN', 'BS Nursing'], ['BSM', 'BS Midwifery'], ['BSCS', 'BS Computer Science'], ['BSIT', 'BS Information Technology'],
                    ['BSIM', 'BS Information Management'], ['BSCPE', 'BS Computer Engineering'], ['BSECE', 'BS Electronics and Communications Engineering'],
                    ['BEEd', 'BS Elementary Education'], ['BSEd', 'BS Secondary Education'], ['BSCRIM', 'BS Criminology'],
                    ['BSCOM', 'BS Commerce'], ['BSACC', 'BS Accountancy'], ['BSHRM', 'BS Hotel and Restaurant Management'],
                    ['BSTOUR', 'BS Tourism'], ['BSCA', 'BS Customs Administration'], ['BSLAW', 'BS Law']].map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Year Level</label>
                  <input name="courseLevel" type="number" min="1" max="5" value={form.courseLevel}
                    onChange={handleChange} className={getInputClass('courseLevel')} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</label>
                  <input name="email" type="email" value={form.email} onChange={handleChange}
                    className={getInputClass('email')} placeholder="you@example.com" />
                  {fieldErrors.email && <span className="block text-xs mt-1 animate-fadeIn" style={{ color: '#ef4444' }}>{fieldErrors.email}</span>}
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Address</label>
                  <input name="address" type="text" value={form.address} onChange={handleChange}
                    className={getInputClass('address')} placeholder="City, Province" />
                </div>
              </div>

              <div className="flex items-center gap-3 py-1">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400 font-medium uppercase tracking-widest">Security</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Password</label>
                  <input name="password" type="password" value={form.password} onChange={handleChange}
                    className={getInputClass('password')} placeholder="••••••••" />
                  {fieldErrors.password && <span className="block text-xs mt-1 animate-fadeIn" style={{ color: '#ef4444' }}>{fieldErrors.password}</span>}
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Confirm Password</label>
                  <input name="repeatPassword" type="password" value={form.repeatPassword} onChange={handleChange}
                    className={getInputClass('repeatPassword')} placeholder="••••••••" />
                  {fieldErrors.repeatPassword && <span className="block text-xs mt-1 animate-fadeIn" style={{ color: '#ef4444' }}>{fieldErrors.repeatPassword}</span>}
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full mt-2 py-3 rounded-xl font-bold text-white bg-[#3c096c] hover:bg-[#9d4edd] shadow-md text-sm tracking-wide disabled:opacity-50 disabled:cursor-not-allowed transition duration-300">
                {loading ? 'Registering...' : 'Register'}
              </button>

              <p className="text-center text-sm text-gray-500">
                Already have an account?{' '}
                <Link to="/login" className="text-[#3c096c] font-bold hover:underline">Login</Link>
              </p>

            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
