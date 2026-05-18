import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Clock, Plus, Trash2, ChevronDown, ChevronUp, AlertCircle, X, ExternalLink, CheckCircle, MoreHorizontal, ChevronRight, Search, Filter } from 'lucide-react';
import ReservationWizard from './ReservationWizard';
import { authService } from '../services/authService';
import LoadingScreen from '../components/LoadingScreen';

// ─── UTILITY FUNCTIONS ────────────────────────────────────────────────────────────────────────
const formatDateTime = (value, includeTime = true) => {
  if (!value) return '—';
  const d = new Date(String(value).replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return '—';
  const options = {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  };
  if (includeTime) {
    options.hour = 'numeric';
    options.minute = '2-digit';
  }
  return d.toLocaleString('en-US', options);
};

const formatTime12h = (time) => {
  if (!time) return 'N/A';
  const [h, m] = time.split(':');
  const hr = parseInt(h);
  const ampm = hr >= 12 ? 'PM' : 'AM';
  const displayHr = hr % 12 || 12;
  return `${displayHr}:${m} ${ampm}`;
};

const PAGE_SIZE = 8;

// ─── STYLES & CONFIG ──────────────────────────────────────────────────────────────────────────
const STATUS_STYLES = {
  pending: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', icon: <Clock size={12} /> },
  approved: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', icon: <CheckCircle size={12} /> },
  declined: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: <AlertCircle size={12} /> },
  cancelled: { bg: 'bg-gray-100', text: 'text-gray-500', border: 'border-gray-200', icon: <X size={12} /> },
  active: { bg: 'bg-[#ff9100]', text: 'text-white', border: 'border-orange-300', icon: <Clock size={12} className="animate-pulse" /> },
  completed: { bg: 'bg-indigo-600', text: 'text-white', border: 'border-indigo-400', icon: <CheckCircle size={12} /> },
  failed_to_appear: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200', icon: <X size={12} /> },
};

const getStatusStyle = (status = '') => {
  const s = String(status).toLowerCase();
  return STATUS_STYLES[s] || STATUS_STYLES.cancelled;
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────────────────────
export default function Reservations() {
  const [showWizard, setShowWizard] = useState(false);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [expandedRow, setExpandedRow] = useState(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [labFilter, setLabFilter] = useState('all');

  const fetchReservations = async (showError = false) => {
    try {
      const user = authService.getUser();
      if (!user?.id_number) {
        if (showError) setError('User not authenticated.');
        setReservations([]);
        return;
      }
      const data = await authService.fetchStudentReservations(user.id_number);
      setReservations(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      console.error('Error fetching reservations:', err);
      if (showError) setError(err.message || 'Unable to load reservations.');
      setReservations([]);
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      await fetchReservations(true);
      setLoading(false);
    };
    loadInitialData();
  }, []);

  // Auto-refresh hook
  useEffect(() => {
    const intervalId = setInterval(() => fetchReservations(false), 10000); // Refresh every 10s
    window.addEventListener('focus', fetchReservations);
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', fetchReservations);
    };
  }, []);

  const handleReservationCreated = () => {
    setShowWizard(false);
    fetchReservations(true);
  };

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [pendingCancelReservation, setPendingCancelReservation] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  const handleInitiateCancel = (reservation) => {
    setPendingCancelReservation(reservation);
    setShowCancelModal(true);
  };

  const handleConfirmCancel = async () => {
    if (!pendingCancelReservation) return;
    setCancelLoading(true);
    try {
      await authService.deleteReservation(pendingCancelReservation.id);
      setShowCancelModal(false);
      setPendingCancelReservation(null);
      fetchReservations(true);
    } catch (err) {
      alert(err.message || 'Failed to cancel reservation.');
    } finally {
      setCancelLoading(false);
    }
  };

  const summary = useMemo(() => {
    const pending = reservations.filter(r => r.status === 'pending').length;
    const approved = reservations.filter(r => r.status === 'approved').length;
    const total = reservations.length;
    return { pending, approved, total };
  }, [reservations]);

  const uniqueLabs = useMemo(() => {
    const labs = reservations.map(r => r.lab_name).filter(Boolean);
    return [...new Set(labs)];
  }, [reservations]);

  const filteredReservations = useMemo(() => {
    return reservations.filter(res => {
      const searchStr = `${res.lab_name || ''} ${res.pc_number || ''}`.toLowerCase();
      const matchesSearch = searchStr.includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || res.status.toLowerCase() === statusFilter.toLowerCase();
      const matchesLab = labFilter === 'all' || res.lab_name === labFilter;

      return matchesSearch && matchesStatus && matchesLab;
    });
  }, [reservations, searchTerm, statusFilter, labFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredReservations.length / PAGE_SIZE));
  const pagedReservations = filteredReservations.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter, labFilter]);

  useEffect(() => {
    setPage(prev => Math.min(prev, totalPages));
  }, [totalPages]);

  if (loading && reservations.length === 0) {
    return <LoadingScreen message="Loading reservations..." />;
  }

  return (
    <div className="pt-2 sm:pt-3 pb-4 sm:pb-6 px-1 sm:px-2 bg-transparent">
      <div className="max-w-380 mx-auto w-full flex flex-col gap-4">

        {/* ─── Header ─── */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-[0.62rem] font-black uppercase tracking-[0.2em] text-[#3c096c]/50">Student</p>
            <h1 className="text-3xl sm:text-4xl font-black text-[#1a0030] tracking-tight">Reservations</h1>
          </div>
          <button
            onClick={() => setShowWizard(true)}
            className="flex items-center gap-2 bg-[#ff9100] text-[#3c096c] font-bold px-5 py-2.5 rounded-full hover:bg-orange-400 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 text-sm"
          >
            <Plus size={16} strokeWidth={3} />
            New Reservation
          </button>
        </div>

        {/* ─── Summary Cards ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <StatCard label="Pending Approval" value={summary.pending} className="bg-black" />
          <StatCard label="Approved" value={summary.approved} color="#3c096c" />
          <StatCard label="Total Reservations" value={summary.total} color="#ff9100" />
        </div>

        {/* ─── Filters ─── */}
        <div className="bg-white border border-gray-100 rounded-2xl p-3 shadow-sm flex flex-col sm:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by Lab or PC"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-transparent rounded-xl text-[0.8rem] font-bold text-[#1a0030] focus:outline-none focus:ring-2 focus:ring-[#3c096c]/10 focus:bg-white transition-all placeholder:text-gray-400"
            />
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3c096c]/50" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full sm:w-36 pl-9 pr-8 py-2.5 bg-gray-50 border border-transparent rounded-xl text-[0.7rem] font-black uppercase tracking-widest text-[#3c096c] focus:outline-none focus:ring-2 focus:ring-[#3c096c]/10 focus:bg-white transition-all appearance-none cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="completed">Completed</option>
                <option value="declined">Declined</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="relative flex-1 sm:flex-initial">
              <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3c096c]/50" />
              <select
                value={labFilter}
                onChange={(e) => setLabFilter(e.target.value)}
                className="w-full sm:w-36 pl-9 pr-8 py-2.5 bg-gray-50 border border-transparent rounded-xl text-[0.7rem] font-black uppercase tracking-widest text-[#3c096c] focus:outline-none focus:ring-2 focus:ring-[#3c096c]/10 focus:bg-white transition-all appearance-none cursor-pointer"
              >
                <option value="all">All Labs</option>
                {uniqueLabs.map(lab => <option key={lab} value={lab}>{lab}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* ─── Reservations Table ─── */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 sm:px-5 py-3 border-b border-gray-100">
            <p className="text-sm font-bold text-[#1a0030]">My Reservations</p>
          </div>

          {error && <div className="p-8 text-center text-sm text-red-500 font-bold">{error}</div>}
          {!error && loading && reservations.length === 0 && <div className="p-12 text-center text-sm text-gray-400 font-black uppercase tracking-widest">Loading...</div>}
          {!error && !loading && reservations.length === 0 && <div className="p-12 text-center text-sm text-gray-400 font-black uppercase tracking-widest">No reservations found</div>}
          {!error && !loading && reservations.length > 0 && filteredReservations.length === 0 && (
            <div className="p-12 text-center">
              <Search size={32} className="mx-auto text-gray-200 mb-3" />
              <p className="text-sm text-gray-400 font-black uppercase tracking-widest">No matching reservations found</p>
              <button
                onClick={() => { setSearchTerm(''); setStatusFilter('all'); setLabFilter('all'); }}
                className="mt-3 text-[#ff9100] text-xs font-black uppercase tracking-widest hover:underline"
              >
                Clear all filters
              </button>
            </div>
          )}

          {!error && filteredReservations.length > 0 && (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full min-w-225 text-left">
                  <thead className="bg-gray-50 text-[0.64rem] uppercase tracking-wider text-gray-500">
                    <tr>
                      <th className="px-4 py-3">Lab</th>
                      <th className="px-4 py-3">PC</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Time</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Submitted</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedReservations.map(res => (
                      <ReservationRow
                        key={res.id}
                        reservation={res}
                        onDelete={handleInitiateCancel}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile List */}
              <div className="md:hidden p-3 flex flex-col gap-2.5">
                {pagedReservations.map(res => (
                  <ReservationCard
                    key={res.id}
                    reservation={res}
                    onDelete={handleInitiateCancel}
                    isExpanded={expandedRow === res.id}
                    onToggleExpand={() => setExpandedRow(prev => prev === res.id ? null : res.id)}
                  />
                ))}
              </div>

              {/* Pagination */}
              {filteredReservations.length > PAGE_SIZE && (
                <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
                  <p className="text-xs font-semibold text-gray-400">Page {page} of {totalPages}</p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-bold text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-bold text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ─── Reservation Wizard Modal ─── */}
        {showWizard && (
          <ReservationWizard
            onClose={() => setShowWizard(false)}
            onSuccess={handleReservationCreated}
          />
        )}

        {/* ─── Cancel Confirmation Modal ─── */}
        {showCancelModal && pendingCancelReservation && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#1a0030]/60 backdrop-blur-sm" onClick={() => setShowCancelModal(false)} />
            <div className="relative bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col text-center" onClick={e => e.stopPropagation()}>
              <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 shrink-0">
                <Trash2 size={24} className="stroke-[2.5]" />
              </div>
              <h3 className="text-base font-black text-[#1a0030] uppercase tracking-tight mb-2">Cancel Reservation?</h3>
              <p className="text-xs text-gray-500 leading-relaxed font-bold mb-5">
                Are you sure you want to cancel your reservation for <span className="text-[#3c096c] underline">{pendingCancelReservation.pc_number || 'PC'}</span> in <span className="text-[#3c096c] font-black">{pendingCancelReservation.lab_name}</span>? This slot will be opened to other students.
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCancelModal(false)}
                  disabled={cancelLoading}
                  className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[0.7rem] font-black rounded-xl transition-all uppercase tracking-widest disabled:opacity-50"
                >
                  No, Keep It
                </button>
                <button
                  onClick={handleConfirmCancel}
                  disabled={cancelLoading}
                  className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-[0.7rem] font-black rounded-xl transition-all shadow-md shadow-red-600/20 uppercase tracking-widest disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {cancelLoading ? 'Cancelling...' : 'Yes, Cancel'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── SUB-COMPONENTS ────────────────────────────────────────────────────────────────────────────

function StatCard({ label, value, color = '#3c096c' }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group">
      <p className="text-[0.6rem] font-black uppercase tracking-[0.2em] text-gray-400 group-hover:text-[#3c096c] transition-colors">{label}</p>
      <p className="text-3xl font-black mt-1 text-[#1a0030]" style={{ color: color !== 'blue' && color !== 'green' && color !== 'yellow' ? color : undefined }}>{value}</p>
    </div>
  );
}

function ReservationRow({ reservation, onDelete }) {
  const { bg, text, border, icon } = getStatusStyle(reservation.status);
  const canCancel = reservation.status === 'pending';

  return (
    <tr className="border-t border-gray-100 hover:bg-gray-50/50">
      <td className="px-4 py-3 text-sm font-semibold text-[#1a0030]">{reservation.lab_name || '—'}</td>
      <td className="px-4 py-3 text-sm text-gray-600">{reservation.pc_number || '—'}</td>
      <td className="px-4 py-3 text-sm text-gray-600">{formatDateTime(reservation.reservation_date, false)}</td>
      <td className="px-4 py-3 text-sm text-gray-600">
        {reservation.time_from ? formatTime12h(reservation.time_from) : 'All Day'}
      </td>
      <td className="px-4 py-3 text-sm">
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-xs font-bold ${bg} ${text} ${border}`}>
          {icon}
          {String(reservation.status).toLowerCase() === 'failed_to_appear' ? 'Absent' : String(reservation.status).charAt(0).toUpperCase() + String(reservation.status).slice(1)}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">{formatDateTime(reservation.created_at)}</td>
      <td className="px-4 py-3 text-sm">
        {canCancel ? (
          <button
            onClick={() => onDelete(reservation)}
            className="flex items-center gap-1.5 text-red-600 hover:text-red-800 font-bold text-xs"
            title="Cancel Reservation"
          >
            <Trash2 size={14} /> Cancel
          </button>
        ) : <span className="text-gray-400 text-xs font-semibold">—</span>}
      </td>
    </tr>
  );
}

function ReservationCard({ reservation, onDelete, isExpanded, onToggleExpand }) {
  const { bg, text, border, icon } = getStatusStyle(reservation.status);
  const canCancel = reservation.status === 'pending';

  return (
    <div className="border border-gray-100 rounded-xl p-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-[#1a0030]">{reservation.lab_name || 'Unspecified Lab'}</p>
          <p className="text-xs text-gray-500 mt-0.5">PC: {reservation.pc_number || 'Any'}</p>
        </div>
        <button onClick={onToggleExpand} className="text-gray-400 hover:text-gray-600">
          <MoreHorizontal size={20} />
        </button>
      </div>

      <div className="mt-2 flex items-center justify-between gap-2 flex-wrap">
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[0.68rem] font-bold ${bg} ${text} ${border}`}>
          {icon}
          {String(reservation.status).toLowerCase() === 'failed_to_appear' ? 'Absent' : String(reservation.status).charAt(0).toUpperCase() + String(reservation.status).slice(1)}
        </span>
        <p className="text-xs font-semibold text-gray-500">{formatDateTime(reservation.reservation_date, false)}</p>
      </div>

      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-[0.7rem] text-gray-400">Time: {reservation.time_from ? formatTime12h(reservation.time_from) : 'All Day'}</p>
          <p className="text-[0.7rem] text-gray-400">Submitted: {formatDateTime(reservation.created_at)}</p>
          {reservation.status === 'declined' && reservation.decline_reason && (
            <p className="text-[0.7rem] text-red-500 mt-1">Reason: {reservation.decline_reason}</p>
          )}

          <div className="mt-3 flex items-center gap-3">
            {canCancel && (
              <button
                onClick={() => onDelete(reservation)}
                className="flex items-center gap-1.5 text-red-600 hover:text-red-800 font-bold text-xs"
              >
                <Trash2 size={14} /> Cancel Reservation
              </button>
            )}
            <a href={`/student/history`} className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-bold text-xs">
              <ExternalLink size={14} /> View History
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
