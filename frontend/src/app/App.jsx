import { useEffect, useState } from 'react';
import { AuthScreen } from '../features/auth';
import { CandidateDashboard } from '../features/candidate';
import { InterviewerDashboard } from '../features/interviewer';
import { Sidebar } from '../layouts';
import { api, mapBooking } from '../api';
import LiveInterviewRoom from '../pages/LiveInterviewRoom';
import MessagesPage from '../pages/MessagesPage';
import InterviewerBookingRequests from '../pages/InterviewerBookingRequests';
import CandidateBookingHistory from '../pages/CandidateBookingHistory';
import InterviewerPricingPage from '../pages/InterviewerPricingPage';
import InterviewerSubmissionReviewPage from '../pages/InterviewerSubmissionReviewPage';
import CandidateSubmissionFeedbackPage from '../pages/CandidateSubmissionFeedbackPage';
import InterviewerPackagesPage from '../pages/InterviewerPackagesPage';
import CandidatePackageMarketplacePage from '../pages/CandidatePackageMarketplacePage';
import CandidatePackageBookingsPage from '../pages/CandidatePackageBookingsPage';
import InterviewerEvaluationForm from '../pages/InterviewerEvaluationForm';
import CandidateEvaluationReports from '../pages/CandidateEvaluationReports';
import { showError, showSuccess } from '../utils/alerts';

const STORED_USER_KEY = 'hiresphere.user';

function getStoredUser() {
  try {
    return JSON.parse(window.localStorage.getItem(STORED_USER_KEY));
  } catch {
    return null;
  }
}

function App() {
  const [user, setUser] = useState(() => getStoredUser());
  const [authMode, setAuthMode] = useState('login');
  const [profileType, setProfileType] = useState('');
  const [bookings, setBookings] = useState([]);
  const [authError, setAuthError] = useState('');
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  const activeProfile = user?.profileType || profileType;
  const isLiveInterviewPage = currentPath === '/live-interview';
  const isMessagesPage = currentPath === '/messages';
  const isBookingRequestsPage = currentPath === '/booking-requests';
  const isBookingHistoryPage = currentPath === '/booking-history';
  const isPricingPage = currentPath === '/pricing';
  const isSubmissionReviewPage = currentPath === '/submission-review';
  const isSubmissionFeedbackPage = currentPath === '/submission-feedback';
  const isInterviewerPackagesPage = currentPath === '/interviewer-packages';
  const isPackageMarketplacePage = currentPath === '/packages';
  const isCandidatePackageBookingsPage = currentPath === '/my-packages';
  const isInterviewerEvaluationPage = currentPath === '/evaluation-form';
  const isCandidateEvaluationReportsPage = currentPath === '/evaluation-reports';

  function navigate(path) {
    window.history.pushState({}, '', path);
    setCurrentPath(window.location.pathname);
  }

  async function loadBookings(currentUser) {
    if (!currentUser) return;

    const rows =
      currentUser.profileType === 'candidate'
        ? await api.getCandidateBookings(currentUser.id)
        : await api.getInterviewerBookings(currentUser.interviewerId);

    setBookings(rows.map(mapBooking));
  }

  async function handleAuth(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setAuthError('');

    try {
      const loggedInUser = await api.login({
        mode: authMode,
        name: form.get('name'),
        email: form.get('email'),
        password: form.get('password'),
        role: profileType,
      });

      setUser(loggedInUser);
      window.localStorage.setItem(STORED_USER_KEY, JSON.stringify(loggedInUser));
      await loadBookings(loggedInUser);
      await showSuccess(authMode === 'signup' ? 'Account created' : 'Login successful', `Welcome, ${loggedInUser.name}.`);
    } catch (error) {
      setAuthError(error.message);
      showError(authMode === 'signup' ? 'Signup failed' : 'Login failed', error);
    }
  }

  function logout() {
    setUser(null);
    window.localStorage.removeItem(STORED_USER_KEY);
    setProfileType('');
    setAuthMode('login');
    setBookings([]);
  }

  useEffect(() => {
    if (user) {
      loadBookings(user).catch((error) => console.error(error));
    }
  }, [user]);

  useEffect(() => {
    function handleRouteChange() {
      setCurrentPath(window.location.pathname);
    }

    window.addEventListener('popstate', handleRouteChange);
    return () => window.removeEventListener('popstate', handleRouteChange);
  }, []);

  if (isLiveInterviewPage) {
    return <LiveInterviewRoom />;
  }

  if (isMessagesPage) {
    return <MessagesPage />;
  }

  if (isBookingRequestsPage) {
    return user ? (
      <main className={isSidebarVisible ? 'app-shell' : 'app-shell sidebar-hidden'}>
        <Sidebar
          user={user}
          activeProfile={activeProfile}
          isVisible={isSidebarVisible}
          onLogout={logout}
          onToggle={() => setIsSidebarVisible((visible) => !visible)}
        />
        <InterviewerBookingRequests user={user} onBack={() => navigate('/')} />
      </main>
    ) : (
      <InterviewerBookingRequests onBack={() => navigate('/')} />
    );
  }

  if (isBookingHistoryPage) {
    return user ? (
      <main className={isSidebarVisible ? 'app-shell' : 'app-shell sidebar-hidden'}>
        <Sidebar
          user={user}
          activeProfile={activeProfile}
          isVisible={isSidebarVisible}
          onLogout={logout}
          onToggle={() => setIsSidebarVisible((visible) => !visible)}
        />
        <CandidateBookingHistory user={user} onBack={() => navigate('/')} />
      </main>
    ) : (
      <CandidateBookingHistory onBack={() => navigate('/')} />
    );
  }

  if (isPricingPage) {
    return user ? (
      <main className={isSidebarVisible ? 'app-shell' : 'app-shell sidebar-hidden'}>
        <Sidebar
          user={user}
          activeProfile={activeProfile}
          isVisible={isSidebarVisible}
          onLogout={logout}
          onToggle={() => setIsSidebarVisible((visible) => !visible)}
        />
        <InterviewerPricingPage user={user} onBack={() => navigate('/')} />
      </main>
    ) : (
      <InterviewerPricingPage onBack={() => navigate('/')} />
    );
  }

  if (isSubmissionReviewPage) {
    return user ? (
      <main className={isSidebarVisible ? 'app-shell' : 'app-shell sidebar-hidden'}>
        <Sidebar
          user={user}
          activeProfile={activeProfile}
          isVisible={isSidebarVisible}
          onLogout={logout}
          onToggle={() => setIsSidebarVisible((visible) => !visible)}
        />
        <InterviewerSubmissionReviewPage user={user} onBack={() => navigate('/')} />
      </main>
    ) : (
      <InterviewerSubmissionReviewPage onBack={() => navigate('/')} />
    );
  }

  if (isSubmissionFeedbackPage) {
    return user ? (
      <main className={isSidebarVisible ? 'app-shell' : 'app-shell sidebar-hidden'}>
        <Sidebar
          user={user}
          activeProfile={activeProfile}
          isVisible={isSidebarVisible}
          onLogout={logout}
          onToggle={() => setIsSidebarVisible((visible) => !visible)}
        />
        <CandidateSubmissionFeedbackPage user={user} onBack={() => navigate('/')} />
      </main>
    ) : (
      <CandidateSubmissionFeedbackPage onBack={() => navigate('/')} />
    );
  }

  if (isInterviewerPackagesPage) {
    return user ? (
      <main className={isSidebarVisible ? 'app-shell' : 'app-shell sidebar-hidden'}>
        <Sidebar user={user} activeProfile={activeProfile} isVisible={isSidebarVisible} onLogout={logout} onToggle={() => setIsSidebarVisible((visible) => !visible)} />
        <InterviewerPackagesPage user={user} onBack={() => navigate('/')} />
      </main>
    ) : <InterviewerPackagesPage onBack={() => navigate('/')} />;
  }

  if (isPackageMarketplacePage) {
    return user ? (
      <main className={isSidebarVisible ? 'app-shell' : 'app-shell sidebar-hidden'}>
        <Sidebar user={user} activeProfile={activeProfile} isVisible={isSidebarVisible} onLogout={logout} onToggle={() => setIsSidebarVisible((visible) => !visible)} />
        <CandidatePackageMarketplacePage user={user} onBack={() => navigate('/')} onNavigate={navigate} />
      </main>
    ) : <CandidatePackageMarketplacePage onBack={() => navigate('/')} onNavigate={navigate} />;
  }

  if (isCandidatePackageBookingsPage) {
    return user ? (
      <main className={isSidebarVisible ? 'app-shell' : 'app-shell sidebar-hidden'}>
        <Sidebar user={user} activeProfile={activeProfile} isVisible={isSidebarVisible} onLogout={logout} onToggle={() => setIsSidebarVisible((visible) => !visible)} />
        <CandidatePackageBookingsPage user={user} onBack={() => navigate('/')} />
      </main>
    ) : <CandidatePackageBookingsPage onBack={() => navigate('/')} />;
  }

  if (isInterviewerEvaluationPage) {
    return user ? (
      <main className={isSidebarVisible ? 'app-shell' : 'app-shell sidebar-hidden'}>
        <Sidebar user={user} activeProfile={activeProfile} isVisible={isSidebarVisible} onLogout={logout} onToggle={() => setIsSidebarVisible((visible) => !visible)} />
        <InterviewerEvaluationForm user={user} onBack={() => navigate('/')} />
      </main>
    ) : <InterviewerEvaluationForm onBack={() => navigate('/')} />;
  }

  if (isCandidateEvaluationReportsPage) {
    return user ? (
      <main className={isSidebarVisible ? 'app-shell' : 'app-shell sidebar-hidden'}>
        <Sidebar user={user} activeProfile={activeProfile} isVisible={isSidebarVisible} onLogout={logout} onToggle={() => setIsSidebarVisible((visible) => !visible)} />
        <CandidateEvaluationReports user={user} onBack={() => navigate('/')} />
      </main>
    ) : <CandidateEvaluationReports onBack={() => navigate('/')} />;
  }

  if (!user) {
    return (
      <AuthScreen
        authMode={authMode}
        setAuthMode={setAuthMode}
        profileType={profileType}
        setProfileType={setProfileType}
        onSubmit={handleAuth}
        error={authError}
      />
    );
  }

  return (
    <main className={isSidebarVisible ? 'app-shell' : 'app-shell sidebar-hidden'}>
      <Sidebar
        user={user}
        activeProfile={activeProfile}
        isVisible={isSidebarVisible}
        onLogout={logout}
        onToggle={() => setIsSidebarVisible((visible) => !visible)}
      />

      {activeProfile === 'candidate' ? (
        <CandidateDashboard user={user} bookings={bookings} reloadBookings={() => loadBookings(user)} onNavigate={navigate} />
      ) : (
        <InterviewerDashboard user={user} bookings={bookings} reloadBookings={() => loadBookings(user)} onNavigate={navigate} />
      )}
    </main>
  );
}

export default App;
