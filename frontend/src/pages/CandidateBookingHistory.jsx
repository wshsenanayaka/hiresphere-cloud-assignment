import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, RefreshCcw } from 'lucide-react';
import { bookingApi } from '../services/bookingApi';
import { showError, showSuccess } from '../utils/alerts';

function CandidateBookingHistory({ user, onBack }) {
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const candidateId = user?.id || params.get('candidateId') || '';
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function loadBookings({ notify = false } = {}) {
    if (!candidateId) {
      const missingIdMessage = 'candidateId is required to load booking history.';
      setError(missingIdMessage);
      if (notify) showError('Cannot load history', missingIdMessage);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await bookingApi.getCandidateBookings(candidateId);
      setBookings(data.bookings || []);
      if (notify) {
        await showSuccess('History refreshed', 'Booking history was loaded successfully.');
      }
    } catch (requestError) {
      setError(requestError.message);
      if (notify) showError('Refresh failed', requestError);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBookings();
  }, [candidateId]);

  return (
    <section className="workspace">
      <div className="dashboard-header">
        <div>
          <p className="eyebrow">Booking Service</p>
          <h2>Booking History</h2>
          <p>Track your interview booking status from request to completion.</p>
        </div>
        <div className="dashboard-actions">
          <button className="secondary-button header-action" type="button" onClick={onBack}>
            <ArrowLeft size={17} /> Back
          </button>
          <button className="secondary-button header-action" type="button" onClick={() => loadBookings({ notify: true })} disabled={loading}>
            <RefreshCcw size={17} /> Refresh
          </button>
        </div>
      </div>

      {error && <p className="form-error page-message">{error}</p>}

      <section className="panel wide">
        <div className="table booking-history-table">
          <div className="table-head">
            <span>Interviewer</span>
            <span>Interview Type</span>
            <span>Domain</span>
            <span>Date</span>
            <span>Time</span>
            <span>Price</span>
            <span>Status</span>
            <span>Reason</span>
          </div>
          {bookings.length === 0 && !loading && <div className="empty-state">No booking history found.</div>}
          {bookings.map((booking) => (
            <div className="table-row" key={booking.id}>
              <span>{booking.interviewerName}</span>
              <span>{booking.interviewType}</span>
              <span>{booking.domain}</span>
              <span>{booking.scheduledDate}</span>
              <span>{booking.scheduledTime}</span>
              <span>${Number(booking.price || 0).toFixed(2)}</span>
              <span className="status-pill">{booking.status}</span>
              <span>{booking.rejectionReason || '-'}</span>
            </div>
          ))}
        </div>
      </section>
    </section>
  );
}

export default CandidateBookingHistory;
