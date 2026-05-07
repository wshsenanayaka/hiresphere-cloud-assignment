import React from 'react';

function Metric({ icon, label, value, active = false, onClick }) {
  const content = (
    <>
      <span>{React.cloneElement(icon, { size: 20 })}</span>
      <div>
        <strong>{value}</strong>
        <small>{label}</small>
      </div>
    </>
  );

  if (onClick) {
    return (
      <button
        className={active ? 'metric active' : 'metric'}
        type="button"
        onClick={onClick}
        aria-pressed={active}
      >
        {content}
      </button>
    );
  }

  return (
    <div className="metric">
      {content}
    </div>
  );
}

export default Metric;
