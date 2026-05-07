import { useEffect, useState } from 'react';
import { ArrowLeft, FileCheck2, RefreshCcw } from 'lucide-react';
import EvaluationReportCard from '../components/EvaluationReportCard';
import { api } from '../api';
import { evaluationApi } from '../services/evaluationApi';
import { showError, showSuccess } from '../utils/alerts';

const RECOMMENDATIONS = ['Strong Hire', 'Hire', 'Needs Improvement', 'Not Ready'];
const emptyForm = {
  bookingId: '',
  technicalScore: 3,
  communicationScore: 3,
  problemSolvingScore: 3,
  codingScore: 3,
  systemDesignScore: 3,
  behavioralScore: 3,
  strengths: '',
  improvementAreas: '',
  interviewerComments: '',
  recommendation: 'Hire',
};

function InterviewerEvaluationForm({ user, onBack }) {
  const [bookings, setBookings] = useState([]);
  const [reports, setReports] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');

  async function loadData() {
    try {
      const [bookingRows, reportData] = await Promise.all([
        api.getInterviewerBookings(user.interviewerId),
        evaluationApi.getInterviewerReports(user.interviewerId),
      ]);
      setBookings(bookingRows);
      setReports(reportData.reports || []);
      if (!form.bookingId && bookingRows[0]) setForm((current) => ({ ...current, bookingId: bookingRows[0].id }));
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  useEffect(() => {
    loadData();
  }, [user.interviewerId]);

  function updateField(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function editReport(report) {
    setEditingId(report.id);
    setForm({
      bookingId: report.bookingId,
      technicalScore: report.technicalScore,
      communicationScore: report.communicationScore,
      problemSolvingScore: report.problemSolvingScore,
      codingScore: report.codingScore,
      systemDesignScore: report.systemDesignScore,
      behavioralScore: report.behavioralScore,
      strengths: report.strengths,
      improvementAreas: report.improvementAreas,
      interviewerComments: report.interviewerComments,
      recommendation: report.recommendation,
    });
  }

  async function saveReport(event) {
    event.preventDefault();
    const booking = bookings.find((item) => Number(item.id) === Number(form.bookingId));
    const payload = {
      ...form,
      bookingId: Number(form.bookingId),
      candidateId: booking?.candidate_id || booking?.candidateId,
      interviewerId: user.interviewerId,
      technicalScore: Number(form.technicalScore),
      communicationScore: Number(form.communicationScore),
      problemSolvingScore: Number(form.problemSolvingScore),
      codingScore: Number(form.codingScore),
      systemDesignScore: Number(form.systemDesignScore),
      behavioralScore: Number(form.behavioralScore),
    };
    try {
      if (editingId) {
        await evaluationApi.updateReport(editingId, payload);
        await showSuccess('Report updated', 'Structured evaluation report updated.');
      } else {
        await evaluationApi.createReport(payload);
        await showSuccess('Report created', 'Structured evaluation report created.');
      }
      setEditingId(null);
      setForm(emptyForm);
      await loadData();
    } catch (requestError) {
      setError(requestError.message);
      showError(editingId ? 'Update failed' : 'Create failed', requestError);
    }
  }

  return (
    <section className="workspace evaluation-page">
      <div className="dashboard-header">
        <div><p className="eyebrow">Evaluation Service</p><h2>Structured Evaluation</h2><p>Create or edit detailed candidate reports.</p></div>
        <div className="dashboard-actions">
          <button className="secondary-button header-action" type="button" onClick={onBack}><ArrowLeft size={17} /> Back</button>
          <button className="secondary-button header-action" type="button" onClick={loadData}><RefreshCcw size={17} /> Refresh</button>
        </div>
      </div>
      {error && <p className="form-error page-message">{error}</p>}
      <div className="content-grid">
        <section className="panel">
          <h2>{editingId ? 'Edit Report' : 'Create Report'}</h2>
          <form className="stack-form" onSubmit={saveReport}>
            <label>Booking<select value={form.bookingId} onChange={(e) => updateField('bookingId', e.target.value)} required>{bookings.map((b) => <option value={b.id} key={b.id}>{b.candidate_name || b.candidate || `Booking #${b.id}`}</option>)}</select></label>
            {['technicalScore','communicationScore','problemSolvingScore','codingScore','systemDesignScore','behavioralScore'].map((field) => (
              <label key={field}>{field.replace(/([A-Z])/g, ' $1')}<input type="number" min="1" max="5" value={form[field]} onChange={(e) => updateField(field, e.target.value)} required /></label>
            ))}
            <label>Strengths<textarea value={form.strengths} onChange={(e) => updateField('strengths', e.target.value)} /></label>
            <label>Improvement areas<textarea value={form.improvementAreas} onChange={(e) => updateField('improvementAreas', e.target.value)} /></label>
            <label>Interviewer comments<textarea value={form.interviewerComments} onChange={(e) => updateField('interviewerComments', e.target.value)} /></label>
            <label>Recommendation<select value={form.recommendation} onChange={(e) => updateField('recommendation', e.target.value)}>{RECOMMENDATIONS.map((item) => <option key={item}>{item}</option>)}</select></label>
            <button className="primary-button"><FileCheck2 size={17} /> {editingId ? 'Update report' : 'Create report'}</button>
          </form>
        </section>
        <section className="panel wide">
          <div className="panel-title"><h2>My Reports</h2><span className="call-status">{reports.length} reports</span></div>
          <div className="report-grid">
            {reports.length === 0 && <div className="empty-state">No structured reports yet.</div>}
            {reports.map((report) => <button className="unstyled-button" type="button" key={report.id} onClick={() => editReport(report)}><EvaluationReportCard report={report} /></button>)}
          </div>
        </section>
      </div>
    </section>
  );
}

export default InterviewerEvaluationForm;
