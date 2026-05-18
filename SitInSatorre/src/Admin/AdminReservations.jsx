import React, { useEffect, useState, useCallback } from 'react';

import ReactDOM from 'react-dom';



import { useNavigate } from 'react-router-dom';



import { toast } from 'react-toastify';



import { authService } from '../services/authService';



import LoadingScreen from '../components/LoadingScreen';



import {



  CheckCircle,



  XCircle,



  Monitor,



  History,



  Clock,



  Search,



  Layout,



  Calendar,



  AlertCircle,



  MoreVertical,



  Check,



  X,



  ChevronRight,



  ChevronLeft,



  Shield,



  ShieldOff,



  Settings



} from 'lucide-react';







const PURPOSE_OPTIONS = [



  'Java Programming',



  'C Programming',



  'Database Management',



  'Web Development',



  'Data Structures and Algorithms',



  'Software Engineering Project',



  'Research / Thesis',



  'Exam Review',



];







// ── Avatar: shows profile_picture if available, else initials ──



function Avatar({ first_name, last_name, profile_picture, size = 'md' }) {



  const [imgError, setImgError] = React.useState(false);







  const sizeClasses = {



    xs: 'w-7 h-7 rounded-lg text-[0.5rem]',



    sm: 'w-8 h-8 rounded-lg text-[0.6rem]',



    md: 'w-10 h-10 rounded-2xl text-sm',



    lg: 'w-12 h-12 rounded-2xl text-base',



  };







  const initials = `${first_name?.[0] ?? ''}${last_name?.[0] ?? ''}`;



  const hasPic = profile_picture && !imgError;







  if (hasPic) {



    return (



      <img



        src={profile_picture}



        alt={`${first_name} ${last_name}`}



        onError={() => setImgError(true)}



        className={`${sizeClasses[size]} object-cover flex-shrink-0 border-2 border-white shadow-sm`}



      />



    );



  }







  return (



    <div className={`${sizeClasses[size]} bg-[#3c096c] flex items-center justify-center flex-shrink-0 border border-[#3c096c]/10`}>



      <span className="text-white font-black">{initials}</span>



    </div>



  );



}







const formatTime12h = (time) => {



  if (!time) return 'N/A';



  const [h, m] = time.split(':');



  const hr = parseInt(h);



  const ampm = hr >= 12 ? 'PM' : 'AM';



  const displayHr = hr % 12 || 12;



  return `${displayHr}:${m} ${ampm}`;



};







export default function AdminReservations() {



  const navigate = useNavigate();



  const [data, setData] = useState({ pending: [], logs: [], labs: [] });



  const [loading, setLoading] = useState(true);



  const [error, setError] = useState(null);







  // Selection states



  const [selectedLab, setSelectedLab] = useState(null);



  const [labPCs, setLabPCs] = useState([]);



  const [pcsLoading, setPcsLoading] = useState(false);



  const [selectedPC, setSelectedPC] = useState(null);
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [pcSearchTerm, setPcSearchTerm] = useState('');
  const [selectedPCIds, setSelectedPCIds] = useState([]); // Multi-select state
  const [isBulkMode, setIsBulkMode] = useState(false);

  // Decline Reason States
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineReason, setDeclineReason] = useState('');

  const [startSessionTarget, setStartSessionTarget] = useState(null);
  const [endSessionTarget, setEndSessionTarget] = useState(null);
  const [declineTargetId, setDeclineTargetId] = useState(null);
  const [isBusy, setIsBusy] = useState(false);
  const [isSubmittingDecline, setIsSubmittingDecline] = useState(false);
  const [showFullHistoryModal, setShowFullHistoryModal] = useState(false);
  const [historySearchTerm, setHistorySearchTerm] = useState('');
  const [historyStatusFilter, setHistoryStatusFilter] = useState('all');
  const [historyPage, setHistoryPage] = useState(1);

  const fetchData = useCallback(async (showLoadingScreen = false) => {
    try {
      if (showLoadingScreen) {
        setLoading(true);
      }
      const res = await authService.adminGetReservations();
      if (res.success) {
        setData(res.data || { pending: [], logs: [], labs: [] });
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch reservations.');
    } finally {
      if (showLoadingScreen) {
        setLoading(false);
      }
    }
  }, []);

  const isExpired = useCallback((req) => {
    try {
      if (!req.reservation_date || !req.time_from) return false;
      const resDateTime = new Date(`${req.reservation_date}T${req.time_from}`);
      return resDateTime < new Date();
    } catch (e) {
      return false;
    }
  }, []);

  useEffect(() => {
    const user = authService.getUser();
    if (!user || user.role !== 'admin') {
      navigate('/login');
      return;
    }
    fetchData(true);

    const intervalId = setInterval(() => {
      fetchData(false).catch(() => { });
    }, 10000);

    return () => clearInterval(intervalId);
  }, [navigate, fetchData]);

  const handleLabClick = async (lab) => {
    setSelectedLab(lab);
    setPcsLoading(true);
    try {
      const res = await authService.adminGetLabPCs(lab.id);



      if (res.success) {



        setLabPCs(res.data);



      }



    } catch (err) {



      console.error(err);



    } finally {



      setPcsLoading(false);



    }



  };











  const handleUpdatePCStatus = async (newStatus) => {



    try {



      const res = await authService.adminUpdatePCStatus(selectedPC.id, newStatus);



      if (res.success) {



        // Refresh PCs for current lab



        const pcRes = await authService.adminGetLabPCs(selectedLab.id);



        if (pcRes.success) setLabPCs(pcRes.data);



        setActionModalOpen(false);



        setSelectedPC(null);



      }



    } catch (err) {



      alert('Failed to update PC status.');



    }



  };







  const handlePCClick = (pc) => {



    if (isBulkMode) {



      setSelectedPCIds(prev =>



        prev.includes(pc.id) ? prev.filter(id => id !== pc.id) : [...prev, pc.id]



      );



    } else {



      setSelectedPC(pc);



      setActionModalOpen(true);



    }



  };







  const handlePCSelectToggle = (pcId, forceState) => {



    setSelectedPCIds(prev => {



      const hasId = prev.includes(pcId);



      if (forceState === 'select') {



        return hasId ? prev : [...prev, pcId];



      } else if (forceState === 'deselect') {



        return hasId ? prev.filter(id => id !== pcId) : prev;



      } else {



        return hasId ? prev.filter(id => id !== pcId) : [...prev, pcId];



      }



    });



  };







  const handleBulkUpdate = async (status) => {



    if (selectedPCIds.length === 0) return;



    try {



      const res = await authService.adminBulkUpdatePCStatus(selectedPCIds, status);



      if (res.success) {



        // Refresh grid



        const pcsData = await authService.adminGetLabPCs(selectedLab.id);



        setLabPCs(pcsData.data || []);



        setSelectedPCIds([]);



        setIsBulkMode(false);



      }



    } catch (err) {



      alert('Failed to update workstations');



    }



  };







  const handleStartSession = async (log) => {



    setStartSessionTarget({ ...log, purpose: log.purpose || 'C Programming' });



  };







  const handleConfirmStartSession = async () => {



    if (!startSessionTarget) return;



    try {



      setIsBusy(true);



      const response = await authService.adminStartReservationSession(



        startSessionTarget.id,



        startSessionTarget.purpose



      );



      if (response.success) {



        toast.success("Session started!");



        navigate('/admin/current-sessions');



      }



    } catch (error) {



      toast.error("Failed to start session");



    } finally {



      setIsBusy(false);



      setStartSessionTarget(null);



    }



  };







  const handleMarkAbsent = async (id) => {



    try {



      const response = await authService.adminMarkReservationAbsent(id);



      if (response.success) {



        fetchData();



        toast.success("Marked as absent");



      }



    } catch (error) {



      toast.error("Failed to mark absent");



    }



  };







  const handleEndSession = async (log) => {



    setEndSessionTarget({ ...log, adminFeedback: '' });



  };







  const handleConfirmEndSession = async () => {



    if (!endSessionTarget) return;



    try {



      setIsBusy(true);



      const response = await authService.adminEndReservationSession(



        endSessionTarget.id,



        endSessionTarget.adminFeedback



      );



      if (response.success) {



        fetchData();



        toast.success("Session ended and recorded!");



        setEndSessionTarget(null);



      }



    } catch (error) {



      toast.error("Failed to end session");



    } finally {



      setIsBusy(false);



    }



  };







  const handleApprove = async (id) => {



    try {



      const res = await authService.adminApproveReservation(id);



      if (res.success) {
        fetchData();
        window.dispatchEvent(new Event('pendingCountChanged'));
      }



    } catch (err) {



      alert('Failed to approve reservation.');



    }



  };







  const handleDeclineClick = (id) => {



    setDeclineTargetId(id);



    setDeclineReason('');



    setShowDeclineModal(true);



  };







  const handleConfirmDecline = async () => {



    if (!declineReason.trim()) {



      alert('Please provide a reason.');



      return;



    }







    try {



      setIsSubmittingDecline(true);



      const res = await authService.adminDeclineReservation(declineTargetId, declineReason);



      if (res.success) {



        await fetchData();



        setShowDeclineModal(false);



        setDeclineTargetId(null);



        setDeclineReason('');


        window.dispatchEvent(new Event('pendingCountChanged'));

      }



    } catch (err) {



      alert('Failed to decline reservation.');



    } finally {



      setIsSubmittingDecline(false);



    }



  };







  const handleToggleLabStatus = async (e, labId, currentStatus) => {
    e.stopPropagation(); // Prevent opening lab grid
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';

    // Optimistically update the UI status immediately
    setData(prev => {
      const updatedLabs = (prev?.labs || []).map(lab => {
        if (lab.id === labId) {
          return { ...lab, status: newStatus };
        }
        return lab;
      });
      return { ...prev, labs: updatedLabs };
    });

    try {
      const res = await authService.adminUpdateLabStatus(labId, newStatus);
      if (res.success) {
        await fetchData(false);
      } else {
        await fetchData(false);
        alert('Failed to update lab status');
      }
    } catch (err) {
      await fetchData(false);
      alert('Failed to update lab status');
    }
  };







  if (loading) {



    return <LoadingScreen message="Loading System Controls..." />;



  }







  return (



    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto flex flex-col gap-6 animate-page-entrance">



      {/* ─── Decline Reason Modal ─── */}



      {showDeclineModal && ReactDOM.createPortal(



        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-backdrop-fade">



          <div className="absolute inset-0 bg-[#1a0030]/60 backdrop-blur-sm" onClick={() => !isSubmittingDecline && setShowDeclineModal(false)} />



          <div className="relative bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-gray-100 animate-modal-scale">



            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-6">



              <XCircle size={32} className="text-red-500" />



            </div>







            <h3 className="text-xl font-black text-[#1a0030] mb-2 uppercase tracking-tight">Decline Reservation</h3>



            <p className="text-sm text-gray-500 mb-6 font-medium leading-relaxed">



              Please provide a reason for declining this request. This will be visible to the student.



            </p>







            <div className="space-y-4">



              <textarea



                value={declineReason}



                onChange={(e) => setDeclineReason(e.target.value)}



                placeholder="e.g. Schedule conflict, PC under maintenance, etc."



                className="w-full h-32 p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-[#1a0030] focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500/50 transition-all resize-none"



              />







              <div className="flex gap-3">



                <button



                  onClick={() => setShowDeclineModal(false)}



                  disabled={isSubmittingDecline}



                  className="flex-1 px-6 py-3 rounded-xl border-2 border-gray-100 font-black text-gray-400 hover:bg-gray-50 transition-all uppercase text-xs tracking-widest disabled:opacity-50"



                >



                  Cancel



                </button>



                <button



                  onClick={handleConfirmDecline}



                  disabled={isSubmittingDecline || !declineReason.trim()}



                  className="flex-1 px-6 py-3 rounded-xl bg-red-500 font-black text-white hover:bg-red-600 transition-all shadow-lg shadow-red-500/20 uppercase text-xs tracking-widest disabled:opacity-50 flex items-center justify-center gap-2"



                >



                  {isSubmittingDecline ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <X size={14} />}



                  Confirm



                </button>



              </div>



            </div>



          </div>



        </div>



        , document.body)}



      {/* ─── Full History Modal ─── */}



      {showFullHistoryModal && (() => {



        const itemsPerPage = 6;



        const filteredLogs = data.logs.filter(log => {



          const searchLower = historySearchTerm.toLowerCase();



          const matchesSearch =



            log.first_name.toLowerCase().includes(searchLower) ||



            log.last_name.toLowerCase().includes(searchLower) ||



            log.id_number.toLowerCase().includes(searchLower) ||



            log.lab_name.toLowerCase().includes(searchLower) ||



            log.pc_number.toLowerCase().includes(searchLower);







          const matchesStatus = historyStatusFilter === 'all' || String(log.status).toLowerCase() === historyStatusFilter;



          return matchesSearch && matchesStatus;



        });







        const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);



        const paginatedLogs = filteredLogs.slice((historyPage - 1) * itemsPerPage, historyPage * itemsPerPage);







        return ReactDOM.createPortal(



          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 animate-backdrop-fade">



            <div className="absolute inset-0 bg-[#1a0030]/80 backdrop-blur-md" onClick={() => setShowFullHistoryModal(false)} />



            <div className="relative bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 max-w-5xl w-full flex flex-col overflow-hidden max-h-[90vh] animate-modal-scale">



              {/* Header */}



              <div className="p-8 border-b border-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-gray-50/50">



                <div className="flex items-center gap-4">



                  <div className="w-12 h-12 bg-[#3c096c] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-[#3c096c]/20">



                    <History size={24} />



                  </div>



                  <div>



                    <h3 className="text-xl font-black text-[#1a0030] uppercase tracking-tight">Full System Audit</h3>



                    <p className="text-[0.65rem] text-gray-400 font-black uppercase tracking-widest">Showing {filteredLogs.length} Records</p>



                  </div>



                </div>







                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">



                  {/* Search Bar */}



                  <div className="relative">



                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />



                    <input



                      type="text"



                      placeholder="Search name, ID, lab..."



                      value={historySearchTerm}



                      onChange={(e) => { setHistorySearchTerm(e.target.value); setHistoryPage(1); }}



                      className="w-full sm:w-64 pl-12 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-[#1a0030] focus:outline-none focus:ring-2 focus:ring-[#3c096c]/20 transition-all"



                    />



                  </div>







                  {/* Status Filter */}



                  <select



                    value={historyStatusFilter}



                    onChange={(e) => { setHistoryStatusFilter(e.target.value); setHistoryPage(1); }}



                    className="pl-4 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-black text-[#3c096c] uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-[#3c096c]/20 transition-all appearance-none cursor-pointer"



                  >



                    <option value="all">All Status</option>



                    <option value="active">Active</option>



                    <option value="approved">Approved</option>



                    <option value="completed">Completed</option>



                    <option value="declined">Declined</option>



                    <option value="cancelled">Cancelled</option>



                    <option value="failed_to_appear">Absent</option>



                    <option value="pending">Pending</option>



                  </select>







                  <button



                    onClick={() => setShowFullHistoryModal(false)}



                    className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-red-500 transition-all"



                  >



                    <X size={20} />



                  </button>



                </div>



              </div>







              {/* Content */}



              <div className="flex-1 overflow-y-auto p-8 bg-white custom-scrollbar">



                {paginatedLogs.length === 0 ? (



                  <div className="h-full flex flex-col items-center justify-center p-12 text-center opacity-40">



                    <Search size={48} className="text-gray-200 mb-4" />



                    <p className="text-sm font-black text-gray-400 uppercase tracking-[0.2em]">No matching records found</p>



                  </div>



                ) : (



                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">



                    {[...paginatedLogs].sort((a, b) => {



                      const getScore = (log) => {



                        if (log.status === 'active') return 1;



                        const isReady = log.status === 'approved' &&



                          log.reservation_date === new Date().toLocaleDateString('en-CA') &&



                          new Date().toLocaleTimeString('en-GB', { hour12: false }) >= log.time_from;



                        if (isReady) return 2;



                        const priority = { 'approved': 3, 'failed_to_appear': 4 };



                        return priority[String(log.status).toLowerCase()] || 99;



                      };



                      return getScore(a) - getScore(b);



                    }).map(log => {



                      const isActive = log.status === 'active';



                      const isApproved = log.status === 'approved';



                      const isDeclined = log.status === 'declined';



                      const isReadyToStart = isApproved &&



                        log.reservation_date === new Date().toLocaleDateString('en-CA') &&



                        new Date().toLocaleTimeString('en-GB', { hour12: false }) >= log.time_from;



                      return (



                        <div key={log.id} className={`p-5 rounded-3xl border-2 transition-all duration-300 ${isActive ? 'border-[#ff9100] ring-2 ring-orange-50/50' : isReadyToStart ? 'bg-blue-50/20 border-blue-400' : isApproved ? 'bg-green-50/20 border-green-100' : isDeclined ? 'bg-red-50/20 border-red-100' : 'bg-gray-50 border-gray-200'}`}>



                          <div className="flex justify-between items-start mb-4">



                            <div className="flex items-center gap-3">



                              <Avatar



                                first_name={log.first_name}



                                last_name={log.last_name}



                                profile_picture={log.profile_picture}



                                size="sm"



                              />



                              <div className="min-w-0">



                                <h4 className="font-black text-[#1a0030] text-[0.7rem] truncate">{log.first_name} {log.last_name}</h4>



                                <p className="text-[0.55rem] text-gray-400 font-bold uppercase">{log.id_number}</p>



                              </div>



                            </div>



                            <span className={`text-[0.5rem] font-black uppercase px-2 py-0.5 rounded-lg flex items-center gap-1 ${isActive ? 'bg-[#ff9100] text-white shadow-lg shadow-orange-200' : log.status === 'completed' ? 'bg-indigo-600 text-white' : isReadyToStart ? 'bg-blue-500 text-white' : isApproved ? 'bg-green-500 text-white' : isDeclined ? 'bg-red-500 text-white' : 'bg-gray-400 text-white'}`}>



                              {isActive && <span className="w-1 h-1 rounded-full bg-white animate-pulse" />}



                              {String(log.status).toLowerCase() === 'failed_to_appear' ? 'Absent' : isReadyToStart ? 'Waiting' : log.status}



                            </span>



                          </div>







                          <div className="space-y-2 mb-4">



                            <div className="flex items-center gap-2 text-[0.6rem] font-bold text-gray-600">



                              <Monitor size={12} className="text-[#3c096c]/40" /> {log.lab_name} • {log.pc_number}



                            </div>



                            <div className="flex items-center gap-2 text-[0.6rem] font-bold text-gray-600">



                              <Calendar size={12} className="text-[#3c096c]/40" /> {log.reservation_date}



                            </div>



                          </div>







                          {log.decline_reason && (



                            <div className="p-2.5 bg-red-50/50 rounded-xl text-[0.6rem] text-red-600 font-medium italic border border-red-100 mb-2 truncate">



                              "{log.decline_reason}"



                            </div>



                          )}







                          {isReadyToStart && (



                            <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">



                              <button



                                onClick={() => handleStartSession(log)}



                                className="flex-1 bg-[#3c096c] text-white py-1.5 rounded-lg text-[0.55rem] font-black uppercase tracking-wider hover:bg-black transition-all"



                              >



                                Start Session



                              </button>



                              <button



                                onClick={() => handleMarkAbsent(log.id)}



                                className="flex-1 bg-white border border-orange-100 text-orange-600 py-1.5 rounded-lg text-[0.55rem] font-black uppercase tracking-wider hover:bg-orange-50 transition-all"



                              >



                                Absent



                              </button>



                            </div>



                          )}







                          {log.status === 'active' && (



                            <div className="mt-4 pt-3 border-t border-gray-100">



                              <button



                                onClick={() => handleEndSession(log)}



                                className="w-full bg-red-500 text-white py-1.5 rounded-lg text-[0.55rem] font-black uppercase tracking-wider hover:bg-red-600 transition-all"



                              >



                                End Session



                              </button>



                            </div>



                          )}







                          <div className="mt-4 pt-3 border-t border-gray-100/50 flex justify-between items-center">



                            <span className="text-[0.5rem] text-gray-400 font-black uppercase tracking-widest">Logged At</span>



                            <span className="text-[0.6rem] text-gray-500 font-bold">{new Date(log.created_at).toLocaleDateString()}</span>



                          </div>



                        </div>



                      );



                    })}



                  </div>



                )}



              </div>







              {/* Pagination Footer */}



              <div className="p-6 border-t border-gray-50 bg-gray-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">



                <p className="text-[0.6rem] font-black text-gray-400 uppercase tracking-widest">



                  Page {historyPage} of {totalPages || 1}



                </p>







                <div className="flex gap-2">



                  <button



                    disabled={historyPage <= 1}



                    onClick={() => setHistoryPage(p => p - 1)}



                    className="p-2 rounded-xl bg-white border border-gray-200 text-[#3c096c] disabled:opacity-30 hover:bg-gray-100 transition-all"



                  >



                    <ChevronLeft size={20} />



                  </button>



                  <button



                    disabled={historyPage >= totalPages}



                    onClick={() => setHistoryPage(p => p + 1)}



                    className="p-2 rounded-xl bg-white border border-gray-200 text-[#3c096c] disabled:opacity-30 hover:bg-gray-100 transition-all"



                  >



                    <ChevronRight size={20} />



                  </button>



                </div>



              </div>



            </div>



          </div>



          , document.body);



      })()}







      {/* Header */}



      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">



        <div>



          <div className="flex items-center gap-2 mb-1">



            <Layout size={14} className="text-[#ff9100]" />



            <span className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-gray-400">Reservation Management</span>



          </div>



          <h1 className="text-3xl font-black text-[#1a0030] tracking-tight">System Controls</h1>



        </div>



        <div className="flex items-center gap-2">



          {/* Removed Time Slot Button */}



          <button



            onClick={fetchData}



            className="px-4 py-2 bg-white border border-gray-100 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-50 flex items-center gap-2 transition-all cursor-pointer shadow-sm"



          >



            <History size={14} /> Refresh Data



          </button>



        </div>



      </div>







      {/* Main 3-Column Layout */}



      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">







        {/* Column 1: Lab Selection (4/12) */}



        <div className="lg:col-span-4 flex flex-col gap-4 animate-column-1">



          <div className="flex items-center justify-between mb-1">



            <div className="flex items-center gap-2">



              <Monitor size={18} className="text-[#3c096c]" />



              <h2 className="font-black text-[#1a0030] text-lg tracking-tight">CCS Laboratories</h2>



            </div>



            <span className="text-[0.6rem] font-black bg-[#3c096c]/08 text-[#3c096c] px-2 py-0.5 rounded-full uppercase tracking-wider">



              {data.labs.length} Labs



            </span>



          </div>







          <div className="flex flex-col gap-3">



            {data.labs.map(lab => (



              <div key={lab.id} className="relative">



                <button



                  onClick={() => handleLabClick(lab)}



                  className={`w-full text-left bg-white border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group flex items-center justify-between ${selectedLab?.id === lab.id ? 'border-[#3c096c] ring-1 ring-[#3c096c]' : 'border-gray-100'



                    } ${lab.status === 'inactive' ? 'opacity-70 grayscale-[0.5] border-dashed' : ''}`}



                >



                  <div className="flex-1">



                    <div className="flex items-center gap-2 mb-1">



                      <h3 className="font-black text-[#1a0030] text-base">{lab.lab_name}</h3>



                      <span className={`text-[0.55rem] font-black px-1.5 py-0.5 rounded uppercase tracking-widest ${lab.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>



                        {lab.status}



                      </span>



                    </div>



                    <p className="text-[0.65rem] text-gray-400 font-bold uppercase">{lab.location}</p>



                  </div>



                  <div className="flex items-center gap-4">



                    <div className="text-right">



                      <p className={`text-xs font-black ${lab.status === 'active' ? 'text-green-500' : 'text-gray-400'}`}>{lab.available_pcs} Free</p>



                      <p className="text-[0.55rem] text-gray-400 uppercase font-bold">of {lab.total_pcs}</p>



                    </div>



                    <ChevronRight size={18} className="text-gray-300 group-hover:text-[#3c096c] group-hover:translate-x-1 transition-all" />



                  </div>



                </button>







                {/* Status Toggle Button */}



                <button



                  onClick={(e) => handleToggleLabStatus(e, lab.id, lab.status)}



                  className={`absolute -top-2 -right-2 w-8 h-8 rounded-full shadow-lg border-2 border-white flex items-center justify-center transition-all z-10 



                    ${lab.status === 'active' ? 'bg-green-500 text-white hover:bg-red-500' : 'bg-red-500 text-white hover:bg-green-500'}`}



                  title={lab.status === 'active' ? 'Disable Laboratory' : 'Enable Laboratory'}



                >



                  {lab.status === 'active' ? <Shield size={14} /> : <ShieldOff size={14} />}



                </button>



              </div>



            ))}



          </div>



        </div>







        {/* Column 2: Pending Approvals (4/12) */}



        <div className="lg:col-span-4 flex flex-col gap-4 animate-column-2">



          <div className="flex items-center justify-between mb-1">



            <div className="flex items-center gap-2">



              <Clock size={18} className="text-[#ff9100]" />



              <h2 className="font-black text-[#1a0030] text-lg tracking-tight">Pending Queue</h2>



            </div>



            <span className="text-[0.6rem] font-black bg-[#ff9100]/10 text-[#ff9100] px-2 py-0.5 rounded-full uppercase tracking-wider">



              {data.pending.length} Requests



            </span>



          </div>







          <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar" style={{ maxHeight: '660px' }}>



            {data.pending.length === 0 ? (



              <div className="bg-white border border-gray-100 rounded-3xl p-12 text-center shadow-sm">



                <Clock size={32} className="text-gray-100 mx-auto mb-3" />



                <p className="text-[0.65rem] font-black text-gray-300 uppercase tracking-[0.2em]">Queue Empty</p>



              </div>



            ) : (



              data.pending.map(req => (



                <div key={req.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300">



                  <div className="flex justify-between items-start mb-4">



                    <div className="flex items-center gap-3">



                      <Avatar



                        first_name={req.first_name}



                        last_name={req.last_name}



                        profile_picture={req.profile_picture}



                        size="md"



                      />



                      <div>



                        <div className="flex items-center gap-2 mb-1">



                          <h4 className="font-black text-[#1a0030] text-sm leading-tight">{req.first_name} {req.last_name}</h4>



                          {isExpired(req) && (



                            <span className="text-[0.55rem] font-black bg-red-50 text-red-500 px-1.5 py-0.5 rounded uppercase tracking-widest animate-pulse">



                              Expiring



                            </span>



                          )}



                        </div>



                        <p className="text-[0.65rem] text-gray-400 font-bold uppercase tracking-tight">{req.id_number}</p>



                      </div>



                    </div>



                  </div>







                  <div className="bg-gray-50 rounded-xl p-3 mb-4 grid grid-cols-2 gap-2">



                    <div className="flex items-center gap-2">



                      <Monitor size={12} className="text-[#3c096c]" />



                      <span className="text-[0.65rem] font-black text-gray-600">{req.lab_name} - {req.pc_number}</span>



                    </div>



                    <div className="flex items-center gap-2">



                      <Calendar size={12} className="text-[#3c096c]" />



                      <span className="text-[0.65rem] font-black text-gray-600">{req.reservation_date}</span>



                    </div>



                    <div className="col-span-2 flex items-center gap-2">



                      <Clock size={12} className="text-[#3c096c]" />



                      <span className="text-[0.65rem] font-black text-gray-600 uppercase">



                        {formatTime12h(req.time_from)}



                      </span>



                    </div>



                  </div>







                  <div className="flex gap-2">



                    <button



                      onClick={() => handleApprove(req.id)}



                      className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-xl text-[0.65rem] font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all"



                    >



                      <Check size={14} /> Approve



                    </button>



                    <button



                      onClick={() => handleDeclineClick(req.id)}



                      className="flex-1 bg-white border border-red-100 text-red-500 hover:bg-red-50 py-2 rounded-xl text-[0.65rem] font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all"



                    >



                      <X size={14} /> Decline



                    </button>



                  </div>



                </div>



              ))



            )}



          </div>



        </div>







        {/* Column 3: Activity Stack (4/12) */}



        <div className="lg:col-span-4 flex flex-col gap-4 animate-column-3">



          <div className="flex items-center justify-between mb-1">



            <div className="flex items-center gap-2">



              <History size={18} className="text-[#3c096c]" />



              <h2 className="font-black text-[#1a0030] text-lg tracking-tight uppercase">System Log</h2>



            </div>



            <div className="flex items-center gap-1.5">



              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />



              <span className="text-[0.6rem] font-black text-gray-400 uppercase tracking-widest">Real-time</span>



            </div>



          </div>







          <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar" style={{ maxHeight: '700px' }}>



            {data.logs.length === 0 ? (



              <div className="bg-white border border-gray-100 rounded-3xl p-12 text-center shadow-sm">



                <History size={32} className="text-gray-100 mx-auto mb-3" />



                <p className="text-[0.65rem] font-black text-gray-300 uppercase tracking-[0.2em]">End of Log</p>



              </div>



            ) : (



              [...data.logs].sort((a, b) => {



                const getScore = (log) => {



                  if (log.status === 'active') return 1;



                  const isReady = log.status === 'approved' &&



                    log.reservation_date === new Date().toLocaleDateString('en-CA') &&



                    new Date().toLocaleTimeString('en-GB', { hour12: false }) >= log.time_from;



                  if (isReady) return 2;



                  const priority = { 'approved': 3, 'failed_to_appear': 4 };



                  return priority[String(log.status).toLowerCase()] || 99;



                };



                return getScore(a) - getScore(b);



              }).slice(0, 4).map(log => {



                const isApproved = log.status === 'approved';



                const isDeclined = log.status === 'declined';



                const isCancelled = log.status === 'cancelled';







                const isActive = log.status === 'active';



                const isReadyToStart = isApproved &&



                  log.reservation_date === new Date().toLocaleDateString('en-CA') &&



                  new Date().toLocaleTimeString('en-GB', { hour12: false }) >= log.time_from;







                return (



                  <div



                    key={log.id}



                    className={`group relative bg-white border-l-[4px] border-t-[1px] rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-300



                      ${isActive ? 'border-[#ff9100] ring-2 ring-orange-50/50' : isReadyToStart ? 'border-blue-500' : isApproved ? 'border-green-500' : isDeclined ? 'border-red-500' : 'border-gray-300'}`}



                  >



                    <div className="flex justify-between items-start mb-3">



                      <div className="flex items-center gap-3">



                        <Avatar



                          first_name={log.first_name}



                          last_name={log.last_name}



                          profile_picture={log.profile_picture}



                          size="sm"



                        />



                        <div>



                          <h4 className="text-[0.75rem] font-black text-[#1a0030] leading-none mb-1">



                            {log.first_name} {log.last_name}



                          </h4>



                          <p className="text-[0.55rem] text-gray-400 font-bold uppercase tracking-widest">{log.id_number}</p>



                        </div>



                      </div>



                      <div className="text-right">



                        <p className="text-[0.52rem] text-[#3c096c] font-black uppercase tracking-widest mb-0.5">Scheduled</p>



                        <p className="text-[0.6rem] text-gray-700 font-black leading-none">



                          {new Date(log.reservation_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}



                        </p>



                        <p className="text-[0.6rem] text-[#3c096c] font-bold mt-0.5">



                          {formatTime12h(log.time_from)}



                        </p>



                      </div>



                    </div>







                    <div className="flex items-center gap-2 mb-3">



                      <div className={`px-2 py-0.5 rounded text-[0.55rem] font-black uppercase tracking-widest flex items-center gap-1



                        ${isReadyToStart ? 'bg-blue-50 text-blue-600' :



                          isApproved ? 'bg-green-50 text-green-600' :



                            isDeclined ? 'bg-red-50 text-red-600' :



                              isActive ? 'bg-[#ff9100] text-white shadow-lg shadow-orange-200' :



                                log.status === 'completed' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' :



                                  log.status === 'failed_to_appear' ? 'bg-orange-50 text-orange-600' :



                                    'bg-gray-50 text-gray-500'}`}>



                        {isActive && <span className="w-1 h-1 rounded-full bg-white animate-pulse" />}



                        {String(log.status).toLowerCase() === 'failed_to_appear' ? 'Absent' : isReadyToStart ? 'Waiting' : log.status}



                      </div>



                      <div className="h-px flex-1 bg-gray-50" />



                      <div className="flex items-center gap-1.5 text-[0.6rem] font-bold text-gray-500">



                        <Monitor size={10} /> {log.pc_number}



                      </div>



                    </div>







                    <p className="text-[0.65rem] text-gray-600 leading-relaxed font-medium mb-3">



                      Reservation for <span className="text-[#3c096c] font-black">{log.lab_name}</span> on



                      <span className="text-[#3c096c] font-black ml-1">{new Date(log.reservation_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>



                    </p>







                    {/* Session Controls in Log */}



                    {isReadyToStart && (



                      <div className="flex gap-2 pt-2 border-t border-gray-50">



                        <button



                          onClick={() => handleStartSession(log)}



                          className="flex-1 bg-[#3c096c] text-white py-1.5 rounded-lg text-[0.55rem] font-black uppercase tracking-wider hover:bg-black transition-all"



                        >



                          Start Session



                        </button>



                        <button



                          onClick={() => handleMarkAbsent(log.id)}



                          className="flex-1 bg-white border border-orange-100 text-orange-600 py-1.5 rounded-lg text-[0.55rem] font-black uppercase tracking-wider hover:bg-orange-50 transition-all"



                        >



                          Absent



                        </button>



                      </div>



                    )}







                    {log.status === 'active' && (



                      <div className="pt-2 border-t border-gray-50">



                        <button



                          onClick={() => handleEndSession(log)}



                          className="w-full bg-red-500 text-white py-1.5 rounded-lg text-[0.55rem] font-black uppercase tracking-wider hover:bg-red-600 transition-all"



                        >



                          End Session



                        </button>



                      </div>



                    )}







                    {isDeclined && log.decline_reason && (



                      <div className="mt-3 pt-3 border-t border-red-50">



                        <p className="text-[0.6rem] text-red-500 italic font-medium leading-relaxed">



                          "{log.decline_reason}"



                        </p>



                      </div>



                    )}







                    {/* Quick View Icon on Hover */}



                    <div className="absolute right-3 bottom-3 opacity-0 group-hover:opacity-100 transition-opacity">



                      <ChevronRight size={14} className="text-gray-300" />



                    </div>



                  </div>



                );



              })



            )}







            {data.logs.length > 4 && (



              <button



                onClick={() => setShowFullHistoryModal(true)}



                className="w-full py-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-[0.65rem] font-black text-gray-400 uppercase tracking-[0.3em] hover:bg-gray-100 transition-all"



              >



                Load More History



              </button>



            )}



          </div>



        </div>



      </div>







      {/* PC Selection Modal (Full Layout) */}



      {selectedLab && ReactDOM.createPortal(



        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#1a0030]/80 backdrop-blur-md p-4 sm:p-6 animate-backdrop-fade">



          <div className="bg-white dark:bg-[#18181b] dark:border dark:border-[#27272a] w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-modal-scale">



            {/* Modal Header */}



            <div className="px-6 py-5 border-b border-gray-100 dark:border-zinc-800 flex flex-col md:flex-row items-center justify-between bg-linear-to-r from-white to-gray-50 dark:from-zinc-900 dark:to-zinc-900/50 gap-4">



              <div className="flex items-center gap-4">



                <div className="w-10 h-10 rounded-xl bg-[#3c096c]/08 flex items-center justify-center">



                  <Monitor size={20} className="text-[#3c096c]" />



                </div>



                <div>



                  <h2 className="text-xl font-black text-[#1a0030] tracking-tight">{selectedLab.lab_name} Workstations</h2>



                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{selectedLab.location}</p>



                </div>



              </div>







              <div className="flex-1 max-w-sm w-full relative">



                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />



                <input



                  type="text"



                  placeholder="Search PC number... (e.g. 05)"



                  className="w-full bg-white border border-gray-200 rounded-2xl pl-11 pr-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-[#3c096c]/20 outline-none transition-all shadow-sm"



                  value={pcSearchTerm}



                  onChange={e => setPcSearchTerm(e.target.value)}



                />



              </div>







              <div className="flex items-center gap-2">



                <button



                  onClick={() => {



                    setIsBulkMode(!isBulkMode);



                    setSelectedPCIds([]);



                  }}



                  className={`px-4 py-2 rounded-xl text-[0.65rem] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${isBulkMode ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'



                    }`}



                >



                  {isBulkMode ? 'Bulk Mode: ON' : 'Bulk Select'}



                </button>



                <button



                  onClick={() => {



                    setSelectedLab(null);



                    setPcSearchTerm('');



                    setIsBulkMode(false);



                    setSelectedPCIds([]);



                  }}



                  className="w-10 h-10 rounded-xl border border-gray-100 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all hover:rotate-90"



                >



                  <X size={20} />



                </button>



              </div>



            </div>







            {/* Bulk Action Bar (Visible when in Bulk Mode) */}



            {isBulkMode && (



              <div className="px-8 py-3 bg-[#3c096c] flex items-center justify-between animate-in slide-in-from-top duration-300">



                <div className="flex items-center gap-4">



                  <p className="text-[0.65rem] font-black text-white uppercase tracking-[0.2em]">{selectedPCIds.length} Workstations Selected</p>



                </div>



                <div className="flex items-center gap-2">



                  {(() => {



                    const selectedPCs = labPCs.filter(pc => selectedPCIds.includes(pc.id));



                    const isAllAvailable = selectedPCs.length > 0 && selectedPCs.every(pc => pc.status === 'available');



                    const isAllDisabled = selectedPCs.length > 0 && selectedPCs.every(pc => pc.status === 'disabled');



                    const isAllMaintenance = selectedPCs.length > 0 && selectedPCs.every(pc => pc.status === 'maintenance');







                    return (



                      <>



                        <button



                          onClick={() => handleBulkUpdate('available')}



                          disabled={selectedPCIds.length === 0 || isAllAvailable}



                          className="px-4 py-1.5 bg-green-500 text-white rounded-lg text-[0.6rem] font-black uppercase hover:bg-green-600 transition-all disabled:opacity-30 disabled:grayscale"



                        >



                          Enable All



                        </button>



                        <button



                          onClick={() => handleBulkUpdate('disabled')}



                          disabled={selectedPCIds.length === 0 || isAllDisabled}



                          className="px-4 py-1.5 bg-red-500 text-white rounded-lg text-[0.6rem] font-black uppercase hover:bg-red-600 transition-all disabled:opacity-30 disabled:grayscale"



                        >



                          Disable All



                        </button>



                        <button



                          onClick={() => handleBulkUpdate('maintenance')}



                          disabled={selectedPCIds.length === 0 || isAllMaintenance}



                          className="px-4 py-1.5 bg-[#240046] text-white rounded-lg text-[0.6rem] font-black uppercase hover:bg-black transition-all disabled:opacity-30 disabled:grayscale"



                        >



                          Maintenance



                        </button>



                      </>



                    );



                  })()}



                </div>



              </div>



            )}







            {/* PC Grid Area */}



            <div className="flex-1 overflow-auto p-8 bg-[#fdfdfd] dark:bg-[#0f0f11]">



              {pcsLoading ? (



                <div className="flex flex-col items-center justify-center py-20 gap-4">



                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3c096c]"></div>



                  <p className="text-xs font-black uppercase tracking-widest text-[#3c096c] animate-pulse">Loading Grid...</p>



                </div>



              ) : (



                <PCGrid



                  pcs={labPCs}



                  onPCClick={handlePCClick}



                  searchTerm={pcSearchTerm}



                  selectedIds={selectedPCIds}



                  isBulkMode={isBulkMode}



                  onPCSelectToggle={handlePCSelectToggle}



                />



              )}



            </div>







            {/* Modal Footer */}



            <div className="px-8 py-5 border-t border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900 flex justify-between items-center">



              <div className="flex gap-6">

                <div className="flex items-center gap-2">

                  <div className="w-3 h-3 rounded-full bg-green-500 shadow-sm shadow-green-200" />

                  <span className="text-[0.65rem] font-black uppercase tracking-wider text-gray-500">Available</span>

                </div>

                <div className="flex items-center gap-2">

                  <div className="w-3 h-3 rounded-full bg-[#ff9100] shadow-sm shadow-orange-200" />

                  <span className="text-[0.65rem] font-black uppercase tracking-wider text-gray-500">Active</span>

                </div>

                <div className="flex items-center gap-2">

                  <div className="w-3 h-3 rounded-full bg-[#3b82f6] shadow-sm shadow-[#3b82f6]/20" />

                  <span className="text-[0.65rem] font-black uppercase tracking-wider text-gray-500">Reserved</span>

                </div>

                <div className="flex items-center gap-2">

                  <div className="w-3 h-3 rounded-full bg-red-400 shadow-sm shadow-red-200" />

                  <span className="text-[0.65rem] font-black uppercase tracking-wider text-gray-500">Disabled</span>

                </div>

                <div className="flex items-center gap-2">

                  <div className="w-3 h-3 rounded-full bg-[#3c096c] shadow-sm shadow-[#3c096c]/20" />

                  <span className="text-[0.65rem] font-black uppercase tracking-wider text-gray-500">Maintenance</span>

                </div>

              </div>



              <p className="text-[0.65rem] font-bold text-gray-400 italic">Select a workstation to manage its status</p>



            </div>



          </div>



        </div>



        , document.body)}







      {/* PC Action Modal */}



      {actionModalOpen && selectedPC && ReactDOM.createPortal(



        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-[#1a0030]/90 backdrop-blur-md p-4 animate-backdrop-fade">



          <div className="bg-white dark:bg-[#18181b] dark:border dark:border-[#27272a] w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-modal-scale">



            <div className="px-6 py-6 text-center border-b border-gray-50 bg-linear-to-b from-[#3c096c] to-[#5a189a] text-white">



              <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-4 border border-white/20">



                <Monitor size={32} />



              </div>



              <h3 className="text-2xl font-black tracking-tight">{selectedPC.pc_number}</h3>



              <p className="text-white/60 text-[0.65rem] font-black uppercase tracking-[0.2em] mt-1">{selectedLab?.lab_name}</p>



            </div>







            <div className="p-6 flex flex-col gap-3">



              <p className="text-[0.65rem] font-black text-gray-400 uppercase tracking-widest mb-1">Workstation Controls</p>







              <button
                onClick={() => handleUpdatePCStatus('available')}
                className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer hover:scale-[1.01] ${selectedPC.status === 'available' ? 'border-green-500 bg-green-50/50 dark:bg-green-950/20 shadow-md shadow-green-500/10' : 'border-gray-50 dark:border-zinc-800 hover:border-green-400 hover:bg-green-50/30'
                  }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedPC.status === 'available' ? 'bg-green-500 text-white' : 'bg-gray-100 dark:bg-zinc-800 text-gray-400'}`}>
                  <Shield size={20} />
                </div>
                <div className="text-left">
                  <span className="block text-sm font-black text-[#1a0030] dark:text-white">Enable Workstation</span>
                  <span className="block text-xs text-gray-400 dark:text-zinc-400 font-medium">Available for student reservations</span>
                </div>
                {selectedPC.status === 'available' && <Check size={18} className="ml-auto text-green-500" />}
              </button>

              <button
                onClick={() => handleUpdatePCStatus('disabled')}
                className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer hover:scale-[1.01] ${selectedPC.status === 'disabled' ? 'border-red-500 bg-red-50/50 dark:bg-red-950/20 shadow-md shadow-red-500/10' : 'border-gray-50 dark:border-zinc-800 hover:border-red-400 hover:bg-red-50/30'
                  }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedPC.status === 'disabled' ? 'bg-red-500 text-white' : 'bg-gray-100 dark:bg-zinc-800 text-gray-400'}`}>
                  <ShieldOff size={20} />
                </div>
                <div className="text-left">
                  <span className="block text-sm font-black text-[#1a0030] dark:text-white">Disable Workstation</span>
                  <span className="block text-xs text-gray-400 dark:text-zinc-400 font-medium">Block all new reservation requests</span>
                </div>
                {selectedPC.status === 'disabled' && <Check size={18} className="ml-auto text-red-500" />}
              </button>

              <button
                onClick={() => handleUpdatePCStatus('maintenance')}
                className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer hover:scale-[1.01] ${selectedPC.status === 'maintenance' ? 'border-[#3c096c] bg-purple-500/10 dark:bg-purple-950/20 shadow-md shadow-purple-500/10' : 'border-gray-50 dark:border-zinc-800 hover:border-purple-400 hover:bg-purple-500/5'
                  }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedPC.status === 'maintenance' ? 'bg-[#3c096c] text-white' : 'bg-gray-100 dark:bg-zinc-800 text-gray-400'}`}>
                  <AlertCircle size={20} />
                </div>
                <div className="text-left">
                  <span className="block text-sm font-black text-[#1a0030] dark:text-white">Maintenance Mode</span>
                  <span className="block text-xs text-gray-400 dark:text-zinc-400 font-medium">Mark for repair or technical check</span>
                </div>
                {selectedPC.status === 'maintenance' && <Check size={18} className="ml-auto text-[#3c096c]" />}
              </button>



            </div>







            <div className="p-6 pt-0">



              <button



                onClick={() => setActionModalOpen(false)}



                className="w-full py-3 rounded-2xl bg-gray-100 text-gray-500 font-black uppercase text-xs tracking-widest hover:bg-gray-200 transition-all"



              >



                Cancel



              </button>



            </div>



          </div>



        </div>



        , document.body)}







      {/* Start Session Modal */}



      {startSessionTarget && (



        <StartSessionModal



          target={{



            ...startSessionTarget,



            onChange: (f, v) => setStartSessionTarget(p => ({ ...p, [f]: v }))



          }}



          onConfirm={handleConfirmStartSession}



          onClose={() => setStartSessionTarget(null)}



          busy={isBusy}



        />



      )}







      {/* End Session Modal */}



      {endSessionTarget && (



        <EndSessionModal



          target={{



            ...endSessionTarget,



            onChange: (f, v) => setEndSessionTarget(p => ({ ...p, [f]: v }))



          }}



          onConfirm={handleConfirmEndSession}



          onClose={() => setEndSessionTarget(null)}



          busy={isBusy}



        />



      )}



    </div>



  );



}







// ── Start Session Modal ──



function StartSessionModal({ target, onConfirm, onClose, busy }) {



  if (!target) return null;



  return ReactDOM.createPortal(



    <div className="fixed inset-0 z-[120] flex items-center justify-center px-4 animate-backdrop-fade">



      <div className="absolute inset-0 bg-[#1a0030]/80 backdrop-blur-md" onClick={onClose} />



      <div className="relative w-full max-w-sm bg-white dark:bg-[#18181b] dark:border dark:border-[#27272a] rounded-3xl shadow-2xl overflow-hidden animate-modal-scale">



        <div className="h-1.5 w-full bg-[#3c096c]" />



        <div className="p-6">



          <div className="flex items-center gap-4 mb-6">



            <Avatar first_name={target.first_name} last_name={target.last_name} profile_picture={target.profile_picture} size="md" />



            <div>



              <h3 className="font-black text-[#1a0030] text-lg leading-tight">Start Session</h3>



              <p className="text-[0.65rem] text-gray-400 font-bold uppercase tracking-widest">{target.id_number}</p>



            </div>



          </div>







          <div className="bg-gray-50 rounded-2xl p-4 mb-6">



            <div className="flex items-center gap-3 mb-2">



              <Monitor size={16} className="text-[#3c096c]" />



              <p className="text-sm font-black text-gray-700">{target.lab_name} - {target.pc_number}</p>



            </div>



            <div className="flex items-center gap-3">



              <Calendar size={16} className="text-[#3c096c]" />



              <p className="text-[0.65rem] font-bold text-gray-500 uppercase tracking-wider">{new Date(target.reservation_date).toLocaleDateString()}</p>



            </div>



          </div>







          <div className="space-y-1.5 mb-6">



            <label className="text-[0.6rem] font-black uppercase tracking-widest text-gray-400">Select Purpose</label>



            <select



              value={target.purpose}



              onChange={(e) => target.onChange?.('purpose', e.target.value)}



              className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 text-sm font-bold text-[#1a0030] focus:ring-2 focus:ring-[#3c096c]/20 outline-none transition-all"



            >



              {PURPOSE_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}



            </select>



          </div>







          <div className="flex gap-2">



            <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-200 text-xs font-black uppercase text-gray-400 hover:bg-gray-50 transition-all">Cancel</button>



            <button onClick={onConfirm} disabled={busy} className="flex-2 py-3 rounded-xl bg-[#3c096c] text-white text-xs font-black uppercase tracking-widest hover:bg-black transition-all disabled:opacity-50">



              {busy ? 'Starting...' : 'Confirm Start'}



            </button>



          </div>



        </div>



      </div>



    </div>



    , document.body);



}







// ── End Session Modal ──



function EndSessionModal({ target, onConfirm, onClose, busy }) {



  if (!target) return null;



  return ReactDOM.createPortal(



    <div className="fixed inset-0 z-[120] flex items-center justify-center px-4 animate-backdrop-fade">



      <div className="absolute inset-0 bg-[#1a0030]/80 backdrop-blur-md" onClick={onClose} />



      <div className="relative w-full max-w-md bg-white dark:bg-[#18181b] dark:border dark:border-[#27272a] rounded-3xl shadow-2xl overflow-hidden animate-modal-scale">



        <div className="h-1.5 w-full bg-red-500" />



        <div className="p-8">



          <div className="flex items-center gap-4 mb-8">



            <Avatar first_name={target.first_name} last_name={target.last_name} profile_picture={target.profile_picture} size="lg" />



            <div>



              <h3 className="font-black text-[#1a0030] text-xl leading-tight">End Session</h3>



              <p className="text-[0.7rem] text-gray-400 font-bold uppercase tracking-[0.15em]">{target.id_number}</p>



            </div>



            <div className="ml-auto px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[0.6rem] font-black uppercase tracking-widest">Active</div>



          </div>







          <div className="grid grid-cols-2 gap-4 mb-8">



            <div className="bg-gray-50 p-4 rounded-2xl">



              <p className="text-[0.55rem] font-black text-gray-400 uppercase tracking-widest mb-1">Laboratory</p>



              <p className="text-sm font-black text-[#1a0030]">{target.lab_name}</p>



            </div>



            <div className="bg-gray-50 p-4 rounded-2xl">



              <p className="text-[0.55rem] font-black text-gray-400 uppercase tracking-widest mb-1">Workstation</p>



              <p className="text-sm font-black text-[#1a0030]">{target.pc_number}</p>



            </div>



          </div>







          <div className="space-y-2 mb-8">



            <label className="text-[0.6rem] font-black uppercase tracking-widest text-gray-400">Administrative Feedback</label>



            <textarea



              value={target.adminFeedback || ''}



              onChange={(e) => target.onChange?.('adminFeedback', e.target.value)}



              placeholder="Any issues or observations? (Optional)"



              rows={3}



              className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-4 py-3 text-sm font-bold text-[#1a0030] focus:ring-2 focus:ring-red-500/20 outline-none transition-all resize-none"



            />



          </div>







          <div className="flex gap-3">



            <button onClick={onClose} className="flex-1 py-3.5 rounded-2xl border border-gray-200 text-xs font-black uppercase text-gray-400 hover:bg-gray-50 transition-all">Cancel</button>



            <button onClick={onConfirm} disabled={busy} className="flex-2 py-3.5 rounded-2xl bg-red-500 text-white text-xs font-black uppercase tracking-[0.15em] hover:bg-red-600 transition-all shadow-lg shadow-red-200 disabled:opacity-50">



              {busy ? 'Ending...' : 'Terminate Session'}



            </button>



          </div>



        </div>



      </div>



    </div>



    , document.body);



}







// Sub-component for the PC Grid



function PCGrid({ pcs, onPCClick, searchTerm, selectedIds = [], isBulkMode = false, onPCSelectToggle }) {



  const [isDragging, setIsDragging] = React.useState(false);



  const [dragMode, setDragMode] = React.useState('select');







  React.useEffect(() => {



    const handleGlobalMouseUp = () => {



      setIsDragging(false);



    };



    window.addEventListener('mouseup', handleGlobalMouseUp);



    return () => {



      window.removeEventListener('mouseup', handleGlobalMouseUp);



    };



  }, []);







  if (pcs.length === 0) return (



    <div className="text-center py-20">



      <AlertCircle size={48} className="mx-auto text-gray-200 mb-4" />



      <p className="font-black text-gray-400 uppercase tracking-[0.2em]">No PCs configured for this lab</p>



    </div>



  );







  const filteredPCs = pcs.filter(pc =>



    pc.pc_number.toLowerCase().includes(searchTerm.toLowerCase())



  );







  if (filteredPCs.length === 0) return (



    <div className="text-center py-20">



      <Search size={48} className="mx-auto text-gray-100 mb-4" />



      <p className="font-black text-gray-400 uppercase tracking-[0.2em]">No results for "{searchTerm}"</p>



    </div>



  );







  const sortedPCs = [...filteredPCs].sort((a, b) => {



    const numA = parseInt(a.pc_number.replace(/\D/g, '')) || 0;



    const numB = parseInt(b.pc_number.replace(/\D/g, '')) || 0;



    return numA - numB;



  });







  const blocks = [];



  for (let i = 0; i < sortedPCs.length; i += 16) {



    blocks.push(sortedPCs.slice(i, i + 16));



  }







  const handleCardMouseDown = (e, pc) => {



    if (!isBulkMode) return;



    e.preventDefault();



    setIsDragging(true);



    const mode = selectedIds.includes(pc.id) ? 'deselect' : 'select';



    setDragMode(mode);



    onPCSelectToggle(pc.id, mode);



  };







  const handleCardMouseEnter = (pc) => {



    if (!isBulkMode || !isDragging) return;



    onPCSelectToggle(pc.id, dragMode);



  };







  const handleCardClick = (e, pc) => {



    if (isBulkMode) return;



    onPCClick(pc);



  };







  return (



    <div className="flex gap-x-16 justify-center min-w-max pb-4 animate-in fade-in duration-300 select-none">



      {blocks.map((block, bIdx) => (



        <div



          key={bIdx}



          className="grid grid-rows-8 grid-flow-col gap-x-6 gap-y-3"



          style={{ gridTemplateRows: 'repeat(8, minmax(0, 1fr))' }}



        >



          {block.map(pc => {



            const pcLabel = pc.pc_number.replace('PC-', '');



            const isDisabled = pc.status === 'disabled';



            const isMaintenance = pc.status === 'maintenance';



            const isSelected = selectedIds.includes(pc.id);
            const hasReservations = pc.all_reservations && pc.all_reservations.length > 0;
            const isActiveSession = pc.all_reservations && pc.all_reservations.some(r => r.status === 'active');
            const reservationCount = pc.all_reservations ? pc.all_reservations.length : 0;

            return (



              <button



                key={pc.id}



                onClick={(e) => handleCardClick(e, pc)}



                onMouseDown={(e) => handleCardMouseDown(e, pc)}



                onMouseEnter={() => handleCardMouseEnter(pc)}



                className={`flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl transition-all duration-300 w-22 border group relative select-none
                  ${isSelected ? 'border-green-500 ring-2 ring-green-500/20 z-10 scale-105 bg-green-50/10' :
                    isDisabled ? 'bg-red-50/50 border-red-300 text-red-500' :
                      isMaintenance ? 'bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-950/20 dark:border-purple-800/40 dark:text-purple-400' :
                        isActiveSession ? 'bg-[#ff9100]/10 border-[#ff9100]/40 text-[#ff9100] shadow-sm shadow-[#ff9100]/10' :
                          hasReservations ? 'bg-[#3b82f6]/10 border-[#3b82f6]/40 text-[#3b82f6] shadow-sm shadow-[#3b82f6]/10' :
                            'bg-white text-gray-600 border-gray-100 hover:bg-green-50 hover:text-green-600 hover:border-green-400 hover:scale-105 shadow-xs hover:shadow-md'}`}
              >



                {/* Checkbox for Bulk Mode */}



                {isBulkMode && (



                  <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 transition-all ${isSelected ? 'bg-green-500 border-green-500' : 'bg-white border-gray-200'



                    }`}>



                    {isSelected && <Check size={12} className="text-white" />}



                  </div>



                )}







                {reservationCount > 1 && (
                  <div className={`absolute -top-1.5 -right-1.5 min-w-[15px] h-[15px] px-[4px] rounded-full border border-white flex items-center justify-center shadow-sm z-10 ${isActiveSession ? 'bg-[#ff9100]' : 'bg-[#3b82f6]'}`}>
                    <span className="text-[0.5rem] font-black text-white leading-none tracking-tighter">
                      {reservationCount}
                    </span>
                  </div>
                )}

                <Monitor
                  size={32}
                  strokeWidth={2}
                  className={`transition-colors ${isSelected ? 'text-green-500' : isDisabled ? 'text-red-400' : isMaintenance ? 'text-purple-500 dark:text-purple-400/80' : isActiveSession ? 'text-[#ff9100]' : hasReservations ? 'text-[#3b82f6]' : 'text-gray-700 group-hover:text-green-500'}`}
                />



                <span className={`text-[0.7rem] font-black tracking-tight ${isSelected ? 'text-green-600' : isDisabled ? 'text-red-500' : isMaintenance ? 'text-purple-700 dark:text-purple-400' : isActiveSession ? 'text-[#ff9100]' : hasReservations ? 'text-[#3b82f6]' : 'text-gray-500 group-hover:text-green-600'}`}>
                  PC {pcLabel.padStart(2, '0')}
                </span>

                <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-green-500' : isDisabled ? 'bg-red-400' : isMaintenance ? 'bg-purple-500 dark:bg-purple-400' : isActiveSession ? 'bg-[#ff9100]' : hasReservations ? 'bg-[#3b82f6]' : 'bg-green-400'}`} />



              </button>



            );



          })}



        </div>



      ))}



    </div>



  );



}



