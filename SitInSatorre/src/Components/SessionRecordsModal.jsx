import React, { useState, useEffect } from 'react';
import { X, Clock, Server, BookOpen, ShieldAlert, Cpu, Radio, Award } from 'lucide-react';
import { authService } from '../services/authService';

export default function SessionRecordsModal({ isOpen, onClose }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [availableSessions, setAvailableSessions] = useState(30);
  const [elapsedTime, setElapsedTime] = useState({ h: '00', m: '00', s: '00' });
  const [colonVisible, setColonVisible] = useState(true);

  const fetchSessionStatus = async () => {
    if (!isOpen) return;
    try {
      setLoading(true);
      const user = authService.getUser();
      if (!user?.id_number) return;

      const response = await authService.fetchStudentCurrentSession(user.id_number);
      setActiveSession(response.active_session);
      setAvailableSessions(response.available_sessions);
      setError(null);
    } catch (err) {
      console.error('Error loading session records:', err);
      setError('Unable to load active session details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchSessionStatus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const interval = setInterval(fetchSessionStatus, 15000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Ticking stopwatch and colon pulse
  useEffect(() => {
    if (!isOpen || !activeSession?.started_at) {
      setElapsedTime({ h: '00', m: '00', s: '00' });
      return undefined;
    }

    const calculateElapsed = () => {
      const startStr = activeSession.started_at.replace(' ', 'T');
      const start = new Date(startStr);
      const now = new Date();
      const diffMs = now - start;

      if (isNaN(start.getTime()) || diffMs <= 0) {
        setElapsedTime({ h: '00', m: '00', s: '00' });
        return;
      }

      const diffSec = Math.floor(diffMs / 1000);
      const h = Math.floor(diffSec / 3600);
      const m = Math.floor((diffSec % 3600) / 60);
      const s = diffSec % 60;
      
      const pad = (num) => String(num).padStart(2, '0');
      setElapsedTime({
        h: pad(h),
        m: pad(m),
        s: pad(s)
      });
      setColonVisible((prev) => !prev);
    };

    calculateElapsed();
    const clockTimer = setInterval(calculateElapsed, 1000);
    return () => clearInterval(clockTimer);
  }, [isOpen, activeSession]);

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString.replace(' ', 'T'));
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString.replace(' ', 'T'));
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Blurred Deep Backdrop */}
      <div 
        className="absolute inset-0 bg-[#0c031a]/65 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Redesigned Premium White Lab Pass Card */}
      <div className="relative bg-white rounded-[32px] w-full max-w-md shadow-[0_25px_60px_-15px_rgba(60,9,108,0.25)] overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col border border-gray-100">
        
        {/* Sleek top glowing border bar */}
        <div className="h-2 w-full bg-linear-to-r from-[#ff9100] via-[#5a189a] to-[#3c096c]" />

        {/* Dynamic Pass Header */}
        <div className="px-6 pt-6 pb-4 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#3c096c]/05 border border-[#3c096c]/10 text-[#3c096c] flex items-center justify-center shrink-0">
              <Cpu size={15} />
            </div>
            <div>
              <p className="text-[0.55rem] font-black uppercase tracking-[0.25em] text-[#3c096c]/60">CCS PASSIVE TRACKER</p>
              <h2 className="text-sm font-black text-[#3c096c] uppercase tracking-tight mt-0.5">Active Laboratory Pass</h2>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-gray-600 flex items-center justify-center transition-all cursor-pointer border border-gray-100"
          >
            <X size={15} />
          </button>
        </div>

        {/* Content Area */}
        <div className="px-6 pb-8 flex flex-col gap-6 max-h-[75vh] overflow-y-auto bg-white">
          {loading && !activeSession ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-3 border-[#3c096c] border-t-transparent rounded-full animate-spin" />
              <p className="text-[0.62rem] font-black uppercase tracking-widest text-[#3c096c]/40">Securing Session status...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-xs font-bold text-red-700 flex items-center justify-between">
              <p>{error}</p>
              <button onClick={fetchSessionStatus} className="text-[#3c096c] underline font-black">Retry</button>
            </div>
          ) : activeSession ? (
            <div className="flex flex-col gap-6">
              
              {/* Premium Stopwatch Capsule Display */}
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 flex flex-col items-center relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-3 text-[#3c096c]/10 pointer-events-none">
                  <Radio size={48} className="animate-pulse" />
                </div>
                
                <div className="w-full flex flex-col items-center">
                  <p className="text-[0.52rem] font-black uppercase tracking-[0.25em] text-gray-400 mb-1">Time Elapsed</p>
                  
                  {/* Digital Clock layout with pulsing colons */}
                  <div className="flex items-center gap-1.5 font-mono text-4xl sm:text-5xl font-black text-[#3c096c] select-none tracking-tight">
                    <span className="bg-white px-3 py-1.5 rounded-xl border border-gray-100 shadow-xs tabular-nums">{elapsedTime.h}</span>
                    <span className={`text-[#ff9100] transition-opacity duration-300 ${colonVisible ? 'opacity-100' : 'opacity-20'}`}>:</span>
                    <span className="bg-white px-3 py-1.5 rounded-xl border border-gray-100 shadow-xs tabular-nums">{elapsedTime.m}</span>
                    <span className={`text-[#ff9100] transition-opacity duration-300 ${colonVisible ? 'opacity-100' : 'opacity-20'}`}>:</span>
                    <span className="bg-white px-3 py-1.5 rounded-xl border border-gray-100 shadow-xs tabular-nums">{elapsedTime.s}</span>
                  </div>
                </div>

                {/* Sub info grid */}
                <div className="grid grid-cols-2 gap-4 border-t border-gray-150 pt-4 w-full text-center mt-5">
                  <div>
                    <p className="text-[0.52rem] font-black uppercase tracking-widest text-gray-400 mb-0.5">Started At</p>
                    <p className="text-xs font-black text-[#3c096c]">{formatTime(activeSession.started_at)}</p>
                  </div>
                  <div>
                    <p className="text-[0.52rem] font-black uppercase tracking-widest text-gray-400 mb-0.5">Session Date</p>
                    <p className="text-xs font-black text-[#3c096c]">{formatDate(activeSession.started_at)}</p>
                  </div>
                </div>
              </div>

              {/* Lab Workspace Pod Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* PC Assignment Card */}
                <div className="bg-white border border-gray-150 rounded-2xl p-5 hover:border-[#3c096c]/30 hover:shadow-lg hover:shadow-[#3c096c]/03 transition-all duration-300 group">
                  <div className="w-8 h-8 rounded-lg bg-[#3c096c]/10 text-[#3c096c] flex items-center justify-center mb-3.5 group-hover:scale-105 transition-transform">
                    <Server size={15} />
                  </div>
                  <p className="text-[0.52rem] font-black uppercase tracking-widest text-gray-400 mb-0.5">Workstation PC</p>
                  <h4 className="text-base font-black text-[#3c096c] tracking-tight">{activeSession.pc_number || 'PC-00'}</h4>
                  <p className="text-[0.65rem] text-gray-500 font-bold mt-0.5">{activeSession.room || 'CCS Laboratory'}</p>
                </div>

                {/* Purpose Card */}
                <div className="bg-white border border-gray-150 rounded-2xl p-5 hover:border-[#ff9100]/30 hover:shadow-lg hover:shadow-[#ff9100]/03 transition-all duration-300 group">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-100 text-[#ff9100] flex items-center justify-center mb-3.5 group-hover:scale-105 transition-transform">
                    <BookOpen size={15} />
                  </div>
                  <p className="text-[0.52rem] font-black uppercase tracking-widest text-gray-400 mb-0.5">Subject Purpose</p>
                  <h4 className="text-xs font-black text-gray-700 line-clamp-2 leading-relaxed">{activeSession.purpose || 'C Programming'}</h4>
                </div>

              </div>

              {/* Session Footnotes */}
              <div className="border-t border-gray-100 pt-4.5 flex items-center justify-between text-[0.68rem] font-bold text-gray-400">
                <span className="bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">Pass ID: #{activeSession.id}</span>
                <span className="text-[#3c096c] font-black flex items-center gap-1">
                  <Award size={12} className="text-[#ff9100]" />
                  {availableSessions} sessions left
                </span>
              </div>

            </div>
          ) : (
            /* Redesigned Empty State */
            <div className="py-12 text-center flex flex-col items-center justify-center">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-[#ff9100] mb-5 shrink-0 animate-pulse">
                <ShieldAlert size={24} />
              </div>
              <h3 className="text-sm font-black text-[#3c096c] uppercase tracking-tight">No Active Session</h3>
              <p className="text-xs text-gray-500 font-medium max-w-xs mt-2 leading-relaxed">
                You are not currently checked into any laboratory workspace. Check in with the laboratory administrator or make a reservation to begin tracking elapsed time.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
