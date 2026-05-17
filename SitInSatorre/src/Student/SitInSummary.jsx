import React, { useState, useEffect } from 'react';
import { Clock, BarChart3, Zap, Award } from 'lucide-react';
import { authService } from '../services/authService';

const SummaryCard = ({ icon: Icon, label, value, iconBg, iconColor }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
    <div className="flex items-center gap-4">
      <div className={`${iconBg} rounded-xl p-3 flex-shrink-0`}>
        <Icon className={`${iconColor} w-6 h-6`} />
      </div>
      <div>
        <p className="text-sm text-gray-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  </div>
);

export default function SitInSummary() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const user = authService.getUser();
      
      if (!user || !user.id_number) {
        setError('Unable to determine user identity');
        setLoading(false);
        return;
      }

      const data = await authService.fetchStudentSitInSummary(user.id_number);
      setStats(data);
    } catch (err) {
      setError(err.message || 'Unable to load statistics. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const formatDuration = (hours) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  if (loading && !stats) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3c096c]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
        <p className="text-red-800 text-sm font-medium">{error}</p>
        <button
          onClick={fetchStats}
          className="mt-2 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <SummaryCard
        icon={Clock}
        label="Total Hours"
        value={formatDuration(stats.total_hours)}
        iconBg="bg-[#3c096c]/10"
        iconColor="text-[#3c096c]"
      />
      <SummaryCard
        icon={BarChart3}
        label="Sessions"
        value={stats.session_count}
        iconBg="bg-[#ff9100]/10"
        iconColor="text-[#ff9100]"
      />
      <SummaryCard
        icon={Zap}
        label="Avg Duration"
        value={formatDuration(stats.average_duration)}
        iconBg="bg-yellow-100"
        iconColor="text-yellow-600"
      />
      <SummaryCard
        icon={Award}
        label="Longest Session"
        value={formatDuration(stats.longest_session)}
        iconBg="bg-green-100"
        iconColor="text-green-600"
      />
    </div>
  );
}
