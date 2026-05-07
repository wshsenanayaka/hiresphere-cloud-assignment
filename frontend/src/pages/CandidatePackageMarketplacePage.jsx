import { useEffect, useState } from 'react';
import { ArrowLeft, RefreshCcw } from 'lucide-react';
import PackageCard from '../components/PackageCard';
import { packageApi } from '../services/packageApi';
import { showError, showSuccess } from '../utils/alerts';

const DOMAINS = ['', 'Backend', 'Frontend', 'DevOps', 'AI/ML', 'Mobile'];
const TYPES = ['', 'DSA', 'System Design', 'Behavioral'];

function CandidatePackageMarketplacePage({ user, onBack, onNavigate }) {
  const [packages, setPackages] = useState([]);
  const [filters, setFilters] = useState({ domain: '', interviewType: '' });
  const [error, setError] = useState('');

  async function loadPackages() {
    try {
      const data = await packageApi.getActivePackages(filters);
      setPackages(data.packages || []);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  useEffect(() => {
    loadPackages();
  }, [filters.domain, filters.interviewType]);

  async function bookPackage(item) {
    try {
      await packageApi.bookPackage(item.id, user.id);
      await showSuccess('Package booked', 'Package payment marked as paid and booking created.');
      onNavigate?.('/my-packages');
    } catch (requestError) {
      setError(requestError.message);
      showError('Booking failed', requestError);
    }
  }

  return (
    <section className="workspace package-page">
      <div className="dashboard-header">
        <div><p className="eyebrow">Package Marketplace</p><h2>Bundled Interview Packages</h2><p>Book multi-session interview preparation packages.</p></div>
        <div className="dashboard-actions">
          <button className="secondary-button header-action" type="button" onClick={onBack}><ArrowLeft size={17} /> Back</button>
          <button className="secondary-button header-action" type="button" onClick={loadPackages}><RefreshCcw size={17} /> Refresh</button>
        </div>
      </div>
      {error && <p className="form-error page-message">{error}</p>}
      <section className="panel">
        <div className="filter-grid">
          <label>Domain<select value={filters.domain} onChange={(e) => setFilters((c) => ({ ...c, domain: e.target.value }))}>{DOMAINS.map((item) => <option value={item} key={item}>{item || 'All domains'}</option>)}</select></label>
          <label>Interview type<select value={filters.interviewType} onChange={(e) => setFilters((c) => ({ ...c, interviewType: e.target.value }))}>{TYPES.map((item) => <option value={item} key={item}>{item || 'All types'}</option>)}</select></label>
          <button className="secondary-button filter-reset" type="button" onClick={() => setFilters({ domain: '', interviewType: '' })}>Reset filters</button>
        </div>
        <div className="package-grid">
          {packages.length === 0 && <div className="empty-state">No active packages found.</div>}
          {packages.map((item) => <PackageCard key={item.id} item={item} actionLabel="Book package" onAction={bookPackage} />)}
        </div>
      </section>
    </section>
  );
}

export default CandidatePackageMarketplacePage;
