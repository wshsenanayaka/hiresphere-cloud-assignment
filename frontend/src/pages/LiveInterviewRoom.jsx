import { useMemo } from 'react';
import VideoCall from '../components/VideoCall';

function LiveInterviewRoom() {
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const roomId = params.get('roomId') || params.get('bookingId') || '';
  const userName = params.get('name') || 'HireSphere User';

  function goBackToDashboard() {
    window.location.href = '/';
  }

  return (
    <main className="live-room-page">
      <section className="live-room-shell">
        <div className="live-room-header">
          <div>
            <p className="eyebrow">HireSphere</p>
            <h2>Interview Room</h2>
            <p>Candidate and interviewer join the same private room using the booking ID.</p>
          </div>
        </div>

        <VideoCall roomId={roomId} userName={userName} onLeave={goBackToDashboard} />
      </section>
    </main>
  );
}

export default LiveInterviewRoom;
