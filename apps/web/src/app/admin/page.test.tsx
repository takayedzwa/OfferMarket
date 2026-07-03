import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminDashboard from './page';

// --- Module-level mocks ---

// These must be defined inside jest.mock factories to avoid hoisting issues.
// We use a module-scoped object to share mutable references between the mock factory and test code.

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  prefetch: jest.fn(),
};

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  usePathname: () => '/admin',
  useSearchParams: () => new URLSearchParams(),
}));

const mockUseAuth = jest.fn();

jest.mock('@/contexts/AuthContext', () => {
  const { useAuth } = jest.requireActual
    ? { useAuth: (...args: unknown[]) => mockUseAuth(...args) }
    : { useAuth: mockUseAuth };
  return {
    useAuth,
    AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  };
});

jest.mock('lucide-react', () => ({
  Users: () => 'UsersIcon',
  Building2: () => 'Building2Icon',
  Settings: () => 'SettingsIcon',
  AlertTriangle: () => 'AlertTriangleIcon',
  FileText: () => 'FileTextIcon',
  Eye: () => 'EyeIcon',
  DollarSign: () => 'DollarSignIcon',
  Clock: () => 'ClockIcon',
  Activity: () => 'ActivityIcon',
  UserCheck: () => 'UserCheckIcon',
}));

// --- Mock fetch ---

const mockFetch = jest.fn();

// --- Helpers ---

const defaultAuthReturn = {
  user: { id: '1', email: 'admin@example.com', role: 'ADMIN' as const, emailVerified: true, phoneVerified: true },
  loading: false,
  logout: jest.fn(),
  refreshUser: jest.fn(),
};

const defaultStats = {
  totalUsers: 100,
  totalWorkers: 60,
  totalEmployers: 40,
  pendingVerifications: 5,
  activeOffers: 25,
  totalCredits: 50000,
};

function setupLocalStorage(admin = true) {
  localStorage.clear();
  if (admin) {
    localStorage.setItem('accessToken', 'test-token');
    localStorage.setItem('userRole', 'ADMIN');
    localStorage.setItem('userId', 'user-1');
  }
}

function setupFetchSuccess(data = defaultStats) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    status: 200,
    json: async () => data,
  });
}

function setupFetchError(status: number) {
  mockFetch.mockResolvedValueOnce({
    ok: status < 400,
    status,
    json: async () => ({ message: 'Error' }),
  });
}

function setupFetchNetworkError() {
  mockFetch.mockRejectedValueOnce(new Error('Failed to fetch stats'));
}

// --- Tests ---

describe('AdminDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue(defaultAuthReturn);
    global.fetch = mockFetch;
    process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3001/api/v1';
  });

  afterEach(() => {
    localStorage.clear();
    // @ts-expect-error -- cleanup
    delete global.fetch;
    delete process.env.NEXT_PUBLIC_API_URL;
  });

  // -----------------------------------------------------------------------
  // Group 1: Auth / Redirect Behavior
  // -----------------------------------------------------------------------

  describe('Auth / Redirect', () => {
    it('redirects to /login when no accessToken in localStorage', async () => {
      localStorage.clear();
      mockUseAuth.mockReturnValue(defaultAuthReturn);

      render(<AdminDashboard />);

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/login');
      });
    });

    it('redirects to /login when no userRole in localStorage', async () => {
      localStorage.clear();
      localStorage.setItem('accessToken', 'test-token');

      render(<AdminDashboard />);

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/login');
      });
    });

    it('redirects to /login when userRole is not ADMIN', async () => {
      localStorage.clear();
      localStorage.setItem('accessToken', 'test-token');
      localStorage.setItem('userRole', 'WORKER');

      render(<AdminDashboard />);

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/login');
      });
    });

    it('does not redirect when user is admin', async () => {
      setupLocalStorage(true);
      setupFetchSuccess();

      render(<AdminDashboard />);

      // Wait for data to load
      await screen.findByText('Total Users');

      // Should NOT have been called with /login
      expect(mockRouter.push).not.toHaveBeenCalledWith('/login');
    });

    it('redirects to /login when fetch returns 401', async () => {
      setupLocalStorage(true);
      setupFetchError(401);

      render(<AdminDashboard />);

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/login');
      });
    });
  });

  // -----------------------------------------------------------------------
  // Group 2: Loading State
  // -----------------------------------------------------------------------

  describe('Loading State', () => {
    it('renders loading spinner while data is being fetched', () => {
      setupLocalStorage(true);
      // Don't resolve fetch yet — keep component in loading state
      mockFetch.mockReturnValue(new Promise(() => {}));

      render(<AdminDashboard />);

      expect(screen.getByText('Loading dashboard...')).toBeInTheDocument();
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });
  });

  // -----------------------------------------------------------------------
  // Group 3: Error State
  // -----------------------------------------------------------------------

  describe('Error State', () => {
    it('renders error message when fetch fails', async () => {
      setupLocalStorage(true);
      setupFetchNetworkError();

      render(<AdminDashboard />);

      expect(await screen.findByText('Failed to fetch stats')).toBeInTheDocument();
    });

    it('renders "Go Back" button on error', async () => {
      setupLocalStorage(true);
      setupFetchNetworkError();

      render(<AdminDashboard />);

      expect(await screen.findByText('Go Back')).toBeInTheDocument();
    });

    it('"Go Back" button navigates to /', async () => {
      setupLocalStorage(true);
      setupFetchNetworkError();

      render(<AdminDashboard />);

      const goBackButton = await screen.findByText('Go Back');
      await userEvent.click(goBackButton);

      expect(mockRouter.push).toHaveBeenCalledWith('/');
    });

    it('does not show error message for 401 responses (redirects instead)', async () => {
      setupLocalStorage(true);
      setupFetchError(401);

      render(<AdminDashboard />);

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/login');
      });

      expect(screen.queryByText('Failed to fetch stats')).not.toBeInTheDocument();
    });
  });

  // -----------------------------------------------------------------------
  // Group 4: Successful Data Rendering
  // -----------------------------------------------------------------------

  describe('Successful Data Rendering', () => {
    it('renders all 6 stat cards with correct labels and values', async () => {
      setupLocalStorage(true);
      setupFetchSuccess();

      render(<AdminDashboard />);

      expect(await screen.findByText('Total Users')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
      expect(screen.getByText('Workers')).toBeInTheDocument();
      expect(screen.getByText('60')).toBeInTheDocument();
      expect(screen.getByText('Employers')).toBeInTheDocument();
      expect(screen.getByText('40')).toBeInTheDocument();
      expect(screen.getByText('Pending Verifications')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('Active Offers')).toBeInTheDocument();
      expect(screen.getByText('25')).toBeInTheDocument();
      expect(screen.getByText('Total Credits')).toBeInTheDocument();
    });

    it('formats totalCredits with Euro symbol and locale formatting', async () => {
      setupLocalStorage(true);
      setupFetchSuccess({ ...defaultStats, totalCredits: 50000 });

      render(<AdminDashboard />);

      expect(await screen.findByText(/€50,000/)).toBeInTheDocument();
    });

    it('renders user email in the header', async () => {
      setupLocalStorage(true);
      setupFetchSuccess();

      render(<AdminDashboard />);

      expect(await screen.findByText('admin@example.com')).toBeInTheDocument();
    });

    it('renders "Platform Management" subtitle', async () => {
      setupLocalStorage(true);
      setupFetchSuccess();

      render(<AdminDashboard />);

      expect(await screen.findByText('Platform Management')).toBeInTheDocument();
    });

    it('renders all 3 quick action buttons with labels and descriptions', async () => {
      setupLocalStorage(true);
      setupFetchSuccess();

      render(<AdminDashboard />);

      expect(await screen.findByText('Settings')).toBeInTheDocument();
      expect(screen.getByText('Platform settings')).toBeInTheDocument();
      expect(screen.getByText('Reports')).toBeInTheDocument();
      expect(screen.getByText('Reported content')).toBeInTheDocument();
      expect(screen.getByText('Audit Logs')).toBeInTheDocument();
      expect(screen.getByText('View audit trail')).toBeInTheDocument();
    });
  });

  // -----------------------------------------------------------------------
  // Group 5: Stat Card Navigation
  // -----------------------------------------------------------------------

  describe('Stat Card Navigation', () => {
    it('"Total Users" card navigates to /admin/users', async () => {
      setupLocalStorage(true);
      setupFetchSuccess();

      render(<AdminDashboard />);

      const card = await screen.findByText('Total Users');
      await userEvent.click(card);

      expect(mockRouter.push).toHaveBeenCalledWith('/admin/users');
    });

    it('"Workers" card navigates to /admin/users', async () => {
      setupLocalStorage(true);
      setupFetchSuccess();

      render(<AdminDashboard />);

      const card = await screen.findByText('Workers');
      await userEvent.click(card);

      expect(mockRouter.push).toHaveBeenCalledWith('/admin/users');
    });

    it('"Employers" card navigates to /admin/employers', async () => {
      setupLocalStorage(true);
      setupFetchSuccess();

      render(<AdminDashboard />);

      const card = await screen.findByText('Employers');
      await userEvent.click(card);

      expect(mockRouter.push).toHaveBeenCalledWith('/admin/employers');
    });

    it('"Pending Verifications" card navigates to /admin/verifications', async () => {
      setupLocalStorage(true);
      setupFetchSuccess();

      render(<AdminDashboard />);

      const card = await screen.findByText('Pending Verifications');
      await userEvent.click(card);

      expect(mockRouter.push).toHaveBeenCalledWith('/admin/verifications');
    });

    it('"Active Offers" card navigates to /admin/offers', async () => {
      setupLocalStorage(true);
      setupFetchSuccess();

      render(<AdminDashboard />);

      const card = await screen.findByText('Active Offers');
      await userEvent.click(card);

      expect(mockRouter.push).toHaveBeenCalledWith('/admin/offers');
    });

    it('"Total Credits" card navigates to /admin/settings', async () => {
      setupLocalStorage(true);
      setupFetchSuccess();

      render(<AdminDashboard />);

      const card = await screen.findByText('Total Credits');
      await userEvent.click(card);

      expect(mockRouter.push).toHaveBeenCalledWith('/admin/settings');
    });
  });

  // -----------------------------------------------------------------------
  // Group 6: Quick Action Navigation
  // -----------------------------------------------------------------------

  describe('Quick Action Navigation', () => {
    it('"Settings" button navigates to /admin/settings', async () => {
      setupLocalStorage(true);
      setupFetchSuccess();

      render(<AdminDashboard />);

      const button = await screen.findByText('Settings');
      await userEvent.click(button);

      expect(mockRouter.push).toHaveBeenCalledWith('/admin/settings');
    });

    it('"Reports" button navigates to /admin/reports', async () => {
      setupLocalStorage(true);
      setupFetchSuccess();

      render(<AdminDashboard />);

      const button = await screen.findByText('Reports');
      await userEvent.click(button);

      expect(mockRouter.push).toHaveBeenCalledWith('/admin/reports');
    });

    it('"Audit Logs" button navigates to /admin/audit-logs', async () => {
      setupLocalStorage(true);
      setupFetchSuccess();

      render(<AdminDashboard />);

      const button = await screen.findByText('Audit Logs');
      await userEvent.click(button);

      expect(mockRouter.push).toHaveBeenCalledWith('/admin/audit-logs');
    });
  });

  // -----------------------------------------------------------------------
  // Group 7: Exit Admin Button
  // -----------------------------------------------------------------------

  describe('Exit Admin', () => {
    it('"Exit Admin" button navigates to /', async () => {
      setupLocalStorage(true);
      setupFetchSuccess();

      render(<AdminDashboard />);

      const exitButton = await screen.findByText('Exit Admin');
      await userEvent.click(exitButton);

      expect(mockRouter.push).toHaveBeenCalledWith('/');
    });
  });
});