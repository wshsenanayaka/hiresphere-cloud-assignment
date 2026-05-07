import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, FileCheck2, RefreshCcw } from 'lucide-react';
import AnnotationPanel from '../components/AnnotationPanel';
import SubmissionCodeViewer from '../components/SubmissionCodeViewer';
import { submissionApi } from '../services/submissionApi';
import { showError, showSuccess } from '../utils/alerts';

const STATUSES = ['SUBMITTED', 'UNDER_REVIEW', 'REVIEWED', 'NEEDS_CHANGES'];
const SEVERITIES = ['INFO', 'SUGGESTION', 'WARNING', 'CRITICAL'];
const emptyAnnotation = { lineNumber: '', selectedText: '', comment: '', severity: 'INFO' };

function InterviewerSubmissionReviewPage({ user, onBack }) {
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const interviewerId = user?.interviewerId || params.get('interviewerId') || '';
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [annotations, setAnnotations] = useState([]);
  const [annotationForm, setAnnotationForm] = useState(emptyAnnotation);
  const [editingAnnotationId, setEditingAnnotationId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function loadSubmissions({ notify = false } = {}) {
    if (!interviewerId) {
      setError('interviewerId is required to load submissions.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await submissionApi.getInterviewerSubmissions(interviewerId);
      setSubmissions(data.submissions || []);
      if (!selectedSubmission && data.submissions?.[0]) {
        await openSubmission(data.submissions[0].id);
      }
      if (notify) await showSuccess('Submissions refreshed', 'Assigned submissions were loaded.');
    } catch (requestError) {
      setError(requestError.message);
      if (notify) showError('Refresh failed', requestError);
    } finally {
      setLoading(false);
    }
  }

  async function openSubmission(submissionId) {
    try {
      const [submissionData, annotationData] = await Promise.all([
        submissionApi.getSubmission(submissionId),
        submissionApi.getAnnotations(submissionId),
      ]);
      setSelectedSubmission(submissionData.submission);
      setAnnotations(annotationData.annotations || []);
      setAnnotationForm(emptyAnnotation);
      setEditingAnnotationId(null);
    } catch (requestError) {
      setError(requestError.message);
      showError('Submission load failed', requestError);
    }
  }

  useEffect(() => {
    loadSubmissions();
  }, [interviewerId]);

  function updateAnnotationField(name, value) {
    setAnnotationForm((current) => ({ ...current, [name]: value }));
  }

  function editAnnotation(annotation) {
    setEditingAnnotationId(annotation.id);
    setAnnotationForm({
      lineNumber: annotation.lineNumber || '',
      selectedText: annotation.selectedText || '',
      comment: annotation.comment || '',
      severity: annotation.severity || 'INFO',
    });
  }

  async function saveAnnotation(event) {
    event.preventDefault();
    if (!selectedSubmission) return;

    const payload = {
      interviewerId,
      lineNumber: annotationForm.lineNumber ? Number(annotationForm.lineNumber) : null,
      selectedText: annotationForm.selectedText,
      comment: annotationForm.comment,
      severity: annotationForm.severity,
    };

    try {
      if (editingAnnotationId) {
        await submissionApi.updateAnnotation(editingAnnotationId, payload);
        await showSuccess('Annotation updated', 'Your note was updated.');
      } else {
        await submissionApi.createAnnotation(selectedSubmission.id, payload);
        await showSuccess('Annotation added', 'Your note was saved.');
      }
      await openSubmission(selectedSubmission.id);
    } catch (requestError) {
      setError(requestError.message);
      showError('Annotation failed', requestError);
    }
  }

  async function deleteAnnotation(annotation) {
    try {
      await submissionApi.deleteAnnotation(annotation.id, interviewerId);
      await showSuccess('Annotation deleted', 'The annotation was removed.');
      await openSubmission(selectedSubmission.id);
    } catch (requestError) {
      setError(requestError.message);
      showError('Delete failed', requestError);
    }
  }

  async function updateStatus(status) {
    if (!selectedSubmission) return;

    try {
      const data = await submissionApi.updateStatus(selectedSubmission.id, { interviewerId, status });
      setSelectedSubmission(data.submission);
      await loadSubmissions();
      await showSuccess('Status updated', `Submission marked as ${status}.`);
    } catch (requestError) {
      setError(requestError.message);
      showError('Status update failed', requestError);
    }
  }

  return (
    <section className="workspace submission-review-page">
      <div className="dashboard-header">
        <div>
          <p className="eyebrow">Submission Service</p>
          <h2>Submission Review</h2>
          <p>Open assigned candidate submissions, annotate code, and update review status.</p>
        </div>
        <div className="dashboard-actions">
          <button className="secondary-button header-action" type="button" onClick={onBack}>
            <ArrowLeft size={17} /> Back
          </button>
          <button className="secondary-button header-action" type="button" onClick={() => loadSubmissions({ notify: true })} disabled={loading}>
            <RefreshCcw size={17} /> Refresh
          </button>
        </div>
      </div>

      {error && <p className="form-error page-message">{error}</p>}

      <div className="submission-review-grid">
        <section className="panel submission-list-panel">
          <div className="panel-title">
            <h2>Assigned Submissions</h2>
            <span className="call-status">{submissions.length} items</span>
          </div>
          <div className="submission-list">
            {submissions.length === 0 && <div className="empty-state">No candidate submissions found.</div>}
            {submissions.map((submission) => (
              <button
                className={selectedSubmission?.id === submission.id ? 'submission-card selected' : 'submission-card'}
                key={submission.id}
                type="button"
                onClick={() => openSubmission(submission.id)}
              >
                <strong>{submission.title}</strong>
                <span>{submission.candidateName || `Candidate #${submission.candidateId}`}</span>
                <small>{submission.status}</small>
              </button>
            ))}
          </div>
        </section>

        <div className="submission-main">
          <section className="panel">
            <div className="panel-title">
              <div>
                <h2>{selectedSubmission?.title || 'Select a submission'}</h2>
                <p className="muted">{selectedSubmission ? `Status: ${selectedSubmission.status}` : 'Choose a submission to begin review.'}</p>
              </div>
              {selectedSubmission && (
                <select value={selectedSubmission.status} onChange={(event) => updateStatus(event.target.value)}>
                  {STATUSES.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
              )}
            </div>
          </section>

          {selectedSubmission && <SubmissionCodeViewer submission={selectedSubmission} />}
        </div>

        <aside className="submission-side">
          <section className="panel">
            <div className="panel-title">
              <h2>{editingAnnotationId ? 'Edit Annotation' : 'Add Annotation'}</h2>
            </div>
            <form className="stack-form" onSubmit={saveAnnotation}>
              <label>
                Line number
                <input type="number" min="1" value={annotationForm.lineNumber} onChange={(event) => updateAnnotationField('lineNumber', event.target.value)} />
              </label>
              <label>
                Selected text
                <textarea value={annotationForm.selectedText} onChange={(event) => updateAnnotationField('selectedText', event.target.value)} />
              </label>
              <label>
                Comment
                <textarea value={annotationForm.comment} onChange={(event) => updateAnnotationField('comment', event.target.value)} required />
              </label>
              <label>
                Severity
                <select value={annotationForm.severity} onChange={(event) => updateAnnotationField('severity', event.target.value)}>
                  {SEVERITIES.map((severity) => (
                    <option key={severity}>{severity}</option>
                  ))}
                </select>
              </label>
              <button className="primary-button" disabled={!selectedSubmission}>
                <FileCheck2 size={17} /> {editingAnnotationId ? 'Update annotation' : 'Add annotation'}
              </button>
            </form>
          </section>

          <AnnotationPanel annotations={annotations} onEdit={editAnnotation} onDelete={deleteAnnotation} />
        </aside>
      </div>
    </section>
  );
}

export default InterviewerSubmissionReviewPage;
