// client/src/api/api.js
// --------------------------------------------------
// API Service Layer
// --------------------------------------------------
// Maps cleanly to the verified Express backend routes.
// - Handles JWT Bearer authorization automatically
// - Handles expired/invalid token detection
// - Formats and returns standardized { success, data, message, error }
// --------------------------------------------------

const BASE_URL = '/api';

// Token helpers in localStorage
export const getToken = () => localStorage.getItem('smartcampus_token');
export const setToken = (token) => localStorage.setItem('smartcampus_token', token);
export const removeToken = () => {
  localStorage.removeItem('smartcampus_token');
  localStorage.removeItem('smartcampus_user');
};

export const getStoredUser = () => {
  try {
    const raw = localStorage.getItem('smartcampus_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setStoredUser = (user) => {
  localStorage.setItem('smartcampus_user', JSON.stringify(user));
};

// Core fetch handler
async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, config);
    const data = await response.json().catch(() => ({}));

    // If unauthorized or expired token, clear session and dispatch event
    if (response.status === 401) {
      removeToken();
      window.dispatchEvent(new Event('auth:unauthorized'));
    }

    return {
      ok: response.ok,
      status: response.status,
      data: data.data !== undefined ? data.data : data,
      token: data.token,
      count: data.count,
      pagination: data.pagination,
      message: data.message,
      raw: data,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      data: null,
      message: 'Network error. Please ensure the backend server is running.',
      error: error.message,
    };
  }
}

// --------------------------------------------------
// Authentication API
// --------------------------------------------------
export const authApi = {
  login: async (email, password) => {
    const res = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (res.ok) {
      const token = res.token || res.raw?.token;
      const user = res.data;
      if (token && user) {
        setToken(token);
        setStoredUser(user);
      }
    }
    return res;
  },

  register: async (name, email, password, role) => {
    const res = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role }),
    });
    if (res.ok) {
      const token = res.token || res.raw?.token;
      const user = res.data;
      if (token && user) {
        setToken(token);
        setStoredUser(user);
      }
    }
    return res;
  },

  logout: () => {
    removeToken();
    window.dispatchEvent(new Event('auth:logout'));
  },
};

// --------------------------------------------------
// Attendance API (Assigned Module)
// --------------------------------------------------
export const attendanceApi = {
  // Dashboard stats
  getStats: () => request('/attendance/stats'),

  // Get attendance records with filters
  getAll: (params = {}) => {
    const query = new URLSearchParams();
    if (params.student) query.append('student', params.student);
    if (params.status) query.append('status', params.status);
    if (params.date) query.append('date', params.date);

    const qs = query.toString();
    return request(`/attendance${qs ? `?${qs}` : ''}`);
  },

  // Mark attendance (faculty/admin)
  mark: (data) =>
    request('/attendance', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Update attendance (faculty/admin)
  update: (id, data) =>
    request(`/attendance/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Delete attendance (faculty/admin)
  delete: (id) =>
    request(`/attendance/${id}`, {
      method: 'DELETE',
    }),

  // Get attendance % for a student
  getPercentage: (studentId) =>
    request(`/attendance/percentage/${studentId}`),
};

// --------------------------------------------------
// User Search & Pagination API (Assigned Module)
// --------------------------------------------------
export const userApi = {
  getUsers: (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.role) query.append('role', params.role);
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);

    const qs = query.toString();
    return request(`/users${qs ? `?${qs}` : ''}`);
  },
};

// --------------------------------------------------
// Assignments & Submissions API (Assigned Module)
// --------------------------------------------------
export const assignmentApi = {
  // Get all assignments with optional query params (search, subject, page, limit)
  getAll: (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.subject) query.append('subject', params.subject);
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);

    const qs = query.toString();
    return request(`/assignments${qs ? `?${qs}` : ''}`);
  },

  // Get single assignment
  getById: (id) => request(`/assignments/${id}`),

  // Create assignment (faculty/admin)
  create: (data) =>
    request('/assignments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Update assignment (faculty/admin)
  update: (id, data) =>
    request(`/assignments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Delete assignment (faculty/admin)
  delete: (id) =>
    request(`/assignments/${id}`, {
      method: 'DELETE',
    }),

  // Student submits assignment
  submit: (assignmentId, data) =>
    request(`/assignments/${assignmentId}/submissions`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Faculty views submissions for an assignment
  getSubmissions: (assignmentId) =>
    request(`/assignments/${assignmentId}/submissions`),

  // Student views their own submissions
  getMySubmissions: () => request('/submissions/my'),
};
