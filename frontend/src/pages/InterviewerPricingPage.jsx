import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, DollarSign, Edit3, Plus, RefreshCcw, Trash2 } from 'lucide-react';
import { pricingApi } from '../services/pricingApi';
import { showError, showSuccess } from '../utils/alerts';

const INTERVIEW_TYPES = ['DSA', 'System Design', 'Behavioral'];
const DOMAINS = ['Backend', 'Frontend', 'DevOps', 'AI/ML', 'Mobile'];
const emptyForm = {
  interviewType: 'DSA',
  domain: 'Backend',
  durationMinutes: 60,
  price: '',
  currency: 'USD',
  isActive: true,
};

function formatCurrency(value, currency) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currency || 'USD',
  }).format(Number(value || 0));
}

function InterviewerPricingPage({ user, onBack }) {
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const interviewerId = user?.interviewerId || params.get('interviewerId') || '';
  const [pricing, setPricing] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingPricingId, setEditingPricingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function loadPricing({ notify = false } = {}) {
    if (!interviewerId) {
      const message = 'interviewerId is required to load pricing.';
      setError(message);
      if (notify) showError('Cannot load pricing', message);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await pricingApi.getInterviewerPricing(interviewerId);
      setPricing(data.pricing || []);
      if (notify) {
        await showSuccess('Pricing refreshed', 'Pricing list was loaded successfully.');
      }
    } catch (requestError) {
      setError(requestError.message);
      if (notify) showError('Refresh failed', requestError);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPricing();
  }, [interviewerId]);

  function updateField(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingPricingId(null);
  }

  function startEdit(item) {
    setEditingPricingId(item.id);
    setForm({
      interviewType: item.interviewType,
      domain: item.domain,
      durationMinutes: item.durationMinutes,
      price: item.price,
      currency: item.currency,
      isActive: item.isActive,
    });
  }

  async function savePricing(event) {
    event.preventDefault();
    setError('');

    const payload = {
      interviewerId,
      interviewType: form.interviewType,
      domain: form.domain,
      durationMinutes: Number(form.durationMinutes),
      price: Number(form.price),
      currency: form.currency || 'USD',
      isActive: form.isActive,
    };

    try {
      if (editingPricingId) {
        await pricingApi.updatePricing(editingPricingId, payload);
        await showSuccess('Pricing updated', 'Session pricing was updated successfully.');
      } else {
        await pricingApi.createPricing(payload);
        await showSuccess('Pricing created', 'Session pricing was created successfully.');
      }

      resetForm();
      await loadPricing();
    } catch (requestError) {
      setError(requestError.message);
      showError(editingPricingId ? 'Update failed' : 'Create failed', requestError);
    }
  }

  async function deactivatePricing(item) {
    setError('');

    try {
      await pricingApi.deletePricing(item.id, interviewerId);
      await showSuccess('Pricing deactivated', 'This pricing option is now inactive.');
      await loadPricing();
    } catch (requestError) {
      setError(requestError.message);
      showError('Delete failed', requestError);
    }
  }

  return (
    <section className="workspace">
      <div className="dashboard-header">
        <div>
          <p className="eyebrow">Interviewer Service</p>
          <h2>Session Pricing</h2>
          <p>Set pricing by interview type, domain, and session duration.</p>
        </div>
        <div className="dashboard-actions">
          <button className="secondary-button header-action" type="button" onClick={onBack}>
            <ArrowLeft size={17} /> Back
          </button>
          <button className="secondary-button header-action" type="button" onClick={() => loadPricing({ notify: true })} disabled={loading}>
            <RefreshCcw size={17} /> Refresh
          </button>
        </div>
      </div>

      {error && <p className="form-error page-message">{error}</p>}

      <div className="content-grid">
        <section className="panel">
          <h2>{editingPricingId ? 'Edit Pricing' : 'Add Pricing'}</h2>
          <form className="stack-form" onSubmit={savePricing}>
            <label>
              Interview type
              <select value={form.interviewType} onChange={(event) => updateField('interviewType', event.target.value)} required>
                {INTERVIEW_TYPES.map((type) => (
                  <option key={type}>{type}</option>
                ))}
              </select>
            </label>
            <label>
              Domain
              <select value={form.domain} onChange={(event) => updateField('domain', event.target.value)} required>
                {DOMAINS.map((domain) => (
                  <option key={domain}>{domain}</option>
                ))}
              </select>
            </label>
            <label>
              Duration minutes
              <input
                min="1"
                type="number"
                value={form.durationMinutes}
                onChange={(event) => updateField('durationMinutes', event.target.value)}
                required
              />
            </label>
            <label>
              Price
              <input
                min="1"
                step="0.01"
                type="number"
                value={form.price}
                onChange={(event) => updateField('price', event.target.value)}
                required
              />
            </label>
            <label>
              Currency
              <input maxLength="3" value={form.currency} onChange={(event) => updateField('currency', event.target.value.toUpperCase())} />
            </label>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) => updateField('isActive', event.target.checked)}
              />
              Active pricing
            </label>
            <div className="form-actions">
              <button className="primary-button" type="submit">
                {editingPricingId ? <Edit3 size={17} /> : <Plus size={17} />}
                {editingPricingId ? 'Update pricing' : 'Create pricing'}
              </button>
              {editingPricingId && (
                <button className="secondary-button" type="button" onClick={resetForm}>
                  Cancel edit
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="panel wide">
          <div className="panel-title">
            <h2>Pricing List</h2>
            <span className="call-status">{loading ? 'Loading' : `${pricing.length} records`}</span>
          </div>
          <div className="table pricing-table">
            <div className="table-head">
              <span>Type</span>
              <span>Domain</span>
              <span>Duration</span>
              <span>Price</span>
              <span>Status</span>
              <span>Edit</span>
              <span>Delete</span>
            </div>
            {pricing.length === 0 && !loading && <div className="empty-state">No pricing records found.</div>}
            {pricing.map((item) => (
              <div className="table-row" key={item.id}>
                <span>{item.interviewType}</span>
                <span>{item.domain}</span>
                <span>{item.durationMinutes} min</span>
                <span>
                  <DollarSign size={15} /> {formatCurrency(item.price, item.currency)}
                </span>
                <span className="status-pill">{item.isActive ? 'Active' : 'Inactive'}</span>
                <button className="secondary-button table-action" type="button" onClick={() => startEdit(item)}>
                  <Edit3 size={16} /> Edit
                </button>
                <button className="danger-button table-action" type="button" onClick={() => deactivatePricing(item)} disabled={!item.isActive}>
                  <Trash2 size={16} /> Deactivate
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}

export default InterviewerPricingPage;
