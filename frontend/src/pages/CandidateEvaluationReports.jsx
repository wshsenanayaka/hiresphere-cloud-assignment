import { useEffect, useState } from 'react';
import { ArrowLeft, RefreshCcw } from 'lucide-react';
import EvaluationReportCard from '../components/EvaluationReportCard';
import { evaluationApi } from '../services/evaluationApi';
import { showError } from '../utils/alerts';

function CandidateEvaluationReports({ user, onBack }) {
  const [reports, setReports] = useState([]);
  const [error, setError] = useState('');

  async function loadReports() {
    try {
      const data = await evaluationApi.getCandidateReports(user.id);
      setReports(data.reports || []);
    } catch (requestError) {
      setError(requestError.message);
      showError('Reports failed', requestError);
    }
  }

  useEffect(() => { loadReports(); }, [user.id]);

  return (
    <section className="workspace evaluation-page">
      <div className="dashboard-header">
        <div><p className="eyebrow">Evaluation Service</p><h2>Evaluation Reports</h2><p>Review your structured mock interview feedback.</p></div>
        <div className="dashboard-actions">
          <button className="secondary-button header-action" type="button" onClick={onBack}><ArrowLeft size={17} /> Back</button>
          <button className="secondary-button header-action" type="button" onClick={loadReports}><RefreshCcw size={17} /> Refresh</button>
        </div>
      </div>
      {error && <p className="form-error page-message">{error}</p>}
      <section className="panel wide">
        <div className="report-grid">
          {reports.length === 0 && <div className="empty-state">No evaluation reports yet.</div>}
          {reports.map((report) => <EvaluationReportCard report={report} key={report.id} />)}
        </div>
      </section>
    </section>
  );
}

export default CandidateEvaluationReports;
