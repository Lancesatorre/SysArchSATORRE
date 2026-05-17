import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Check, Calendar, Clock, Wind, Server, Monitor, Layout, CheckCircle } from 'lucide-react';
import { authService } from '../services/authService';

// ─── MAIN WIZARD COMPONENT ──────────────────────────────────────────────────────────────────
export default function ReservationWizard({ onClose, onSuccess }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [labs, setLabs] = useState([]);
  const [availablePCs, setAvailablePCs] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [studentReservations, setStudentReservations] = useState([]);

  // Modal for clicking reserved PC
  const [showReservedConfirm, setShowReservedConfirm] = useState(false);
  const [pendingPC, setPendingPC] = useState(null);
  const [selectedPCReservation, setSelectedPCReservation] = useState(null);

  const handleSelectPC = (pc, isReserved = false) => {
    setFormData(prev => ({ ...prev, pcNumber: pc.pc_number }));
    if (isReserved) {
      setSelectedPCReservation({
        reserved_date_raw: pc.reserved_date_raw,
        reserved_time_raw: pc.reserved_time_raw,
        reserved_date: pc.reserved_date,
        reserved_time: pc.reserved_time,
        reserved_by_me: pc.reserved_by_me,
        student_id_number: pc.student_id_number,
        is_session_active: pc.is_session_active,
        session_started_date: pc.session_started_date,
        session_started_time: pc.session_started_time,
        session_started_date_raw: pc.session_started_date_raw,
        session_started_time_raw: pc.session_started_time_raw,
        session_student_id_number: pc.session_student_id_number,
        all_reservations: pc.all_reservations || []
      });
    } else {
      setSelectedPCReservation(null);
    }
  };

  const [formData, setFormData] = useState({
    labId: '',
    labName: '',
    date: new Date().toLocaleDateString('en-CA'),
    startTime: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    pcNumber: '',
  });

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const [labsData, slotsData] = await Promise.all([
          authService.fetchLabAvailability(),
          authService.fetchTimeSlots()
        ]);

        setLabs(labsData || []);

        if (slotsData && slotsData.length > 0) {
          const uniqueSlots = slotsData.reduce((acc, current) => {
            const isDuplicate = acc.find(item =>
              item.slot_name.toLowerCase() === current.slot_name.toLowerCase() &&
              item.start_time === current.start_time &&
              item.end_time === current.end_time
            );
            if (!isDuplicate) acc.push(current);
            return acc;
          }, []);

          const formattedSlots = uniqueSlots.map(s => ({
            id: s.slot_name,
            label: s.slot_name.charAt(0).toUpperCase() + s.slot_name.slice(1).replace('-', ' '),
            time: `${s.start_time.substring(0, 5)} - ${s.end_time.substring(0, 5)}`
          }));
          setTimeSlots(formattedSlots);
        }

        const user = authService.getUser();
        if (user && user.id_number) {
          const resData = await authService.fetchStudentReservations(user.id_number);
          setStudentReservations(Array.isArray(resData) ? resData : []);
        }
      } catch (err) {
        setError(err.message || 'Failed to load initial data.');
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    const fetchPCs = async () => {
      if (!formData.labId || !formData.date) return;
      try {
        setLoading(true);
        setError(null);
        const pcs = await authService.fetchPCAvailability(
          formData.labId,
          formData.date,
          formData.startTime
        );

        const slicedPCs = pcs.slice(0, 50) || [];
        setAvailablePCs(slicedPCs);

        // Auto-update selectedPCReservation based on the refetched PC slots at the selected date/time
        if (formData.pcNumber) {
          const matchedPC = slicedPCs.find(pc => pc.pc_number === formData.pcNumber);
          if (matchedPC) {
            const hasConflict = matchedPC.is_reserved || matchedPC.is_reserved_slot || matchedPC.is_session_active;
            if (hasConflict) {
              setSelectedPCReservation({
                reserved_date_raw: matchedPC.reserved_date_raw,
                reserved_time_raw: matchedPC.reserved_time_raw,
                reserved_date: matchedPC.reserved_date,
                reserved_time: matchedPC.reserved_time,
                reserved_by_me: matchedPC.reserved_by_me,
                student_id_number: matchedPC.student_id_number,
                is_session_active: matchedPC.is_session_active,
                session_started_date: matchedPC.session_started_date,
                session_started_time: matchedPC.session_started_time,
                session_started_date_raw: matchedPC.session_started_date_raw,
                session_started_time_raw: matchedPC.session_started_time_raw,
                session_student_id_number: matchedPC.session_student_id_number,
                all_reservations: matchedPC.all_reservations || []
              });
            } else {
              setSelectedPCReservation(null);
            }
          }
        }

        // We do not clear pcNumber here because the step validation checks conflicts dynamically and locks the wizard.
        // This ensures the student does not lose their selected PC number when they temporarily input a conflicting slot.
      } catch (err) {
        setError(err.message || 'Failed to load PC availability.');
      } finally {
        setLoading(false);
      }
    };
    fetchPCs();
  }, [formData.labId, formData.date, formData.startTime]);

  useEffect(() => {
    setError(null);
  }, [formData.date, formData.startTime]);

  const handleNextStep = () => {
    if (step === 3) {
      if (selectedPCReservation) {
        const reservationsToCheck = (selectedPCReservation.all_reservations && selectedPCReservation.all_reservations.length > 0)
          ? selectedPCReservation.all_reservations
          : [selectedPCReservation];

        const [sYear, sMonth, sDay] = formData.date.split('-').map(Number);
        const [selHours, selMinutes] = formData.startTime.split(':').map(Number);
        const selectedDateTime = new Date(sYear, sMonth - 1, sDay, selHours, selMinutes, 0, 0);

        for (const res of reservationsToCheck) {
          const useSession = res.is_session_active && (res.session_started_date_raw || res.session_started_date) && (res.session_started_time_raw || res.session_started_time);
          const exDateRaw = useSession 
            ? res.session_started_date_raw 
            : (res.reservation_date_raw || res.reserved_date_raw || res.reservation_date);
          const exTimeRaw = useSession 
            ? res.session_started_time_raw 
            : (res.reservation_time_raw || res.reserved_time_raw || res.time_from || res.reservation_time);

          if (exDateRaw && exTimeRaw) {
            const [exYear, exMonth, exDay] = exDateRaw.split('-').map(Number);
            const [exHours, exMinutes] = exTimeRaw.split(':').map(Number);
            const existingDateTime = new Date(exYear, exMonth - 1, exDay, exHours, exMinutes, 0, 0);

            const diffMs = Math.abs(selectedDateTime.getTime() - existingDateTime.getTime());
            const diffHours = diffMs / (1000 * 60 * 60);

            if (diffHours < 3) {
              const formatTimeAMPM = (time24) => {
                if (!time24) return '12:50 AM';
                const [hoursStr, minutesStr] = time24.split(':');
                const hours = parseInt(hoursStr, 10);
                const ampm = hours >= 12 ? 'PM' : 'AM';
                const displayHours = hours % 12 || 12;
                return `${displayHours}:${minutesStr} ${ampm}`;
              };
              const conflictingTime = formatTimeAMPM(exTimeRaw);
              setError(`This PC is already reserved by another student at ${conflictingTime}. You must choose a time at least 3 hours before or after.`);
              return;
            }
          }
        }
      }

      if (studentReservations.length > 0) {
        const [sYear, sMonth, sDay] = formData.date.split('-').map(Number);
        const [selHours, selMinutes] = formData.startTime.split(':').map(Number);
        const selectedDateTime = new Date(sYear, sMonth - 1, sDay, selHours, selMinutes, 0, 0);

        for (const res of studentReservations) {
          if (res.status !== 'pending' && res.status !== 'approved') continue;

          const exDateRaw = res.reservation_date;
          const exTimeRaw = res.time_from;
          if (exDateRaw && exTimeRaw) {
            const [exYear, exMonth, exDay] = exDateRaw.split('-').map(Number);
            const [exHours, exMinutes] = exTimeRaw.split(':').map(Number);
            const existingDateTime = new Date(exYear, exMonth - 1, exDay, exHours, exMinutes, 0, 0);

            const diffMs = Math.abs(selectedDateTime.getTime() - existingDateTime.getTime());
            const diffHours = diffMs / (1000 * 60 * 60);

            if (diffHours < 3) {
              const formatTimeAMPM = (time24) => {
                if (!time24) return '12:50 AM';
                const [hoursStr, minutesStr] = time24.split(':');
                const hours = parseInt(hoursStr, 10);
                const ampm = hours >= 12 ? 'PM' : 'AM';
                const displayHours = hours % 12 || 12;
                return `${displayHours}:${minutesStr} ${ampm}`;
              };
              const conflictingTime = formatTimeAMPM(exTimeRaw);
              setError(`This PC is already reserved by another student at ${conflictingTime}. You must choose a time at least 3 hours before or after.`);
              return;
            }
          }
        }
      }
    }
    setError(null);
    setStep(s => s + 1);
  };
  const handlePrevStep = () => setStep(s => s - 1);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);
      await authService.createReservation(formData);
      onSuccess();
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    {
      title: 'Select a Laboratory',
      component: <Step1LabSelection labs={labs} formData={formData} setFormData={setFormData} onNext={handleNextStep} />,
      isValid: !!formData.labId,
    },
    {
      title: 'Choose Your PC',
      component: (
        <Step2PCSelection
          availablePCs={availablePCs}
          formData={formData}
          setFormData={setFormData}
          loading={loading}
          onShowConfirm={(pc) => { setPendingPC(pc); setShowReservedConfirm(true); }}
          onSelectPC={handleSelectPC}
        />
      ),
      isValid: !!formData.pcNumber,
    },
    {
      title: 'Set Date & Time',
      component: <Step3TimeSelection formData={formData} setFormData={setFormData} selectedPCReservation={selectedPCReservation} studentReservations={studentReservations} />,
      isValid: (() => {
        if (!formData.date || !formData.startTime) return false;
        
        const now = new Date();
        const [sYear, sMonth, sDay] = formData.date.split('-').map(Number);
        const selectedDate = new Date(sYear, sMonth - 1, sDay, 0, 0, 0, 0);
        
        const isToday = selectedDate.toDateString() === now.toDateString();
        if (isToday) {
          const [hours, minutes] = formData.startTime.split(':').map(Number);
          const selectedTime = new Date(sYear, sMonth - 1, sDay, hours, minutes, 0, 0);
          // Allow a 5-minute buffer so that default current time does not trigger immediate past error due to delay
          if (selectedTime <= new Date(now.getTime() - 5 * 60 * 1000)) return false;
        } else if (selectedDate < new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)) {
          return false;
        }

        // Disable "Next" if selectedPCReservation has a conflict
        if (selectedPCReservation) {
          const reservationsToCheck = (selectedPCReservation.all_reservations && selectedPCReservation.all_reservations.length > 0)
            ? selectedPCReservation.all_reservations
            : [selectedPCReservation];

          const [selHours, selMinutes] = formData.startTime.split(':').map(Number);
          const selectedDateTime = new Date(sYear, sMonth - 1, sDay, selHours, selMinutes, 0, 0);

          for (const res of reservationsToCheck) {
            const useSession = res.is_session_active && (res.session_started_date_raw || res.session_started_date) && (res.session_started_time_raw || res.session_started_time);
            const exDateRaw = useSession 
              ? res.session_started_date_raw 
              : (res.reservation_date_raw || res.reserved_date_raw || res.reservation_date);
            const exTimeRaw = useSession 
              ? res.session_started_time_raw 
              : (res.reservation_time_raw || res.reserved_time_raw || res.time_from || res.reservation_time);

            if (exDateRaw && exTimeRaw) {
              const [exYear, exMonth, exDay] = exDateRaw.split('-').map(Number);
              const [exHours, exMinutes] = exTimeRaw.split(':').map(Number);
              const existingDateTime = new Date(exYear, exMonth - 1, exDay, exHours, exMinutes, 0, 0);

              const diffMs = Math.abs(selectedDateTime.getTime() - existingDateTime.getTime());
              const diffHours = diffMs / (1000 * 60 * 60);
              if (diffHours < 3) return false;
            }
          }
        }

        // Disable "Next" if self reservation has a conflict
        if (studentReservations.length > 0) {
          const [selHours, selMinutes] = formData.startTime.split(':').map(Number);
          const selectedDateTime = new Date(sYear, sMonth - 1, sDay, selHours, selMinutes, 0, 0);

          for (const res of studentReservations) {
            if (res.status !== 'pending' && res.status !== 'approved') continue;

            const exDateRaw = res.reservation_date;
            const exTimeRaw = res.time_from;
            if (exDateRaw && exTimeRaw) {
              const [exYear, exMonth, exDay] = exDateRaw.split('-').map(Number);
              const [exHours, exMinutes] = exTimeRaw.split(':').map(Number);
              const existingDateTime = new Date(exYear, exMonth - 1, exDay, exHours, exMinutes, 0, 0);

              const diffMs = Math.abs(selectedDateTime.getTime() - existingDateTime.getTime());
              const diffHours = diffMs / (1000 * 60 * 60);
              if (diffHours < 3) return false;
            }
          }
        }
        
        return true;
      })(),
    },
    {
      title: 'Final Confirmation',
      component: <Step4Confirmation formData={formData} timeSlots={timeSlots} />,
      isValid: true,
    },
  ];

  return (
    <div className="fixed inset-0 bg-[#1a0030]/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className={`bg-white rounded-2xl shadow-2xl shadow-[#3c096c]/20 ${step === 1 ? 'max-w-4xl' : step === 2 ? 'max-w-5xl' : 'max-w-2xl'} w-full max-h-[90vh] flex flex-col transition-all duration-500 ease-in-out`} onClick={e => e.stopPropagation()}>

        {/* ─── Reservation Confirmation Modal ─── */}
        {showReservedConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#1a0030]/60 backdrop-blur-sm" onClick={() => setShowReservedConfirm(false)} />
            <div className="relative bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 bg-[#5a189a]/10 rounded-2xl flex items-center justify-center mb-6">
                <Clock size={32} className="text-[#5a189a]" />
              </div>
              <h3 className="text-xl font-black text-[#1a0030] mb-2">
                {pendingPC?.is_session_active ? 'Active Session' : pendingPC?.is_mine ? 'Your Reservation' : 'Already Reserved'}
              </h3>
              <p className="text-sm text-gray-500 mb-8 leading-relaxed font-medium">
                {pendingPC?.is_session_active
                  ? `PC ${pendingPC?.pc_number.replace('PC-', '')} currently has an active sitting session. Do you want to reserve another time slot for this PC?`
                  : pendingPC?.is_mine
                    ? `You already have a reservation on PC ${pendingPC?.pc_number.replace('PC-', '')}. Do you want to reserve another time slot for this PC?`
                    : `PC ${pendingPC?.pc_number.replace('PC-', '')} already has a pending or approved reservation for this day. Do you want to create another reservation for a different time?`
                }
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowReservedConfirm(false)}
                  className="flex-1 px-6 py-3 rounded-xl border-2 border-gray-100 font-black text-gray-400 hover:bg-gray-50 transition-all uppercase text-xs tracking-widest"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleSelectPC(pendingPC, true);
                    setShowReservedConfirm(false);
                  }}
                  className="flex-1 px-6 py-3 rounded-xl bg-[#3c096c] font-black text-white hover:bg-[#5a189a] transition-all shadow-lg shadow-[#3c096c]/20 uppercase text-xs tracking-widest"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="px-6 py-4 flex justify-between items-center border-b border-gray-100">
          <div>
            <h2 className="text-xl font-black text-[#1a0030] tracking-tight">{steps[step - 1].title}</h2>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Step {step} of {steps.length}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"><X size={20} /></button>
        </div>

        {/* Content */}
        <div className={`p-6 flex-1 ${step === 1 ? 'overflow-hidden' : 'overflow-y-auto'}`}>
          {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">{error}</div>}
          {steps[step - 1].component}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-100 px-6 py-4 flex justify-between items-center">
          <button onClick={onClose} className="text-sm font-bold text-gray-500 hover:text-gray-700">Cancel</button>
          <div className="flex items-center gap-3">
            {step > 1 && (
              <button onClick={handlePrevStep} className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-gray-600 bg-gray-200/80 hover:bg-gray-200 rounded-lg transition-colors">
                <ChevronLeft size={16} /> Back
              </button>
            )}
            {step < steps.length ? (
              <button onClick={handleNextStep} disabled={!steps[step - 1].isValid} className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-[#3c096c] hover:bg-[#2a064f] rounded-lg transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed">
                Next <ChevronRight size={16} />
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={loading} className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-green-500 hover:bg-green-600 rounded-lg transition-colors disabled:opacity-50">
                {loading ? 'Submitting...' : 'Confirm & Submit'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── WIZARD STEPS ─────────────────────────────────────────────────────────────────────────────

const Step1LabSelection = ({ labs, formData, setFormData, onNext }) => {
  const getLabSpecs = (labName) => {
    const name = labName.toLowerCase();
    
    const themeStyles = {
      fuchsia: {
        accent: 'text-fuchsia-600',
        bg: 'bg-fuchsia-50/5',
        border: 'border-fuchsia-100',
        hoverBorder: 'hover:border-fuchsia-400/60',
        selectedBorder: 'border-fuchsia-600 ring-2 ring-fuchsia-500/20 bg-fuchsia-50/05 shadow-lg shadow-fuchsia-500/05',
        badge: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-100',
        iconBg: 'bg-fuchsia-50 text-fuchsia-600',
        glow: 'from-fuchsia-500/05 to-transparent',
        accentText: 'text-fuchsia-600 group-hover:text-fuchsia-700',
      },
      indigo: {
        accent: 'text-indigo-600',
        bg: 'bg-indigo-50/5',
        border: 'border-indigo-100',
        hoverBorder: 'hover:border-indigo-400/60',
        selectedBorder: 'border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/05 shadow-lg shadow-indigo-500/05',
        badge: 'bg-indigo-50 text-indigo-700 border-indigo-100',
        iconBg: 'bg-indigo-50 text-indigo-600',
        glow: 'from-indigo-500/05 to-transparent',
        accentText: 'text-indigo-600 group-hover:text-indigo-700',
      },
      teal: {
        accent: 'text-teal-600',
        bg: 'bg-teal-50/5',
        border: 'border-teal-100',
        hoverBorder: 'hover:border-teal-400/60',
        selectedBorder: 'border-teal-600 ring-2 ring-teal-500/20 bg-teal-50/05 shadow-lg shadow-teal-500/05',
        badge: 'bg-teal-50 text-teal-700 border-teal-100',
        iconBg: 'bg-teal-50 text-teal-600',
        glow: 'from-teal-500/05 to-transparent',
        accentText: 'text-teal-600 group-hover:text-teal-700',
      },
      slate: {
        accent: 'text-slate-600',
        bg: 'bg-slate-50/5',
        border: 'border-slate-100',
        hoverBorder: 'hover:border-slate-400/60',
        selectedBorder: 'border-slate-600 ring-2 ring-slate-500/20 bg-slate-50/05 shadow-lg shadow-slate-500/05',
        badge: 'bg-slate-50 text-slate-700 border-slate-100',
        iconBg: 'bg-slate-50 text-slate-600',
        glow: 'from-slate-500/05 to-transparent',
        accentText: 'text-slate-600 group-hover:text-slate-700',
      }
    };

    if (name.includes('526')) {
      return {
        type: 'High-End Computing Lab',
        theme: themeStyles.fuchsia
      };
    } else if (name.includes('541')) {
      return {
        type: 'Advanced Software Lab',
        theme: themeStyles.indigo
      };
    } else if (name.includes('542') || name.includes('543')) {
      return {
        type: 'General Purpose Lab',
        theme: themeStyles.teal
      };
    }
    return {
      type: 'General Sit-in Space',
      theme: themeStyles.slate
    };
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-2">
      {labs.map(lab => {
        const isSelected = formData.labId === lab.id;
        const isInactive = lab.status !== 'active';
        const isFull = !isInactive && parseInt(lab.available_pcs) === 0;
        
        // Calculate utilization rate (how many PCs are currently occupied or reserved)
        const total = parseInt(lab.total_pcs) || 1;
        const avail = parseInt(lab.available_pcs) || 0;
        const occupied = total - avail;
        const utilizationRate = Math.round((occupied / total) * 100);
        const availableRate = 100 - utilizationRate;

        const specs = getLabSpecs(lab.lab_name);
        const theme = specs.theme;

        // Calculate discrete tactical tick markers (8 discrete columns representing seat loads)
        const filledTicks = Math.round((availableRate / 100) * 8);

        return (
          <button
            key={lab.id}
            onClick={() => {
              setFormData(f => ({ ...f, labId: lab.id, labName: lab.lab_name }));
              onNext();
            }}
            disabled={isFull || isInactive}
            className={`group relative flex flex-col text-left rounded-3xl transition-all duration-300 overflow-hidden border-[1.5px] p-5 h-[200px] justify-between
              ${isSelected
                ? 'bg-gradient-to-br from-[#3c096c] to-[#1a0030] border-[#3c096c] text-white shadow-xl shadow-[#3c096c]/25 ring-2 ring-[#3c096c] ring-offset-2 scale-[1.01]'
                : isInactive
                  ? 'border-red-100 bg-red-50/05 opacity-60 cursor-not-allowed'
                  : isFull
                    ? 'border-amber-100 bg-amber-50/05 opacity-75 cursor-not-allowed'
                    : `bg-white border-gray-150 ${theme.hoverBorder} hover:shadow-xl hover:shadow-gray-100/80 hover:-translate-y-1`
              }`}
          >
            {/* Retro-Futuristic Radar Blueprint Layer */}
            <div className={`absolute right-0 bottom-0 translate-x-12 translate-y-12 ${isSelected ? 'text-white' : theme.accent} opacity-[0.03] group-hover:opacity-[0.06] transition-all duration-700 pointer-events-none -z-10`}>
              <svg width="180" height="180" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="100" cy="100" r="85" stroke="currentColor" strokeWidth="1.5" strokeDasharray="6 6" className="animate-spin" style={{ animationDuration: '45s' }} />
                <circle cx="100" cy="100" r="60" stroke="currentColor" strokeWidth="0.75" strokeDasharray="3 3" className="animate-spin" style={{ animationDuration: '22s', animationDirection: 'reverse' }} />
                <path d="M100 5 V195 M5 100 H195" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.5" />
              </svg>
            </div>

            {/* Glowing Accent Aura Layer */}
            {!isSelected && <div className={`absolute top-0 right-0 w-36 h-36 bg-gradient-to-bl ${theme.glow} rounded-full blur-2xl pointer-events-none -z-10`} />}

            {/* Top Row / Badges */}
            <div className="flex justify-between items-start w-full">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl transition-all duration-300 group-hover:scale-105 shadow-sm
                  ${isSelected ? 'bg-white text-[#3c096c]' : `${theme.iconBg}`}`}>
                  <Server size={18} className="stroke-[2.2]" />
                </div>
                <div className="flex flex-col justify-center">
                  <h3 className={`text-lg font-black leading-none transition-colors uppercase tracking-tight flex items-center gap-1.5
                    ${isSelected ? 'text-white' : 'text-[#1a0030] group-hover:text-[#3c096c]'}`}>
                    {lab.lab_name}
                  </h3>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className={`px-2 py-0.5 rounded-md text-[0.55rem] font-black uppercase tracking-wider border
                  ${isSelected
                    ? 'bg-white/10 text-white border-white/20'
                    : isInactive 
                      ? 'bg-rose-50 text-rose-600 border-rose-100' 
                      : isFull 
                        ? 'bg-amber-50 text-amber-600 border-amber-100' 
                        : `${theme.badge}`}`}>
                  {isInactive ? 'Inactive' : isFull ? 'Full' : 'Open'}
                </span>
              </div>
            </div>

            {/* Tactical Load Cells */}
            <div className="w-full">
              <div className="flex justify-between items-center mb-1.5">
                <span className={`text-[0.55rem] font-black uppercase tracking-wider flex items-center gap-1
                  ${isSelected ? 'text-purple-200' : 'text-gray-400'}`}>
                  <Layout size={10} className={`${isSelected ? 'text-purple-300' : 'text-gray-300'}`} />
                  Seat Node Load
                </span>
                <span className={`text-[0.6rem] font-black ${isSelected ? 'text-white' : 'text-gray-700'}`}>
                  {avail} / {total} Free
                </span>
              </div>
              <div className="flex gap-0.5">
                {Array.from({ length: 8 }).map((_, i) => {
                  const isFilled = i < filledTicks;
                  return (
                    <div
                      key={i}
                      className={`h-2 flex-1 rounded-[2px] transition-all duration-300
                        ${isSelected
                          ? isFilled
                            ? 'bg-emerald-400 shadow-sm shadow-emerald-400/40'
                            : 'bg-white/10'
                          : isInactive
                            ? 'bg-gray-150'
                            : isFilled
                              ? isFull
                                ? 'bg-rose-400 shadow-sm shadow-rose-400/50'
                                : availableRate > 50
                                  ? 'bg-emerald-400 shadow-sm shadow-emerald-400/40'
                                  : 'bg-amber-400 shadow-sm shadow-amber-400/40'
                              : 'bg-gray-100'
                        }`}
                    />
                  );
                })}
              </div>
            </div>

            {/* Bottom Initialize Seat Grid Bar */}
            <div className={`w-full flex items-center justify-between border-t pt-3 mt-1.5
              ${isSelected ? 'border-white/10' : 'border-gray-100'}`}>
              <span className={`text-[0.55rem] font-bold uppercase tracking-wider
                ${isSelected ? 'text-purple-200' : 'text-gray-400'}`}>
                CCS LEVEL 5 • {utilizationRate}% UTILIZATION
              </span>
              <div className={`flex items-center gap-0.5 px-2.5 py-1 rounded-lg text-[0.55rem] font-black uppercase tracking-wider transition-all duration-300 shrink-0
                ${isSelected
                  ? 'bg-white text-[#3c096c] hover:bg-purple-50 shadow-sm opacity-100 translate-x-0'
                  : !(isFull || isInactive)
                    ? 'bg-[#3c096c] hover:bg-[#5a189a] text-white shadow-sm shadow-[#3c096c]/20 opacity-0 transform translate-x-1 group-hover:opacity-100 group-hover:translate-x-0'
                    : 'hidden opacity-0 pointer-events-none'}`}>
                Book <ChevronRight size={10} className="stroke-[3]" />
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

const Step2TimeSelection = ({ timeSlots, formData, setFormData }) => {
  const minDate = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">Date</label>
        <div className="relative">
          <Calendar size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="date"
            min={minDate}
            value={formData.date}
            onChange={e => setFormData({ ...formData, date: e.target.value, pcNumber: '' })}
            className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 font-semibold focus:outline-none focus:ring-2 focus:ring-[#3c096c]/50"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">Time Slot</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {timeSlots.map(slot => {
            const isSelected = formData.timeSlot === slot.id;
            return (
              <button
                key={slot.id}
                onClick={() => setFormData({ ...formData, timeSlot: slot.id, pcNumber: '' })}
                className={`text-left border-2 rounded-xl p-3 transition-all duration-200 ${isSelected ? 'border-[#3c096c] bg-[#3c096c]/5 ring-2 ring-[#3c096c]/20' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
              >
                <p className="font-bold text-[#1a0030]">{slot.label}</p>
                <p className="text-xs text-gray-500">{slot.time}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const Step3TimeSelection = ({ formData, setFormData, selectedPCReservation, studentReservations = [] }) => {
  const minDate = new Date().toLocaleDateString('en-CA');
  const [showAllModal, setShowAllModal] = useState(false);
  const [filterType, setFilterType] = useState('all');

  const formatTo12Hour = (time24) => {
    if (!time24) return '';
    const [hoursStr, minutesStr] = time24.split(':');
    const hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr, 10);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes < 10 ? '0' + minutes : minutes;
    return `${displayHours}:${displayMinutes} ${ampm}`;
  };

  const isConflict = (() => {
    if (!formData.date || !formData.startTime || !selectedPCReservation) return false;
    
    try {
      const reservationsToCheck = (selectedPCReservation.all_reservations && selectedPCReservation.all_reservations.length > 0)
        ? selectedPCReservation.all_reservations
        : [selectedPCReservation];

      const [sYear, sMonth, sDay] = formData.date.split('-').map(Number);
      const [selHours, selMinutes] = formData.startTime.split(':').map(Number);
      const selectedDateTime = new Date(sYear, sMonth - 1, sDay, selHours, selMinutes, 0, 0);

      for (const res of reservationsToCheck) {
        const useSession = res.is_session_active && (res.session_started_date_raw || res.session_started_date) && (res.session_started_time_raw || res.session_started_time);
        const exDateRaw = useSession 
          ? res.session_started_date_raw 
          : (res.reservation_date_raw || res.reserved_date_raw || res.reservation_date);
        const exTimeRaw = useSession 
          ? res.session_started_time_raw 
          : (res.reservation_time_raw || res.reserved_time_raw || res.time_from || res.reservation_time);

        if (!exDateRaw || !exTimeRaw) continue;

        const [exYear, exMonth, exDay] = exDateRaw.split('-').map(Number);
        const [exHours, exMinutes] = exTimeRaw.split(':').map(Number);
        const existingDateTime = new Date(exYear, exMonth - 1, exDay, exHours, exMinutes, 0, 0);

        const diffMs = Math.abs(selectedDateTime.getTime() - existingDateTime.getTime());
        const diffHours = diffMs / (1000 * 60 * 60);
        if (diffHours < 3) return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  })();

  const isPastTime = () => {
    if (!formData.date || !formData.startTime) return false;
    const now = new Date();
    const [sYear, sMonth, sDay] = formData.date.split('-').map(Number);
    const selectedDate = new Date(sYear, sMonth - 1, sDay, 0, 0, 0, 0);
    if (selectedDate.toDateString() !== now.toDateString()) return false;

    const [hours, minutes] = formData.startTime.split(':').map(Number);
    const selectedTime = new Date(sYear, sMonth - 1, sDay, hours, minutes, 0, 0);
    // Allow a 5-minute buffer so that default current time does not trigger immediate past error due to delay
    return selectedTime < new Date(now.getTime() - 5 * 60 * 1000);
  };

  const hasMultiple = selectedPCReservation && selectedPCReservation.all_reservations && selectedPCReservation.all_reservations.length >= 2;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {selectedPCReservation && (
        hasMultiple ? (
          <div className="bg-[#5a189a]/5 border border-[#5a189a]/20 rounded-2xl p-5 flex items-start gap-4 shadow-sm shadow-[#5a189a]/5">
            <div className="w-10 h-10 bg-[#5a189a]/10 rounded-xl flex items-center justify-center text-[#5a189a] shrink-0">
              <Server size={20} className="stroke-[2.5]" />
            </div>
            <div className="flex-1">
              <h4 className="font-black text-[#1a0030] text-sm mb-1 uppercase tracking-wider">Multiple Existing Bookings</h4>
              <p className="text-xs text-gray-500 leading-relaxed font-bold">
                PC {formData.pcNumber.replace('PC-', '')} has <span className="text-[#3c096c] font-black">{selectedPCReservation.all_reservations.length} scheduled reservations</span>.
                <span className="text-[0.65rem] text-[#3c096c] uppercase font-black tracking-wide block mt-1.5 flex items-center gap-1">
                  ⚠️ Note: Your new reservation must be at least 3 hours before or after ALL booked slots.
                </span>
              </p>
              <button
                type="button"
                onClick={() => setShowAllModal(true)}
                className="mt-4 px-4 py-2.5 bg-[#3c096c] hover:bg-[#5a189a] text-white text-[0.65rem] font-black rounded-xl transition-all shadow-md shadow-[#3c096c]/10 uppercase tracking-widest flex items-center gap-2"
              >
                <Clock size={12} /> View All Existing Reservations
              </button>
            </div>
          </div>
        ) : selectedPCReservation.is_session_active ? (
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 flex items-start gap-4 shadow-sm shadow-orange-50/50">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600 shrink-0">
              <Monitor size={20} className="stroke-[2.5]" />
            </div>
            <div>
              <h4 className="font-black text-orange-950 text-sm mb-1 uppercase tracking-wider">PC Active Sitting Session</h4>
              <p className="text-xs text-orange-850 leading-relaxed font-bold">
                This PC currently has an active sitting session by ID No. <span className="text-orange-950 underline">{selectedPCReservation.session_student_id_number || selectedPCReservation.student_id_number}</span>, started on <span className="text-orange-950 underline">{selectedPCReservation.session_started_date}</span> at <span className="text-orange-950 underline">{selectedPCReservation.session_started_time}</span>.
                <span className="text-[0.65rem] text-orange-700 uppercase font-black tracking-wide block mt-1.5 flex items-center gap-1">
                  ⚠️ Note: Your new reservation must be at least 3 hours before or after the session started time.
                </span>
              </p>
            </div>
          </div>
        ) : selectedPCReservation.reserved_date ? (
          selectedPCReservation.reserved_by_me ? (
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 flex items-start gap-4 shadow-sm shadow-blue-50/50">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
                <Monitor size={20} className="stroke-[2.5]" />
              </div>
              <div>
                <h4 className="font-black text-blue-900 text-sm mb-1 uppercase tracking-wider">Your Existing Reservation Details</h4>
                <p className="text-xs text-blue-700 leading-relaxed font-bold">
                  You already have a reservation on PC {formData.pcNumber.replace('PC-', '')} for <span className="text-blue-900 underline">{selectedPCReservation.reserved_date}</span> at <span className="text-blue-900 underline">{selectedPCReservation.reserved_time}</span>.
                  <span className="text-[0.65rem] text-blue-600/80 uppercase font-black tracking-wide block mt-1.5 flex items-center gap-1">
                    ⚠️ Note: Your new reservation must be at least 3 hours before or after this slot.
                  </span>
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-[#5a189a]/5 border border-[#5a189a]/20 rounded-2xl p-5 flex items-start gap-4 shadow-sm shadow-[#5a189a]/5">
              <div className="w-10 h-10 bg-[#5a189a]/10 rounded-xl flex items-center justify-center text-[#5a189a] shrink-0">
                <Monitor size={20} className="stroke-[2.5]" />
              </div>
              <div>
                <h4 className="font-black text-[#5a189a] text-sm mb-1 uppercase tracking-wider">PC Existing Reservation Details</h4>
                <p className="text-xs text-[#5a189a]/90 leading-relaxed font-bold">
                  This PC is already reserved by student ID No. <span className="text-[#5a189a] underline">{selectedPCReservation.student_id_number}</span> for <span className="text-[#5a189a] underline">{selectedPCReservation.reserved_date}</span> at <span className="text-[#5a189a] underline">{selectedPCReservation.reserved_time}</span>.
                  <span className="text-[0.65rem] text-[#5a189a]/70 uppercase font-black tracking-wide block mt-1.5 flex items-center gap-1">
                    ⚠️ Note: Your new reservation must be at least 3 hours before or after this slot.
                  </span>
                </p>
              </div>
            </div>
          )
        ) : null
      )}

      {/* Existing Reservations Modal */}
      {showAllModal && selectedPCReservation && selectedPCReservation.all_reservations && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#1a0030]/60 backdrop-blur-sm" onClick={() => setShowAllModal(false)} />
          <div className="relative bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-300 max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-black text-[#1a0030] uppercase tracking-tight">
                  PC {formData.pcNumber.replace('PC-', '')} Bookings
                </h3>
                <p className="text-[0.65rem] font-bold text-gray-400 uppercase tracking-wider">
                  Lab {formData.labName || '526'} • Existing Schedule
                </p>
              </div>
              <button
                onClick={() => setShowAllModal(false)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-1.5 py-3 border-b border-gray-100 overflow-x-auto shrink-0 scrollbar-none">
              {[
                { id: 'all', label: 'All' },
                { id: 'active', label: 'Active' },
                { id: 'mine', label: 'Mine' },
                { id: 'others', label: 'Others' }
              ].map(tab => {
                const isActive = filterType === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setFilterType(tab.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-[0.6rem] font-black uppercase tracking-wider transition-all border shrink-0
                      ${isActive 
                        ? 'bg-[#3c096c] border-[#3c096c] text-white shadow-md shadow-[#3c096c]/20' 
                        : 'bg-gray-50 border-gray-100 text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                      }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {selectedPCReservation.all_reservations.filter(res => {
                if (filterType === 'active') return res.is_session_active;
                if (filterType === 'mine') return res.reserved_by_me && !res.is_session_active;
                if (filterType === 'others') return !res.reserved_by_me && !res.is_session_active;
                return true;
              }).length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest">No bookings match this filter</p>
                </div>
              ) : (
                selectedPCReservation.all_reservations
                  .filter(res => {
                    if (filterType === 'active') return res.is_session_active;
                    if (filterType === 'mine') return res.reserved_by_me && !res.is_session_active;
                    if (filterType === 'others') return !res.reserved_by_me && !res.is_session_active;
                    return true;
                  })
                  .map((res, index) => {
                    const badgeColor = res.is_session_active 
                      ? 'bg-orange-50 text-orange-700 border-orange-200' 
                      : res.reserved_by_me 
                        ? 'bg-blue-50 text-blue-700 border-blue-200' 
                        : 'bg-purple-50 text-[#3c096c] border-[#3c096c]/20';

                    const badgeText = res.is_session_active 
                      ? 'Active Session' 
                      : res.reserved_by_me 
                        ? 'Your Booking' 
                        : 'Reserved Slot';

                    return (
                      <div 
                        key={index}
                        className={`border rounded-2xl p-4 flex items-start gap-3 transition-all
                          ${res.is_session_active 
                            ? 'border-orange-200 bg-orange-50/30' 
                            : res.reserved_by_me 
                              ? 'border-blue-200 bg-blue-50/20' 
                              : 'border-gray-100 bg-gray-50/50'
                          }`}
                      >
                        <div className={`p-2.5 rounded-xl shrink-0 ${res.is_session_active ? 'bg-orange-100 text-orange-600' : res.reserved_by_me ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                          <Monitor size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-2">
                            <span className={`text-[0.6rem] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider border ${badgeColor}`}>
                              {badgeText}
                            </span>
                          </div>
                          <p className="text-xs text-[#1a0030] font-black mt-2">
                            {res.is_session_active ? res.session_started_date : res.reservation_date}
                          </p>
                          <p className="text-xs text-gray-500 font-bold mt-1">
                            Time Slot: <span className="text-[#3c096c] font-black underline">{res.is_session_active ? res.session_started_time : res.reservation_time}</span>
                          </p>
                          <p className="text-[0.7rem] text-gray-400 font-black uppercase mt-1">
                            Student ID: <span className="text-gray-600 font-black">{res.student_id_number}</span>
                          </p>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        </div>
      )}

      {isConflict && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-2xl text-xs font-bold flex items-center gap-3 animate-pulse shadow-sm shadow-red-50/50">
          <Clock size={16} className="shrink-0" />
          <span className="uppercase tracking-wider font-black">Booking Conflict Detected</span>
        </div>
      )}

      {/* Self Scheduling Conflict Alert */}
      {(() => {
        if (!formData.date || !formData.startTime || studentReservations.length === 0) return null;

        try {
          const [sYear, sMonth, sDay] = formData.date.split('-').map(Number);
          const [selHours, selMinutes] = formData.startTime.split(':').map(Number);
          const selectedDateTime = new Date(sYear, sMonth - 1, sDay, selHours, selMinutes, 0, 0);

          for (const res of studentReservations) {
            if (res.status !== 'pending' && res.status !== 'approved') continue;

            const exDateRaw = res.reservation_date;
            const exTimeRaw = res.time_from;
            if (!exDateRaw || !exTimeRaw) continue;

            const [exYear, exMonth, exDay] = exDateRaw.split('-').map(Number);
            const [exHours, exMinutes] = exTimeRaw.split(':').map(Number);
            const existingDateTime = new Date(exYear, exMonth - 1, exDay, exHours, exMinutes, 0, 0);

            const diffMs = Math.abs(selectedDateTime.getTime() - existingDateTime.getTime());
            const diffHours = diffMs / (1000 * 60 * 60);

            if (diffHours < 3) {
              return (
                <div className="bg-amber-50 border border-amber-200 text-amber-900 px-5 py-4 rounded-2xl text-xs font-bold flex items-start gap-3 animate-pulse shadow-sm shadow-amber-50/50">
                  <Wind size={18} className="shrink-0 text-amber-600 mt-0.5" />
                  <div>
                    <h5 className="uppercase tracking-wider font-black text-amber-950 mb-0.5">Personal Scheduling Conflict</h5>
                    <p className="text-[0.7rem] font-bold text-amber-800 leading-relaxed">
                      You already have an existing reservation for <span className="font-black text-amber-950 underline">{res.pc_number}</span> in <span className="font-black text-amber-950">{res.lab_name}</span> at <span className="font-black text-amber-950 underline">{formatTo12Hour(res.time_from.substring(0, 5))}</span> on this date. You cannot book multiple PCs at the same time.
                    </p>
                  </div>
                </div>
              );
            }
          }
        } catch (e) {}
        return null;
      })()}

      {isPastTime() && (
        <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2 animate-pulse">
          <Clock size={14} /> You cannot select a time that has already passed today.
        </div>
      )}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <label className="block text-[0.65rem] font-black text-gray-400 uppercase tracking-widest mb-3">Reservation Date</label>
        <div className="relative">
          <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#3c096c]" />
          <input
            type="date"
            min={minDate}
            value={formData.date}
            onChange={e => setFormData({ ...formData, date: e.target.value })}
            className="w-full border-[0.5px] border-gray-200 rounded-xl pl-12 pr-4 py-3 font-bold text-[#1a0030] focus:outline-none focus:border-[#3c096c] transition-all"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <label className="block text-[0.65rem] font-black text-gray-400 uppercase tracking-widest mb-3">Start Time</label>
        <div className="relative">
          <Clock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-green-500" />
          <input
            type="time"
            value={formData.startTime}
            onChange={e => setFormData({ ...formData, startTime: e.target.value })}
            className="w-full border-[0.5px] border-gray-200 rounded-xl pl-12 pr-4 py-3 font-bold text-[#1a0030] focus:outline-none focus:border-[#3c096c] transition-all"
          />
        </div>
      </div>

      <p className="text-[0.65rem] text-gray-400 font-bold italic px-2 flex items-center gap-2">
        <Clock size={12} /> Please ensure your session duration follows laboratory guidelines.
      </p>
    </div>
  );
};

const Step2PCSelection = ({ availablePCs, formData, setFormData, loading, onShowConfirm, onSelectPC }) => {
  // Group PCs into chunks of 16 (which will form 2 columns of 8 each)
  const sortedPCs = [...availablePCs].sort((a, b) => {
    const numA = parseInt(a.pc_number.replace(/\D/g, '')) || 0;
    const numB = parseInt(b.pc_number.replace(/\D/g, '')) || 0;
    return numA - numB;
  });

  const blocks = [];
  for (let i = 0; i < sortedPCs.length; i += 16) {
    blocks.push(sortedPCs.slice(i, i + 16));
  }

  const handlePCClick = (pc) => {
    if (pc.is_session_active || pc.is_mine || pc.is_reserved || pc.is_reserved_slot) {
      onShowConfirm(pc);
      return;
    }
    if (pc.available) {
      onSelectPC(pc, false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#3c096c]"></div>
        </div>
      ) : availablePCs.length === 0 ? (
        <div className="text-center py-10 px-6 bg-gray-50 rounded-xl">
          <p className="font-bold text-gray-700">No PCs Available</p>
          <p className="text-sm text-gray-500 mt-1">Please try a different date or laboratory.</p>
        </div>
      ) : (
        <div className="p-1">
          <div className="flex gap-x-12 justify-center">
            {blocks.map((block, bIdx) => (
              <div
                key={bIdx}
                className="grid grid-rows-8 grid-flow-col gap-x-4 gap-y-2"
                style={{ gridTemplateRows: 'repeat(8, minmax(0, 1fr))' }}
              >
                {block.map(pc => {
                  const isSelected = formData.pcNumber === pc.pc_number;
                  const pcLabel = pc.pc_number.replace('PC-', '');
                  const isDisabled = pc.status === 'disabled';
                  const isMaintenance = pc.status === 'maintenance';
                  const isReserved = pc.is_reserved;
                  const isReservedSlot = pc.is_reserved_slot;
                  const isMine = pc.is_mine;
                  const slotStatus = pc.slot_status;
                  const isSessionActive = pc.is_session_active;

                  return (
                    <button
                      key={pc.pc_number}
                      onClick={() => handlePCClick(pc)}
                      disabled={isDisabled || isMaintenance}
                      className={`flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl transition-all duration-300 w-20 border-[0.5px]
                        ${isSelected ? 'ring-2 ring-[#9d4edd] ring-offset-2 scale-110 z-10' : ''}
                        ${isDisabled ? 'bg-red-50/30 border-red-100 text-red-200 cursor-not-allowed' :
                          isMaintenance ? 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed' :
                            isSessionActive ? 'bg-[#ff9100] text-white border-[#ff9100] hover:bg-[#e07a00] transition-all transform shadow-md shadow-[#ff9100]/20' :
                              isMine && isReservedSlot && slotStatus === 'approved' ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20' :
                                isMine && isReservedSlot && slotStatus === 'pending' ? 'bg-blue-500/10 border-blue-500/30 text-blue-600 shadow-sm' :
                                  isMine ? 'bg-blue-500/10 border-blue-500/30 text-blue-600 shadow-sm' :
                                    isReservedSlot && slotStatus === 'approved' ? 'bg-[#5a189a] text-white border-[#5a189a] hover:bg-[#3c096c] transition-all transform shadow-md shadow-[#5a189a]/20' :
                                      isReservedSlot && slotStatus === 'pending' ? 'bg-[#5a189a]/10 border-[#5a189a]/30 text-[#5a189a] hover:bg-[#5a189a]/20 shadow-sm' :
                                        isReserved ? 'bg-[#5a189a]/10 border-[#5a189a]/30 text-[#5a189a] hover:border-[#5a189a]/60 shadow-sm' :
                                          isSelected ? 'bg-[#3c096c]/10 text-[#3c096c] border-[#3c096c]' :
                                            'text-gray-600 border-gray-100 hover:bg-gray-50 hover:text-[#3c096c] hover:border-[#3c096c]/30'}`}
                    >
                      <div className="relative">
                        <Monitor
                          size={28}
                          strokeWidth={isSelected || isMine ? 2.5 : 2}
                          className={isDisabled ? 'text-red-100' :
                            isMaintenance ? 'text-gray-200' :
                              isSessionActive ? 'text-white/80' :
                                isMine && isReservedSlot && slotStatus === 'approved' ? 'text-white' :
                                  isMine ? 'text-blue-500' :
                                    isReservedSlot && slotStatus === 'approved' ? 'text-white/60' :
                                      isReserved || isReservedSlot ? 'text-[#5a189a]/40' :
                                        isSelected ? 'text-[#3c096c]' :
                                          pc.available ? 'text-gray-700' : 'text-gray-200'}
                        />
                        {isSessionActive && (
                          <div className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full border border-[#ff9100] animate-pulse" />
                        )}
                        {(isReserved || isReservedSlot) && !isMine && !isSessionActive && (
                          <div className="absolute -top-1 -right-1 w-2 h-2 bg-[#5a189a] rounded-full border border-white animate-pulse" />
                        )}
                        {isMine && !isSessionActive && (
                          <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-white" />
                        )}
                      </div>
                      <span className={`text-[0.65rem] font-black tracking-tight 
                        ${isDisabled ? 'text-red-200' :
                          isMaintenance ? 'text-gray-300' :
                            isSessionActive ? 'text-white' :
                              isMine && isReservedSlot && slotStatus === 'approved' ? 'text-white' :
                                isMine ? 'text-blue-600' :
                                  isReservedSlot && slotStatus === 'approved' ? 'text-white' :
                                    isReservedSlot && slotStatus === 'pending' ? 'text-[#5a189a]' :
                                      isReserved ? 'text-[#5a189a]' :
                                        isSelected ? 'text-[#3c096c]' : 'text-gray-500'}`}>
                        {isSessionActive ? 'ACTIVE' : isMine ? 'YOURS' : `PC ${pcLabel.padStart(2, '0')}`}
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
      <p className="mt-4 text-[0.65rem] text-gray-400 font-bold uppercase tracking-wider flex items-center gap-2">
        <Monitor size={12} /> Click on a PC to select your seat
      </p>
    </div>
  );
};

const Step4Confirmation = ({ formData }) => {
  const formatDate = (date) => new Date(date + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const formatTime = (time) => {
    if (!time) return 'N/A';
    const [h, m] = time.split(':');
    const hr = parseInt(h);
    const ampm = hr >= 12 ? 'PM' : 'AM';
    const displayHr = hr % 12 || 12;
    return `${displayHr}:${m} ${ampm}`;
  };

  return (
    <div className="space-y-3">
      <ConfirmationRow label="Lab" value={formData.labName} />
      <ConfirmationRow label="PC Number" value={formData.pcNumber} />
      <ConfirmationRow label="Reservation Date" value={formatDate(formData.date)} />
      <ConfirmationRow label="Reservation Time" value={formatTime(formData.startTime)} />
      <ConfirmationRow label="Status" value="Pending Admin Approval" highlight />
      <p className="text-xs text-gray-500 pt-4">
        You will receive a notification once your reservation is approved or declined by an administrator.
      </p>
    </div>
  );
};

const ConfirmationRow = ({ label, value, highlight = false }) => (
  <div className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0">
    <span className="text-sm text-gray-500 font-semibold">{label}</span>
    <span className={`text-sm font-bold ${highlight ? 'text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full' : 'text-[#1a0030]'}`}>
      {value}
    </span>
  </div>
);
