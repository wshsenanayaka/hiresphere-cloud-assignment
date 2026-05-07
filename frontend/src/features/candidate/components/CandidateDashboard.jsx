import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, CalendarDays, CreditCard, FileCheck2, Gift, History, MessageSquareText, Search, SlidersHorizontal, Sparkles, Upload } from 'lucide-react';
import { api, mapInterviewer } from '../../../api';
import { Metric } from '../../../shared/components';
import FloatingChatWidget from '../../../components/FloatingChatWidget';
import HistoryPanel from './HistoryPanel';
import { filterOptions } from '../../../data/mockData';
import { showError, showSuccess } from '../../../utils/alerts';

function CandidateDashboard({ user, bookings, reloadBookings, onNavigate }) {
  const [query, setQuery] = useState('');
  const [interviewers, setInterviewers] = useState([]);
  const [filters, setFilters] = useState({
    domain: '',
    interviewType: '',
    experienceLevel: '',
    availability: '',
    minRating: '',
    badge: '',
  });
  const [selectedInterviewer, setSelectedInterviewer] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [calendarProvider, setCalendarProvider] = useState('Google Calendar');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [formError, setFormError] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatBooking, setChatBooking] = useState(null);
  const [historyView, setHistoryView] = useState('all');
  const interviewersSectionRef = useRef(null);
  const historySectionRef = useRef(null);

  useEffect(() => {
    api
      .getInterviewers()
      .then((rows) => {
        const mappedInterviewers = rows.map(mapInterviewer);
        setInterviewers(mappedInterviewers);
        if (mappedInterviewers.length) {
          setSelectedInterviewer(mappedInterviewers[0]);
          setSelectedSlot(mappedInterviewers[0].slots[0]?.startTime || '');
        }
      })
      .catch((error) => setFormError(error.message));
  }, []);

  const filteredInterviewers = useMemo(() => {
    const value = query.toLowerCase();
    return interviewers.filter((person) => {
      const matchesQuery =
        !value ||
        person.name.toLowerCase().includes(value) ||
        person.role.toLowerCase().includes(value) ||
        person.domain.toLowerCase().includes(value) ||
        person.experienceLevel.toLowerCase().includes(value) ||
        person.interviewTypes.some((type) => type.toLowerCase().includes(value)) ||
        person.skills.some((skill) => skill.toLowerCase().includes(value)) ||
        person.badges.some((badge) => badge.toLowerCase().includes(value));

      const matchesDomain = !filters.domain || person.domain === filters.domain;
      const matchesType = !filters.interviewType || person.interviewTypes.includes(filters.interviewType);
      const matchesLevel = !filters.experienceLevel || person.experienceLevel === filters.experienceLevel;
      const matchesAvailability = !filters.availability || person.slots.length > 0;
      const matchesRating = !filters.minRating || person.rating >= Number(filters.minRating);
      const matchesBadge = !filters.badge || person.badges.includes(filters.badge);

      return (
        matchesQuery &&
        matchesDomain &&
        matchesType &&
        matchesLevel &&
        matchesAvailability &&
        matchesRating &&
        matchesBadge
      );
    });
  }, [filters, query]);

  const candidateBookings = bookings;
  const submittedBookings = candidateBookings.filter((item) => item.submission);
  const evaluatedBookings = candidateBookings.filter((item) => item.evaluation);
  const visibleHistoryBookings =
    historyView === 'submitted' ? submittedBookings : historyView === 'evaluated' ? evaluatedBookings : candidateBookings;

  function scrollToSection(ref) {
    window.setTimeout(() => {
      ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  }

  function showInterviewers() {
    scrollToSection(interviewersSectionRef);
  }

  function showHistory(view) {
    setHistoryView(view);
    scrollToSection(historySectionRef);
  }

  async function bookInterview(event) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setFormError('');

    try {
      const slot = selectedInterviewer.slots.find((item) => item.startTime === selectedSlot);
      await api.createBooking({
        candidateId: user.id,
        interviewerId: selectedInterviewer.id,
        availabilitySlotId: slot?.id,
        bookingDate: selectedSlot,
        meetingLink: `${calendarProvider} / ${paymentMethod}`,
      });
      await reloadBookings();
      formElement.reset();
      await showSuccess('Booking successful', 'Your interview booking has been created.');
    } catch (error) {
      setFormError(error.message);
      showError('Booking failed', error);
    }
  }

  async function uploadSubmission(event) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setFormError('');

    try {
      const payload = new FormData();
      payload.append('candidateId', user.id);
      payload.append('bookingId', form.get('bookingId'));
      payload.append('submission', form.get('submission'));
      await api.uploadSubmission(payload);
      await reloadBookings();
      formElement.reset();
      await showSuccess('Submission uploaded', 'Your file was uploaded successfully.');
    } catch (error) {
      setFormError(error.message);
      showError('Upload failed', error);
    }
  }

  function updateFilter(name, value) {
    setFilters((current) => ({ ...current, [name]: value }));
  }

  function resetFilters() {
    setQuery('');
    setFilters({
      domain: '',
      interviewType: '',
      experienceLevel: '',
      availability: '',
      minRating: '',
      badge: '',
    });
  }

  function openChat(booking) {
    setChatBooking(booking);
    setIsChatOpen(true);
  }

  return (
    <section className="workspace candidate-dashboard">
      <header className="candidate-hero">
        <div className="candidate-hero-copy">
          <span className="hero-kicker">
            <Sparkles size={16} /> Candidate workspace
          </span>
          <h2>Welcome back, {user.name}</h2>
          <p>Find the right interviewer, reserve a session, submit your work, and track feedback in one place.</p>
        </div>
        <div className="candidate-hero-actions">
          <button className="secondary-button header-action" type="button" onClick={() => onNavigate('/packages')}>
            <Gift size={17} /> Packages
          </button>
          <button className="secondary-button header-action" type="button" onClick={() => onNavigate('/my-packages')}>
            <Gift size={17} /> My packages
          </button>
          <button className="secondary-button header-action" type="button" onClick={() => onNavigate('/submission-feedback')}>
            <MessageSquareText size={17} /> Feedback
          </button>
          <button className="secondary-button header-action" type="button" onClick={() => onNavigate('/evaluation-reports')}>
            <FileCheck2 size={17} /> Reports
          </button>
          <button className="secondary-button header-action" type="button" onClick={() => onNavigate('/booking-history')}>
            <History size={17} /> Booking history
          </button>
          <button className="primary-button header-action" type="button" onClick={showInterviewers}>
            <Search size={17} /> Find interviewers
          </button>
        </div>
      </header>

      <div className="metrics-grid">
        <Metric icon={<Search />} label="Interviewers" value={filteredInterviewers.length} onClick={showInterviewers} />
        <Metric icon={<CalendarDays />} label="Booked" value={candidateBookings.length} active={historyView === 'all'} onClick={() => showHistory('all')} />
        <Metric icon={<FileCheck2 />} label="Submitted" value={submittedBookings.length} active={historyView === 'submitted'} onClick={() => showHistory('submitted')} />
        <Metric icon={<History />} label="Evaluated" value={evaluatedBookings.length} active={historyView === 'evaluated'} onClick={() => showHistory('evaluated')} />
      </div>

      <div className="content-grid">
        <section className="panel wide candidate-search-panel" ref={interviewersSectionRef}>
          <div className="panel-title">
            <div>
              <span className="section-label">
                <SlidersHorizontal size={15} /> Discovery
              </span>
              <h2>Search Interviewers</h2>
            </div>
            <div className="search-field">
              <Search size={18} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search skill, role, or name" />
            </div>
          </div>
          <div className="filter-grid">
            <label>
              Domain
              <select value={filters.domain} onChange={(event) => updateFilter('domain', event.target.value)}>
                <option value="">All domains</option>
                {filterOptions.domains.map((domain) => (
                  <option key={domain}>{domain}</option>
                ))}
              </select>
            </label>
            <label>
              Interview type
              <select value={filters.interviewType} onChange={(event) => updateFilter('interviewType', event.target.value)}>
                <option value="">All types</option>
                {filterOptions.interviewTypes.map((type) => (
                  <option key={type}>{type}</option>
                ))}
              </select>
            </label>
            <label>
              Experience level
              <select value={filters.experienceLevel} onChange={(event) => updateFilter('experienceLevel', event.target.value)}>
                <option value="">All levels</option>
                {filterOptions.experienceLevels.map((level) => (
                  <option key={level}>{level}</option>
                ))}
              </select>
            </label>
            <label>
              Availability
              <select value={filters.availability} onChange={(event) => updateFilter('availability', event.target.value)}>
                <option value="">Any availability</option>
                <option value="available">Open slots only</option>
              </select>
            </label>
            <label>
              Rating
              <select value={filters.minRating} onChange={(event) => updateFilter('minRating', event.target.value)}>
                <option value="">Any rating</option>
                {filterOptions.ratings.map((rating) => (
                  <option value={rating.value} key={rating.value}>
                    {rating.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Specialization badge
              <select value={filters.badge} onChange={(event) => updateFilter('badge', event.target.value)}>
                <option value="">All badges</option>
                {filterOptions.badges.map((badge) => (
                  <option key={badge}>{badge}</option>
                ))}
              </select>
            </label>
            <button className="secondary-button filter-reset" onClick={resetFilters}>
              Reset filters
            </button>
          </div>
          <div className="interviewer-list">
            {filteredInterviewers.length === 0 && (
              <div className="empty-state">No interviewers match the selected filters.</div>
            )}
            {filteredInterviewers.map((person) => (
              <button
                key={person.id}
                className={selectedInterviewer?.id === person.id ? 'interviewer selected' : 'interviewer'}
                onClick={() => {
                  setSelectedInterviewer(person);
                  setSelectedSlot(person.slots[0]?.startTime || '');
                }}
              >
                <div>
                  <strong>{person.name}</strong>
                  <span>
                    {person.role} - {person.domain} - {person.experienceLevel}
                  </span>
                </div>
                <small className="rating-chip">{person.rating} rating</small>
                <div className="interviewer-meta">
                  <span>{person.interviewTypes.join(', ')}</span>
                  <span>{person.slots.length ? `${person.slots.length} open slots` : 'No open slots'}</span>
                  <span>${person.price} session</span>
                </div>
                <div className="tag-row">
                  {[...person.skills, ...person.badges].map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="panel candidate-action-panel">
          <div className="panel-title compact-title">
            <div>
              <span className="section-label">
                <CalendarDays size={15} /> Checkout
              </span>
              <h2>Book Interview</h2>
            </div>
          </div>
          {selectedInterviewer ? (
            <form onSubmit={bookInterview} className="stack-form">
              <div className="selected-interviewer-card">
                <div>
                  <strong>{selectedInterviewer.name}</strong>
                  <span>{selectedInterviewer.domain} mentor</span>
                </div>
                <small>{selectedInterviewer.slots.length} slots</small>
              </div>
              <label>
                Interviewer
                <input value={selectedInterviewer.name} readOnly />
              </label>
              <div className="booking-summary">
                <span>{selectedInterviewer.domain}</span>
                <strong>${selectedInterviewer.price}</strong>
              </div>
              <label>
                Time slot
                <select value={selectedSlot} onChange={(event) => setSelectedSlot(event.target.value)}>
                  {!selectedInterviewer.slots.length && <option value="">No open slots</option>}
                  {selectedInterviewer.slots.map((slot) => (
                    <option key={slot.id || slot.startTime} value={slot.startTime || slot}>
                      {slot.startTime || slot}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Challenge title
                <input name="challenge" placeholder="Example: Cloud deployment task" required />
              </label>
              <label>
                Calendar integration
                <select value={calendarProvider} onChange={(event) => setCalendarProvider(event.target.value)}>
                  <option>Google Calendar</option>
                  <option>Outlook Calendar</option>
                  <option>Apple Calendar</option>
                </select>
              </label>
              <label>
                Payment method
                <select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}>
                  <option value="card">Credit or debit card</option>
                  <option value="wallet">Digital wallet</option>
                  <option value="bank">Bank transfer</option>
                </select>
              </label>
              {paymentMethod === 'card' && (
                <div className="payment-grid">
                  <label className="full">
                    Card number
                    <input name="cardNumber" inputMode="numeric" placeholder="4242 4242 4242 4242" required />
                  </label>
                  <label>
                    Expiry
                    <input name="expiry" placeholder="MM/YY" required />
                  </label>
                  <label>
                    CVC
                    <input name="cvc" inputMode="numeric" placeholder="123" required />
                  </label>
                </div>
              )}
              <div className="checkout-note">
                <CalendarDays size={17} />
                <span>{calendarProvider} event will be created after payment.</span>
              </div>
              <div className="checkout-note">
                <CreditCard size={17} />
                <span>Mock payment will be marked as paid for this booking.</span>
              </div>
              <button className="primary-button" disabled={!selectedSlot}>
                Pay ${selectedInterviewer.price} and book <ArrowRight size={17} />
              </button>
              {formError && <p className="form-error">{formError}</p>}
            </form>
          ) : (
            <div className="empty-state">No database interviewers are available yet.</div>
          )}
        </section>

        <section className="panel candidate-action-panel">
          <div className="panel-title compact-title">
            <div>
              <span className="section-label">
                <Upload size={15} /> Submission
              </span>
              <h2>Upload Submission</h2>
            </div>
          </div>
          <form onSubmit={uploadSubmission} className="stack-form">
            <label>
              Interview
              <select name="bookingId" required>
                {candidateBookings.map((booking) => (
                  <option value={booking.id} key={booking.id}>
                    {booking.interviewer} - {booking.date}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Submission file
              <input name="submission" type="file" required />
            </label>
            <button className="primary-button">
              <Upload size={17} /> Upload submission
            </button>
            {formError && <p className="form-error">{formError}</p>}
          </form>
        </section>

        <HistoryPanel bookings={visibleHistoryBookings} user={user} onOpenChat={openChat} view={historyView} panelRef={historySectionRef} />
      </div>

      <FloatingChatWidget
        bookings={candidateBookings}
        user={user}
        isOpen={isChatOpen}
        selectedBooking={chatBooking}
        onOpen={() => {
          if (!chatBooking && candidateBookings[0]) {
            setChatBooking(candidateBookings[0]);
          }
          setIsChatOpen(true);
        }}
        onClose={() => setIsChatOpen(false)}
        onSelectBooking={setChatBooking}
      />
    </section>
  );
}

export default CandidateDashboard;
