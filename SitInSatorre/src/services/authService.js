// Prefer explicit env URL. Otherwise, discover a reachable endpoint from
// common XAMPP/Apache paths and ports to keep the project portable across PCs.
const API_BASE_URLS = (() => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) return [envUrl];

  const host = window.location.hostname || "localhost";
  const customPath = import.meta.env.VITE_API_PATH;
  const commonPaths = [
    customPath,
    "/SysArchSATORRE/SitInSatorre/server/authenticate.php",
    "/SitInSatorre/server/authenticate.php",
    "/server/authenticate.php",
  ].filter(Boolean);

  const urls = [];

  // Same-origin first (useful for deployed builds).
  commonPaths.forEach((path) => {
    urls.push(`${window.location.origin}${path}`);
  });

  // During Vite dev, backend is usually Apache on 80 or 8080.
  if (window.location.port === "5173") {
    commonPaths.forEach((path) => {
      urls.push(`http://${host}${path}`);
      urls.push(`http://${host}:8080${path}`);
      urls.push(`http://localhost${path}`);
      urls.push(`http://localhost:8080${path}`);
      urls.push(`http://127.0.0.1${path}`);
      urls.push(`http://127.0.0.1:8080${path}`);
    });
  }

  return [...new Set(urls)];
})();

// Helper function to handle API requests
const apiRequest = async (action, data) => {
  let lastError = null;

  for (const baseUrl of API_BASE_URLS) {
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

      // Some wrong candidates (e.g., Vite dev server) return HTML 404.
      // Parse defensively and keep trying other candidates when appropriate.
      const contentType = (response.headers.get("content-type") || "").toLowerCase();
      const rawBody = await response.text();

      let responseData = null;
      if (rawBody) {
        try {
          responseData = JSON.parse(rawBody);
        } catch {
          responseData = null;
        }
      }

      console.log(`[AUTH] Response data:`, responseData ?? rawBody);

      // If this URL is not the API (common in dev), try next candidate.
      // Example: Vite may return HTML/JS/PHP source with 200/404.
      const looksLikeApiJson =
        contentType.includes("application/json") &&
        responseData &&
        typeof responseData === "object";

      if (!looksLikeApiJson) {
        lastError = new Error(`Not an API endpoint: ${baseUrl}`);
        continue;
      }

      if (!response.ok) {
        throw new Error(responseData?.message || `HTTP ${response.status}`);
      }

      if (!responseData.success) {
        throw new Error(responseData?.message || "Request failed");
      }

      return responseData;
    } catch (error) {
      lastError = error;
      const isNetworkError = error instanceof TypeError;
      if (!isNetworkError) {
        console.error(`[AUTH] Error (${action}):`, error);
        throw error;
      }
    }
  }

  console.error(`[AUTH] Error (${action}):`, lastError);
  throw new Error(
    lastError?.message ||
      `Cannot reach backend API. Checked ${API_BASE_URLS.length} URL(s). ` +
        `Start Apache/PHP and, if needed, set VITE_API_URL in .env.local.`
  );
};

export const authService = {

  getAdminId: () => {
    const user = authService.getUser();
    return user?.id_number || "";
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
  adminEndSession: async (sessionId) => {
    try {
      return await apiRequest("adminEndSession", {
        adminId: authService.getAdminId(),
        sessionId,
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