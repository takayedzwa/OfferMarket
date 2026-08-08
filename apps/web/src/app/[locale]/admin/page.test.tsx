import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import AdminDashboard from '@/app/[locale]/admin/page';
import enMessages from '@/messages/en';

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

// The admin page uses the locale-aware router from `@/i18n/navigation`
// (next-intl). Mock it to return the same mockRouter so navigation
// assertions keep working without a real Next router.
jest.mock('@/i18n/navigation', () => ({
  useRouter: () => mockRouter,
  Link: function MockLink({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: any }) {
    return <a href={href} {...props}>{children}</a>;
  },
  usePathname: () => '/admin',
  redirect: jest.fn(),
  getPathname: jest.fn(),
}));

const mockUseAuth = jest.fn();

jest.mock('@/contexts/AuthContext', () => {
  // Wrap mockUseAuth so call args are forwarded; previously this used an
  // always-true ternary on `jest.requireActual` (a function reference), which
  // triggered TS2774 and always picked this branch anyway.
  const useAuth = (...args: unknown[]) => mockUseAuth(...args);
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
  CreditCard: () => 'CreditCardIcon',
  ShieldAlert: () => 'ShieldAlertIcon',
  LifeBuoy: () => 'LifeBuoyIcon',
  Scale: () => 'ScaleIcon',
  ShieldCheck: () => 'ShieldCheckIcon',
}));

// A-L3: the dashboard now uses the centralized axios client (adminApi) instead
// of raw fetch(). Mock the api module so the auth-header/interceptor logic is
// not exercised here — it's covered by the api client itself.
const mockGetDashboardStats = jest.fn();

jest.mock('@/lib/api', () => {
  // The page's useFormat hook imports formatCurrency/formatDate from here.
  // Provide lightweight locale-aware implementations so the Total Credits
  // Euro formatting assertion works, without loading the real api module
  // (which pulls in axios/socket.io side effects).
  return {
    adminApi: {
      getDashboardStats: (...args: unknown[]) => mockGetDashboardStats(...args),
    },
    formatCurrency: (amount: number, currency: string = 'EUR', locale: string = 'en', options: Record<string, unknown> = {}) =>
      new Intl.NumberFormat(locale, { style: 'currency', currency, ...options }).format(amount),
    formatDate: (date: string | number | Date, locale: string = 'en', options?: Intl.DateTimeFormatOptions) =>
      new Intl.DateTimeFormat(locale, options ?? { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(date)),
  };
});

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
  // adminApi.getDashboardStats() resolves to an axios-style response { data }.
  mockGetDashboardStats.mockResolvedValueOnce({ data });
}

function setupFetchNetworkError() {
  mockGetDashboardStats.mockRejectedValueOnce(new Error('Failed to fetch stats'));
}

// --- Tests ---

// Wraps a node in the provider the page needs for `useTranslations`/`useLocale`.
function renderWithIntl(ui: React.ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={enMessages}>
      {ui}
    </NextIntlClientProvider>,
  );
}

describe('AdminDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue(defaultAuthReturn);
    process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3001/api/v1';
  });

  afterEach(() => {
    localStorage.clear();
    delete process.env.NEXT_PUBLIC_API_URL;
  });

  // -----------------------------------------------------------------------
  // Group 1: Auth / Redirect Behavior
  // -----------------------------------------------------------------------

  describe('Auth / Redirect', () => {
    it('redirects to /login when no accessToken in localStorage', async () => {
      localStorage.clear();
      mockUseAuth.mockReturnValue(defaultAuthReturn);

      renderWithIntl(<AdminDashboard />);

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/login');
      });
    });

    it('redirects to /login when AuthContext user is null', async () => {
      setupLocalStorage(true);
      mockUseAuth.mockReturnValue({ ...defaultAuthReturn, user: null });

      renderWithIntl(<AdminDashboard />);

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/login');
      });
    });

    it('redirects to /login when user role is not ADMIN', async () => {
      setupLocalStorage(true);
      mockUseAuth.mockReturnValue({
        ...defaultAuthReturn,
        user: { ...defaultAuthReturn.user, role: 'WORKER' as const },
      });

      renderWithIntl(<AdminDashboard />);

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/login');
      });
    });

    it('does not redirect when user is admin', async () => {
      setupLocalStorage(true);
      setupFetchSuccess();

      renderWithIntl(<AdminDashboard />);

      // Wait for data to load
      await screen.findByText('Total Users');

      // Should NOT have been called with /login
      expect(mockRouter.push).not.toHaveBeenCalledWith('/login');
    });
  });

  // -----------------------------------------------------------------------
  // Group 2: Loading State
  // -----------------------------------------------------------------------

  describe('Loading State', () => {
    it('renders loading spinner while data is being fetched', () => {
      setupLocalStorage(true);
      // Don't resolve the request yet — keep component in loading state
      mockGetDashboardStats.mockReturnValue(new Promise(() => {}));

      renderWithIntl(<AdminDashboard />);

      expect(screen.getByText('Loading dashboard...')).toBeInTheDocument();
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });
  });

  // -----------------------------------------------------------------------
  // Group 3: Error State
  // -----------------------------------------------------------------------

  describe('Error State', () => {
    it('renders error message when the request fails', async () => {
      setupLocalStorage(true);
      setupFetchNetworkError();

      renderWithIntl(<AdminDashboard />);

      expect(await screen.findByText('Failed to fetch stats')).toBeInTheDocument();
    });

    it('renders "Go Back" button on error', async () => {
      setupLocalStorage(true);
      setupFetchNetworkError();

      renderWithIntl(<AdminDashboard />);

      expect(await screen.findByText('Go Back')).toBeInTheDocument();
    });

    it('"Go Back" button navigates to /', async () => {
      setupLocalStorage(true);
      setupFetchNetworkError();

      renderWithIntl(<AdminDashboard />);

      const goBackButton = await screen.findByText('Go Back');
      await userEvent.click(goBackButton);

      expect(mockRouter.push).toHaveBeenCalledWith('/');
    });
  });

  // -----------------------------------------------------------------------
  // Group 4: Successful Data Rendering
  // -----------------------------------------------------------------------

  describe('Successful Data Rendering', () => {
    it('renders all 6 stat cards with correct labels and values', async () => {
      setupLocalStorage(true);
      setupFetchSuccess();

      renderWithIntl(<AdminDashboard />);

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

      renderWithIntl(<AdminDashboard />);

      expect(await screen.findByText(/€50,000/)).toBeInTheDocument();
    });

    it('renders user email in the header', async () => {
      setupLocalStorage(true);
      setupFetchSuccess();

      renderWithIntl(<AdminDashboard />);

      expect(await screen.findByText('admin@example.com')).toBeInTheDocument();
    });

    it('renders "Platform Management" subtitle', async () => {
      setupLocalStorage(true);
      setupFetchSuccess();

      renderWithIntl(<AdminDashboard />);

      expect(await screen.findByText('Platform Management')).toBeInTheDocument();
    });

    it('renders the core quick action buttons with labels and descriptions', async () => {
      setupLocalStorage(true);
      setupFetchSuccess();

      renderWithIntl(<AdminDashboard />);

      expect(await screen.findByText('Settings')).toBeInTheDocument();
      expect(screen.getByText('Platform settings')).toBeInTheDocument();
      expect(screen.getByText('Reports')).toBeInTheDocument();
      expect(screen.getByText('Reported content')).toBeInTheDocument();
      expect(screen.getByText('Audit Logs')).toBeInTheDocument();
      expect(screen.getByText('View audit trail')).toBeInTheDocument();
    });

    it('renders quick action links for the previously-missing admin modules', async () => {
      setupLocalStorage(true);
      setupFetchSuccess();

      renderWithIntl(<AdminDashboard />);

      // A-L5: Trust/Privacy/DSA/Support now have admin pages linked here.
      expect(await screen.findByText('Trust & Fraud')).toBeInTheDocument();
      expect(screen.getByText('GDPR / Privacy')).toBeInTheDocument();
      expect(screen.getByText('DSA Compliance')).toBeInTheDocument();
      expect(screen.getByText('Support')).toBeInTheDocument();
    });
  });

  // -----------------------------------------------------------------------
  // Group 5: Stat Card Navigation
  // -----------------------------------------------------------------------

  describe('Stat Card Navigation', () => {
    it('"Total Users" card navigates to /admin/users', async () => {
      setupLocalStorage(true);
      setupFetchSuccess();

      renderWithIntl(<AdminDashboard />);

      const card = await screen.findByText('Total Users');
      await userEvent.click(card);

      expect(mockRouter.push).toHaveBeenCalledWith('/admin/users');
    });

    it('"Workers" card navigates to /admin/users', async () => {
      setupLocalStorage(true);
      setupFetchSuccess();

      renderWithIntl(<AdminDashboard />);

      const card = await screen.findByText('Workers');
      await userEvent.click(card);

      expect(mockRouter.push).toHaveBeenCalledWith('/admin/users');
    });

    it('"Employers" card navigates to /admin/employers', async () => {
      setupLocalStorage(true);
      setupFetchSuccess();

      renderWithIntl(<AdminDashboard />);

      const card = await screen.findByText('Employers');
      await userEvent.click(card);

      expect(mockRouter.push).toHaveBeenCalledWith('/admin/employers');
    });

    it('"Pending Verifications" card navigates to /admin/verifications', async () => {
      setupLocalStorage(true);
      setupFetchSuccess();

      renderWithIntl(<AdminDashboard />);

      const card = await screen.findByText('Pending Verifications');
      await userEvent.click(card);

      expect(mockRouter.push).toHaveBeenCalledWith('/admin/verifications');
    });

    it('"Active Offers" card navigates to /admin/offers', async () => {
      setupLocalStorage(true);
      setupFetchSuccess();

      renderWithIntl(<AdminDashboard />);

      const card = await screen.findByText('Active Offers');
      await userEvent.click(card);

      expect(mockRouter.push).toHaveBeenCalledWith('/admin/offers');
    });

    it('"Total Credits" card navigates to /admin/settings', async () => {
      setupLocalStorage(true);
      setupFetchSuccess();

      renderWithIntl(<AdminDashboard />);

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

      renderWithIntl(<AdminDashboard />);

      const button = await screen.findByText('Settings');
      await userEvent.click(button);

      expect(mockRouter.push).toHaveBeenCalledWith('/admin/settings');
    });

    it('"Reports" button navigates to /admin/reports', async () => {
      setupLocalStorage(true);
      setupFetchSuccess();

      renderWithIntl(<AdminDashboard />);

      const button = await screen.findByText('Reports');
      await userEvent.click(button);

      expect(mockRouter.push).toHaveBeenCalledWith('/admin/reports');
    });

    it('"Audit Logs" button navigates to /admin/audit-logs', async () => {
      setupLocalStorage(true);
      setupFetchSuccess();

      renderWithIntl(<AdminDashboard />);

      const button = await screen.findByText('Audit Logs');
      await userEvent.click(button);

      expect(mockRouter.push).toHaveBeenCalledWith('/admin/audit-logs');
    });

    it('"Support" button navigates to /admin/support', async () => {
      setupLocalStorage(true);
      setupFetchSuccess();

      renderWithIntl(<AdminDashboard />);

      const button = await screen.findByText('Support');
      await userEvent.click(button);

      expect(mockRouter.push).toHaveBeenCalledWith('/admin/support');
    });
  });

  // -----------------------------------------------------------------------
  // Group 7: Exit Admin Button
  // -----------------------------------------------------------------------

  describe('Exit Admin', () => {
    it('"Exit Admin" button navigates to /', async () => {
      setupLocalStorage(true);
      setupFetchSuccess();

      renderWithIntl(<AdminDashboard />);

      const exitButton = await screen.findByText('Exit Admin');
      await userEvent.click(exitButton);

      expect(mockRouter.push).toHaveBeenCalledWith('/');
    });
  });
});