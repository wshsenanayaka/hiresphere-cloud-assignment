import { useMemo } from 'react';
import ChatWindow from '../components/ChatWindow';

function MessagesPage() {
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const bookingId = params.get('bookingId') || '';
  const userId = params.get('userId') || '';
  const userName = params.get('name') || 'HireSphere User';

  return (
    <main className="live-room-page">
      <section className="workspace">
        <div className="dashboard-header">
          <div>
            <p className="eyebrow">HireSphere</p>
            <h2>Messages</h2>
            <p>Candidate and interviewer can message each other using the booking ID.</p>
          </div>
        </div>

        <ChatWindow bookingId={bookingId} userId={userId} userName={userName} />
      </section>
    </main>
  );
}

export default MessagesPage;
