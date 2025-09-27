const API_BASE = 'http://localhost:5000/api';

export const authAPI = {
  register: async (userData) => {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Important for cookies
      body: JSON.stringify(userData)
    });
    return response.json();
  },

  login: async (email, password) => {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password })
    });
    return response.json();
  },

  logout: async () => {
    const response = await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      credentials: 'include'
    });
    return response.json();
  },

  getMe: async () => {
    const response = await fetch(`${API_BASE}/auth/me`, {
      credentials: 'include'
    });
    return response.json();
  },

  verifyToken: async () => {
    const response = await fetch(`${API_BASE}/auth/verify`, {
      method: 'POST',
      credentials: 'include'
    });
    return response.json();
  }
};

export const userAPI = {
  getDashboard: async () => {
    const response = await fetch(`${API_BASE}/users/dashboard`, {
      credentials: 'include'
    });
    return response.json();
  },
  
  updateProfile: async (profileData) => {
    const response = await fetch(`${API_BASE}/users/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(profileData)
    });
    return response.json();
  },

  getApplications: async (page = 1, limit = 10) => {
    const response = await fetch(`${API_BASE}/users/applications?page=${page}&limit=${limit}`, {
      credentials: 'include'
    });
    return response.json();
  },

  deleteAccount: async (confirmDelete) => {
    // NOTE: credentials: 'include' ensures the 'token' cookie is sent.
    const response = await fetch(`${API_BASE}/users/account`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', 
      // Sending the body is technically unnecessary for DELETE but harmless here:
      body: JSON.stringify({ confirmDelete })
    });
    return response.json();
  }
};

export const jobAPI = {
  scrapeJobs: async (portalUrl) => {
    const response = await fetch(`${API_BASE}/jobs/scrape`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ portalUrl })
    });
    return response.json();
  },

  searchJobs: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await fetch(`${API_BASE}/jobs/search?${params}`, {
      credentials: 'include'
    });
    return response.json();
  },

  applyToJob: async (jobId, applicationData = {}) => {
    const response = await fetch(`${API_BASE}/jobs/apply/${jobId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(applicationData)
    });
    return response.json();
  },

  startAutomation: async (portalUrl, maxApplications = 10) => {
    const response = await fetch(`${API_BASE}/jobs/automate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        portalUrl,
        maxApplications,
        autoApply: true
      })
    });
    return response.json();
  }
};

export const aiAPI = {
  generateCoverLetter: async (jobId) => {
    const response = await fetch(`${API_BASE}/ai/cover-letter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ jobId })
    });
    return response.json();
  },

  answerQuestion: async (jobId, question) => {
    const response = await fetch(`${API_BASE}/ai/answer-question`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ jobId, question })
    });
    return response.json();
  }
};