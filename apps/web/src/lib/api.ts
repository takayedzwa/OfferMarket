// API Client for OfferMarket Backend
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

// Create axios instance with default config
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth headers
api.interceptors.request.use((config) => {
  // Check for token in localStorage
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    const userId = localStorage.getItem('userId');
    const userRole = localStorage.getItem('userRole');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (userId) {
      config.headers['X-User-ID'] = userId;
    }
    if (userRole) {
      config.headers['X-User-Role'] = userRole;
    }
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired, redirect to login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('userId');
        localStorage.removeItem('userRole');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ============================================================================
// AUTH API
// ============================================================================

export const authApi = {
  registerWorker: (email: string, password: string, phone?: string) =>
    api.post('/auth/register/worker', { email, password, phone }),

  registerEmployer: (email: string, password: string, phone: string, company: { name: string; kvkNumber: string; website?: string }) =>
    api.post('/auth/register/employer', { email, password, phone, company }),

  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('userId');
      localStorage.removeItem('userRole');
    }
  },
};

// ============================================================================
// ENUMS API
// ============================================================================

export const enumsApi = {
  // Get all enums at once
  getAll: () => api.get('/enums'),

  // Individual enum endpoints
  getAvailability: () => api.get('/enums/availability'),
  getProfileVisibility: () => api.get('/enums/profile-visibility'),
  getSkillLevel: () => api.get('/enums/skill-level'),
  getWorkSchedule: () => api.get('/enums/work-schedule'),
  getIndustry: () => api.get('/enums/industry'),
  getCareerPriority: () => api.get('/enums/career-priority'),
  getEmploymentType: () => api.get('/enums/employment-type'),
};

// ============================================================================
// WORKER API
// ============================================================================

export const workersApi = {
  // Get available trades
  getTrades: () => api.get('/workers/trades'),

  // Search workers (for employers)
  searchWorkers: (params?: any) => api.get('/workers/search', { params }),

  // Get my private profile
  getMyProfile: () => {
    const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
    return api.get('/workers/me', { params: { userId } });
  },

  // Create worker profile
  createProfile: (data: any) => {
    const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
    return api.post('/workers', data, { params: { userId } });
  },

  // Update worker profile
  updateProfile: (data: any) => {
    const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
    return api.patch('/workers/me', data, { params: { userId } });
  },

  // Get public profile (anonymous - for employers viewing)
  getPublicProfile: (publicId: string, employerId?: string) =>
    api.get(`/workers/${publicId}`, { params: { employerId } }),

  // Block a company
  blockCompany: (employerId: string, reason?: string) =>
    api.post('/workers/me/block', { employerId, reason }),

  // Unblock a company
  unblockCompany: (employerId: string) =>
    api.delete(`/workers/me/block/${employerId}`),

  // Get blocked companies
  getBlockedCompanies: () => api.get('/workers/me/blocked'),

  // Update visibility
  updateVisibility: (visibility: 'ALL_VERIFIED' | 'SELECTED_COMPANIES' | 'HIDDEN') =>
    api.patch('/workers/me/visibility', { visibility }),

  // Delete profile
  deleteProfile: () => api.delete('/workers/me'),
};

// ============================================================================
// EMPLOYER API
// ============================================================================

export const employersApi = {
  // Get my profile
  getMyProfile: () => {
    const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
    return api.get('/employers/me', { params: { userId } });
  },

  // Create employer profile
  createProfile: (data: any) => {
    const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
    return api.post('/employers', data, { params: { userId } });
  },

  // Update employer profile
  updateProfile: (data: any) => {
    const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
    return api.patch('/employers/me', data, { params: { userId } });
  },

  // Get verification status
  getVerificationStatus: () => {
    const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
    return api.get('/employers/me/verification', { params: { userId } });
  },

  // Get company details
  getMyCompany: () => {
    const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
    return api.get('/employers/me', { params: { userId } });
  },
};

// ============================================================================
// OFFERS API
// ============================================================================

export const offersApi = {
  // Create offer
  createOffer: (data: any) => {
    const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
    return api.post('/offers', data, { params: { employerId: userId } });
  },

  // Get offer details (worker)
  getOffer: (id: string) => api.get(`/offers/${id}`),

  // Get offer details (employer)
  getEmployerOfferDetail: (id: string, employerId: string) =>
    api.get(`/offers/${id}/detail`, { params: { employerId } }),

  // Update offer (employer)
  updateOffer: (id: string, employerId: string, data: any) =>
    api.patch(`/offers/${id}?employerId=${employerId}`, data),

  // Accept offer
  acceptOffer: (id: string) => api.post(`/offers/${id}/accept`),

  // Reject offer
  rejectOffer: (id: string, reason?: string, feedback?: string) =>
    api.post(`/offers/${id}/reject`, { reason, feedback }),

  // Shortlist offer
  shortlistOffer: (id: string) => api.post(`/offers/${id}/shortlist`),

  // Counter offer
  counterOffer: (id: string, data: any) => api.post(`/offers/${id}/counter`, data),

  // Withdraw offer
  withdrawOffer: (id: string, reason?: string) =>
    api.post(`/offers/${id}/withdraw`, { reason }),

  // List offers (with filters)
  listOffers: (params?: {
    status?: string;
    workerId?: string;
    employerId?: string;
    page?: number;
    limit?: number;
  }) => api.get('/offers', { params }),

  // Get offers for worker
  getWorkerOffers: () => api.get('/offers/worker/me'),

  // Get offers for employer
  getEmployerOffers: () => {
    const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
    return api.get('/offers', { params: { employerId: userId } });
  },
};

// ============================================================================
// CONVERSATIONS API
// ============================================================================

export const conversationsApi = {
  // List conversations
  listConversations: (userId?: string, userType?: 'worker' | 'employer') =>
    api.get('/conversations', { params: { userId, userType } }),

  // Get conversation details
  getConversation: (id: string) => api.get(`/conversations/${id}`),

  // Send message
  sendMessage: (conversationId: string, content: string, attachments?: any[]) =>
    api.post(`/conversations/${conversationId}/messages`, { content, attachments }),

  // Mark as read
  markAsRead: (conversationId: string) =>
    api.post(`/conversations/${conversationId}/read`),

  // Archive conversation
  archiveConversation: (conversationId: string) =>
    api.post(`/conversations/${conversationId}/archive`),
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export const formatCurrency = (amount: number, currency: string = 'EUR') => {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency,
  }).format(amount);
};

export const formatDate = (date: string | Date) => {
  return new Intl.DateTimeFormat('nl-NL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
};

export const getOfferStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-800',
    SUBMITTED: 'bg-blue-100 text-blue-800',
    VIEWED: 'bg-purple-100 text-purple-800',
    SHORTLISTED: 'bg-yellow-100 text-yellow-800',
    ACCEPTED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
    EXPIRED: 'bg-gray-100 text-gray-500',
    WITHDRAWN: 'bg-gray-100 text-gray-500',
    COUNTERED: 'bg-orange-100 text-orange-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

export const getOfferStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    DRAFT: 'Draft',
    SUBMITTED: 'Submitted',
    VIEWED: 'Viewed',
    SHORTLISTED: 'Shortlisted',
    ACCEPTED: 'Accepted',
    REJECTED: 'Rejected',
    EXPIRED: 'Expired',
    WITHDRAWN: 'Withdrawn',
    COUNTERED: 'Countered',
  };
  return labels[status] || status;
};
