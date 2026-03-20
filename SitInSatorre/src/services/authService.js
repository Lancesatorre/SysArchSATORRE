// Prefer env override; otherwise choose a sensible default
// - Vite dev (port 5173): call Apache on default http port
// - Otherwise, same origin
const API_URL = (() => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (window.location.port === '5173') {
    return 'http://localhost/SysArchSATORRE/SitInSatorre/server/authenticate.php';
  }
  return `${window.location.origin}/SysArchSATORRE/SitInSatorre/server/authenticate.php`;
})();

// Helper function to handle API requests
const apiRequest = async (action, data) => {
  try {
    console.log(`[AUTH] Making ${action} request to:`, `${API_URL}?action=${action}`);
    console.log(`[AUTH] Request data:`, data);

    const response = await fetch(`${API_URL}?action=${action}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(data),
    });

    console.log(`[AUTH] Response status: ${response.status}`);

    // Parse response
    const responseData = await response.json();
    console.log(`[AUTH] Response data:`, responseData);

    // Check if request was successful
    if (!response.ok) {
      throw new Error(responseData.message || `HTTP ${response.status}`);
    }

    if (!responseData.success) {
      throw new Error(responseData.message || "Request failed");
    }

    return responseData;
  } catch (error) {
    console.error(`[AUTH] Error (${action}):`, error);
    throw error;
  }
};

export const authService = {

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
        localStorage.setItem("user", JSON.stringify(response.user));
        localStorage.setItem("isLoggedIn", "true");
      }

      return response;
    } catch (error) {
      throw new Error(error.message || "Login failed");
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