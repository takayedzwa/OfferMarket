import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Navbar from './Navbar';

// --- Module-level mocks ---

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();
const mockPrefetch = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace, back: mockBack, prefetch: mockPrefetch }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock next/link to render as a regular anchor tag
jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: any }) {
    return <a href={href} {...props}>{children}</a>;
  };
});

const mockUseAuth = jest.fn();
const mockLogout = jest.fn();

jest.mock('@/contexts/AuthContext', () => {
  const useAuth = () => mockUseAuth();
  return {
    useAuth,
    AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  };
});

jest.mock('lucide-react', () => ({
  Home: () => 'HomeIcon',
  Users: () => 'UsersIcon',
  Briefcase: () => 'BriefcaseIcon',
  MessageSquare: () => 'MessageSquareIcon',
  FileText: () => 'FileTextIcon',
  Shield: () => 'ShieldIcon',
  Ticket: () => 'TicketIcon',
  Building2: () => 'Building2Icon',
  User: () => 'UserIcon',
  CreditCard: () => 'CreditCardIcon',
  Search: () => 'SearchIcon',
  Filter: () => 'FilterIcon',
  X: () => 'XIcon',
  ChevronLeft: () => 'ChevronLeftIcon',
  ChevronRight: () => 'ChevronRightIcon',
  ChevronDown: () => 'ChevronDownIcon',
  ChevronUp: () => 'ChevronUpIcon',
  Car: () => 'CarIcon',
  Globe: () => 'GlobeIcon',
  Star: () => 'StarIcon',
  ArrowRight: () => 'ArrowRightIcon',
  Award: () => 'AwardIcon',
  BadgeCheck: () => 'BadgeCheckIcon',
  CheckCircle: () => 'CheckCircleIcon',
  Lock: () => 'LockIcon',
  Flag: () => 'FlagIcon',
  Bell: () => 'BellIcon',
  Check: () => 'CheckIcon',
  CheckCheck: () => 'CheckCheckIcon',
}));

// --- Tests ---

describe('Navbar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  // ============================================================================
  // HYDRATION SAFETY
  // ============================================================================

  describe('Hydration safety', () => {
    it('should render unauthenticated state when no auth context and no localStorage', () => {
      // AuthContext returns null user → not authenticated
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        logout: mockLogout,
        refreshUser: jest.fn(),
      });

      render(<Navbar />);

      expect(screen.getByText('Sign In')).toBeInTheDocument();
      expect(screen.getByText('Get Started')).toBeInTheDocument();
    });

    it('should show WORKER nav items after localStorage populates via useEffect', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'user-1', email: 'worker@example.com', role: 'WORKER', emailVerified: true, phoneVerified: true },
        loading: false,
        logout: mockLogout,
        refreshUser: jest.fn(),
      });
      localStorage.setItem('accessToken', 'test-token');
      localStorage.setItem('userId', 'user-1');
      localStorage.setItem('userRole', 'WORKER');

      render(<Navbar />);

      // After useEffect fires, worker nav items should appear
      // Links include icon text (e.g. "BriefcaseIconDashboard"), so use getByRole with name match
      await waitFor(() => {
        expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
      }, { timeout: 3000 });
      expect(screen.getByRole('link', { name: /offers/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /messages/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /profile/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument();
    });

    it('should show EMPLOYER nav items after useEffect', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'user-2', email: 'employer@example.com', role: 'EMPLOYER', emailVerified: true, phoneVerified: true },
        loading: false,
        logout: mockLogout,
        refreshUser: jest.fn(),
      });
      localStorage.setItem('accessToken', 'test-token');
      localStorage.setItem('userId', 'user-2');
      localStorage.setItem('userRole', 'EMPLOYER');

      render(<Navbar />);

      await waitFor(() => {
        expect(screen.getByRole('link', { name: /search workers/i })).toBeInTheDocument();
      }, { timeout: 3000 });
      expect(screen.getByRole('link', { name: /messages/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /billing/i })).toBeInTheDocument();
    });

    it('should show ADMIN nav link after useEffect', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'admin-1', email: 'admin@example.com', role: 'ADMIN', emailVerified: true, phoneVerified: true },
        loading: false,
        logout: mockLogout,
        refreshUser: jest.fn(),
      });
      localStorage.setItem('accessToken', 'test-token');
      localStorage.setItem('userId', 'admin-1');
      localStorage.setItem('userRole', 'ADMIN');

      render(<Navbar />);

      await waitFor(() => {
        expect(screen.getByRole('link', { name: /admin/i })).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('should show SUPPORT nav links after useEffect', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'support-1', email: 'support@example.com', role: 'SUPPORT', emailVerified: true, phoneVerified: true },
        loading: false,
        logout: mockLogout,
        refreshUser: jest.fn(),
      });
      localStorage.setItem('accessToken', 'test-token');
      localStorage.setItem('userId', 'support-1');
      localStorage.setItem('userRole', 'SUPPORT');

      render(<Navbar />);

      await waitFor(() => {
        expect(screen.getByRole('link', { name: /support/i })).toBeInTheDocument();
      }, { timeout: 3000 });
      expect(screen.getByRole('link', { name: /tickets/i })).toBeInTheDocument();
    });
  });

  // ============================================================================
  // ROLE BADGE DISPLAY
  // ============================================================================

  describe('Role badge display', () => {
    it('should display WORKER role badge for worker users', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'user-1', email: 'worker@example.com', role: 'WORKER', emailVerified: true, phoneVerified: true },
        loading: false,
        logout: mockLogout,
        refreshUser: jest.fn(),
      });
      localStorage.setItem('accessToken', 'test-token');
      localStorage.setItem('userId', 'user-1');
      localStorage.setItem('userRole', 'WORKER');

      render(<Navbar />);

      await waitFor(() => {
        expect(screen.getByText('WORKER')).toBeInTheDocument();
      });
    });

    it('should display EMPLOYER role badge for employer users', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'user-2', email: 'employer@example.com', role: 'EMPLOYER', emailVerified: true, phoneVerified: true },
        loading: false,
        logout: mockLogout,
        refreshUser: jest.fn(),
      });
      localStorage.setItem('accessToken', 'test-token');
      localStorage.setItem('userId', 'user-2');
      localStorage.setItem('userRole', 'EMPLOYER');

      render(<Navbar />);

      await waitFor(() => {
        expect(screen.getByText('EMPLOYER')).toBeInTheDocument();
      });
    });

    it('should display ADMIN role badge for admin users', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'admin-1', email: 'admin@example.com', role: 'ADMIN', emailVerified: true, phoneVerified: true },
        loading: false,
        logout: mockLogout,
        refreshUser: jest.fn(),
      });
      localStorage.setItem('accessToken', 'test-token');
      localStorage.setItem('userId', 'admin-1');
      localStorage.setItem('userRole', 'ADMIN');

      render(<Navbar />);

      await waitFor(() => {
        expect(screen.getByText('ADMIN')).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // SIGN OUT
  // ============================================================================

  describe('Sign out', () => {
    it('should call logout when Sign out button is clicked', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'user-1', email: 'worker@example.com', role: 'WORKER', emailVerified: true, phoneVerified: true },
        loading: false,
        logout: mockLogout,
        refreshUser: jest.fn(),
      });
      localStorage.setItem('accessToken', 'test-token');
      localStorage.setItem('userId', 'user-1');
      localStorage.setItem('userRole', 'WORKER');

      render(<Navbar />);

      await waitFor(() => {
        expect(screen.getByText('Sign out')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText('Sign out'));
      expect(mockLogout).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // UNAUTHENTICATED STATE
  // ============================================================================

  describe('Unauthenticated state', () => {
    it('should show Sign In and Get Started when not authenticated', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        logout: mockLogout,
        refreshUser: jest.fn(),
      });

      render(<Navbar />);

      expect(screen.getByText('Sign In')).toBeInTheDocument();
      expect(screen.getByText('Get Started')).toBeInTheDocument();
    });

    it('should not show role-specific nav items when not authenticated', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        logout: mockLogout,
        refreshUser: jest.fn(),
      });

      render(<Navbar />);

      expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
      expect(screen.queryByText('Admin')).not.toBeInTheDocument();
      expect(screen.queryByText('Search Workers')).not.toBeInTheDocument();
    });
  });

  // ============================================================================
  // USER EMAIL DISPLAY
  // ============================================================================

  describe('User email display', () => {
    it('should display email prefix when authenticated', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'user-1', email: 'worker@example.com', role: 'WORKER', emailVerified: true, phoneVerified: true },
        loading: false,
        logout: mockLogout,
        refreshUser: jest.fn(),
      });
      localStorage.setItem('accessToken', 'test-token');
      localStorage.setItem('userId', 'user-1');
      localStorage.setItem('userRole', 'WORKER');

      render(<Navbar />);

      await waitFor(() => {
        // AuthContext provides user.email as 'worker@example.com'
        expect(screen.getByText('worker')).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // LOADING STATE (no localStorage fallback)
  // ============================================================================

  describe('Loading state', () => {
    it('should suppress the user menu while AuthContext is loading (no sign-in flash)', () => {
      // SECURITY: role/identity now come solely from AuthContext (resolved from
      // the JWT via /auth/me). There is no localStorage fallback anymore, so
      // while /auth/me is still resolving we render neither the authenticated
      // menu nor the Sign In / Get Started buttons — avoiding a sign-in flash.
      mockUseAuth.mockReturnValue({
        user: null,
        loading: true,
        logout: mockLogout,
        refreshUser: jest.fn(),
      });
      localStorage.setItem('accessToken', 'test-token');

      render(<Navbar />);

      // Neither the authed nor the unauthed user menu should be shown.
      expect(screen.queryByText('Sign out')).not.toBeInTheDocument();
      expect(screen.queryByText('Sign In')).not.toBeInTheDocument();
      expect(screen.queryByText('Get Started')).not.toBeInTheDocument();
    });
  });
});