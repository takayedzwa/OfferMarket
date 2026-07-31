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
  // Add JWT token from localStorage
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor for error handling with automatic token refresh
let isRefreshing = false;
let failedQueue: Array<{ resolve: (value: any) => void; reject: (reason: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue this request until the refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        // No refresh token — redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }

      try {
        const response = await api.post('/auth/refresh', { refreshToken });
        const newAccessToken = response.data.accessToken;
        const newRefreshToken = response.data.refreshToken;

        localStorage.setItem('accessToken', newAccessToken);
        if (newRefreshToken) {
          localStorage.setItem('refreshToken', newRefreshToken);
        }

        processQueue(null, newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
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

  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),

  resetPassword: (token: string, newPassword: string) =>
    api.post('/auth/reset-password', { token, newPassword }),

  // Refresh the access token using a valid refresh token
  refreshToken: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  },
};

/**
 * Admin console API helpers. Endpoints are ADMIN-only (AdminGuard on the
 * server). The axios `api` instance attaches the JWT from localStorage.
 */
export const adminApi = {
  createStaffUser: (data: {
    email: string;
    password: string;
    role: 'ADMIN' | 'SUPPORT';
    firstName: string;
    lastName: string;
    phone?: string;
  }) => api.post('/admin/users/staff', data),
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
  getSpecialization: () => api.get('/enums/specialization'),
  getWorkAuthorization: () => api.get('/enums/work-authorization'),
  getLanguageLevel: () => api.get('/enums/language-level'),
  getTicketCategory: () => api.get('/enums/ticket-category'),
  getTicketPriority: () => api.get('/enums/ticket-priority'),
  getTicketStatus: () => api.get('/enums/ticket-status'),
};

// ============================================================================
// REGIONS API
// ============================================================================

export const regionsApi = {
  getRegions: (params?: { type?: string; province?: string; parentId?: string }) =>
    api.get('/regions', { params }),

  resolveRegion: (data: {
    countryCode: string;
    countryName?: string;
    provinceCode: string;
    provinceName: string;
    cityName: string;
    cityLatitude?: string;
    cityLongitude?: string;
  }) => api.post('/regions/resolve', data),
};

// ============================================================================
// WORKER API
// ============================================================================

export const workersApi = {
  // Get available trades
  getTrades: () => api.get('/workers/trades'),

  // Get available specializations
  getSpecializations: () => api.get('/workers/specializations'),

  // Get skills catalog
  getSkillsCatalog: (category?: string) => api.get('/workers/skills', { params: { category } }),

  // Search workers (for employers)
  searchWorkers: (params?: any) => api.get('/workers/search', { params }),

  // Get my private profile
  // SECURITY: userId is no longer sent as a query param. The backend extracts
  // it from the JWT token, preventing IDOR attacks.
  getMyProfile: () => api.get('/workers/me'),

  // Create worker profile
  createProfile: (data: any) => api.post('/workers', data),

  // Update worker profile
  updateProfile: (data: any) => api.patch('/workers/me', data),

  // Get public profile (anonymous - for employers viewing)
  getPublicProfile: (publicId: string, employerId?: string) =>
    api.get(`/workers/${publicId}`, { params: { employerId } }),

  // ============================================================================
  // PROFILE SKILLS CRUD
  // ============================================================================

  addSkill: (data: any) => api.post('/workers/me/skills', data),

  updateSkill: (id: string, data: any) => api.patch(`/workers/me/skills/${id}`, data),

  removeSkill: (id: string) => api.delete(`/workers/me/skills/${id}`),

  // ============================================================================
  // CERTIFICATIONS CRUD
  // ============================================================================

  addCertification: (data: any) => api.post('/workers/me/certifications', data),

  updateCertification: (id: string, data: any) => api.patch(`/workers/me/certifications/${id}`, data),

  removeCertification: (id: string) => api.delete(`/workers/me/certifications/${id}`),

  // ============================================================================
  // LANGUAGES CRUD
  // ============================================================================

  addLanguage: (data: any) => api.post('/workers/me/languages', data),

  updateLanguage: (id: string, data: any) => api.patch(`/workers/me/languages/${id}`, data),

  removeLanguage: (id: string) => api.delete(`/workers/me/languages/${id}`),

  // ============================================================================
  // EDUCATION CRUD
  // ============================================================================

  addEducation: (data: any) => api.post('/workers/me/education', data),

  updateEducation: (id: string, data: any) => api.patch(`/workers/me/education/${id}`, data),

  removeEducation: (id: string) => api.delete(`/workers/me/education/${id}`),

  // ============================================================================
  // PROJECT EXPERIENCE CRUD
  // ============================================================================

  addProjectExperience: (data: any) => api.post('/workers/me/projects', data),

  updateProjectExperience: (id: string, data: any) => api.patch(`/workers/me/projects/${id}`, data),

  removeProjectExperience: (id: string) => api.delete(`/workers/me/projects/${id}`),

  // ============================================================================
  // PRIVACY & VISIBILITY
  // ============================================================================

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

  // ============================================================================
  // VISIBLE COMPANIES (SELECTED_COMPANIES Visibility)
  // ============================================================================

  // Add a company to the visible companies list
  addVisibleCompany: (employerId: string) =>
    api.post('/workers/me/visible-companies', { employerId }),

  // Remove a company from the visible companies list
  removeVisibleCompany: (employerId: string) =>
    api.delete(`/workers/me/visible-companies/${employerId}`),

  // Get all visible companies
  getVisibleCompanies: () =>
    api.get('/workers/me/visible-companies'),

  // Delete profile
  deleteProfile: () => api.delete('/workers/me'),
};

// ============================================================================
// EMPLOYER API
// ============================================================================

export const employersApi = {
  // SECURITY: userId is no longer sent as a query param. The backend extracts
  // it from the JWT token, preventing IDOR attacks.
  getMyProfile: () => api.get('/employers/me'),

  // Create employer profile
  createProfile: (data: any) => api.post('/employers', data),

  // Update employer profile
  updateProfile: (data: any) => api.patch('/employers/me', data),

  // Get verification status
  getVerificationStatus: () => api.get('/employers/me/verification'),

  // Get company details
  getMyCompany: () => api.get('/employers/me'),
};

// ============================================================================
// RATINGS API
// SECURITY: All authenticated endpoints use the JWT token for userId.
// No userId query params are sent — the backend extracts identity from the token.
// ============================================================================

export const ratingsApi = {
  // Create a rating (authenticated)
  createRating: (data: any) => api.post('/ratings', data),

  // Get my ratings (authenticated)
  getMyRatings: () => api.get('/ratings/my'),

  // Get employer ratings (public)
  getEmployerRatings: (employerId: string, limit: number = 5, offset: number = 0) =>
    api.get(`/ratings/employer/${employerId}`, { params: { limit, offset } }),

  // Get employer rating stats (public)
  getEmployerRatingStats: (employerId: string) =>
    api.get(`/ratings/employer/${employerId}/stats`),

  // Get employer trust score (public)
  getEmployerTrustScore: (employerId: string) =>
    api.get(`/ratings/employer/${employerId}/trust-score`),

  // Update a rating (authenticated)
  updateRating: (ratingId: string, data: any) =>
    api.patch(`/ratings/${ratingId}`, data),

  // Get rating by ID (authenticated)
  getRatingById: (ratingId: string) =>
    api.get(`/ratings/${ratingId}`),
};

// ============================================================================
// OFFERS API
// ============================================================================

export const offersApi = {
  // Create offer — the acting employer is derived from the JWT server-side
  createOffer: (data: any) => {
    return api.post('/offers', data);
  },

  // Get offer details (worker)
  getOffer: (id: string) => {
    return api.get(`/offers/${id}`);
  },

  // Get offer details (employer) — ownership resolved from the JWT
  getEmployerOfferDetail: (id: string) =>
    api.get(`/offers/${id}/detail`),

  // Update offer (employer) — ownership resolved from the JWT
  updateOffer: (id: string, data: any) =>
    api.patch(`/offers/${id}`, data),

  // Submit offer (employer) — ownership resolved from the JWT
  submitOffer: (id: string) =>
    api.post(`/offers/${id}/submit`),

  // Accept offer
  acceptOffer: (id: string) => {
    return api.post(`/offers/${id}/accept`);
  },

  // Reject offer
  rejectOffer: (id: string, reason?: string, feedback?: string) => {
    return api.post(`/offers/${id}/reject`, { reason, feedback });
  },

  // Shortlist offer
  shortlistOffer: (id: string) => {
    return api.post(`/offers/${id}/shortlist`);
  },

  // Counter offer
  counterOffer: (id: string, data: any) => {
    return api.post(`/offers/${id}/counter`, data);
  },

  // Withdraw offer (employer) — ownership resolved from the JWT
  withdrawOffer: (id: string, reason?: string) =>
    api.post(`/offers/${id}/withdraw`, { reason }),

  // List offers (filtered by status). The scope (employer vs worker) is
  // resolved from the authenticated user's role on the server, so workerId/
  // employerId are no longer accepted from the client.
  listOffers: (params?: {
    status?: string;
    page?: number;
    limit?: number;
  }) => api.get('/offers', { params }),

  // Get offers for worker
  getWorkerOffers: () => {
    return api.get('/offers/worker/me');
  },

  // Get offers for employer — scoped to the authenticated employer (JWT)
  getEmployerOffers: () => {
    return api.get('/offers');
  },
};

// ============================================================================
// BILLING API
// ============================================================================

export const billingApi = {
  // Employer endpoints
  getMyInvoices: (params?: { unpaidOnly?: boolean; status?: string; page?: number; limit?: number }) =>
    api.get('/billing/invoices', { params }),

  getInvoice: (invoiceId: string) =>
    api.get(`/billing/invoices/${invoiceId}`),

  getInvoiceSummary: () =>
    api.get('/billing/invoices/summary'),

  // Admin endpoints
  adminGetInvoices: (params?: { employerId?: string; status?: string; page?: number; limit?: number }) =>
    api.get('/billing/admin/invoices', { params }),

  adminGetInvoice: (invoiceId: string) =>
    api.get(`/billing/admin/invoices/${invoiceId}`),

  adminMarkInvoicePaid: (invoiceId: string, data?: { paymentReference?: string; paymentMethod?: string; notes?: string }) =>
    api.post(`/billing/admin/invoices/${invoiceId}/mark-paid`, data),

  adminCancelInvoice: (invoiceId: string, reason?: string) =>
    api.post(`/billing/admin/invoices/${invoiceId}/cancel`, { reason }),

  adminCheckOverdue: () =>
    api.post('/billing/admin/check-overdue'),

  adminGetStats: () =>
    api.get('/billing/admin/stats'),

  adminGetSettings: () =>
    api.get('/billing/admin/settings'),

  adminUpdateSetting: (key: string, value: any) =>
    api.patch('/billing/admin/settings', { key, value }),
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
// NOTIFICATIONS API
// ============================================================================

export const notificationsApi = {
  // Get notifications for current user
  // SECURITY: userId is no longer passed as a query param. The backend
  // extracts it from the JWT token, preventing IDOR attacks.
  getNotifications: (params?: { unreadOnly?: boolean; page?: number; limit?: number }) => {
    return api.get('/notifications', { params });
  },

  // Get unread count
  getUnreadCount: () => {
    return api.get('/notifications/unread-count');
  },

  // Mark a single notification as read
  markAsRead: (notificationId: string) => {
    return api.patch(`/notifications/${notificationId}/read`);
  },

  // Mark all notifications as read
  markAllAsRead: () => {
    return api.patch('/notifications/read-all');
  },
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
