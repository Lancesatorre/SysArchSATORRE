import React, { useState, useEffect, useRef, useContext } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import ccsLogo from '../assets/ccsmainlogo.png';
import { authService } from '../services/authService';
import { ThemeContext } from '../services/ThemeContext';
import LoadingScreen from './LoadingScreen';
import SessionRecordsModal from './SessionRecordsModal';

const formatNotificationTime = (dateValue) => {
  if (!dateValue) return 'Just now';
  const date = new Date(dateValue.replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return 'Just now';
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hour${diffHr > 1 ? 's' : ''} ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString();
};

const formatNotificationDateTime = (dateValue) => {
  if (!dateValue) return '—';
  const date = new Date(dateValue.replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Returns tag icon + color config based on notification tag
const getNotifStyle = (tag = '') => {
  const t = tag.toLowerCase();
  if (t.includes('sit')) return {
    bg: 'rgba(255,145,0,0.15)', stroke: '#ff9100',
    pillBg: 'rgba(255,145,0,0.15)', pillColor: '#ff9100',
    icon: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z',
    icon2: 'M14 2v6h6',
  };
  if (t.includes('reserv')) return {
    bg: 'rgba(74,222,128,0.12)', stroke: '#4ade80',
    pillBg: 'rgba(74,222,128,0.12)', pillColor: '#4ade80',
    icon: 'M22 11.08V12a10 10 0 11-5.93-9.14',
    icon2: 'M22 4L12 14.01l-3-3',
  };
  return {
    bg: 'rgba(100,100,120,0.15)', stroke: '#7b5fa8',
    pillBg: 'rgba(100,100,120,0.15)', pillColor: '#5a3f7a',
    icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
    icon2: null,
  };
};

const NavIcon = ({ d, cls = 'w-4 h-4' }) => (
  <svg className={cls} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
);

// Active-aware nav link
function NavLink({ to, children, onClick }) {
  const { pathname } = useLocation();
  const isActive = pathname === to || pathname.startsWith(to + '/');

  const getLinkIcon = (path) => {
    const p = path.toLowerCase();
    if (p.includes('dashboard')) return 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6';
    if (p.includes('history')) return 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z';
    if (p.includes('reservation')) return 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z';
    if (p.includes('software')) return 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z';
    if (p.includes('report')) return 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z';
    if (p.includes('testimonial')) return 'M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z';
    return null;
  };

  const iconD = getLinkIcon(to);

  return (
    <Link
      to={to}
      onClick={onClick}
      style={{
        borderBottom: isActive ? '2.5px solid #ff9100 ' : '',
        fontWeight: isActive ? 600 : 500,
      }}
      className={`transition duration-300 px-2 xl:px-3 rounded-2xl flex items-center gap-1 xl:gap-1.5 pb-0.5 text-xs xl:text-sm font-semibold shrink-0 ${isActive ? 'text-[#ff9100]' : 'text-white hover:text-[#ff9100]'
        }`}
    >
      {iconD && <NavIcon d={iconD} cls='w-4 h-4 shrink-0' />}
      {children}
    </Link>
  );
}

export default function Navbar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [activeSection, setActiveSection] = useState('home');

  const handleSectionClick = (e, sectionId) => {
    e.preventDefault();
    if (pathname === '/') {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else {
      navigate('/');
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 150);
    }
  };

  useEffect(() => {
    if (pathname !== '/') {
      setActiveSection('');
      return;
    }

    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -50% 0px', // detects when section is in viewport view
      threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    }, observerOptions);

    const sections = ['about', 'testimonials', 'faqs'];
    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    const handleScroll = () => {
      if (window.scrollY < 100) {
        setActiveSection('home');
      }
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
    };
  }, [pathname]);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [sitInOpen, setSitInOpen] = useState(false);
  const [announcementOpen, setAnnouncementOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  const navRef = useRef(null);
  const profileRef = useRef(null);
  const notifRef = useRef(null);
  const sitInRef = useRef(null);
  const announcementRef = useRef(null);
  const sessionRef = useRef(null);
  const [sessionDropdownOpen, setSessionDropdownOpen] = useState(false);
  const [sessionModalOpen, setSessionModalOpen] = useState(false);
  const [hasActiveSession, setHasActiveSession] = useState(false);
  const [pendingReservationCount, setPendingReservationCount] = useState(0);
  const [pendingTestimonialCount, setPendingTestimonialCount] = useState(0);

  useEffect(() => {
    const syncUser = () => {
      setIsLoggedIn(authService.isLoggedIn());
      if (authService.isLoggedIn()) {
        const sessionUser = authService.getUser();
        setUser(sessionUser);
        if (sessionUser?.id_number && sessionUser?.role !== 'admin') {
          loadNotifications(sessionUser, false);
          checkActiveSessionStatus(sessionUser);
        }
      } else {
        setUser(null);
      }
    };

    syncUser();

    window.addEventListener('storage', syncUser);
    return () => {
      window.removeEventListener('storage', syncUser);
    };
  }, []);

  const checkActiveSessionStatus = async (activeUser = user) => {
    if (!activeUser?.id_number || activeUser?.role === 'admin') {
      setHasActiveSession(false);
      return;
    }
    try {
      const response = await authService.fetchStudentCurrentSession(activeUser.id_number);
      setHasActiveSession(!!response.active_session);
    } catch (_) {
      setHasActiveSession(false);
    }
  };

  const loadPendingReservationCount = async () => {
    try {
      const url = authService.getActionUrl('adminPendingReservationCount.php');
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) setPendingReservationCount(data.pending_count || 0);
    } catch (_) {
      // silently fail — badge stays at 0
    }
  };

  const loadPendingTestimonialCount = async () => {
    try {
      const url = authService.getActionUrl('adminPendingTestimonialCount.php');
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) setPendingTestimonialCount(data.pending_count || 0);
    } catch (_) {
      // silently fail — badge stays at 0
    }
  };

  const loadNotifications = async (activeUser = user, showLoader = true) => {
    if (!activeUser?.id_number) return;
    if (showLoader) {
      setNotificationsLoading(true);
    }
    try {
      // Fetch both types of notifications
      const [globalRes, personalRes] = await Promise.all([
        authService.fetchNotifications(activeUser.id_number),
        authService.getPersonalNotifications(activeUser.id_number)
      ]);

      const globalLogs = (globalRes.notifications || []).map(n => ({ ...n, is_personal: false }));
      const personalLogs = (personalRes.data || []).map(n => ({ ...n, is_personal: true, tag: 'Reservation' }));

      // Merge and sort
      const merged = [...globalLogs, ...personalLogs].sort((a, b) =>
        new Date(b.created_at) - new Date(a.created_at)
      );

      const totalUnread = merged.filter(n => Number(n.is_read) === 0).length;

      setNotifications(merged);
      setUnreadCount(totalUnread);
    } catch (_) {
      if (showLoader) {
        setNotifications([]);
        setUnreadCount(0);
      }
    } finally {
      if (showLoader) {
        setNotificationsLoading(false);
      }
    }
  };

  const markNotificationAsRead = async (notification) => {
    if (!user?.id_number || !notification?.id) return;

    const alreadyRead = Number(notification.is_read || 0) === 1;
    if (alreadyRead) return;

    // Optimistic update
    setNotifications(prev => prev.map((item) => (
      String(item.id) === String(notification.id) && item.is_personal === notification.is_personal
        ? { ...item, is_read: 1 }
        : item
    )));
    setUnreadCount((prev) => Math.max(0, Number(prev || 0) - 1));

    try {
      if (notification.is_personal) {
        await authService.markPersonalAlertRead(user.id_number, notification.id);
      } else {
        await authService.markNotificationRead({
          idNumber: user.id_number,
          notificationId: notification.id,
        });
      }
    } catch (_) {
      // Revert on error
      setNotifications(prev => prev.map((item) => (
        String(item.id) === String(notification.id) && item.is_personal === notification.is_personal
          ? { ...item, is_read: 0 }
          : item
      )));
      setUnreadCount((prev) => Number(prev || 0) + 1);
    }
  };

  const handleOpenNotification = (item) => {
    setSelectedNotification(item);
    setNotificationOpen(false);
    markNotificationAsRead(item);
  };

  const handleMarkAllNotificationsRead = async () => {
    if (!user?.id_number) return;

    const snapshot = notifications;
    const snapshotUnread = unreadCount;

    setNotifications((prev) => prev.map((item) => ({ ...item, is_read: 1 })));
    setUnreadCount(0);

    try {
      await Promise.all([
        authService.markAllNotificationsRead(user.id_number),
        authService.markAllPersonalAlertsRead(user.id_number)
      ]);
    } catch (_) {
      setNotifications(snapshot);
      setUnreadCount(snapshotUnread);
    }
  };

  useEffect(() => {
    if (!isLoggedIn || !user?.id_number || user?.role === 'admin') return undefined;

    let cancelled = false;
    const refreshNotifications = async () => {
      if (cancelled) return;
      await Promise.all([
        loadNotifications(user, false),
        checkActiveSessionStatus(user)
      ]);
    };

    const intervalId = setInterval(refreshNotifications, 10000);
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshNotifications();
      }
    };

    window.addEventListener('focus', refreshNotifications);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
      window.removeEventListener('focus', refreshNotifications);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isLoggedIn, user?.id_number, user?.role]);

  // Admin: Poll pending reservation + testimonial counts every 5 seconds for live real-time updates
  useEffect(() => {
    if (!isLoggedIn || user?.role !== 'admin') return undefined;

    const handleUpdate = () => {
      loadPendingReservationCount();
      loadPendingTestimonialCount();
    };

    handleUpdate();

    const intervalId = setInterval(handleUpdate, 5000);
    window.addEventListener('pendingCountChanged', handleUpdate);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('pendingCountChanged', handleUpdate);
    };
  }, [isLoggedIn, user?.role]);

  useEffect(() => {
    if (!selectedNotification) return;

    const updated = notifications.find((item) => String(item.id) === String(selectedNotification.id));
    if (updated) {
      setSelectedNotification(updated);
    }
  }, [notifications, selectedNotification?.id]);

  useEffect(() => {
    if (!selectedNotification) return undefined;

    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        setSelectedNotification(null);
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleEsc);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener('keydown', handleEsc);
    };
  }, [selectedNotification]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) setMobileMenuOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotificationOpen(false);
      if (sitInRef.current && !sitInRef.current.contains(e.target)) setSitInOpen(false);
      if (announcementRef.current && !announcementRef.current.contains(e.target)) setAnnouncementOpen(false);
      if (sessionRef.current && !sessionRef.current.contains(e.target)) setSessionDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setLogoutLoading(true);
    setTimeout(() => {
      authService.logout();
      setIsLoggedIn(false);
      setUser(null);
      setLogoutLoading(false);
      navigate('/login');
    }, 800);
  };

  const displayName = user
    ? user.role === 'admin'
      ? 'Admin'
      : `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() || 'Student'
    : 'Student';

  const roleLabel = user?.role === 'admin' ? 'Admin' : 'Student';
  const isAdmin = user?.role === 'admin';
  const dashboardPath = user?.role === 'admin' ? '/admin/dashboard' : '/student/dashboard';
  const profilePath = user?.role === 'admin' ? '/admin/dashboard' : '/student/profile';
  const closeMobileMenu = () => setMobileMenuOpen(false);

  // Helper: is a given path or any of its sub-paths active?
  const isPathActive = (to) => pathname === to || pathname.startsWith(to + '/');

  // Dropdown button active style (for Sit In / Announcement / Notifications)
  const dropdownActiveStyle = (subPaths = []) => {
    const active = subPaths.some(isPathActive);
    return {
      color: active ? '#ff9100' : undefined,
      borderBottom: active ? '2.5px solid #ff9100' : '',
      paddingBottom: active ? '2px' : undefined,
      fontWeight: active ? 0 : undefined,
    };
  };

  return (
    <>
      {logoutLoading && (
        <div className="fixed inset-0 bg-white/75 dark:bg-zinc-950/75 backdrop-blur-md z-50 flex items-center justify-center animate-fade-in">
          <LoadingScreen message="Logging out..." />
        </div>
      )}
      <nav ref={navRef} className='sticky top-4 sm:top-5 z-40 min-h-[5vh] mx-3 sm:mx-4 md:mx-6 lg:mx-8 xl:mx-16 bg-[#3c096c]/90 backdrop-blur-md flex justify-between shadow-md shadow-[#ff9100]/20 items-center rounded-3xl px-3 sm:px-6 lg:px-8 mb-5 transition-all duration-300'>
        <Link
          to={isLoggedIn ? dashboardPath : "/"}
          className='flex items-center justify-start flex-row gap-2 sm:gap-3 shrink-0 group cursor-pointer'
          onClick={() => {
            if (!isLoggedIn && pathname === '/') {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
        >
          <img src={ccsLogo} alt="CCS Logo" className='rounded-md h-8 w-8 border border-[#240046] shrink-0 group-hover:scale-105 transition-transform duration-300' />
          <h1 className='font-bold text-base sm:text-lg text-white tracking-wider whitespace-nowrap shrink-0 group-hover:text-[#ff9100] transition duration-300'>
            Sit-inIT
          </h1>
        </Link>

        <div className='hidden xl:flex gap-2 xl:gap-3 justify-center items-center'>
          {!isLoggedIn ? (
            <>
              <div className='text-white flex justify-center items-center gap-10'>
                <Link
                  to="/"
                  onClick={() => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  style={{
                    borderBottom: activeSection === 'home' ? '2.5px solid #ff9100' : '',
                    fontWeight: activeSection === 'home' ? 600 : 500,
                  }}
                  className={`transition duration-300 px-3 pb-0.5 flex items-center gap-1.5 ${activeSection === 'home' ? 'text-[#ff9100] rounded-2xl' : 'text-white hover:text-[#ff9100] rounded-t-2xl rounded-b-none'
                    }`}
                >
                  <NavIcon d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" cls="w-4 h-4 shrink-0" />
                  Home
                </Link>
                <a
                  href="/#about"
                  onClick={(e) => handleSectionClick(e, 'about')}
                  style={{
                    borderBottom: activeSection === 'about' ? '2.5px solid #ff9100' : '',
                    fontWeight: activeSection === 'about' ? 600 : 500,
                  }}
                  className={`transition duration-300 px-3 pb-0.5 flex items-center gap-1.5 ${activeSection === 'about' ? 'text-[#ff9100] rounded-2xl' : 'text-white hover:text-[#ff9100] rounded-t-2xl rounded-b-none'
                    }`}
                >
                  <NavIcon d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" cls="w-4 h-4 shrink-0" />
                  About
                </a>
                <a
                  href="/#faqs"
                  onClick={(e) => handleSectionClick(e, 'faqs')}
                  style={{
                    borderBottom: activeSection === 'faqs' ? '2.5px solid #ff9100' : '',
                    fontWeight: activeSection === 'faqs' ? 600 : 500,
                  }}
                  className={`transition duration-300 px-3 pb-0.5 flex items-center gap-1.5 ${activeSection === 'faqs' ? 'text-[#ff9100] rounded-2xl' : 'text-white hover:text-[#ff9100] rounded-t-2xl rounded-b-none'
                    }`}
                >
                  <NavIcon d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" cls="w-4 h-4 shrink-0" />
                  FAQs
                </a>
                <a
                  href="/#testimonials"
                  onClick={(e) => handleSectionClick(e, 'testimonials')}
                  style={{
                    borderBottom: activeSection === 'testimonials' ? '2.5px solid #ff9100' : '',
                    fontWeight: activeSection === 'testimonials' ? 600 : 500,
                  }}
                  className={`transition duration-300 px-3 pb-0.5 flex items-center gap-1.5 ${activeSection === 'testimonials' ? 'text-[#ff9100] rounded-2xl' : 'text-white hover:text-[#ff9100] rounded-t-2xl rounded-b-none'
                    }`}
                >
                  <NavIcon d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" cls="w-4 h-4 shrink-0" />
                  Testimonials
                </a>
              </div>
            </>
          ) : (
            <>
              <div className='text-white flex justify-center items-center gap-1.5 xl:gap-3 py-4'>
                <NavLink to={dashboardPath}>Home</NavLink>

                {user?.role === 'admin' ? (
                  <div ref={sitInRef} className='relative'>
                    <button
                      onClick={() => setSitInOpen(!sitInOpen)}
                      style={dropdownActiveStyle(['/admin/search-student', '/admin/current-sessions', '/admin/sit-in-records'])}
                      className='hover:text-[#ff9100] transition duration-300 flex items-center gap-1 xl:gap-1.5 px-2 xl:px-3 rounded-2xl pb-0.5 text-xs xl:text-sm font-semibold shrink-0'
                    >
                      <NavIcon d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" cls="w-4 h-4 shrink-0" />
                      Sit In
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${sitInOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {sitInOpen && (
                      <div className='absolute left-1/2 -translate-x-1/2 top-full mt-2 w-64 bg-[#140828] rounded-2xl shadow-xl z-50 border border-[#7b2cbf]/45 overflow-hidden'>
                        <div className='px-4 py-3 border-b border-[#7b2cbf]/30 bg-linear-to-r from-[#3c096c] to-[#5a189a]'>
                          <p className='text-[0.65rem] uppercase tracking-widest text-[#e0aaff] font-black'>Sit-in Management</p>
                        </div>
                        <div className='p-2.5 flex flex-col gap-1.5'>
                          {[
                            { to: '/admin/search-student', icon: 'M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z', label: 'Search Student' },
                            { to: '/admin/current-sessions', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', label: 'Current Sessions' },
                            { to: '/admin/sit-in-records', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2z', label: 'Sit-in Records' },
                          ].map(({ to, icon, label }) => (
                            <Link
                              key={to}
                              to={to}
                              onClick={() => setSitInOpen(false)}
                              style={isPathActive(to) ? { background: 'rgba(157,78,221,0.2)', color: '#ff9100', borderLeft: '3px solid #ff9100' } : {}}
                              className='flex items-center gap-2 px-3 py-2.5 rounded-lg text-[#e9d5ff] font-semibold text-sm hover:bg-[#3c096c] hover:text-white transition duration-300'
                            >
                              <NavIcon d={icon} cls='w-4 h-4' />
                              {label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <NavLink to="/student/history">History</NavLink>
                    <NavLink to="/student/reservation">Reservation</NavLink>
                    <NavLink to="/student/software-availability">Software</NavLink>
                    <NavLink to="/student/testimonials">Testimonials</NavLink>
                  </>
                )}

                {isAdmin && (
                  <div className="relative">
                    <NavLink to="/admin/reservations">Reservation</NavLink>
                    {pendingReservationCount > 0 && (
                      <span className="absolute -top-2 -right-1 min-w-[18px] h-[18px] px-1 bg-[#ff9100] text-white text-[0.6rem] font-black rounded-full flex items-center justify-center shadow-sm shadow-[#ff9100]/40 animate-pulse">
                        {pendingReservationCount > 99 ? '99+' : pendingReservationCount}
                      </span>
                    )}
                  </div>
                )}
                {isAdmin && <NavLink to="/admin/software-management">Software</NavLink>}
                {isAdmin && <NavLink to="/admin/generate-reports">Reports</NavLink>}
                {isAdmin && (
                  <div className="relative">
                    <NavLink to="/admin/testimonials">Testimonials</NavLink>
                    {pendingTestimonialCount > 0 && (
                      <span className="absolute -top-2 -right-1 min-w-[18px] h-[18px] px-1 bg-[#ff9100] text-white text-[0.6rem] font-black rounded-full flex items-center justify-center shadow-sm shadow-[#ff9100]/40 animate-pulse">
                        {pendingTestimonialCount > 99 ? '99+' : pendingTestimonialCount}
                      </span>
                    )}
                  </div>
                )}

                {isAdmin ? (
                  <div ref={announcementRef} className='relative'>
                    <button
                      onClick={() => setAnnouncementOpen(!announcementOpen)}
                      style={dropdownActiveStyle(['/admin/create-announcement', '/admin/announcement-records'])}
                      className='hover:text-[#ff9100] transition duration-300 flex items-center gap-1 xl:gap-1.5 px-2 xl:px-3 rounded-2xl pb-0.5 text-xs xl:text-sm font-semibold shrink-0'
                    >
                      <NavIcon d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" cls="w-4 h-4 shrink-0" />
                      Announcement
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${announcementOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {announcementOpen && (
                      <div className='absolute right-0 top-full mt-2 w-60 bg-[#140828] rounded-2xl shadow-xl z-50 border border-[#7b2cbf]/45 overflow-hidden'>
                        <div className='px-4 py-3 border-b border-[#7b2cbf]/30 bg-linear-to-r from-[#3c096c] to-[#5a189a]'>
                          <p className='text-[0.65rem] uppercase tracking-widest text-[#e0aaff] font-black'>Announcement Menu</p>
                        </div>
                        <div className='p-2.5 flex flex-col gap-1.5'>
                          {[
                            { to: '/admin/create-announcement', icon: 'M12 4v16m8-8H4', label: 'Create Announcement' },
                            { to: '/admin/announcement-records', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2z', label: 'Announcement Records' },
                          ].map(({ to, icon, label }) => (
                            <Link
                              key={to}
                              to={to}
                              onClick={() => setAnnouncementOpen(false)}
                              style={isPathActive(to) ? { background: 'rgba(157,78,221,0.2)', color: '#ff9100', borderLeft: '3px solid #ff9100' } : {}}
                              className='flex items-center gap-2 px-3 py-2.5 rounded-lg text-[#e9d5ff] font-semibold text-sm hover:bg-[#3c096c] hover:text-white transition duration-300'
                            >
                              <NavIcon d={icon} cls='w-4 h-4' />
                              {label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* ── REDESIGNED NOTIFICATIONS DROPDOWN ── */
                  <div ref={notifRef} className='relative'>
                    <button
                      onClick={() => {
                        const next = !notificationOpen;
                        setNotificationOpen(next);
                        if (next) loadNotifications();
                      }}
                      className='hover:text-[#ff9100] transition duration-300 flex items-center gap-1 xl:gap-1.5 relative pb-0.5 text-xs xl:text-sm font-semibold shrink-0'
                    >
                      <NavIcon d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" cls="w-4 h-4 shrink-0" />
                      Notifications
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${notificationOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                      {unreadCount > 0 && (
                        <span className='absolute -top-3 -right-3 min-w-5 h-5 px-1 bg-[#ff9100] text-white text-xs font-bold rounded-full flex items-center justify-center'>
                          {unreadCount}
                        </span>
                      )}
                    </button>

                    {notificationOpen && (
                      <div className='absolute right-0 top-full mt-2 w-88 bg-[#120723] border border-[#7b2cbf]/40 rounded-2xl overflow-hidden z-50 shadow-2xl shadow-black/40'>
                        <div className='px-4 py-3 bg-linear-to-r from-[#3c096c] to-[#5a189a] border-b border-[#7b2cbf]/30 flex items-center justify-between'>
                          <div className='flex items-center gap-2'>
                            <span className='w-7 h-7 rounded-lg bg-white/10 text-[#e9d5ff] flex items-center justify-center'>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                              </svg>
                            </span>
                            <p className='text-sm font-black text-white'>Notifications</p>
                            {unreadCount > 0 && (
                              <span className='text-[0.62rem] font-black uppercase tracking-wider text-[#ff9100] bg-[#ff9100]/15 border border-[#ff9100]/35 px-2 py-0.5 rounded-full'>
                                {unreadCount} New
                              </span>
                            )}
                          </div>
                          <button
                            onClick={handleMarkAllNotificationsRead}
                            className='text-[0.7rem] font-bold text-[#c77dff] hover:text-[#ff9100] transition'
                          >
                            Mark all read
                          </button>
                        </div>

                        <div className='max-h-90 overflow-y-auto p-2.5 flex flex-col gap-2 bg-[#140828]'>
                          {notificationsLoading && (
                            <div className='px-3 py-4 text-sm text-[#c4b5d8] text-center'>Loading notifications…</div>
                          )}

                          {!notificationsLoading && notifications.length === 0 && (
                            <div className='px-3 py-6 text-sm text-[#9b80b8] text-center'>No notifications yet.</div>
                          )}

                          {!notificationsLoading && notifications.map((item, idx) => {
                            const style = getNotifStyle(item.tag);
                            return (
                              <button
                                key={item.id || idx}
                                type='button'
                                onClick={() => handleOpenNotification(item)}
                                className={`border rounded-xl p-3 flex gap-3 transition-colors ${Number(item.is_read || 0) === 1 ? 'bg-[#1e1035] border-[#7b2cbf]/15 hover:bg-[#25113f]' : 'bg-[#24123f] border-[#7b2cbf]/25 hover:bg-[#2a1547] hover:border-[#c77dff]/45'}`}
                              >
                                <div className='relative shrink-0'>
                                  {item.is_personal ? (
                                    <div
                                      className={`w-9 h-9 rounded-lg flex items-center justify-center border ${item.type === 'reservation_approved'
                                        ? 'bg-green-500/10 border-green-500/20 text-green-400'
                                        : 'bg-red-500/10 border-red-500/20 text-red-400'
                                        }`}
                                    >
                                      {item.type === 'reservation_approved' ? (
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                      ) : (
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                      )}
                                    </div>
                                  ) : (
                                    <div className='w-9 h-9 rounded-lg bg-[#3c096c] text-white text-[0.58rem] font-black flex items-center justify-center border border-[#7b2cbf]/20'>CCS</div>
                                  )}
                                  {Number(item.is_read || 0) === 0 && (
                                    <span className='absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#ff9100] border border-[#140828]' />
                                  )}
                                </div>

                                <div className='min-w-0 flex-1 text-left'>
                                  <div className='flex items-center justify-between gap-2'>
                                    <p className='text-xs font-black uppercase tracking-wider text-[#e9d5ff]'>CCS ADMIN</p>
                                    <span className='text-[0.64rem] text-[#a78bca] shrink-0'>{formatNotificationTime(item.created_at)}</span>
                                  </div>
                                  <p className='text-sm font-bold text-[#f3e8ff] mt-1 truncate'>{item.title || 'Notification'}</p>
                                  <p className='text-xs text-[#d4c6ea] mt-1 line-clamp-2'>{item.message}</p>
                                  {item.tag && (
                                    <span
                                      className='inline-block mt-1.5 text-[0.62rem] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border'
                                      style={{ background: style.pillBg, color: style.pillColor, borderColor: style.pillColor + '40' }}
                                    >
                                      {item.tag}
                                    </span>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        <div className='px-4 py-2.5 border-t border-[#7b2cbf]/30 bg-[#120723] text-center'>
                          <button
                            onClick={() => loadNotifications()}
                            className='text-xs font-bold text-[#c77dff] hover:text-[#ff9100] transition'
                          >
                            Refresh
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {isLoggedIn && !isAdmin && hasActiveSession && (
                <button
                  onClick={() => setSessionModalOpen(true)}
                  title="Active Session Tracker"
                  className="relative w-[38px] h-[38px] rounded-[10px] bg-linear-to-br from-[#ff9100]/25 to-[#3c096c]/25 hover:from-[#ff9100]/35 hover:to-[#3c096c]/35 text-white hover:text-[#ff9100] border border-[#ff9100]/30 hover:border-[#ff9100]/60 flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer shadow-md shadow-[#ff9100]/10 ml-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-[18px] h-[18px] stroke-[2.2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <rect x="2" y="3" width="20" height="14" rx="2" />
                    <line x1="8" y1="21" x2="16" y2="21" />
                    <line x1="12" y1="17" x2="12" y2="21" />
                  </svg>
                </button>
              )}

              <div ref={profileRef} className='relative ml-2'>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  style={{
                    width: '38px', height: '38px', borderRadius: '10px',
                    background: 'linear-gradient(135deg, #9d4edd, #5a189a)',
                    border: profileOpen ? '1.5px solid #c77dff' : '1.5px solid rgba(199,125,255,0.4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', transition: 'border-color 0.15s', flexShrink: 0,
                  }}
                >
                  {user?.profile_picture ? (
                    <img src={user.profile_picture} alt="Avatar" className="w-full h-full object-cover rounded-[10px]" />
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#e9d5ff">
                      <path fillRule="evenodd" d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>

                {profileOpen && (
                  <div style={{
                    position: 'absolute', right: 0, top: 'calc(100% + 10px)',
                    width: '224px', background: '#140828',
                    border: '1px solid rgba(157,78,221,0.25)', borderRadius: '14px',
                    overflow: 'hidden', zIndex: 99, boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                  }}>
                    <div style={{
                      padding: '14px 16px 12px', borderBottom: '1px solid rgba(157,78,221,0.15)',
                      display: 'flex', alignItems: 'center', gap: '12px',
                    }}>
                      <div style={{ position: 'relative', flexShrink: 0 }}>
                        <div style={{
                          width: '40px', height: '40px', borderRadius: '10px',
                          background: 'linear-gradient(135deg, #9d4edd, #5a189a)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          border: '1.5px solid rgba(199,125,255,0.35)',
                        }}>
                          {user?.profile_picture ? (
                            <img src={user.profile_picture} alt="Avatar" className="w-full h-full object-cover rounded-[10px]" />
                          ) : (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="#e9d5ff">
                              <path fillRule="evenodd" d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <span style={{
                          position: 'absolute', bottom: '-2px', right: '-2px',
                          width: '10px', height: '10px', borderRadius: '50%',
                          background: '#4ade80', border: '2px solid #140828',
                        }} />
                      </div>
                      <div style={{ overflow: 'hidden' }}>
                        <p style={{
                          fontSize: '13.5px', fontWeight: 600, color: '#e9d5ff',
                          margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>{displayName}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '3px' }}>
                          <span style={{
                            fontSize: '10px', fontWeight: 600, color: '#c77dff',
                            background: 'rgba(157,78,221,0.18)', border: '1px solid rgba(157,78,221,0.3)',
                            borderRadius: '20px', padding: '1px 7px',
                          }}>{roleLabel}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ padding: '6px' }}>
                      {user?.role !== 'admin' && (
                        <ProfileMenuItem to={profilePath} icon={
                          <svg viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" clipRule="evenodd" /></svg>
                        } onClick={() => setProfileOpen(false)}>Profile</ProfileMenuItem>
                      )}


                      <div style={{ height: '1px', background: 'rgba(157,78,221,0.12)', margin: '4px 0' }} />

                      <button
                        onClick={handleLogout}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                          padding: '9px 10px', borderRadius: '8px', border: 'none',
                          fontSize: '13px', fontWeight: 500, color: '#f87171',
                          background: 'transparent', cursor: 'pointer', textAlign: 'left',
                          transition: 'background 0.12s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <span style={{ opacity: 0.8, display: 'flex', alignItems: 'center' }}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                            <path fillRule="evenodd" d="M7.5 3.75A1.5 1.5 0 0 0 6 5.25v13.5a1.5 1.5 0 0 0 1.5 1.5h6a1.5 1.5 0 0 0 1.5-1.5V15a.75.75 0 0 1 1.5 0v3.75a3 3 0 0 1-3 3h-6a3 3 0 0 1-3-3V5.25a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3V9A.75.75 0 0 1 15 9V5.25a1.5 1.5 0 0 0-1.5-1.5h-6Zm10.72 4.72a.75.75 0 0 1 1.06 0l3 3a.75.75 0 0 1 0 1.06l-3 3a.75.75 0 1 1-1.06-1.06l1.72-1.72H9a.75.75 0 0 1 0-1.5h10.94l-1.72-1.72a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                          </svg>
                        </span>
                        Log out
                      </button>
                    </div>

                    <div style={{
                      padding: '8px 16px',
                      borderTop: '1px solid rgba(157,78,221,0.12)',
                      fontSize: '11px', color: '#4a3f6b', textAlign: 'center',
                    }}>
                      Sit-inIT · CCS Portal
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className='xl:hidden inline-flex items-center justify-center p-2 rounded-lg text-white hover:bg-[#5a189a] transition'
          aria-label='Toggle navigation menu'
        >
          {mobileMenuOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" className='w-6 h-6' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className='w-6 h-6' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d='M4 6h16M4 12h16M4 18h16' />
            </svg>
          )}
        </button>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className='xl:hidden absolute top-[calc(100%+8px)] left-0 right-0 bg-[#140828] text-white rounded-2xl border border-[#7b2cbf]/45 shadow-xl p-3 z-50'>
            {!isLoggedIn ? (
              <div className='flex flex-col gap-2 text-left'>
                <div className='px-2 py-1 text-[0.62rem] font-black uppercase tracking-wider text-[#c77dff]'>Main</div>
                <Link
                  to="/"
                  onClick={() => {
                    closeMobileMenu();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  style={activeSection === 'home' ? { color: '#ff9100', background: 'rgba(255,145,0,0.1)', borderColor: 'rgba(255,145,0,0.35)' } : {}}
                  className='px-3 py-2.5 rounded-xl border border-transparent hover:text-[#ff9100] hover:bg-[#3c096c]/35 transition duration-300'
                >
                  Home
                </Link>
                <a
                  href="/#about"
                  onClick={(e) => {
                    closeMobileMenu();
                    handleSectionClick(e, 'about');
                  }}
                  style={activeSection === 'about' ? { color: '#ff9100', background: 'rgba(255,145,0,0.1)', borderColor: 'rgba(255,145,0,0.35)' } : {}}
                  className='px-3 py-2.5 rounded-xl border border-transparent hover:text-[#ff9100] hover:bg-[#3c096c]/35 transition duration-300 font-medium text-white text-left block'
                >
                  About
                </a>
                <a
                  href="/#faqs"
                  onClick={(e) => {
                    closeMobileMenu();
                    handleSectionClick(e, 'faqs');
                  }}
                  style={activeSection === 'faqs' ? { color: '#ff9100', background: 'rgba(255,145,0,0.1)', borderColor: 'rgba(255,145,0,0.35)' } : {}}
                  className='px-3 py-2.5 rounded-xl border border-transparent hover:text-[#ff9100] hover:bg-[#3c096c]/35 transition duration-300 font-medium text-white text-left block'
                >
                  FAQs
                </a>
                <a
                  href="/#testimonials"
                  onClick={(e) => {
                    closeMobileMenu();
                    handleSectionClick(e, 'testimonials');
                  }}
                  style={activeSection === 'testimonials' ? { color: '#ff9100', background: 'rgba(255,145,0,0.1)', borderColor: 'rgba(255,145,0,0.35)' } : {}}
                  className='px-3 py-2.5 rounded-xl border border-transparent hover:text-[#ff9100] hover:bg-[#3c096c]/35 transition duration-300 font-medium text-white text-left block'
                >
                  Testimonials
                </a>
              </div>
            ) : (
              <div className='flex flex-col gap-2 text-left'>
                <Link
                  to={dashboardPath} onClick={closeMobileMenu}
                  style={isPathActive(dashboardPath) ? { color: '#ff9100', fontWeight: 600, background: 'rgba(255,145,0,0.1)', borderColor: 'rgba(255,145,0,0.35)' } : {}}
                  className='px-3 py-2.5 rounded-xl border border-transparent hover:text-[#ff9100] hover:bg-[#3c096c]/35 transition duration-300'
                >Home</Link>
                {user?.role === 'admin' ? (
                  <>
                    <div className='px-2 py-1 text-[0.62rem] font-black uppercase tracking-wider text-[#c77dff]'>Sit-In</div>
                    {[
                      { to: '/admin/search-student', label: 'Search Student' },
                      { to: '/admin/current-sessions', label: 'Current Sessions' },
                      { to: '/admin/sit-in-records', label: 'Sit in Records' },
                    ].map(({ to, label }) => (
                      <Link
                        key={to} to={to} onClick={closeMobileMenu}
                        style={isPathActive(to) ? { color: '#ff9100', fontWeight: 600, background: 'rgba(255,145,0,0.1)', borderColor: 'rgba(255,145,0,0.35)' } : {}}
                        className='px-3 py-2.5 rounded-xl border border-transparent hover:text-[#ff9100] hover:bg-[#3c096c]/35 transition duration-300'
                      >{label}</Link>
                    ))}

                    <div className='px-2 pt-2 pb-1 text-[0.62rem] font-black uppercase tracking-wider text-[#c77dff]'>Reservations</div>
                    <Link
                      to="/admin/reservations" onClick={closeMobileMenu}
                      style={isPathActive("/admin/reservations") ? { color: '#ff9100', fontWeight: 600, background: 'rgba(255,145,0,0.1)', borderColor: 'rgba(255,145,0,0.35)' } : {}}
                      className='px-3 py-2.5 rounded-xl border border-transparent hover:text-[#ff9100] hover:bg-[#3c096c]/35 transition duration-300'
                    >Manage Reservations</Link>

                    <div className='px-2 pt-2 pb-1 text-[0.62rem] font-black uppercase tracking-wider text-[#c77dff]'>Software</div>
                    <Link
                      to="/admin/software-management" onClick={closeMobileMenu}
                      style={isPathActive("/admin/software-management") ? { color: '#ff9100', fontWeight: 600, background: 'rgba(255,145,0,0.1)', borderColor: 'rgba(255,145,0,0.35)' } : {}}
                      className='px-3 py-2.5 rounded-xl border border-transparent hover:text-[#ff9100] hover:bg-[#3c096c]/35 transition duration-300'
                    >Software</Link>

                    <div className='px-2 pt-2 pb-1 text-[0.62rem] font-black uppercase tracking-wider text-[#c77dff]'>Testimonials</div>
                    <Link
                      to="/admin/testimonials" onClick={closeMobileMenu}
                      style={isPathActive("/admin/testimonials") ? { color: '#ff9100', fontWeight: 600, background: 'rgba(255,145,0,0.1)', borderColor: 'rgba(255,145,0,0.35)' } : {}}
                      className='px-3 py-2.5 rounded-xl border border-transparent hover:text-[#ff9100] hover:bg-[#3c096c]/35 transition duration-300'
                    >Testimonials</Link>

                    <div className='px-2 pt-2 pb-1 text-[0.62rem] font-black uppercase tracking-wider text-[#c77dff]'>Announcement</div>
                    {[
                      { to: '/admin/create-announcement', label: 'Create Announcement' },
                      { to: '/admin/announcement-records', label: 'Announcement Records' },
                    ].map(({ to, label }) => (
                      <Link
                        key={to} to={to} onClick={closeMobileMenu}
                        style={isPathActive(to) ? { color: '#ff9100', fontWeight: 600, background: 'rgba(255,145,0,0.1)', borderColor: 'rgba(255,145,0,0.35)' } : {}}
                        className='px-3 py-2.5 rounded-xl border border-transparent hover:text-[#ff9100] hover:bg-[#3c096c]/35 transition duration-300'
                      >{label}</Link>
                    ))}
                  </>
                ) : (
                  <>
                    {[
                      { to: '/student/history', label: 'History' },
                      { to: '/student/reservation', label: 'Reservation' },
                      { to: '/student/software-availability', label: 'Software' },
                      { to: '/student/testimonials', label: 'Testimonials' },
                    ].map(({ to, label }) => (
                      <Link
                        key={to} to={to} onClick={closeMobileMenu}
                        style={isPathActive(to) ? { color: '#ff9100', fontWeight: 600, background: 'rgba(255,145,0,0.1)', borderColor: 'rgba(255,145,0,0.35)' } : {}}
                        className='px-3 py-2.5 rounded-xl border border-transparent hover:text-[#ff9100] hover:bg-[#3c096c]/35 transition duration-300'
                      >{label}</Link>
                    ))}
                    {hasActiveSession && (
                      <button
                        onClick={() => {
                          closeMobileMenu();
                          setSessionModalOpen(true);
                        }}
                        className='text-left px-3 py-2.5 rounded-xl border border-transparent text-[#e9d5ff] hover:text-[#ff9100] hover:bg-[#3c096c]/35 transition duration-300'
                      >
                        Active Session Tracker
                      </button>
                    )}
                  </>
                )}
                <Link
                  to={profilePath} onClick={closeMobileMenu}
                  style={isPathActive(profilePath) ? { color: '#ff9100', fontWeight: 600, background: 'rgba(255,145,0,0.1)', borderColor: 'rgba(255,145,0,0.35)' } : {}}
                  className='px-3 py-2.5 rounded-xl border border-transparent hover:text-[#ff9100] hover:bg-[#3c096c]/35 transition duration-300'
                >{user?.role === 'admin' ? 'Dashboard' : 'Profile'}</Link>
                <button
                  onClick={() => { closeMobileMenu(); handleLogout(); }}
                  className='text-left px-3 py-2.5 rounded-xl border border-transparent text-red-300 hover:text-red-200 hover:bg-red-500/10 transition duration-300'
                >
                  Log out
                </button>
              </div>
            )}
            <div className="border-t border-[#7b2cbf]/35 my-2 pt-2 flex flex-col gap-2 px-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#c4b5d8]">Theme</span>
                <button
                  onClick={toggleTheme}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-xs font-semibold text-white transition-all cursor-pointer"
                >
                  {theme === 'light' ? (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-[14px] h-[14px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                      </svg>
                      Dark Mode
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-[14px] h-[14px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m0 13.5V21M4.22 4.22l1.59 1.59m12.38 12.38l1.59 1.59M3 12h2.25m13.5 0H21m-16.78 6.78l1.59-1.59M17.66 6.34l1.59-1.59M12 7.5a4.5 4.5 0 110 9 4.5 4.5 0 010-9z" />
                      </svg>
                      Light Mode
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {selectedNotification && (
        <div
          className='fixed inset-0 z-60 flex items-center justify-center bg-[#1a0030]/65 backdrop-blur-[2px] p-4'
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedNotification(null);
            }
          }}
        >
          <div className='w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-2xl border border-gray-200 flex flex-col'>
            <div className='h-1.5 w-full bg-linear-to-r from-[#3c096c] to-[#ff9100]' />

            <div className='px-5 sm:px-6 py-4 border-b border-gray-100 flex items-start justify-between gap-4'>
              <div className='flex items-center gap-2.5 min-w-0'>
                <div className='w-9 h-9 rounded-lg bg-[#3c096c] flex items-center justify-center shrink-0'>
                  <span className='text-white text-[0.55rem] font-black'>CCS</span>
                </div>
                <div className='min-w-0'>
                  <p className='text-sm font-black text-[#1a0030] tracking-wide'>CCS ADMIN</p>
                  <p className='text-[0.7rem] font-semibold text-gray-400'>{formatNotificationDateTime(selectedNotification.created_at)}</p>
                </div>
              </div>

              <button
                type='button'
                onClick={() => setSelectedNotification(null)}
                className='w-8 h-8 rounded-lg border border-gray-200 text-gray-500 hover:text-[#3c096c] hover:border-[#3c096c]/30 hover:bg-[#3c096c]/5 flex items-center justify-center transition-colors'
                aria-label='Close notification'
              >
                <svg className='w-4 h-4' fill='none' stroke='currentColor' strokeWidth='1.8' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' d='M6 18L18 6M6 6l12 12' />
                </svg>
              </button>
            </div>

            <div className='px-5 sm:px-6 py-5 overflow-y-auto'>
              {selectedNotification.tag && (
                <div className='flex items-center gap-2 mb-3'>
                  <span
                    className='text-[0.58rem] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border'
                    style={{
                      background: getNotifStyle(selectedNotification.tag).pillBg,
                      color: getNotifStyle(selectedNotification.tag).pillColor,
                      borderColor: getNotifStyle(selectedNotification.tag).pillColor + '40',
                    }}
                  >
                    {selectedNotification.tag}
                  </span>
                </div>
              )}

              <h3 className='text-xl sm:text-2xl font-black text-[#1a0030] leading-tight mb-3 wrap-break-word'>
                {selectedNotification.title || 'Notification'}
              </h3>

              <p className='text-sm sm:text-base text-gray-700 leading-relaxed whitespace-pre-line wrap-break-word'>
                {selectedNotification.message || 'No details provided.'}
              </p>
            </div>
          </div>
        </div>
      )}
      <SessionRecordsModal isOpen={sessionModalOpen} onClose={() => setSessionModalOpen(false)} />
    </>
  );
}

function ProfileMenuItem({ to, icon, children, onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '9px 10px', borderRadius: '8px',
        fontSize: '13px', fontWeight: 500, color: '#c4b5d8',
        textDecoration: 'none', transition: 'background 0.12s, color 0.12s',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(157,78,221,0.14)'; e.currentTarget.style.color = '#e9d5ff'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#c4b5d8'; }}
    >
      <span style={{ width: '15px', height: '15px', opacity: 0.65, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
        {icon}
      </span>
      {children}
    </Link>
  );
}