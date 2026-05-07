import { Edit3, Trash2 } from 'lucide-react';

function AnnotationPanel({ annotations, readOnly = false, onEdit, onDelete }) {
  return (
    <section className="panel annotation-panel">
      <div className="panel-title">
        <h2>Annotations</h2>
        <span className="call-status">{annotations.length} notes</span>
      </div>

      <div className="annotation-list">
        {annotations.length === 0 && <div className="empty-state">No annotations yet.</div>}
        {annotations.map((annotation) => (
          <article className={`annotation-card severity-${annotation.severity?.toLowerCase()}`} key={annotation.id}>
            <div>
              <span className="status-pill">{annotation.severity}</span>
              {annotation.lineNumber && <small>Line {annotation.lineNumber}</small>}
            </div>
            {annotation.selectedText && <blockquote>{annotation.selectedText}</blockquote>}
            <p>{annotation.comment}</p>
            {!readOnly && (
              <div className="annotation-actions">
                <button className="secondary-button table-action" type="button" onClick={() => onEdit?.(annotation)}>
                  <Edit3 size={15} /> Edit
                </button>
                <button className="danger-button table-action" type="button" onClick={() => onDelete?.(annotation)}>
                  <Trash2 size={15} /> Delete
                </button>
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

export default AnnotationPanel;
