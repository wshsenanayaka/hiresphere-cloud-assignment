import { useEffect, useState } from 'react';
import { ArrowLeft, PackagePlus, RefreshCcw } from 'lucide-react';
import PackageCard from '../components/PackageCard';
import { packageApi } from '../services/packageApi';
import { showError, showSuccess } from '../utils/alerts';

const DOMAINS = ['Backend', 'Frontend', 'DevOps', 'AI/ML', 'Mobile'];
const TYPES = ['DSA', 'System Design', 'Behavioral'];
const emptyForm = {
  packageName: '',
  description: '',
  domain: 'Backend',
  interviewType: 'DSA',
  sessionCount: 3,
  durationMinutesPerSession: 60,
  totalPrice: '',
  currency: 'USD',
  discountPercentage: 0,
  isActive: true,
};

function InterviewerPackagesPage({ user, onBack }) {
  const interviewerId = user?.interviewerId || '';
  const [packages, setPackages] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');

  async function loadPackages() {
    if (!interviewerId) return;
    try {
      const data = await packageApi.getInterviewerPackages(interviewerId);
      setPackages(data.packages || []);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  useEffect(() => {
    loadPackages();
  }, [interviewerId]);

  function updateField(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function editPackage(item) {
    setEditingId(item.id);
    setForm({
      packageName: item.packageName,
      description: item.description,
      domain: item.domain,
      interviewType: item.interviewType,
      sessionCount: item.sessionCount,
      durationMinutesPerSession: item.durationMinutesPerSession,
      totalPrice: item.totalPrice,
      currency: item.currency,
      discountPercentage: item.discountPercentage,
      isActive: item.isActive,
    });
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function savePackage(event) {
    event.preventDefault();
    const payload = {
      interviewerId,
      ...form,
      sessionCount: Number(form.sessionCount),
      durationMinutesPerSession: Number(form.durationMinutesPerSession),
      totalPrice: Number(form.totalPrice),
      discountPercentage: Number(form.discountPercentage || 0),
    };
    try {
      if (editingId) {
        await packageApi.updatePackage(editingId, payload);
        await showSuccess('Package updated', 'Interview package updated successfully.');
      } else {
        await packageApi.createPackage(payload);
        await showSuccess('Package created', 'Interview package created successfully.');
      }
      resetForm();
      await loadPackages();
    } catch (requestError) {
      setError(requestError.message);
      showError(editingId ? 'Update failed' : 'Create failed', requestError);
    }
  }

  async function deactivatePackage(item) {
    try {
      await packageApi.deletePackage(item.id, interviewerId);
      await showSuccess('Package deactivated', 'Package is now inactive.');
      await loadPackages();
    } catch (requestError) {
      setError(requestError.message);
      showError('Deactivate failed', requestError);
    }
  }

  return (
    <section className="workspace package-page">
      <div className="dashboard-header">
        <div>
          <p className="eyebrow">Package Service</p>
          <h2>Interview Packages</h2>
          <p>Create bundled interview packages for candidates.</p>
        </div>
        <div className="dashboard-actions">
          <button className="secondary-button header-action" type="button" onClick={onBack}><ArrowLeft size={17} /> Back</button>
          <button className="secondary-button header-action" type="button" onClick={loadPackages}><RefreshCcw size={17} /> Refresh</button>
        </div>
      </div>
      {error && <p className="form-error page-message">{error}</p>}
      <div className="content-grid">
        <section className="panel">
          <h2>{editingId ? 'Edit Package' : 'Create Package'}</h2>
          <form className="stack-form" onSubmit={savePackage}>
            <label>Package name<input value={form.packageName} onChange={(e) => updateField('packageName', e.target.value)} required /></label>
            <label>Description<textarea value={form.description} onChange={(e) => updateField('description', e.target.value)} /></label>
            <label>Domain<select value={form.domain} onChange={(e) => updateField('domain', e.target.value)}>{DOMAINS.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label>Interview type<select value={form.interviewType} onChange={(e) => updateField('interviewType', e.target.value)}>{TYPES.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label>Session count<input type="number" min="2" value={form.sessionCount} onChange={(e) => updateField('sessionCount', e.target.value)} required /></label>
            <label>Minutes per session<input type="number" min="1" value={form.durationMinutesPerSession} onChange={(e) => updateField('durationMinutesPerSession', e.target.value)} required /></label>
            <label>Total price<input type="number" min="1" step="0.01" value={form.totalPrice} onChange={(e) => updateField('totalPrice', e.target.value)} required /></label>
            <label>Currency<input maxLength="3" value={form.currency} onChange={(e) => updateField('currency', e.target.value.toUpperCase())} /></label>
            <label>Discount %<input type="number" min="0" max="100" value={form.discountPercentage} onChange={(e) => updateField('discountPercentage', e.target.value)} /></label>
            <label className="checkbox-row"><input type="checkbox" checked={form.isActive} onChange={(e) => updateField('isActive', e.target.checked)} /> Active package</label>
            <div className="form-actions">
              <button className="primary-button"><PackagePlus size={17} /> {editingId ? 'Update package' : 'Create package'}</button>
              {editingId && <button className="secondary-button" type="button" onClick={resetForm}>Cancel</button>}
            </div>
          </form>
        </section>
        <section className="panel wide">
          <div className="panel-title"><h2>My Packages</h2><span className="call-status">{packages.length} packages</span></div>
          <div className="package-grid">
            {packages.length === 0 && <div className="empty-state">No packages created yet.</div>}
            {packages.map((item) => (
              <PackageCard key={item.id} item={item} actionLabel="Edit" onAction={editPackage} secondaryActionLabel="Deactivate" onSecondaryAction={deactivatePackage} />
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}

export default InterviewerPackagesPage;
