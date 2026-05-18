import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Check, X, ShieldAlert, Award, Clock, ArrowLeft } from 'lucide-react';
import { authService } from '../services/authService';
import LoadingScreen from '../components/LoadingScreen';

// Reusable Avatar component
function Avatar({ first_name, last_name, profile_picture }) {
  const [imgError, setImgError] = useState(false);
  const initials = `${first_name?.[0] ?? ''}${last_name?.[0] ?? ''}`;

  if (profile_picture && !imgError) {
    return (
      <img
        src={profile_picture}
        alt={`${first_name} ${last_name}`}
        onError={() => setImgError(true)}
        className="w-9 h-9 rounded-xl object-cover flex-shrink-0 border-2 border-white shadow-sm"
      />
    );
  }

  return (
    <div className="w-9 h-9 rounded-xl bg-[#3c096c] flex items-center justify-center flex-shrink-0">
      <span className="text-white font-black text-xs uppercase">{initials}</span>
    </div>
  );
}

export default function Testimonials() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [testimonials, setTestimonials] = useState([]);
  const [filter, setFilter] = useState('all'); // all, pending, approved, declined
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 6;

  const fetchTestimonials = async () => {
    try {
      const result = await authService.adminListTestimonials();
      if (result.success) {
        setTestimonials(result.data || []);
      } else {
        setError(result.message || 'Failed to fetch testimonials');
      }
    } catch (err) {
      console.error('Error fetching testimonials:', err);
      setError(err.message || 'An error occurred while loading testimonials.');
    }
  };

  useEffect(() => {
    const user = authService.getUser();
    if (!user || user.role !== 'admin') {
      navigate('/login');
      return;
    }
    (async () => {
      await fetchTestimonials();
      setLoading(false);
    })();

    const intervalId = setInterval(() => {
      fetchTestimonials().catch(() => { });
    }, 10000);

    return () => clearInterval(intervalId);
  }, [navigate]);

  const handleModerate = async (id, status) => {
    try {
      setBusyId(id);
      setError('');
      setSuccess('');

      const result = await authService.adminModerateTestimonial(id, status);

      if (result.success) {
        setSuccess(`Testimonial has been successfully ${status}.`);
        await fetchTestimonials();
        window.dispatchEvent(new Event('pendingCountChanged'));
      } else {
        setError(result.message || 'Failed to update testimonial status');
      }
    } catch (err) {
      console.error('Error moderating testimonial:', err);
      setError(err.message || 'Failed to moderate testimonial. Please try again.');
    } finally {
      setBusyId(null);
    }
  };

  const filteredTestimonials = useMemo(() => {
    if (filter === 'all') return testimonials;
    return testimonials.filter(t => t.status === filter);
  }, [testimonials, filter]);

  const stats = useMemo(() => {
    return {
      total: testimonials.length,
      pending: testimonials.filter(t => t.status === 'pending').length,
      approved: testimonials.filter(t => t.status === 'approved').length,
      declined: testimonials.filter(t => t.status === 'declined').length
    };
  }, [testimonials]);

  const totalPages = Math.ceil(filteredTestimonials.length / PAGE_SIZE);
  const paginatedTestimonials = filteredTestimonials.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  if (loading) return <LoadingScreen message="Loading testimonials list..." />;

  return (
    <div className="py-6 px-2">
      <div className="max-w-[95rem] mx-auto flex flex-col gap-4">

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-[0.62rem] font-black uppercase tracking-[0.2em] text-[#3c096c]/40 mb-1">SYSTEM CONTROLS</p>
            <h1 className="text-4xl font-black text-[#1a0030] tracking-tight">Testimonial Moderation</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setError('');
                setSuccess('');
                fetchTestimonials();
              }}
              className="px-3 py-1.5 rounded-full bg-white border border-gray-100 shadow-sm text-xs font-bold text-gray-500 hover:border-[#3c096c]/30 hover:text-[#3c096c] transition-colors cursor-pointer"
            >
              Refresh List
            </button>
          </div>
        </div>

        {/* Status Metrics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm border-l-4">
            <p className="text-[0.6rem] font-black uppercase tracking-[0.25em] text-gray-400">Total Submissions</p>
            <p className="text-2xl font-black mt-1 text-[#1a0030]">{stats.total}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm border-l-4">
            <p className="text-[0.6rem] font-black uppercase tracking-[0.25em] text-amber-500">Pending</p>
            <p className="text-2xl font-black mt-1 text-amber-600">{stats.pending}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm border-l-4">
            <p className="text-[0.6rem] font-black uppercase tracking-[0.25em] text-green-500">Approved</p>
            <p className="text-2xl font-black mt-1 text-green-600">{stats.approved}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm border-l-4">
            <p className="text-[0.6rem] font-black uppercase tracking-[0.25em] text-red-500">Declined</p>
            <p className="text-2xl font-black mt-1 text-red-600">{stats.declined}</p>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-white border border-gray-100 rounded-2xl p-3 shadow-xs flex flex-wrap items-center gap-1.5">
          {['all', 'pending', 'approved', 'declined'].map((item) => (
            <button
              key={item}
              onClick={() => { setFilter(item); setCurrentPage(1); }}
              className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${filter === item
                ? 'bg-[#3c096c] text-white'
                : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
                }`}
            >
              {item} ({stats[item] ?? stats.total})
            </button>
          ))}
        </div>

        {/* Alert Notifications */}
        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <ShieldAlert size={16} className="text-red-500 shrink-0" />
            <p className="text-xs font-bold text-red-600">{error}</p>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
            <Check size={16} className="text-green-500 shrink-0" />
            <p className="text-xs font-bold text-green-700">{success}</p>
          </div>
        )}

        {/* Testimonials Grid Card Layout */}
        {filteredTestimonials.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
            <p className="text-gray-400 font-bold uppercase tracking-wider text-xs">
              No student testimonials found matching this filter.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {paginatedTestimonials.map((t) => (
                <div
                  key={t.id}
                  className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs flex flex-col justify-between gap-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
                >
                  {/* Header: Student Info & Date */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar first_name={t.first_name} last_name={t.last_name} profile_picture={t.profile_picture} />
                      <div className="min-w-0">
                        <p className="font-bold text-gray-800 text-sm truncate leading-snug">{t.first_name} {t.last_name}</p>
                        <p className="text-[0.68rem] text-gray-400 font-mono tracking-tight">{t.student_id_number} · {t.course}</p>
                      </div>
                    </div>
                    <span className="text-[0.62rem] font-semibold text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full whitespace-nowrap">
                      {new Date(t.created_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>

                  {/* Rating display */}
                  <div className="flex items-center gap-0.5 text-amber-500">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        className={i < t.rating ? 'fill-amber-400 stroke-amber-500' : 'stroke-gray-200 fill-transparent'}
                      />
                    ))}
                  </div>

                  {/* Feedback Review Body */}
                  <div className="relative bg-gray-50/50 rounded-xl p-3.5 flex-1 min-h-[5.5rem] border border-gray-100/50">
                    <span className="absolute -top-3.5 left-2 text-4xl text-[#3c096c]/08 font-serif pointer-events-none select-none">“</span>
                    <p className="text-xs text-gray-600 font-semibold leading-relaxed whitespace-pre-line italic relative z-10">
                      {t.feedback}
                    </p>
                  </div>

                  {/* Footer Controls & Status Badge */}
                  <div className="flex items-center justify-between gap-3 pt-3 border-t border-dashed border-gray-100 dark:border-zinc-800/80 mt-1">
                    {/* Status Badge */}
                    <div>
                      {t.status === 'approved' && (
                        <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-full text-[0.68rem] font-bold">
                          Approved
                        </span>
                      )}
                      {t.status === 'declined' && (
                        <span className="inline-flex items-center gap-1.5 bg-red-50 text-red-700 border border-red-200 px-2.5 py-1 rounded-full text-[0.68rem] font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                          Declined
                        </span>
                      )}
                      {t.status === 'pending' && (
                        <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full text-[0.68rem] font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          Pending
                        </span>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1.5">
                      {t.status === 'pending' ? (
                        <>
                          <button
                            onClick={() => handleModerate(t.id, 'approved')}
                            disabled={busyId !== null}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-green-200 text-green-600 bg-green-50/50 hover:bg-green-100 text-[0.68rem] font-black uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
                          >
                            <Check size={12} className="stroke-[2.5]" />
                            Approve
                          </button>
                          <button
                            onClick={() => handleModerate(t.id, 'declined')}
                            disabled={busyId !== null}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-red-200 text-red-500 bg-red-50/50 hover:bg-red-100 text-[0.68rem] font-black uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
                          >
                            <X size={12} className="stroke-[2.5]" />
                            Decline
                          </button>
                        </>
                      ) : (
                        <span className="text-xs text-gray-400 select-none font-bold uppercase tracking-widest font-mono mr-2">—</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-2 px-2">
                <p className="text-[0.65rem] font-black uppercase tracking-widest text-gray-400">
                  Page <span className="text-[#3c096c]">{currentPage}</span> of <span className="text-[#3c096c]">{totalPages}</span>
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-xs font-bold text-gray-500 hover:bg-gray-50 hover:text-[#1a0030] shadow-sm transition-all disabled:opacity-40 disabled:hover:bg-white cursor-pointer"
                  >
                    Prev
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-xs font-bold text-gray-500 hover:bg-gray-50 hover:text-[#1a0030] shadow-sm transition-all disabled:opacity-40 disabled:hover:bg-white cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
