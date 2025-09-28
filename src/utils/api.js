// Production backend URL
const PRODUCTION_API_URL = 'https://handleai-q84tva5nd-lipakshinagdeves-projects.vercel.app/api';
const LOCAL_API_URL = 'http://localhost:5001/api';

// Dynamically determine API base URL based on environment
const getAPIBase = () => {
  // Check if we're running on production domains
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    console.log('Current hostname:', hostname); // Debug log
    if (hostname === 'handlejobs.com' || hostname === 'www.handlejobs.com' || hostname.includes('vercel.app')) {
      console.log('Using production API:', PRODUCTION_API_URL); // Debug log
      return PRODUCTION_API_URL;
    }
  }
  
  // Check if we're in production build
  if (process.env.NODE_ENV === 'production') {
    console.log('Production build detected, using:', PRODUCTION_API_URL); // Debug log
    return PRODUCTION_API_URL;
  }
  
  // Default to localhost for development
  console.log('Using local API:', LOCAL_API_URL); // Debug log
  return LOCAL_API_URL;
};

const API_BASE = getAPIBase();

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
  },

  confirmEmail: async (token) => {
    const response = await fetch(`${API_BASE}/auth/confirm-email?token=${token}`, {
      method: 'GET'
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