import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ccsLogo from '../assets/ccsmainlogo.png';
import { authService } from '../services/authService';

export default function SignUp() {
  const navigate = useNavigate();
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState({
    idNumber: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    repeatPassword: '',
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

    // Validation
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
      if (!form[field.name]?.toString().trim()) {
        errors[field.name] = `${field.label} is required`;
      }
    });

    if (Object.keys(errors).length) {
      setFieldErrors((prev) => ({ ...prev, ...errors }));
      return;
    }

    if (form.idNumber.length !== 8) {
      setFieldErrors((prev) => ({ ...prev, idNumber: 'Student ID must be exactly 8 digits' }));
      return;
    }

    if (!/^[0-9]+$/.test(form.idNumber)) {
      setFieldErrors((prev) => ({ ...prev, idNumber: 'Student ID must contain numbers only' }));
      return;
    }

    setFieldErrors({ idNumber: '', firstName: '', lastName: '', email: '', password: '', repeatPassword: '' });

    if (form.password !== form.repeatPassword) {
      setFieldErrors((prev) => ({ ...prev, repeatPassword: 'Passwords do not match' }));
      return;
    }

    if (form.password.length < 6) {
      setFieldErrors((prev) => ({ ...prev, password: 'Password must be at least 6 characters' }));
      return;
    }

    setLoading(true);

    try {
      const response = await authService.register({
        idNumber: form.idNumber,
        firstName: form.firstName,
        lastName: form.lastName,
        middleName: form.middleName,
        email: form.email,
        password: form.password,
        course: form.course,
        courseLevel: parseInt(form.courseLevel),
        address: form.address,
      });

      setSuccess('Registration successful! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      let errorMsg = err.message || 'Registration failed. Please try again.';
      let fieldError = '';

      if (errorMsg.includes('Duplicate entry')) {
        if (errorMsg.includes("'id_number'")) {
          fieldError = 'Student ID is already exist.';
          setFieldErrors((prev) => ({ ...prev, idNumber: fieldError }));
        } else if (errorMsg.includes('email')) {
          fieldError = 'Email is already exist';
          setFieldErrors((prev) => ({ ...prev, email: fieldError }));
        }
      }

      if (!fieldError) {
        setError(errorMsg);
      } else {
        setError('');
      }
    } finally {
      setLoading(false);
    }
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
              Sit-inIT
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

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">ID Number</label>
                <input name="idNumber" type="text" value={form.idNumber} onChange={handleChange}
                  className={inputClass} placeholder="e.g. 23765142" maxLength={8} />
                {fieldErrors.idNumber && (
                  <p className="text-xs text-red-600 mt-1">{fieldErrors.idNumber}</p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Last Name</label>
                  <input name="lastName" type="text" value={form.lastName} onChange={handleChange}
                    className={inputClass} placeholder="Last name" />
                  {fieldErrors.lastName && (
                    <p className="text-xs text-red-600 mt-1">{fieldErrors.lastName}</p>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">First Name</label>
                  <input name="firstName" type="text" value={form.firstName} onChange={handleChange}
                    className={inputClass} placeholder="First name" />
                  {fieldErrors.firstName && (
                    <p className="text-xs text-red-600 mt-1">{fieldErrors.firstName}</p>
                  )}
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
                    <option value="">Select a Course</option>
                    <option value="BSN">BS Nursing</option>
                    <option value="BSM">BS Midwifery</option>
                    <option value="BSHA">BS Health Aide</option>
                    <option value="BSCC">BS Caregiver Course</option>
                    <option value="BSCS">BS Computer Science</option>
                    <option value="BSIT">BS Information Technology</option>
                    <option value="BSIM">BS Information Management</option>
                    <option value="BSCPE">BS Computer Engineering</option>
                    <option value="BSECE">BS Electronics and Communications Engineering</option>
                    <option value="BEEd">BS Elementary Education (BEEd)</option>
                    <option value="BSEd">BS Secondary Education (BSEd)</option>
                    <option value="BSCRIM">BS Criminology</option>
                    <option value="BSCOM">BS Commerce</option>
                    <option value="BSACC">BS Accountancy</option>
                    <option value="BSHRM">BS Hotel and Restaurant Management</option>
                    <option value="BSTOUR">BS Tourism</option>
                    <option value="BSCA">BS Customs Administration</option>
                    <option value="BSCSE">BS Computer Secretarial</option>
                    <option value="BSLAW">BS Law</option>
                    <option value="BSESL">BS ESL Course (for Foreign Students)</option>
                    <option value="BSCCTC">BS Call Center Training Course</option>
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
                  {fieldErrors.email && (
                    <p className="text-xs text-red-600 mt-1">{fieldErrors.email}</p>
                  )}
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
                  {fieldErrors.password && (
                    <p className="text-xs text-red-600 mt-1">{fieldErrors.password}</p>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Confirm Password</label>
                  <input name="repeatPassword" type="password" value={form.repeatPassword} onChange={handleChange}
                    className={inputClass} placeholder="••••••••" />
                  {fieldErrors.repeatPassword && (
                    <p className="text-xs text-red-600 mt-1">{fieldErrors.repeatPassword}</p>
                  )}
                </div>
              </div>


              <button type="submit" disabled={loading}
                className="w-full mt-2 py-3 rounded-xl font-bold text-white bg-[#3c096c] hover:bg-[#9d4edd] shadow-md text-sm tracking-wide disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? 'Registering...' : 'Register'}
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