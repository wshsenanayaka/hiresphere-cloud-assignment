import { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, RefreshCcw } from 'lucide-react';
import { packageApi } from '../services/packageApi';
import { showError, showSuccess } from '../utils/alerts';

function CandidatePackageBookingsPage({ user, onBack }) {
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState('');

  async function loadBookings() {
    try {
      const data = await packageApi.getCandidateBookings(user.id);
      setBookings(data.bookings || []);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  useEffect(() => {
    loadBookings();
  }, [user.id]);

  async function useSession(booking) {
    try {
      await packageApi.useSession(booking.id);
      await showSuccess('Session used', 'Remaining sessions updated.');
      await loadBookings();
    } catch (requestError) {
      setError(requestError.message);
      showError('Session update failed', requestError);
    }
  }

  return (
    <section className="workspace package-page">
      <div className="dashboard-header">
        <div><p className="eyebrow">My Packages</p><h2>Purchased Packages</h2><p>Track used and remaining bundled interview sessions.</p></div>
        <div className="dashboard-actions">
          <button className="secondary-button header-action" type="button" onClick={onBack}><ArrowLeft size={17} /> Back</button>
          <button className="secondary-button header-action" type="button" onClick={loadBookings}><RefreshCcw size={17} /> Refresh</button>
        </div>
      </div>
      {error && <p className="form-error page-message">{error}</p>}
      <section className="panel wide">
        <div className="table package-booking-table">
          <div className="table-head"><span>Package</span><span>Interviewer</span><span>Used</span><span>Remaining</span><span>Payment</span><span>Status</span><span>Action</span></div>
          {bookings.length === 0 && <div className="empty-state">No purchased packages yet.</div>}
          {bookings.map((booking) => (
            <div className="table-row" key={booking.id}>
              <span>{booking.packageName}</span>
              <span>{booking.interviewerName}</span>
              <span>{booking.usedSessions} / {booking.totalSessions}</span>
              <span>{booking.remainingSessions}</span>
              <span>{booking.paymentStatus}</span>
              <span className="status-pill">{booking.bookingStatus}</span>
              <button className="primary-button table-action" type="button" onClick={() => useSession(booking)} disabled={booking.remainingSessions <= 0}>
                <CheckCircle2 size={16} /> Use session
              </button>
            </div>
          ))}
        </div>
      </section>
    </section>
  );
}

export default CandidatePackageBookingsPage;
