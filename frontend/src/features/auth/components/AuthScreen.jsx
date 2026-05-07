import { CheckCircle2, ChevronRight, UserCheck, Users } from 'lucide-react';

function AuthScreen({ authMode, setAuthMode, profileType, setProfileType, onSubmit, error }) {
  return (
    <main className="auth-layout">
      <section className="brand-panel">
        <p className="eyebrow">Cloud interview management</p>
        <h1>HireSphere</h1>
        <p>
          Book interviews, manage availability, upload challenges, and publish evaluations from one
          simple workflow.
        </p>
        <div className="flow-list">
          {['Select profile', 'Book interview', 'Upload submission', 'Review evaluation'].map(
            (item) => (
              <span key={item}>
                <CheckCircle2 size={18} /> {item}
              </span>
            ),
          )}
        </div>
      </section>

      <section className="auth-panel">
        <div className="segmented" aria-label="Authentication mode">
          <button className={authMode === 'login' ? 'active' : ''} onClick={() => setAuthMode('login')}>
            Login
          </button>
          <button className={authMode === 'signup' ? 'active' : ''} onClick={() => setAuthMode('signup')}>
            Sign up
          </button>
        </div>

        <h2>{authMode === 'login' ? 'Welcome back' : 'Create account'}</h2>
        <p className="muted">Select how you want to enter the platform.</p>

        <div className="profile-options">
          <button
            className={profileType === 'candidate' ? 'selected' : ''}
            onClick={() => setProfileType('candidate')}
          >
            <Users size={22} />
            <strong>Candidate</strong>
            <span>Search and book interviews</span>
          </button>
          <button
            className={profileType === 'interviewer' ? 'selected' : ''}
            onClick={() => setProfileType('interviewer')}
          >
            <UserCheck size={22} />
            <strong>Interviewer</strong>
            <span>Manage slots and evaluations</span>
          </button>
        </div>

        <form onSubmit={onSubmit} className="auth-form">
          {authMode === 'signup' && <input name="name" placeholder="Full name" required />}
          <input name="email" type="email" placeholder="Email address" required />
          <input name="password" type="password" placeholder="Password" required />
          {error && <p className="form-error">{error}</p>}
          <button className="primary-button" disabled={!profileType}>
            Continue <ChevronRight size={18} />
          </button>
        </form>
      </section>
    </main>
  );
}

export default AuthScreen;
