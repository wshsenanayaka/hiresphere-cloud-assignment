import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, RefreshCcw } from 'lucide-react';
import AnnotationPanel from '../components/AnnotationPanel';
import SubmissionCodeViewer from '../components/SubmissionCodeViewer';
import { submissionApi } from '../services/submissionApi';
import { showError, showSuccess } from '../utils/alerts';

function CandidateSubmissionFeedbackPage({ user, onBack }) {
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const candidateId = user?.id || params.get('candidateId') || '';
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [annotations, setAnnotations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function openSubmission(submissionId) {
    try {
      const [submissionData, annotationData] = await Promise.all([
        submissionApi.getSubmission(submissionId),
        submissionApi.getAnnotations(submissionId),
      ]);
      setSelectedSubmission(submissionData.submission);
      setAnnotations(annotationData.annotations || []);
    } catch (requestError) {
      setError(requestError.message);
      showError('Feedback load failed', requestError);
    }
  }

  async function loadFeedback({ notify = false } = {}) {
    if (!candidateId) {
      setError('candidateId is required to load feedback.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await submissionApi.getCandidateSubmissions(candidateId);
      setSubmissions(data.submissions || []);
      if (!selectedSubmission && data.submissions?.[0]) {
        await openSubmission(data.submissions[0].id);
      }
      if (notify) await showSuccess('Feedback refreshed', 'Reviewed submissions were loaded.');
    } catch (requestError) {
      setError(requestError.message);
      if (notify) showError('Refresh failed', requestError);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFeedback();
  }, [candidateId]);

  return (
    <section className="workspace submission-review-page">
      <div className="dashboard-header">
        <div>
          <p className="eyebrow">Submission Service</p>
          <h2>Submission Feedback</h2>
          <p>View reviewed submissions, annotations, and reviewer status updates.</p>
        </div>
        <div className="dashboard-actions">
          <button className="secondary-button header-action" type="button" onClick={onBack}>
            <ArrowLeft size={17} /> Back
          </button>
          <button className="secondary-button header-action" type="button" onClick={() => loadFeedback({ notify: true })} disabled={loading}>
            <RefreshCcw size={17} /> Refresh
          </button>
        </div>
      </div>

      {error && <p className="form-error page-message">{error}</p>}

      <div className="submission-review-grid candidate-feedback-grid">
        <section className="panel submission-list-panel">
          <div className="panel-title">
            <h2>Reviewed Submissions</h2>
            <span className="call-status">{submissions.length} items</span>
          </div>
          <div className="submission-list">
            {submissions.length === 0 && <div className="empty-state">No reviewed submissions yet.</div>}
            {submissions.map((submission) => (
              <button
                className={selectedSubmission?.id === submission.id ? 'submission-card selected' : 'submission-card'}
                key={submission.id}
                type="button"
                onClick={() => openSubmission(submission.id)}
              >
                <strong>{submission.title}</strong>
                <span>{submission.interviewerName || `Interviewer #${submission.interviewerId}`}</span>
                <small>{submission.status}</small>
              </button>
            ))}
          </div>
        </section>

        <div className="submission-main">
          {selectedSubmission ? (
            <SubmissionCodeViewer submission={selectedSubmission} />
          ) : (
            <section className="panel">
              <div className="empty-state">Select a reviewed submission to see feedback.</div>
            </section>
          )}
        </div>

        <aside className="submission-side">
          <AnnotationPanel annotations={annotations} readOnly />
        </aside>
      </div>
    </section>
  );
}

export default CandidateSubmissionFeedbackPage;
