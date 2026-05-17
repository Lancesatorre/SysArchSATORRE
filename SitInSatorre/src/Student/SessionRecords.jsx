import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, CheckCircle, ShieldAlert, Server, Calendar, ArrowRight, BookOpen } from 'lucide-react';
import { authService } from '../services/authService';
import LoadingScreen from '../components/LoadingScreen';

// ─── UTILITY FUNCTIONS ────────────────────────────────────────────────────────────────────────
const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString.replace(' ', 'T'));
  return date.toLocaleDateString('en-US', { 
    weekday: 'long',
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
};

const formatTime = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString.replace(' ', 'T'));
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────────────────────
export default function SessionRecords() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [availableSessions, setAvailableSessions] = useState(30);
  const [elapsedTime, setElapsedTime] = useState('0h 0m 0s');

  const fetchSessionStatus = async () => {
    try {
      const user = authService.getUser();
      if (!user?.id_number) return;

      const response = await authService.fetchStudentCurrentSession(user.id_number);
      setActiveSession(response.active_session);
      setAvailableSessions(response.available_sessions);
      setError(null);
    } catch (err) {
      console.error('Error loading session records:', err);
      setError('Unable to load current session details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessionStatus();
    
    // Refresh check every 15 seconds to sync state
    const interval = setInterval(fetchSessionStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  // Ticking Elapsed Clock Hook
  useEffect(() => {
    if (!activeSession?.started_at) {
      setElapsedTime('0h 0m 0s');
      return undefined;
    }

    const calculateElapsed = () => {
      const startStr = activeSession.started_at.replace(' ', 'T');
      const start = new Date(startStr);
      const now = new Date();
      const diffMs = now - start;

      if (isNaN(start.getTime()) || diffMs <= 0) {
        setElapsedTime('0h 0m 0s');
        return;
      }

      const diffSec = Math.floor(diffMs / 1000);
      const h = Math.floor(diffSec / 3600);
      const m = Math.floor((diffSec % 3600) / 60);
      const s = diffSec % 60;
      setElapsedTime(`${h}h ${m}m ${s}s`);
    };

    calculateElapsed();
    const clockTimer = setInterval(calculateElapsed, 1000);
    return () => clearInterval(clockTimer);
  }, [activeSession]);

  if (loading) {
    return <LoadingScreen message="Loading session status..." />;
  }

  return (
    <div className="pt-2 sm:pt-3 pb-4 sm:pb-6 px-1 sm:px-2 bg-transparent">
      <div className="max-w-380 mx-auto w-full flex flex-col gap-4">
        
        {/* ─── Header ─── */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-[0.62rem] font-black uppercase tracking-[0.2em] text-[#3c096c]/50">Student</p>
            <h1 className="text-3xl sm:text-4xl font-black text-[#1a0030] tracking-tight">Session Records</h1>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-xs font-bold text-red-700 flex items-center justify-between">
            <p>{error}</p>
            <button onClick={fetchSessionStatus} className="text-[#3c096c] underline">Retry</button>
          </div>
        )}

        {/* ── LIVE ACTIVE SESSION VIEW ── */}
        {activeSession ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Live Ticking Counter Panel */}
            <div className="md:col-span-2 bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/03 rounded-full blur-2xl group-hover:bg-green-500/08 transition-all duration-500" />
              
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 bg-green-50 text-green-600 border border-green-200 px-3.5 py-1.5 rounded-full text-[0.65rem] font-black uppercase tracking-widest shadow-xs shadow-green-200/10">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
                  Live Checked-in
                </span>
                
                <span className="text-xs font-bold text-gray-400">
                  ID: #{activeSession.id}
                </span>
              </div>

              <div className="my-8 text-center sm:text-left">
                <p className="text-[0.62rem] font-black uppercase tracking-[0.25em] text-gray-400 mb-1">Time Elapsed</p>
                <h2 className="text-4xl sm:text-5xl font-black text-[#1a0030] tracking-tight tabular-nums select-none animate-pulse">
                  {elapsedTime}
                </h2>
              </div>

              <div className="border-t border-gray-100 pt-6 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[0.58rem] font-black uppercase tracking-widest text-gray-400 mb-1">Started At</p>
                  <p className="text-xs font-bold text-gray-700">{formatTime(activeSession.started_at)}</p>
                </div>
                <div>
                  <p className="text-[0.58rem] font-black uppercase tracking-widest text-gray-400 mb-1">Session Date</p>
                  <p className="text-xs font-bold text-gray-700">{formatDate(activeSession.started_at)}</p>
                </div>
              </div>
            </div>

            {/* Session Workstation Details Card */}
            <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col justify-between relative overflow-hidden">
              <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-[#3c096c]/03 rounded-full blur-2xl" />
              
              <div className="flex flex-col gap-6">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-[#3c096c]/08 flex items-center justify-center text-[#3c096c] mb-4">
                    <Server size={20} />
                  </div>
                  <p className="text-[0.58rem] font-black uppercase tracking-widest text-gray-400 mb-1">Workstation</p>
                  <h3 className="text-2xl font-black text-[#1a0030]">
                    {activeSession.pc_number || 'PC-00'}
                  </h3>
                  <p className="text-xs text-gray-500 font-semibold mt-1 flex items-center gap-1">
                    <Server size={12} className="text-[#3c096c]/40" />
                    {activeSession.room || 'Unspecified Lab'}
                  </p>
                </div>

                <div>
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-[#ff9100] mb-4">
                    <BookOpen size={20} />
                  </div>
                  <p className="text-[0.58rem] font-black uppercase tracking-widest text-gray-400 mb-1">Subject / Purpose</p>
                  <h3 className="text-sm font-black text-gray-800 line-clamp-2">
                    {activeSession.purpose || 'C Programming'}
                  </h3>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-6 mt-6 flex items-center justify-between">
                <div>
                  <p className="text-[0.58rem] font-black uppercase tracking-widest text-gray-400 mb-0.5">Sessions Left</p>
                  <p className="text-sm font-black text-[#3c096c]">
                    {availableSessions} <span className="text-[0.68rem] text-gray-400 font-bold">remaining</span>
                  </p>
                </div>
              </div>

            </div>

          </div>
        ) : (
          /* ── NO ACTIVE SESSION EMPTY STATE ── */
          <div className="bg-white border border-gray-100 rounded-3xl p-8 sm:p-12 shadow-xs text-center flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-24 h-24 bg-amber-500/03 rounded-full blur-2xl" />
            
            <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center text-[#ff9100] mb-6 animate-bounce">
              <ShieldAlert size={28} />
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-[#1a0030] tracking-tight uppercase">
              No Active Sit-In Session
            </h2>
            
            <p className="text-xs text-gray-500 font-medium max-w-md mt-2.5 leading-relaxed">
              You are not currently checked into any laboratory workspace. To begin a live sit-in session, check in with the laboratory administrator or reserve a computer workstation.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => navigate('/student/reservation')}
                className="flex items-center justify-center gap-2 bg-[#ff9100] hover:bg-[#e07a00] text-white px-6 py-3 rounded-xl transition-all duration-300 font-black text-xs uppercase tracking-widest shadow-lg shadow-[#ff9100]/25 hover:scale-105 active:scale-95"
              >
                Reserve Workstation <ArrowRight size={14} />
              </button>
              
              <button
                onClick={() => navigate('/student/history')}
                className="flex items-center justify-center gap-2 border border-gray-200 hover:border-[#3c096c] hover:bg-gray-50 text-gray-600 hover:text-[#3c096c] px-6 py-3 rounded-xl transition-all duration-300 font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95"
              >
                View History Logs
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
