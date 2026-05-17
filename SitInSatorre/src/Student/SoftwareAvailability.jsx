import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Database, Laptop } from 'lucide-react';
import { authService } from '../services/authService';
import LoadingScreen from '../components/LoadingScreen';

const PAGE_SIZE = 6; // Standard layout size for high-fidelity card grids

const STATUS_STYLES = {
  active: {
    bg: 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-400',
    icon: <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
  },
  inactive: {
    bg: 'bg-red-50 border-red-200 text-red-500 dark:bg-red-950/20 dark:border-red-900/30 dark:text-red-400',
    icon: <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
  }
};

const getStatusStyle = (status = '') => {
  const s = String(status).toLowerCase();
  return STATUS_STYLES[s] || STATUS_STYLES.inactive;
};

const formatInstallationDate = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric'
  });
};

export default function SoftwareAvailability() {
  const [softwareList, setSoftwareList] = useState([]);
  const [labList, setLabList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search & Filtering states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLab, setSelectedLab] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError('');
      try {
        // 1. Fetch Labs
        let labs = [];
        try {
          labs = await authService.fetchLabAvailability();
          setLabList(labs);
        } catch (err) {
          console.error('Error fetching labs', err);
        }

        // 2. Fetch Software
        let records = [];
        try {
          records = await authService.adminGetSoftware();
        } catch (err) {
          console.error('Error fetching software from server:', err);
          records = [];
        }
        setSoftwareList(records);
      } catch (err) {
        setError('Unable to fetch software records. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Compute unique categories
  const categories = useMemo(() => {
    return ['all', ...new Set(softwareList.map(s => s.category).filter(Boolean))];
  }, [softwareList]);

  // Filter Software List
  const filteredList = useMemo(() => {
    return softwareList.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            s.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'all' || s.category === selectedCategory;
      
      const matchesLab = selectedLab === 'all' || (s.labs && s.labs.some(l => {
        const labName = typeof l === 'object' && l !== null ? l.lab_name : l;
        return String(labName).toLowerCase().includes(selectedLab.toLowerCase());
      }));

      return matchesSearch && matchesCategory && matchesLab;
    });
  }, [softwareList, searchQuery, selectedCategory, selectedLab]);

  // Compute summary stats
  const stats = useMemo(() => {
    const total = softwareList.length;
    const active = softwareList.filter(s => String(s.status).toLowerCase() === 'active').length;
    const labsCount = labList.length || 6;
    return { total, active, labsCount };
  }, [softwareList, labList]);

  const totalPages = Math.max(1, Math.ceil(filteredList.length / PAGE_SIZE));
  const pagedSoftware = useMemo(() => {
    return filteredList.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  }, [filteredList, page]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, selectedCategory, selectedLab]);

  useEffect(() => {
    setPage(prev => Math.min(prev, totalPages));
  }, [totalPages]);

  if (isLoading && softwareList.length === 0) {
    return <LoadingScreen message="Syncing workstation catalog..." />;
  }

  return (
    <div className="pt-2 sm:pt-3 pb-4 sm:pb-6 px-1 sm:px-2 bg-transparent">
      <div className="max-w-380 mx-auto w-full flex flex-col gap-4">
        
        {/* ─── Header ─── */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-[0.62rem] font-black uppercase tracking-[0.2em] text-[#3c096c]/50">Student</p>
            <h1 className="text-3xl sm:text-4xl font-black text-[#1a0030] tracking-tight">Software Availability</h1>
          </div>
        </div>

        {/* ─── Stat Cards ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <StatCard label="Active Packages" value={stats.active} color="#ff9100" />
          <StatCard label="Total Categories" value={categories.length - 1} color="#3c096c" />
          <StatCard label="Supported Laboratories" value={stats.labsCount} color="#1a0030" />
        </div>

        {/* ─── Filters ─── */}
        <div className="bg-white border border-gray-100 rounded-2xl p-3 shadow-sm flex flex-col sm:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by Application or Category"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-transparent rounded-xl text-[0.8rem] font-bold text-[#1a0030] focus:outline-none focus:ring-2 focus:ring-[#3c096c]/10 focus:bg-white transition-all placeholder:text-gray-400"
            />
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3c096c]/50" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full sm:w-40 pl-9 pr-8 py-2.5 bg-gray-50 border border-transparent rounded-xl text-[0.7rem] font-black uppercase tracking-widest text-[#3c096c] focus:outline-none focus:ring-2 focus:ring-[#3c096c]/10 focus:bg-white transition-all appearance-none cursor-pointer"
              >
                <option value="all">All Categories</option>
                {categories.filter(c => c !== 'all').map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="relative flex-1 sm:flex-initial">
              <Database size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3c096c]/50" />
              <select
                value={selectedLab}
                onChange={(e) => setSelectedLab(e.target.value)}
                className="w-full sm:w-40 pl-9 pr-8 py-2.5 bg-gray-50 border border-transparent rounded-xl text-[0.7rem] font-black uppercase tracking-widest text-[#3c096c] focus:outline-none focus:ring-2 focus:ring-[#3c096c]/10 focus:bg-white transition-all appearance-none cursor-pointer"
              >
                <option value="all">All Labs</option>
                {labList.map(lab => (
                  <option key={lab.id} value={lab.lab_name}>{lab.lab_name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ─── Main Cards Grid Container ─── */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between px-1">
            <p className="text-xs font-black uppercase tracking-widest text-[#3c096c]/70">Workstation Catalog ({filteredList.length} matches)</p>
          </div>

          {error && <div className="p-8 text-center text-sm text-red-500 font-bold bg-white border border-gray-100 rounded-2xl shadow-sm">{error}</div>}
          {!error && filteredList.length === 0 && (
            <div className="p-12 text-center bg-white border border-gray-100 rounded-2xl shadow-sm">
              <Search size={32} className="mx-auto text-gray-200 mb-3" />
              <p className="text-sm text-gray-400 font-black uppercase tracking-widest">No matching applications found</p>
              <button
                onClick={() => { setSearchQuery(''); setSelectedCategory('all'); setSelectedLab('all'); }}
                className="mt-3 text-[#ff9100] text-xs font-black uppercase tracking-widest hover:underline"
              >
                Clear all filters
              </button>
            </div>
          )}

          {!error && filteredList.length > 0 && (
            <>
              {/* Premium Light Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {pagedSoftware.map(s => {
                  const { bg, text, border, icon } = getStatusStyle(s.status);
                  const isInactive = String(s.status).toLowerCase() === 'inactive';
                  return (
                    <div 
                      key={s.id} 
                      className={`group bg-white border rounded-2xl p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-purple-200/60 dark:hover:border-[#ff9100]/30 flex flex-col justify-between relative ${
                        isInactive ? 'border-gray-100 opacity-75 dark:border-zinc-800/50' : 'border-gray-150 dark:border-zinc-800/80'
                      }`}
                    >
                      {/* Upper Content */}
                      <div>
                        {/* Header Badge Row */}
                        <div className="flex justify-between items-center gap-2">
                          <span className="px-2.5 py-0.5 bg-[#3c096c]/05 border border-purple-100/50 text-[#3c096c] rounded-lg text-[0.62rem] font-black uppercase tracking-wider dark:bg-zinc-800/50 dark:border-zinc-700/60 dark:text-zinc-300">
                            {s.category}
                          </span>
                          
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[0.68rem] font-bold ${bg} ${text} ${border}`}>
                            {icon}
                            {s.status}
                          </span>
                        </div>

                        {/* Title and Avatar Details */}
                        <div className="flex items-center gap-3 mt-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${
                            isInactive 
                              ? 'bg-gray-50 border-gray-200 text-gray-400 dark:bg-zinc-800/40 dark:border-zinc-700 dark:text-zinc-500' 
                              : 'bg-[#3c096c]/05 border-purple-100 text-[#3c096c] group-hover:bg-[#ff9100]/10 group-hover:border-[#ff9100]/20 group-hover:text-[#ff9100] dark:bg-zinc-800/40 dark:border-zinc-700 dark:text-zinc-300'
                          }`}>
                            <Laptop size={18} />
                          </div>
                          <div>
                            <h3 className="text-base font-black text-[#1a0030] tracking-tight group-hover:text-[#3c096c] transition-colors leading-snug">{s.name}</h3>
                            <span className="text-[0.68rem] font-bold text-gray-400">v{s.version}</span>
                          </div>
                        </div>

                        {/* Description Block */}
                        <p className="text-xs text-gray-500 font-medium leading-relaxed mt-3.5 mb-4 line-clamp-3">
                          {s.description || 'No workstation profile description provided.'}
                        </p>
                      </div>

                      {/* Lower Content */}
                      <div>
                        <div className="border-t border-gray-100 my-3" />

                        {/* Specs & Dates Row */}
                        <div className="flex justify-between items-center text-[0.68rem] font-semibold text-gray-400 mb-3">
                          <span>License: <strong className="text-gray-700 font-bold dark:text-zinc-300">{s.license_type}</strong></span>
                          {s.installation_date && (
                            <span>Installed: <strong className="text-gray-700 font-bold dark:text-zinc-300">{formatInstallationDate(s.installation_date)}</strong></span>
                          )}
                        </div>

                        {/* Labs assignments */}
                        <div>
                          <span className="text-[0.62rem] font-bold text-gray-400 uppercase tracking-widest block mb-2">Available In:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {s.labs && s.labs.length > 0 ? (
                              s.labs.map((lab, i) => {
                                const labName = typeof lab === 'object' && lab !== null ? lab.lab_name : lab;
                                const isLabInactive = typeof lab === 'object' && lab !== null && String(lab.status).toLowerCase() === 'inactive';
                                return (
                                  <span
                                    key={i}
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[0.62rem] font-black border transition-all duration-300 ${
                                      isLabInactive
                                        ? 'bg-gray-50 border-gray-200 text-gray-400 line-through opacity-70 dark:bg-zinc-800/40 dark:border-zinc-700/50 dark:text-zinc-500'
                                        : 'bg-amber-50 border-amber-100 text-[#ff9100] dark:bg-amber-950/15 dark:border-amber-900/20 dark:text-[#ff9100]'
                                    }`}
                                    title={isLabInactive ? 'Currently Inactive in this lab' : 'Active in this lab'}
                                  >
                                    <span className={`w-1 h-1 rounded-full ${isLabInactive ? 'bg-gray-400' : 'bg-emerald-500 animate-pulse'}`} />
                                    {labName}
                                  </span>
                                );
                              })
                            ) : (
                              <span className="text-[0.68rem] font-bold text-gray-400 italic">No assigned laboratories.</span>
                            )}
                          </div>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>

              {/* Pagination controls */}
              {filteredList.length > PAGE_SIZE && (
                <div className="px-5 py-3 border border-gray-100 flex items-center justify-between bg-white rounded-2xl shadow-sm mt-2">
                  <p className="text-xs font-semibold text-gray-400">Page {page} of {totalPages}</p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-bold text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition-colors cursor-pointer"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-bold text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition-colors cursor-pointer"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  );
}

function StatCard({ label, value, color = '#3c096c', className = '' }) {
  return (
    <div className={`bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group ${className}`}>
      <p className={`text-[0.6rem] font-black uppercase tracking-[0.2em] text-gray-400 group-hover:text-[#3c096c] transition-colors ${className.includes('bg-black') ? 'group-hover:text-amber-400 text-gray-500' : ''}`}>{label}</p>
      <p className={`text-3xl font-black mt-1 ${className.includes('bg-black') ? 'text-white' : 'text-[#1a0030]'}`} style={{ color: !className.includes('bg-black') ? color : undefined }}>{value}</p>
    </div>
  );
}
