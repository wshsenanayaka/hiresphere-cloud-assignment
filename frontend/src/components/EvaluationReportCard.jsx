const scoreLabels = [
  ['Technical', 'technicalScore'],
  ['Communication', 'communicationScore'],
  ['Problem solving', 'problemSolvingScore'],
  ['Coding', 'codingScore'],
  ['System design', 'systemDesignScore'],
  ['Behavioral', 'behavioralScore'],
];

function EvaluationReportCard({ report }) {
  return (
    <article className="evaluation-report-card">
      <div className="package-card-top">
        <span className="status-pill">{report.recommendation}</span>
        <strong>{report.overallScore} / 5 overall</strong>
      </div>
      <h3>{report.candidateName || report.interviewerName || `Booking #${report.bookingId}`}</h3>
      <div className="score-grid">
        {scoreLabels.map(([label, key]) => (
          <div key={key}>
            <span>{label}</span>
            <strong>{report[key]} / 5</strong>
          </div>
        ))}
      </div>
      <dl className="report-notes">
        <div><dt>Strengths</dt><dd>{report.strengths || '-'}</dd></div>
        <div><dt>Improvement areas</dt><dd>{report.improvementAreas || '-'}</dd></div>
        <div><dt>Interviewer comments</dt><dd>{report.interviewerComments || '-'}</dd></div>
      </dl>
    </article>
  );
}

export default EvaluationReportCard;
