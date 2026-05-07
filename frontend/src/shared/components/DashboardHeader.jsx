function DashboardHeader({ title, subtitle, actions }) {
  return (
    <header className="dashboard-header">
      <div>
        <p className="eyebrow">Workflow dashboard</p>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
      {actions && <div className="dashboard-actions">{actions}</div>}
    </header>
  );
}

export default DashboardHeader;
