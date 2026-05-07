import { MessageCircle, Video } from 'lucide-react';

function buildChatUrl(booking, user) {
  const params = new URLSearchParams({
    bookingId: String(booking.id),
    userId: String(user.id),
    name: user.name,
  });

  return `/messages?${params.toString()}`;
}

function buildLiveUrl(booking, user) {
  const params = new URLSearchParams({
    bookingId: String(booking.id),
    name: user.name,
  });

  return `/live-interview?${params.toString()}`;
}

const historyTitles = {
  all: 'Interview History',
  submitted: 'Submitted Interviews',
  evaluated: 'Evaluated Interviews',
};

function HistoryPanel({ bookings, user, onOpenChat, view = 'all', panelRef }) {
  return (
    <section className="panel wide" ref={panelRef}>
      <h2>{historyTitles[view] || 'Interview History'}</h2>
      <div className="table history-table">
        <div className="table-head">
          <span>Interviewer</span>
          <span>Challenge</span>
          <span>Date</span>
          <span>Status</span>
          <span>Payment</span>
          <span>Calendar</span>
          <span>Chat</span>
          <span>Live</span>
        </div>
        {bookings.length === 0 && <div className="empty-state">No matching interview records found.</div>}
        {bookings.map((booking) => (
          <div className="table-row" key={booking.id}>
            <span>{booking.interviewer}</span>
            <span>{booking.challenge}</span>
            <span>{booking.date}</span>
            <span>{booking.status}</span>
            <span>{booking.paymentStatus || 'Pending'}</span>
            <span>{booking.calendarStatus || 'Pending'}</span>
            <button
              className="secondary-button table-action"
              type="button"
              onClick={() => onOpenChat?.(booking)}
              data-fallback-url={buildChatUrl(booking, user)}
            >
              <MessageCircle size={16} /> Message
            </button>
            <a className="primary-button table-action" href={buildLiveUrl(booking, user)}>
              <Video size={16} /> Join
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}

export default HistoryPanel;
