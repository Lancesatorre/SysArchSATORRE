import React, { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown, Calendar, Clock, Zap, Award, Search, RotateCcw, Filter, ChevronLeft, ChevronRight, CheckCircle, Server, Star, MessageSquare } from 'lucide-react';
import LoadingScreen from '../Components/LoadingScreen';
import { authService } from '../services/authService';

// ─── UTILITY FUNCTIONS ────────────────────────────────────────────────────────────────────────
const formatDuration = (minutes) => {
  if (!minutes) return '0h 0m';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
};

const formatTime = (timeString) => {
  if (!timeString) return '-';
  try {
    let timePortion = timeString;
    if (timeString.includes(' ')) {
      timePortion = timeString.split(' ')[1];
    } else if (timeString.includes('T')) {
      timePortion = timeString.split('T')[1];
    }

    const [hours, minutes] = timePortion.split(':');
    const h = parseInt(hours, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayHours = h % 12 || 12;
    const m = minutes.substring(0, 2);
    return `${displayHours}:${m} ${ampm}`;
  } catch (e) {
    return timeString.substring(0, 5);
  }
};

const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString.replace(/-/g, '/'));
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const formatHoursToHrsMins = (hoursVal) => {
  if (!hoursVal) return '0hrs 0m';
  const totalMinutes = Math.round(hoursVal * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}hrs ${m}m`;
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────────────────────
export default function SessionHistory() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'session_date', direction: 'desc' });
  const [filters, setFilters] = useState({
    lab: '',
    startDate: '',
    endDate: '',
    page: 1,
    perPage: 8
  });
  const [total, setTotal] = useState(0);
  const [labs, setLabs] = useState([]);
  const [stats, setStats] = useState({
    total_hours: 0,
    session_count: 0,
    average_duration: 0,
    longest_session: 0
  });
  const [feedbackModal, setFeedbackModal] = useState({ open: false, record: null });

  const openFeedbackModal = (row) => {
    setFeedbackModal({ open: true, record: row });
  };

  const closeFeedbackModal = () => {
    setFeedbackModal({ open: false, record: null });
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [filters, sortConfig]);

  const fetchStats = async () => {
    try {
      const user = authService.getUser();
      const idNumber = user?.id_number;
      if (!idNumber) return;

      const url = authService.getActionUrl('getStudentSitInSummary.php') + `?idNumber=${idNumber}`;
      const response = await fetch(url, {
        credentials: 'include'
      });
      const result = await response.json();
      if (result.success) {
        setStats(result.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchSessions = async () => {
    try {
      setLoading(true);
      setError(null);

      const user = authService.getUser();
      const idNumber = user?.id_number;

      const params = new URLSearchParams();
      if (idNumber) params.append('idNumber', idNumber);
      if (filters.lab) params.append('lab_name', filters.lab);
      if (filters.startDate) params.append('start_date', filters.startDate);
      if (filters.endDate) params.append('end_date', filters.endDate);
      params.append('page', filters.page);
      params.append('per_page', filters.perPage);
      params.append('sort_by', sortConfig.key);
      params.append('sort_order', sortConfig.direction);

      const url = authService.getActionUrl('getStudentSessions.php') + `?${params}`;
      const response = await fetch(url, {
        credentials: 'include'
      });
      const result = await response.json();

      if (result.success) {
        setSessions(result.data.sessions);
        setTotal(result.data.total_count);
        if (result.data.available_labs) {
          setLabs(result.data.available_labs);
        }
      } else {
        setError(result.message || 'Failed to load sessions');
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
      setError('Unable to load sessions. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };


  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key === 'page' ? value : 1
    }));
  };

  const resetFilters = () => {
    setFilters({
      lab: '',
      startDate: '',
      endDate: '',
      page: 1,
      perPage: 10
    });
  };

  const totalPages = Math.ceil(total / filters.perPage) || 1;

  if (loading && sessions.length === 0) {
    return <LoadingScreen message="Loading session history..." />;
  }

  return (
    <div className="pt-2 sm:pt-3 pb-4 sm:pb-6 px-1 sm:px-2 bg-transparent">
      <div className="max-w-380 mx-auto w-full flex flex-col gap-4">

        {/* ─── Header ─── */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-[0.62rem] font-black uppercase tracking-[0.2em] text-[#3c096c]/50">Student</p>
            <h1 className="text-3xl sm:text-4xl font-black text-[#1a0030] tracking-tight">Session History</h1>
          </div>
        </div>

        {/* ─── Summary Cards ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="Total Sit-In Time" value={formatHoursToHrsMins(stats.total_hours)} color="#3c096c" />
          <StatCard label="Completed Sessions" value={stats.session_count} color="black" />
          <StatCard label="Average Session" value={formatHoursToHrsMins(stats.average_duration)} color="#ff9100" />
          <StatCard label="Longest Session" value={formatHoursToHrsMins(stats.longest_session)} color="#3c096c" />
        </div>

        {/* ─── Filters ─── */}
        <div className="bg-white border border-gray-100 rounded-2xl p-3 shadow-sm flex flex-col lg:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full">
            <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <span className="absolute left-10 text-[0.65rem] font-black text-gray-400 uppercase tracking-widest top-1/2 -translate-y-1/2 pointer-events-none">From:</span>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="w-full pl-22 pr-4 py-2.5 bg-gray-50 border border-transparent rounded-xl text-[0.8rem] font-bold text-[#1a0030] focus:outline-none focus:ring-2 focus:ring-[#3c096c]/10 focus:bg-white transition-all"
            />
          </div>

          <div className="relative flex-1 w-full">
            <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <span className="absolute left-10 text-[0.65rem] font-black text-gray-400 uppercase tracking-widest top-1/2 -translate-y-1/2 pointer-events-none">To:</span>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="w-full pl-18 pr-4 py-2.5 bg-gray-50 border border-transparent rounded-xl text-[0.8rem] font-bold text-[#1a0030] focus:outline-none focus:ring-2 focus:ring-[#3c096c]/10 focus:bg-white transition-all"
            />
          </div>

          <div className="flex gap-2 w-full lg:w-auto">
            <div className="relative flex-1 lg:flex-initial">
              <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3c096c]/50" />
              <select
                value={filters.lab}
                onChange={(e) => handleFilterChange('lab', e.target.value)}
                className="w-full lg:w-44 pl-9 pr-8 py-2.5 bg-gray-50 border border-transparent rounded-xl text-[0.7rem] font-black uppercase tracking-widest text-[#3c096c] focus:outline-none focus:ring-2 focus:ring-[#3c096c]/10 focus:bg-white transition-all appearance-none cursor-pointer"
              >
                <option value="">All Labs</option>
                {labs.map(labName => (
                  <option key={labName} value={labName}>{labName}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ─── Error State ─── */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-xs font-bold flex items-center justify-between text-red-700">
            <p>{error}</p>
            <button
              onClick={fetchSessions}
              className="text-[0.62rem] font-black uppercase tracking-widest bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 transition"
            >
              Retry
            </button>
          </div>
        )}

        {/* ─── Sessions Log Table ─── */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="px-4 sm:px-5 py-3 border-b border-gray-100">
            <p className="text-sm font-bold text-[#1a0030]">My Session Logs</p>
          </div>

          {sessions.length === 0 ? (
            <div className="p-16 text-center">
              <Search size={48} className="mx-auto text-gray-200 mb-4" />
              <p className="font-black text-gray-400 uppercase tracking-[0.2em] text-xs">No check-in logs found</p>
              <p className="text-[0.7rem] text-gray-500 font-semibold mt-1">Check your date filters or complete a sit-in session to populate logs.</p>
            </div>
          ) : (
            <>
              {/* Desktop View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-225">
                  <thead className="bg-gray-50 text-[0.64rem] uppercase tracking-wider text-gray-500">
                    <tr className="border-b border-gray-100">
                      <TableHeader label="Date" sortKey="session_date" currentSort={sortConfig} onSort={handleSort} />
                      <TableHeader label="Time In" sortKey="time_in" currentSort={sortConfig} onSort={handleSort} />
                      <TableHeader label="Time Out" sortKey="time_out" currentSort={sortConfig} onSort={handleSort} />
                      <TableHeader label="Duration" sortKey="duration_minutes" currentSort={sortConfig} onSort={handleSort} />
                      <TableHeader label="PC No." sortKey="pc_number" currentSort={sortConfig} onSort={handleSort} />
                      <TableHeader label="Entry Type" sortKey="entry_type" currentSort={sortConfig} onSort={handleSort} />
                      <TableHeader label="Laboratory" sortKey="lab_name" currentSort={sortConfig} onSort={handleSort} />
                      <TableHeader label="Status" sortKey="status" currentSort={sortConfig} onSort={handleSort} />
                      <th className="px-4 py-3 select-none text-right pr-6">Admin Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map(session => (
                      <tr key={session.session_id} className="border-t border-gray-100 hover:bg-gray-50/50">
                        <td className="px-4 py-3 text-sm font-semibold text-[#1a0030]">{formatDate(session.session_date)}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{formatTime(session.time_in)}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{formatTime(session.time_out)}</td>
                        <td className="px-4 py-3 text-sm text-[#3c096c] underline decoration-wavy decoration-[#3c096c]/20 font-semibold">{formatDuration(session.duration_minutes)}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {session.pc_number ? (
                            <span className="bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded-lg border border-gray-150 text-xs font-semibold">
                              {session.pc_number.replace('PC-', '')}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs font-semibold">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${session.entry_type === 'Reservation'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-orange-50 text-orange-700 border-orange-200'
                            }`}>
                            {session.entry_type || 'Walk-in'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-[#1a0030]">
                          <div className="flex items-center gap-1.5">
                            <Server size={12} className="text-[#3c096c]/40" />
                            {session.lab_name}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 px-2.5 py-0.5 rounded-full text-xs font-bold">
                            {session.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-right pr-6">
                          {session.admin_feedback && session.admin_feedback.trim() !== '' ? (
                            <button
                              onClick={() => openFeedbackModal(session)}
                              className="text-[0.65rem] font-black uppercase tracking-widest px-3 py-1 rounded-lg border border-[#3c096c]/20 text-[#3c096c] hover:bg-[#3c096c]/5 transition-colors cursor-pointer hover:scale-105 active:scale-95 duration-200"
                            >
                              View
                            </button>
                          ) : (
                            <span className="text-gray-400 text-xs font-semibold">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile View */}
              <div className="md:hidden p-3 flex flex-col gap-2.5">
                {sessions.map(session => (
                  <MobileSessionCard
                    key={session.session_id}
                    session={session}
                    onFeedback={openFeedbackModal}
                  />
                ))}
              </div>

              {/* Pagination controls */}
              {total > 0 && (
                <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
                  <p className="text-xs font-semibold text-gray-400">
                    Showing <span className="text-[#3c096c]">{(filters.page - 1) * filters.perPage + 1}</span> to{' '}
                    <span className="text-[#3c096c]">{Math.min(filters.page * filters.perPage, total)}</span> of{' '}
                    <span className="text-[#3c096c]">{total}</span> check-ins
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleFilterChange('page', Math.max(1, filters.page - 1))}
                      disabled={filters.page === 1}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-bold text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => handleFilterChange('page', Math.min(totalPages, filters.page + 1))}
                      disabled={filters.page === totalPages}
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

        {/* ─── Feedback Modal ─── */}
        {feedbackModal.open && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && closeFeedbackModal()}>
            <div className="absolute inset-0 bg-[#1a0030]/60 backdrop-blur-sm" />
            <div className="relative bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col text-center" onClick={e => e.stopPropagation()}>
              <div className="w-12 h-12 bg-linear-to-br from-[#3c096c]/10 to-[#ff9100]/10 text-[#3c096c] rounded-full flex items-center justify-center mx-auto mb-4 shrink-0">
                <Server size={24} className="stroke-[2.5]" />
              </div>
              <h3 className="text-base font-black text-[#1a0030] uppercase tracking-tight mb-1">Session Feedback</h3>
              <p className="text-[0.62rem] text-gray-400 font-bold uppercase tracking-wider mb-4">
                Session #{feedbackModal.record?.session_id} · {feedbackModal.record?.lab_name}
              </p>

              <div className="bg-gray-50 border-2 border-gray-100 rounded-2xl px-4 py-3.5 text-left text-xs font-semibold text-gray-700 min-h-24 whitespace-pre-wrap mb-5 leading-relaxed">
                {String(feedbackModal.record?.admin_feedback || '').trim() || 'No feedback provided.'}
              </div>

              <button
                onClick={closeFeedbackModal}
                className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[0.7rem] font-black rounded-xl transition-all uppercase tracking-widest"
              >
                Close
              </button>
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
      <p className="text-3xl font-black mt-1 text-[#1a0030]" style={{ color: color }}>{value}</p>
    </div>
  );
}

function TableHeader({ label, sortKey, currentSort, onSort }) {
  const isActive = currentSort.key === sortKey;
  const isAsc = isActive && currentSort.direction === 'asc';

  return (
    <th
      onClick={() => onSort(sortKey)}
      className="px-4 py-3 cursor-pointer hover:bg-gray-100/50 transition-colors select-none"
    >
      <div className="flex items-center gap-1.5">
        {label}
        {isActive && (
          isAsc ? <ChevronUp size={12} className="text-[#ff9100]" /> : <ChevronDown size={12} className="text-[#ff9100]" />
        )}
      </div>
    </th>
  );
}

function MobileSessionCard({ session, onFeedback }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-gray-100 rounded-xl p-3 bg-white shadow-xs">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-bold text-[#1a0030]">{session.lab_name || 'Unspecified Lab'}</p>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">PC No: {session.pc_number ? session.pc_number.replace('PC-', '') : '—'}</p>
        </div>
        <button onClick={() => setExpanded(!expanded)} className="text-xs font-black uppercase tracking-wider text-gray-400 hover:text-gray-600 px-2 py-1">
          {expanded ? 'Less' : 'More'}
        </button>
      </div>

      <div className="mt-2 flex items-center justify-between gap-2 flex-wrap">
        <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 px-2.5 py-0.5 rounded-full text-[0.68rem] font-bold">
          {session.status}
        </span>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[0.65rem] font-bold border ${session.entry_type === 'Reservation'
            ? 'bg-blue-50 text-blue-700 border-blue-200'
            : 'bg-orange-50 text-orange-700 border-orange-200'
            }`}>
            {session.entry_type || 'Walk-in'}
          </span>
          <p className="text-xs font-semibold text-gray-500">{formatDate(session.session_date)}</p>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex flex-col gap-1.5">
          <p className="text-[0.7rem] text-gray-400 font-semibold">Time In: {formatTime(session.time_in)}</p>
          <p className="text-[0.7rem] text-gray-400 font-semibold">Time Out: {formatTime(session.time_out)}</p>
          <p className="text-[0.7rem] text-[#3c096c] font-black">Duration: {formatDuration(session.duration_minutes)}</p>

          {session.admin_feedback && session.admin_feedback.trim() !== '' && (
            <button
              onClick={() => onFeedback(session)}
              className="mt-2 w-full py-2 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 text-[0.65rem] font-black rounded-lg transition-all uppercase tracking-widest cursor-pointer"
            >
              View Admin Note
            </button>
          )}
        </div>
      )}
    </div>
  );
}
