const API_PATH = "/SysArchSATORRE/SitInSatorre/server/authenticate.php";

const buildApiCandidates = () => {
  const explicitApiUrl = import.meta.env.VITE_API_URL?.trim();
  if (explicitApiUrl) return [explicitApiUrl];

  const { protocol, hostname, origin, port } = window.location;
  const candidates = [];

  const addCandidate = (url) => {
    if (url && !candidates.includes(url)) {
      candidates.push(url);
    }
  };

  // Vite dev mode usually runs on 5173; try common PHP hosts in order.
  if (port === "5173") {
    addCandidate(`${protocol}//${hostname}:8080${API_PATH}`);
    addCandidate(`${protocol}//${hostname}${API_PATH}`);
    addCandidate(`http://localhost${API_PATH}`);
    addCandidate(`http://127.0.0.1${API_PATH}`);
  } else {
    addCandidate(`${origin}${API_PATH}`);
  }

  return candidates;
};

const API_URL_CANDIDATES = buildApiCandidates();
let activeApiUrl = localStorage.getItem("activeApiUrl") || API_URL_CANDIDATES[0];

const getApiCandidateOrder = () => {
  const remaining = API_URL_CANDIDATES.filter((url) => url !== activeApiUrl);
  return [activeApiUrl, ...remaining];
};

const probeApiUrl = async () => {
  for (const baseUrl of API_URL_CANDIDATES) {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 1000);
      
      const response = await fetch(`${baseUrl}?action=probe`, {
        method: "GET",
        signal: controller.signal
      });
      clearTimeout(id);
      if (response.ok || response.status === 400 || response.status === 404 || response.status === 200) {
        activeApiUrl = baseUrl;
        localStorage.setItem("activeApiUrl", baseUrl);
        console.log("[AUTH] Discovered working API URL:", baseUrl);
        break;
      }
    } catch (e) {
      // Proceed to next candidate
    }
  }
};

probeApiUrl();

// Helper function to handle API requests
const apiRequest = async (action, data) => {
  try {
    let lastNetworkError = null;

    for (const baseUrl of getApiCandidateOrder()) {
      try {
        console.log(`[AUTH] Making ${action} request to:`, `${baseUrl}?action=${action}`);
        console.log(`[AUTH] Request data:`, data);

        const response = await fetch(`${baseUrl}?action=${action}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(data),
        });

        console.log(`[AUTH] Response status: ${response.status}`);

        const responseData = await response.json();
        console.log(`[AUTH] Response data:`, responseData);

        if (!response.ok) {
          throw new Error(responseData?.message || `HTTP ${response.status}`);
        }

        if (!responseData.success) {
          throw new Error(responseData?.message || "Request failed");
        }

        activeApiUrl = baseUrl;
        localStorage.setItem("activeApiUrl", baseUrl);
        return responseData;
      } catch (error) {
        const isNetworkError =
          error instanceof TypeError &&
          /(Failed to fetch|NetworkError|Load failed)/i.test(error.message || "");

        if (!isNetworkError) {
          throw error;
        }

        lastNetworkError = error;
      }
    }

    const triedTargets = API_URL_CANDIDATES.join(", ");
    throw new Error(
      `Unable to reach backend API. Tried: ${triedTargets}. ` +
        "Set VITE_API_URL to your working authenticate.php URL."
    );
  } catch (error) {
    console.error(`[AUTH] Error (${action}):`, error);
    throw error;
  }
};

export const authService = {

  getAdminId: () => {
    const user = authService.getUser();
    // Support both current (id_number) and legacy (idNumber) cached user shapes.
    return (user?.id_number || user?.idNumber || "").toString().trim();
  },

  // Fetch Dynamic Time Slots
  fetchTimeSlots: async () => {
    try {
      const response = await apiRequest("getTimeSlots", {});
      return response.success ? response.data : [];
    } catch (error) {
      console.error("Error fetching time slots:", error);
      return [];
    }
  },

  // Admin: Get all reservation data (pending, logs, labs)
  adminGetReservations: async () => {
    try {
      return await apiRequest("adminGetReservations", {});
    } catch (error) {
      console.error("Error fetching admin reservations:", error);
      throw error;
    }
  },

  // Admin: Approve a reservation
  adminApproveReservation: async (id) => {
    try {
      return await apiRequest("adminApproveReservation", { id });
    } catch (error) {
      console.error("Error approving reservation:", error);
      throw error;
    }
  },

  // Admin: Decline a reservation
  adminDeclineReservation: async (id, reason) => {
    try {
      return await apiRequest("adminDeclineReservation", { id, reason });
    } catch (error) {
      console.error("Error declining reservation:", error);
      throw error;
    }
  },

  adminGetLabPCs: async (labId) => {
    try {
      return await apiRequest("adminGetLabPCs", { lab_id: labId });
    } catch (error) {
      console.error("Error fetching lab PCs:", error);
      throw error;
    }
  },

  adminUpdatePCStatus: async (pcId, status) => {
    try {
      return await apiRequest("adminUpdatePCStatus", { pc_id: pcId, status });
    } catch (error) {
      console.error("Error updating PC status:", error);
      throw error;
    }
  },

  adminCreateTimeSlot: async (slotData) => {
    try {
      return await apiRequest("adminCreateTimeSlot", slotData);
    } catch (error) {
      console.error("Error creating time slot:", error);
      throw error;
    }
  },

  adminDeleteTimeSlot: async (id) => {
    try {
      return await apiRequest("adminDeleteTimeSlot", { id });
    } catch (error) {
      console.error("Error deleting time slot:", error);
      throw error;
    }
  },

  adminClearAllTimeSlots: async () => {
    try {
      return await apiRequest("clearTimeSlots", {});
    } catch (error) {
      console.error("Error clearing time slots:", error);
      throw error;
    }
  },

  getPersonalNotifications: async (idNumber) => {
    try {
      return await apiRequest("getPersonalNotifications", { idNumber });
    } catch (error) {
      console.error("Error fetching personal notifications:", error);
      throw error;
    }
  },

  markPersonalAlertRead: async (idNumber, notificationId) => {
    try {
      return await apiRequest("markPersonalAlertRead", { 
        idNumber,
        notification_id: notificationId 
      });
    } catch (error) {
      console.error("Error marking alert as read:", error);
      throw error;
    }
  },

  markAllPersonalAlertsRead: async (idNumber) => {
    try {
      return await apiRequest("markAllPersonalAlertsRead", { idNumber });
    } catch (error) {
      console.error("Error marking all personal alerts as read:", error);
      throw error;
    }
  },

  adminUpdateLabStatus: async (labId, status) => {
    try {
      const response = await apiRequest("adminUpdateLabStatus", {
        lab_id: labId,
        status: status
      });
      return response;
    } catch (error) {
      console.error("Error updating lab status:", error);
      throw error;
    }
  },

  adminBulkUpdatePCStatus: async (pcIds, status) => {
    try {
      return await apiRequest("bulkUpdatePCStatus", { pc_ids: pcIds, status });
    } catch (error) {
      console.error("Error bulk updating PCs:", error);
      throw error;
    }
  },

  adminGetAuditHistory: async (params = {}) => {
    try {
      return await apiRequest("adminGetAuditHistory", params);
    } catch (error) {
      console.error("Error fetching audit history:", error);
      throw error;
    }
  },

  adminStartReservationSession: async (id, purpose = '') => {
    try {
      return await apiRequest("adminStartReservationSession", { id, purpose });
    } catch (error) {
      console.error("Error starting reservation session:", error);
      throw error;
    }
  },

  adminMarkReservationAbsent: async (id) => {
    try {
      return await apiRequest("adminMarkReservationAbsent", { id });
    } catch (error) {
      console.error("Error marking reservation absent:", error);
      throw error;
    }
  },

  adminEndReservationSession: async (id, feedback = '') => {
    try {
      // We use the common endSession endpoint which handles sit_in_sessions and linked reservations
      return await apiRequest("adminEndReservationSession", { id, adminFeedback: feedback });
    } catch (error) {
      console.error("Error ending reservation session:", error);
      throw error;
    }
  },

  // =========================
  // REGISTER
  // =========================
  register: async (userData) => {
    try {
      const response = await apiRequest("register", {
        idNumber: userData.idNumber,
        firstName: userData.firstName,
        lastName: userData.lastName,
        middleName: userData.middleName || "",
        email: userData.email,
        password: userData.password,
        course: userData.course || "",
        courseLevel: userData.courseLevel || 0,
        address: userData.address || "",
      });

      return response;
    } catch (error) {
      throw new Error(error.message || "Registration failed");
    }
  },

  // =========================
  // LOGIN
  // =========================
  login: async (credentials) => {
    try {
      const response = await apiRequest("login", {
        idNumber: credentials.idNumber,
        password: credentials.password,
      });

      // Save user session
      if (response.user) {
        // Map profile_picture from backend to photo for frontend consistency
        const user = response.user;
        if (user.profile_picture && !user.photo) {
          user.photo = user.profile_picture;
        }
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("isLoggedIn", "true");
      }

      return response;
    } catch (error) {
      throw new Error(error.message || "Login failed");
    }
  },

  // =========================
  // UPDATE PROFILE
  // =========================
  updateProfile: async (profileData) => {
    try {
      const response = await apiRequest("updateProfile", {
        idNumber: profileData.idNumber,
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        middleName: profileData.middleName || "",
        address: profileData.address || "",
        photo: profileData.photo || null,
        email: profileData.email || "",
        password: profileData.password || "",
      });

      if (response.user) {
        // Map profile_picture from backend to photo for frontend consistency
        const user = response.user;
        if (user.profile_picture && !user.photo) {
          user.photo = user.profile_picture;
        }
        localStorage.setItem("user", JSON.stringify(user));
      }

      return response;
    } catch (error) {
      throw new Error(error.message || "Profile update failed");
    }
  },

  // =========================
  // ADMIN - SEARCH STUDENT
  // =========================
  adminSearchStudent: async (studentKeyword) => {
    try {
      const response = await apiRequest("adminSearchStudent", {
        adminId: authService.getAdminId(),
        studentKeyword,
      });
      return response.students || [];
    } catch (error) {
      throw new Error(error.message || "Failed to search student");
    }
  },

  // =========================
  // ADMIN - START SESSION
  // =========================
  adminStartSession: async (studentIdNumber, room = "", purpose = "", pcNumber = "") => {
    try {
      return await apiRequest("adminStartSession", {
        adminId: authService.getAdminId(),
        studentIdNumber,
        room,
        purpose,
        pcNumber,
      });
    } catch (error) {
      throw new Error(error.message || "Failed to start session");
    }
  },

  // =========================
  // ADMIN - LIST STUDENTS
  // =========================
  adminListStudents: async () => {
    try {
      const response = await apiRequest("adminListStudents", {
        adminId: authService.getAdminId(),
      });
      return response.students || [];
    } catch (error) {
      throw new Error(error.message || "Failed to load students");
    }
  },

  // =========================
  // ADMIN - UPDATE STUDENT
  // =========================
  adminUpdateStudent: async (student) => {
    try {
      return await apiRequest("adminUpdateStudent", {
        adminId: authService.getAdminId(),
        id: student.id,
        firstName: student.first_name,
        lastName: student.last_name,
        middleName: student.middle_name || "",
        course: student.course || "",
        yearLevel: Number(student.year_level || 0),
        address: student.address || "",
        availableSessions: Number(student.available_sessions || 0),
      });
    } catch (error) {
      throw new Error(error.message || "Failed to update student");
    }
  },

  // =========================
  // ADMIN - DELETE STUDENT
  // =========================
  adminDeleteStudent: async (id) => {
    try {
      return await apiRequest("adminDeleteStudent", {
        adminId: authService.getAdminId(),
        id,
      });
    } catch (error) {
      throw new Error(error.message || "Failed to delete student");
    }
  },

  // =========================
  // ADMIN - CURRENT SESSIONS
  // =========================
  adminCurrentSessions: async () => {
    try {
      const response = await apiRequest("adminCurrentSessions", {
        adminId: authService.getAdminId(),
      });
      return response.sessions || [];
    } catch (error) {
      throw new Error(error.message || "Failed to load current sessions");
    }
  },

  // =========================
  // ADMIN - END SESSION
  // =========================
  adminEndSession: async (sessionId, payload = {}) => {
    try {
      return await apiRequest("adminEndSession", {
        adminId: authService.getAdminId(),
        sessionId,
        adminFeedback: payload.adminFeedback || '',
      });
    } catch (error) {
      throw new Error(error.message || "Failed to end session");
    }
  },

  // =========================
  // ADMIN - SIT-IN RECORDS
  // =========================
  adminSitInRecords: async () => {
    try {
      const response = await apiRequest("adminSitInRecords", {
        adminId: authService.getAdminId(),
      });
      return response.records || [];
    } catch (error) {
      throw new Error(error.message || "Failed to load sit-in records");
    }
  },

  // =========================
  // ADMIN - CREATE ANNOUNCEMENT
  // =========================
  adminCreateAnnouncement: async ({ title, message, tag = "General" }) => {
    try {
      return await apiRequest("adminCreateAnnouncement", {
        adminId: authService.getAdminId(),
        title,
        message,
        tag,
      });
    } catch (error) {
      throw new Error(error.message || "Failed to create announcement");
    }
  },

  // =========================
  // ADMIN - ANNOUNCEMENT RECORDS
  // =========================
  adminAnnouncementRecords: async () => {
    try {
      const response = await apiRequest("adminAnnouncementRecords", {
        adminId: authService.getAdminId(),
      });
      return response.records || [];
    } catch (error) {
      throw new Error(error.message || "Failed to load announcement records");
    }
  },

  adminUpdateAnnouncement: async ({ id, title, message, tag = "General" }) => {
    try {
      return await apiRequest("adminUpdateAnnouncement", {
        adminId: authService.getAdminId(),
        id,
        title,
        message,
        tag,
      });
    } catch (error) {
      throw new Error(error.message || "Failed to update announcement");
    }
  },

  adminDeleteAnnouncement: async (id) => {
    try {
      return await apiRequest("adminDeleteAnnouncement", {
        adminId: authService.getAdminId(),
        id,
      });
    } catch (error) {
      throw new Error(error.message || "Failed to delete announcement");
    }
  },

  // =========================
  // NOTIFICATIONS
  // =========================
  fetchNotifications: async (idNumber) => {
    try {
      const response = await apiRequest("fetchNotifications", { idNumber });
      return {
        notifications: response.notifications || [],
        unreadCount: Number(response.unreadCount || 0),
      };
    } catch (error) {
      throw new Error(error.message || "Failed to fetch notifications");
    }
  },

  markNotificationRead: async ({ idNumber, notificationId }) => {
    try {
      return await apiRequest("markNotificationRead", {
        idNumber,
        notificationId,
      });
    } catch (error) {
      throw new Error(error.message || "Failed to mark notification as read");
    }
  },

  markAllNotificationsRead: async (idNumber) => {
    try {
      return await apiRequest("markAllNotificationsRead", { idNumber });
    } catch (error) {
      throw new Error(error.message || "Failed to mark all notifications as read");
    }
  },

  // =========================
  // STUDENT - PROFILE STATS
  // =========================
  fetchStudentProfileStats: async (idNumber) => {
    try {
      const response = await apiRequest("studentProfileStats", { idNumber });
      return response.stats || {
        total_sessions: 0,
        this_month: 0,
        hours_logged: 0,
        avg_per_week: 0,
        lab_usage: [],
      };
    } catch (error) {
      throw new Error(error.message || "Failed to load profile stats");
    }
  },

  // STUDENT - SIT-IN SUMMARY
  // =======================
  fetchStudentSitInSummary: async (idNumber) => {
    try {
      const response = await apiRequest("studentSitInSummary", { idNumber });
      return response.data || {
        total_hours: 0,
        session_count: 0,
        average_duration: 0,
        longest_session: 0,
      };
    } catch (error) {
      throw new Error(error.message || "Failed to load sit-in summary");
    }
  },

  fetchStudentTopLabs: async (idNumber) => {
    try {
      const response = await apiRequest("studentTopLabs", { idNumber });
      return response.data || [];
    } catch (error) {
      console.error('[AUTH] Error (fetchStudentTopLabs):', error);
      throw error;
    }
  },

  // STUDENT - RESERVATIONS
  // ======================
  fetchStudentReservations: async (idNumber) => {
    try {
      const response = await apiRequest("studentReservations", { idNumber });
      return response.data || [];
    } catch (error) {
      console.error('[AUTH] Error (fetchStudentReservations):', error);
      throw error;
    }
  },

  fetchLabAvailability: async () => {
    try {
      const response = await apiRequest("getLabAvailability", {});
      return response.data || [];
    } catch (error) {
      console.error('[AUTH] Error (fetchLabAvailability):', error);
      throw error;
    }
  },

  fetchPCAvailability: async (labId, date, startTime) => {
    try {
      const user = authService.getUser();
      const response = await apiRequest("getPCAvailability", {
        lab_id: labId,
        date: date,
        startTime: startTime,
        idNumber: user?.id_number
      });
      return response.data || [];
    } catch (error) {
      console.error('[AUTH] Error (fetchPCAvailability):', error);
      throw error;
    }
  },

  createReservation: async (formData) => {
    try {
      const user = authService.getUser();
      const response = await apiRequest("createReservation", {
        idNumber: user?.id_number,
        lab_id: formData.labId,
        pc_number: formData.pcNumber,
        reservation_date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
      });
      return response;
    } catch (error) {
      throw new Error(error.message || "Failed to create reservation");
    }
  },

  deleteReservation: async (reservationId) => {
    try {
      const response = await apiRequest("deleteReservation", { reservation_id: reservationId });
      return response;
    } catch (error) {
      throw new Error(error.message || "Failed to delete reservation");
    }
  },

  // =========================
  // STUDENT - CURRENT SESSION
  // =========================
  fetchStudentCurrentSession: async (idNumber) => {
    try {
      const response = await apiRequest("studentCurrentSession", { idNumber });
      return {
        available_sessions: Number(response.available_sessions || 0),
        active_session: response.active_session || null,
      };
    } catch (error) {
      throw new Error(error.message || "Failed to load current student session");
    }
  },

  // =========================
  // STUDENT - HISTORY
  // =========================
  fetchStudentHistory: async (idNumber) => {
    try {
      const response = await apiRequest("studentHistory", { idNumber });
      return response.records || [];
    } catch (error) {
      throw new Error(error.message || "Failed to load student history");
    }
  },

  submitStudentFeedback: async ({ idNumber, recordId, feedback }) => {
    try {
      return await apiRequest("studentSubmitFeedback", {
        idNumber,
        recordId,
        feedback,
      });
    } catch (error) {
      throw new Error(error.message || "Failed to submit feedback");
    }
  },

  // =========================
  // LOGOUT
  // =========================
  logout: () => {
    localStorage.removeItem("user");
    localStorage.removeItem("isLoggedIn");
  },

  // =========================
  // CHECK IF LOGGED IN
  // =========================
  isLoggedIn: () => {
    return localStorage.getItem("isLoggedIn") === "true";
  },

  // =========================
  // GET CURRENT USER
  // =========================
  getUser: () => {
    try {
      const user = localStorage.getItem("user");
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error("Error parsing user data:", error);
      return null;
    }
  },

  // =========================
  // CLEAR AUTH DATA
  // =========================
  clearAuth: () => {
    localStorage.removeItem("user");
    localStorage.removeItem("isLoggedIn");
  },

  // =========================
  // FETCH USER PROFILE
  // =========================
  fetchProfile: async () => {
    try {
      // For now, return cached user data
      // In future, this can be replaced with an API call to fetch fresh data
      const user = localStorage.getItem("user");
      if (!user) {
        throw new Error("No user session found");
      }
      return JSON.parse(user);
    } catch (error) {
      console.error("Error fetching profile:", error);
      throw error;
    }
  },

  // =========================
  // ADMIN - SOFTWARE MANAGEMENT
  // =========================
  adminGetSoftware: async () => {
    try {
      const response = await apiRequest("adminGetSoftware", {
        adminId: authService.getAdminId(),
      });
      return response.records || [];
    } catch (error) {
      throw new Error(error.message || "Failed to load software applications");
    }
  },

  adminAddSoftware: async (softwareData) => {
    try {
      return await apiRequest("adminAddSoftware", {
        adminId: authService.getAdminId(),
        ...softwareData,
      });
    } catch (error) {
      throw new Error(error.message || "Failed to add software application");
    }
  },

  adminEditSoftware: async (softwareData) => {
    try {
      return await apiRequest("adminEditSoftware", {
        adminId: authService.getAdminId(),
        ...softwareData,
      });
    } catch (error) {
      throw new Error(error.message || "Failed to update software application");
    }
  },

  adminDeleteSoftware: async (id) => {
    try {
      return await apiRequest("adminDeleteSoftware", {
        adminId: authService.getAdminId(),
        id,
      });
    } catch (error) {
      throw new Error(error.message || "Failed to delete software application");
    }
  },

  adminBulkAddSoftware: async (softwareList) => {
    try {
      return await apiRequest("adminBulkAddSoftware", {
        adminId: authService.getAdminId(),
        software_list: softwareList,
      });
    } catch (error) {
      throw new Error(error.message || "Failed to import software applications");
    }
  },

  // =========================
  // TESTIMONIALS MODERATION SYSTEM
  // =========================
  studentGetTestimonial: async (idNumber) => {
    try {
      return await apiRequest("studentGetTestimonial", { idNumber });
    } catch (error) {
      throw new Error(error.message || "Failed to get student testimonial");
    }
  },

  studentSubmitTestimonial: async (idNumber, rating, feedback) => {
    try {
      return await apiRequest("studentSubmitTestimonial", { idNumber, rating, feedback });
    } catch (error) {
      throw new Error(error.message || "Failed to submit testimonial");
    }
  },

  adminListTestimonials: async () => {
    try {
      return await apiRequest("adminListTestimonials", {
        adminId: authService.getAdminId(),
      });
    } catch (error) {
      throw new Error(error.message || "Failed to load testimonials");
    }
  },

  adminModerateTestimonial: async (id, status) => {
    try {
      return await apiRequest("adminModerateTestimonial", {
        adminId: authService.getAdminId(),
        id,
        status,
      });
    } catch (error) {
      throw new Error(error.message || "Failed to moderate testimonial");
    }
  },

  // =========================
  // DYNAMIC ACTION PATH RESOLVER
  // =========================
  getActionUrl: (actionFile) => {
    return activeApiUrl.replace("authenticate.php", "actions/" + actionFile);
  },
};