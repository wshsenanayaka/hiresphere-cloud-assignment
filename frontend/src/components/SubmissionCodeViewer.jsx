function SubmissionCodeViewer({ submission }) {
  const content = submission?.content || '';
  const lines = content ? content.split(/\r?\n/) : [];

  return (
    <section className="panel wide submission-code-panel">
      <div className="panel-title">
        <div>
          <h2>Submission Viewer</h2>
          <p className="muted">{submission?.title || 'No submission selected'}</p>
        </div>
        {submission?.githubLink && (
          <a className="secondary-button table-action" href={submission.githubLink} target="_blank" rel="noreferrer">
            Open GitHub
          </a>
        )}
      </div>

      {submission?.fileUrl && (
        <a className="secondary-button table-action file-link" href={submission.fileUrl} target="_blank" rel="noreferrer">
          Open uploaded file
        </a>
      )}

      {lines.length > 0 ? (
        <pre className="code-viewer">
          {lines.map((line, index) => (
            <code key={`${index}-${line}`}>
              <span>{index + 1}</span>
              {line || ' '}
            </code>
          ))}
        </pre>
      ) : (
        <div className="empty-state">No previewable file content. Use the file or GitHub link to review.</div>
      )}
    </section>
  );
}

export default SubmissionCodeViewer;
