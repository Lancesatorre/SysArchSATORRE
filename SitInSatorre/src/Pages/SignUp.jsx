import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import ccsLogo from '../assets/ccsmainlogo.png';

export default function SignUp() {
  const [form, setForm] = useState({
    idNumber: '',
    lastName: '',
    firstName: '',
    middleName: '',
    courseLevel: '1',
    password: '',
    repeatPassword: '',
    email: '',
    course: 'BSIT',
    address: '',
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(form);
  };

  const inputClass =
    'w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#9d4edd] focus:bg-white transition';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-400 to-white flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-2xl">

        <div className="flex items-center gap-4 mb-8">
          <img src={ccsLogo} alt="CCS Logo" className="h-14 w-14 rounded-xl shadow-md border border-[#240046]" />
          <div>
            <h1 className="tracking-wider text-2xl font-black text-[#3c096c]  leading-tight">
              SitInit
            </h1>
            <p className="text-sm text-gray-700 tracking-wide">College of Computer Studies Sit-in Monitoring System</p>
          </div>
        </div>

       
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">

  
          <div className="h-2 w-full bg-[#3c096c]" />

          <div className="p-8">
            <div className="mb-6">
              <h2 className="text-3xl font-black text-gray-800 tracking-tight">Create Account</h2>
              <p className="text-sm text-gray-400 mt-1">Fill in the details below to register</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">ID Number</label>
                <input name="idNumber" type="text" value={form.idNumber} onChange={handleChange}
                  className={inputClass} placeholder="e.g. 23765142" />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Last Name</label>
                  <input name="lastName" type="text" value={form.lastName} onChange={handleChange}
                    className={inputClass} placeholder="Last name" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">First Name</label>
                  <input name="firstName" type="text" value={form.firstName} onChange={handleChange}
                    className={inputClass} placeholder="First name" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Middle Name</label>
                  <input name="middleName" type="text" value={form.middleName} onChange={handleChange}
                    className={inputClass} placeholder="Middle name" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Course</label>
                  <select name="course" value={form.course} onChange={handleChange}
                    className={inputClass + ' bg-gray-50'}>
                    <option value="BSIT">BSIT</option>
                    <option value="BSCS">BSCS</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Year Level</label>
                  <input name="courseLevel" type="number" min="1" max="5" value={form.courseLevel} onChange={handleChange}
                    className={inputClass} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</label>
                  <input name="email" type="email" value={form.email} onChange={handleChange}
                    className={inputClass} placeholder="you@example.com" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Address</label>
                  <input name="address" type="text" value={form.address} onChange={handleChange}
                    className={inputClass} placeholder="City, Province" />
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
                    className={inputClass} placeholder="••••••••" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Confirm Password</label>
                  <input name="repeatPassword" type="password" value={form.repeatPassword} onChange={handleChange}
                    className={inputClass} placeholder="••••••••" />
                </div>
              </div>


              <button type="submit"
                className="w-full mt-2 py-3 rounded-xl font-bold text-white bg-[#3c096c] hover:bg-[#9d4edd] shadow-md text-sm tracking-wide ">
                Register
              </button>

              <p className="text-center text-sm text-gray-500">
                Already have an account?{' '}
                <Link to="/login" className="text-[#3c096c] font-bold hover:underline">
                  Login
                </Link>
              </p>

            </form>
          </div>
        </div>
      </div>
    </div>
  );
}