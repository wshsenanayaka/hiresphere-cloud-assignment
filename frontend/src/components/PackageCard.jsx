import { CalendarDays, CheckCircle2, DollarSign } from 'lucide-react';

function formatCurrency(value, currency) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: currency || 'USD' }).format(Number(value || 0));
}

function PackageCard({ item, actionLabel, onAction, secondaryActionLabel, onSecondaryAction }) {
  return (
    <article className="package-card">
      <div className="package-card-top">
        <span className="status-pill">{item.isActive === false ? 'Inactive' : 'Active'}</span>
        {item.discountPercentage > 0 && <span className="status-pill">{item.discountPercentage}% off</span>}
      </div>
      <h3>{item.packageName}</h3>
      <p>{item.description || 'Bundled interview preparation package.'}</p>
      <div className="package-meta">
        <span>{item.domain}</span>
        <span>{item.interviewType}</span>
        {item.interviewerName && <span>{item.interviewerName}</span>}
      </div>
      <div className="package-stats">
        <span>
          <CalendarDays size={16} /> {item.sessionCount} sessions
        </span>
        <span>{item.durationMinutesPerSession} min each</span>
        <strong>
          <DollarSign size={17} /> {formatCurrency(item.totalPrice, item.currency)}
        </strong>
      </div>
      <div className="form-actions">
        {actionLabel && (
          <button className="primary-button" type="button" onClick={() => onAction?.(item)}>
            <CheckCircle2 size={17} /> {actionLabel}
          </button>
        )}
        {secondaryActionLabel && (
          <button className="secondary-button" type="button" onClick={() => onSecondaryAction?.(item)}>
            {secondaryActionLabel}
          </button>
        )}
      </div>
    </article>
  );
}

export default PackageCard;
