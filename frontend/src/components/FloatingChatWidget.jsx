import { MessageCircle, X } from 'lucide-react';
import ChatWindow from './ChatWindow';

function FloatingChatWidget({ bookings, user, isOpen, selectedBooking, onOpen, onClose, onSelectBooking }) {
  const activeBooking = selectedBooking || bookings[0];
  const hasBookings = bookings.length > 0;

  function handleOpen() {
    if (!activeBooking && bookings[0]) {
      onSelectBooking(bookings[0]);
    }
    onOpen();
  }

  return (
    <div className="floating-chat">
      {isOpen && (
        <div className="floating-chat-panel" role="dialog" aria-label="Booking chat">
          <div className="floating-chat-header">
            <div>
              <strong>Messages</strong>
              <span>{activeBooking ? `Booking #${activeBooking.id}` : 'No booking selected'}</span>
            </div>
            <button className="icon-button" type="button" onClick={onClose} aria-label="Close chat">
              <X size={18} />
            </button>
          </div>

          {hasBookings && (
            <label className="floating-chat-select">
              Chat room
              <select
                value={activeBooking?.id || ''}
                onChange={(event) => {
                  const nextBooking = bookings.find((booking) => String(booking.id) === event.target.value);
                  if (nextBooking) onSelectBooking(nextBooking);
                }}
              >
                {bookings.map((booking) => (
                  <option value={booking.id} key={booking.id}>
                    #{booking.id} - {booking.candidate || booking.interviewer || booking.challenge}
                  </option>
                ))}
              </select>
            </label>
          )}

          {activeBooking ? (
            <ChatWindow bookingId={activeBooking.id} userId={user.id} userName={user.name} />
          ) : (
            <div className="empty-state">No interviews are available for chat.</div>
          )}
        </div>
      )}

      <button
        className="floating-chat-button"
        type="button"
        onClick={handleOpen}
        disabled={!hasBookings}
        aria-label="Open messages"
      >
        <MessageCircle size={24} />
      </button>
    </div>
  );
}

export default FloatingChatWidget;
