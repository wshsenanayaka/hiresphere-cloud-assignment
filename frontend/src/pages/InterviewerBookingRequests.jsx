import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Check, RefreshCcw, X } from 'lucide-react';
import { bookingApi } from '../services/bookingApi';
import { showError, showSuccess } from '../utils/alerts';

function formatCurrency(value) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
  }).format(Number(value || 0));
}

function InterviewerBookingRequests({ user, onBack }) {
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const interviewerId = user?.interviewerId || params.get('interviewerId') || '';
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [rejectingBooking, setRejectingBooking] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  async function loadPendingBookings({ notify = false } = {}) {
    if (!interviewerId) {
      const missingIdMessage = 'interviewerId is required to load booking requests.';
      setError(missingIdMessage);
      if (notify) showError('Cannot load requests', missingIdMessage);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await bookingApi.getPendingInterviewerBookings(interviewerId);
      setBookings(data.bookings || []);
      if (notify) {
        await showSuccess('Requests refreshed', 'Booking requests were loaded successfully.');
      }
    } catch (requestError) {
      setError(requestError.message);
      if (notify) showError('Refresh failed', requestError);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPendingBookings();
  }, [interviewerId]);

  async function acceptBooking(booking) {
    setMessage('');
    setError('');

    try {
      const response = await bookingApi.acceptBooking(booking.id, interviewerId);
      setMessage(response.message);
      await loadPendingBookings();
      await showSuccess('Booking accepted', response.message || 'The booking request was accepted.');
    } catch (requestError) {
      setError(requestError.message);
      showError('Accept failed', requestError);
    }
  }

  async function rejectBooking(event) {
    event.preventDefault();
    setMessage('');
    setError('');

    try {
      const response = await bookingApi.rejectBooking(rejectingBooking.id, interviewerId, rejectionReason.trim());
      setMessage(response.message);
      setRejectingBooking(null);
      setRejectionReason('');
      await loadPendingBookings();
      await showSuccess('Booking rejected', response.message || 'The booking request was rejected.');
    } catch (requestError) {
      setError(requestError.message);
      showError('Reject failed', requestError);
    }
  }

  return (
    <section className="workspace">
      <div className="dashboard-header">
        <div>
          <p className="eyebrow">Booking Service</p>
          <h2>Booking Requests</h2>
          <p>Review pending candidate interview requests and accept or reject each booking.</p>
        </div>
        <div className="dashboard-actions">
          <button className="secondary-button header-action" type="button" onClick={onBack}>
            <ArrowLeft size={17} /> Back
          </button>
          <button className="secondary-button header-action" type="button" onClick={() => loadPendingBookings({ notify: true })} disabled={loading}>
            <RefreshCcw size={17} /> Refresh
          </button>
        </div>
      </div>

      {message && <p className="success-banner">{message}</p>}
      {error && <p className="form-error page-message">{error}</p>}

      <section className="panel wide">
        <div className="panel-title">
          <h2>Pending Requests</h2>
          <span className="call-status">{loading ? 'Loading' : `${bookings.length} pending`}</span>
        </div>

        <div className="booking-request-grid">
          {bookings.length === 0 && !loading && <div className="empty-state">No pending booking requests.</div>}
          {bookings.map((booking) => (
            <article className="booking-request-card" key={booking.id}>
              <div>
                <span className="status-pill">{booking.status}</span>
                <h3>{booking.candidateName}</h3>
                <p>{booking.interviewType}</p>
              </div>
              <dl>
                <div>
                  <dt>Domain</dt>
                  <dd>{booking.domain}</dd>
                </div>
                <div>
                  <dt>Date</dt>
                  <dd>{booking.scheduledDate}</dd>
                </div>
                <div>
                  <dt>Time</dt>
                  <dd>{booking.scheduledTime}</dd>
                </div>
                <div>
                  <dt>Price</dt>
                  <dd>{formatCurrency(booking.price)}</dd>
                </div>
              </dl>
              <div className="request-actions">
                <button className="primary-button" type="button" onClick={() => acceptBooking(booking)}>
                  <Check size={17} /> Accept
                </button>
                <button className="danger-button" type="button" onClick={() => setRejectingBooking(booking)}>
                  <X size={17} /> Reject
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {rejectingBooking && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Reject booking request">
          <form className="modal-panel" onSubmit={rejectBooking}>
            <div className="panel-title">
              <div>
                <h2>Reject Booking</h2>
                <p className="muted">Reason is optional and visible in candidate history.</p>
              </div>
              <button className="icon-button" type="button" onClick={() => setRejectingBooking(null)} aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <label>
              Rejection reason
              <textarea
                value={rejectionReason}
                onChange={(event) => setRejectionReason(event.target.value)}
                placeholder="Example: I am not available for this selected time."
              />
            </label>
            <button className="danger-button" type="submit">
              <X size={17} /> Confirm rejection
            </button>
          </form>
        </div>
      )}
    </section>
  );
}

export default InterviewerBookingRequests;
