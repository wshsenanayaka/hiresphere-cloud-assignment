import { LogOut, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

function Sidebar({ user, activeProfile, isVisible, onLogout, onToggle }) {
  return (
    <>
      <button
        className="sidebar-toggle"
        onClick={onToggle}
        aria-label={isVisible ? 'Hide side menu' : 'Show side menu'}
        title={isVisible ? 'Hide side menu' : 'Show side menu'}
      >
        {isVisible ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
      </button>
      <aside className="sidebar" aria-hidden={!isVisible}>
        <div>
          <p className="eyebrow">HireSphere</p>
          <h1>{activeProfile === 'candidate' ? 'Candidate Portal' : 'Interviewer Portal'}</h1>
        </div>
        <div className="profile-card">
          <div className="avatar">{user.name.charAt(0).toUpperCase()}</div>
          <div>
            <strong>{user.name}</strong>
            <span>{activeProfile}</span>
          </div>
        </div>
        <button className="secondary-button" onClick={onLogout}>
          <LogOut size={17} /> Sign out
        </button>
      </aside>
    </>
  );
}

export default Sidebar;
