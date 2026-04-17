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
let activeApiUrl = API_URL_CANDIDATES[0];

const getApiCandidateOrder = () => {
  const remaining = API_URL_CANDIDATES.filter((url) => url !== activeApiUrl);
  return [activeApiUrl, ...remaining];
};

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
  adminStartSession: async (studentIdNumber, room = "", purpose = "") => {
    try {
      return await apiRequest("adminStartSession", {
        adminId: authService.getAdminId(),
        studentIdNumber,
        room,
        purpose,
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

};