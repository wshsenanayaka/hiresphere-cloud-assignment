import { useEffect, useState } from 'react';
import { CalendarDays, ClipboardList, Clock, DollarSign, FileCheck2, MessageCircle, Upload, Video } from 'lucide-react';
import { api } from '../../../api';
import { DashboardHeader, Metric } from '../../../shared/components';
import FloatingChatWidget from '../../../components/FloatingChatWidget';
import { showError, showSuccess } from '../../../utils/alerts';

function InterviewerDashboard({ user, bookings, reloadBookings, onNavigate }) {
  const [slots, setSlots] = useState([]);
  const [formError, setFormError] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatBooking, setChatBooking] = useState(null);
  const interviewerBookings = bookings;

  function buildChatUrl(booking) {
    const params = new URLSearchParams({
      bookingId: String(booking.id),
      userId: String(user.id),
      name: user.name,
    });

    return `/messages?${params.toString()}`;
  }

  function buildLiveUrl(booking) {
    const params = new URLSearchParams({
      bookingId: String(booking.id),
      name: user.name,
    });

    return `/live-interview?${params.toString()}`;
  }

  useEffect(() => {
    api
      .getInterviewers()
      .then((rows) => {
        const current = rows.find((interviewer) => interviewer.id === user.interviewerId);
        const parsedSlots = Array.isArray(current?.slots) ? current.slots.filter(Boolean) : JSON.parse(current?.slots || '[]');
        setSlots(parsedSlots.map((slot) => slot.startTime));
      })
      .catch((error) => setFormError(error.message));
  }, [user.interviewerId]);

  async function addSlot(event) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const startTime = `${form.get('date')} ${form.get('time')}`;

    try {
      await api.createSlot({
        interviewerId: user.interviewerId,
        startTime,
        endTime: startTime,
      });
      setSlots([...slots, startTime]);
      formElement.reset();
      await showSuccess('Slot added', 'Your availability slot has been saved.');
    } catch (error) {
      setFormError(error.message);
      showError('Could not add slot', error);
    }
  }

  async function uploadEvaluation(event) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const bookingId = Number(form.get('bookingId'));
    const booking = interviewerBookings.find((item) => item.id === bookingId);

    try {
      await api.createEvaluation({
        candidateId: booking.candidateId,
        bookingId,
        interviewerId: user.interviewerId,
        score: Number(form.get('score')),
        feedback: form.get('evaluation'),
        recommendation: 'Review complete',
      });
      await reloadBookings();
      formElement.reset();
      await showSuccess('Evaluation published', 'The candidate evaluation has been saved.');
    } catch (error) {
      setFormError(error.message);
      showError('Evaluation failed', error);
    }
  }

  function openChat(booking) {
    setChatBooking(booking);
    setIsChatOpen(true);
  }

  return (
    <section className="workspace">
      <DashboardHeader
        title="Interviewer Dashboard"
        subtitle="Manage interview availability and upload candidate evaluation results."
        actions={
          <>
            <button className="secondary-button header-action" type="button" onClick={() => onNavigate('/pricing')}>
              <DollarSign size={17} /> Set pricing
            </button>
            <button className="primary-button header-action" type="button" onClick={() => onNavigate('/booking-requests')}>
              <ClipboardList size={17} /> Booking requests
            </button>
          </>
        }
      />

      <div className="metrics-grid">
        <Metric icon={<Clock />} label="Open slots" value={slots.length} />
        <Metric icon={<CalendarDays />} label="Bookings" value={interviewerBookings.length} />
        <Metric icon={<Upload />} label="Submissions" value={interviewerBookings.filter((item) => item.submission).length} />
        <Metric icon={<FileCheck2 />} label="Evaluations" value={interviewerBookings.filter((item) => item.evaluation).length} />
      </div>

      <div className="content-grid">
        <section className="panel">
          <h2>Availability Management</h2>
          <form className="stack-form" onSubmit={addSlot}>
            <label>
              Date
              <input name="date" type="date" required />
            </label>
            <label>
              Time
              <input name="time" type="time" required />
            </label>
            <button className="primary-button">
              <CalendarDays size={17} /> Add slot
            </button>
            {formError && <p className="form-error">{formError}</p>}
          </form>
          <div className="slot-list">
            {slots.map((slot) => (
              <span key={slot}>{slot}</span>
            ))}
          </div>
        </section>

        <section className="panel wide">
          <h2>Evaluation Upload</h2>
          <form className="evaluation-form" onSubmit={uploadEvaluation}>
            <label>
              Candidate interview
              <select name="bookingId" required>
                {interviewerBookings.map((booking) => (
                  <option value={booking.id} key={booking.id}>
                    {booking.candidate} - {booking.challenge}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Score
              <input name="score" type="number" min="0" max="100" placeholder="0-100" required />
            </label>
            <label className="full">
              Evaluation notes
              <textarea name="evaluation" placeholder="Technical feedback, communication notes, next recommendation" required />
            </label>
            <button className="primary-button">
              <FileCheck2 size={17} /> Publish evaluation
            </button>
          </form>
        </section>

        <section className="panel wide">
          <h2>Assigned Interviews</h2>
          <div className="table assigned-table">
            <div className="table-head">
              <span>Candidate</span>
              <span>Challenge</span>
              <span>Submission</span>
              <span>Status</span>
              <span>Chat</span>
              <span>Live</span>
            </div>
            {interviewerBookings.map((booking) => (
              <div className="table-row" key={booking.id}>
                <span>{booking.candidate}</span>
                <span>{booking.challenge}</span>
                <span>{booking.submission || 'Waiting'}</span>
                <span>{booking.status}</span>
                <button
                  className="secondary-button table-action"
                  type="button"
                  onClick={() => openChat(booking)}
                  data-fallback-url={buildChatUrl(booking)}
                >
                  <MessageCircle size={16} /> Message
                </button>
                <a className="primary-button table-action" href={buildLiveUrl(booking)}>
                  <Video size={16} /> Join
                </a>
              </div>
            ))}
          </div>
        </section>
      </div>

      <FloatingChatWidget
        bookings={interviewerBookings}
        user={user}
        isOpen={isChatOpen}
        selectedBooking={chatBooking}
        onOpen={() => {
          if (!chatBooking && interviewerBookings[0]) {
            setChatBooking(interviewerBookings[0]);
          }
          setIsChatOpen(true);
        }}
        onClose={() => setIsChatOpen(false)}
        onSelectBooking={setChatBooking}
      />
    </section>
  );
}

export default InterviewerDashboard;
