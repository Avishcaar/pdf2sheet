import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowUpRight, Crosshair, Mail, Plus, Search, Store, X } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import { useVendors } from '../../hooks/useVendors';
import AddVendorModal from '../../components/vendors/AddVendorModal';
import EditVendorModal from '../../components/vendors/EditVendorModal';

function initials(name) {
  return (name || 'Vendor').trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

function fieldLabel(value) {
  return String(value || 'Unnamed field').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_-]/g, ' ');
}

export default function Vendors() {
  const { data: vendors, isLoading, error, refetch } = useVendors();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);

  const vendorList = useMemo(() => Array.isArray(vendors) ? vendors : [], [vendors]);
  const stats = useMemo(() => {
    let coordinateRules = 0;
    let heuristicRules = 0;
    vendorList.forEach((vendor) => (vendor.extractionRules || []).forEach((rule) => {
      if (rule.method === 'coordinate') coordinateRules += 1;
      else heuristicRules += 1;
    }));
    return { total: vendorList.length, coordinateRules, heuristicRules };
  }, [vendorList]);

  const filteredVendors = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return vendorList;
    return vendorList.filter((vendor) => (
      vendor.vendorName?.toLowerCase().includes(query)
      || vendor.senderEmail?.toLowerCase().includes(query)
    ));
  }, [vendorList, searchQuery]);

  return (
    <div className="vendors-workbench directory-page">
      <Toaster position="top-center" />
      <section className="directory-header" aria-labelledby="directory-title">
        <div>
          <p className="directory-overline">Familiar faces. Familiar fields.</p>
          <h1 id="directory-title">Your vendor circle.</h1>
          <p className="directory-intro">Keep sender details and learned invoice rules in one place.</p>
        </div>
        <button type="button" className="directory-add-button" onClick={() => setShowAddModal(true)}><Plus size={17} aria-hidden="true" />Add vendor</button>
      </section>

      <dl className="directory-stat-line" aria-label="Vendor directory summary">
        <div><dt><Store size={16} aria-hidden="true" />Vendor profiles</dt><dd>{stats.total}</dd></div>
        <div><dt><Crosshair size={16} aria-hidden="true" />Coordinate rules</dt><dd>{stats.coordinateRules}</dd></div>
        <div><dt><Search size={16} aria-hidden="true" />Heuristic rules</dt><dd>{stats.heuristicRules}</dd></div>
      </dl>

      <section className="directory-list" aria-labelledby="directory-list-title">
        <div className="directory-toolbar">
          <div><h2 id="directory-list-title">All vendors</h2><p className="directory-result-count" aria-live="polite">{filteredVendors.length} of {stats.total} profiles</p></div>
          <div className="directory-search">
            <Search size={16} aria-hidden="true" />
            <label className="sr-only" htmlFor="directory-search">Search vendors by name or sender email</label>
            <input id="directory-search" type="search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Find a vendor…" />
            {searchQuery && <button type="button" onClick={() => setSearchQuery('')} aria-label="Clear vendor search"><X size={15} aria-hidden="true" /></button>}
          </div>
        </div>

        {isLoading ? (
          <div className="directory-state" role="status"><span className="directory-loading" aria-hidden="true" /><h3>Gathering your vendors…</h3><p>Loading profiles and saved field rules.</p></div>
        ) : error ? (
          <div className="directory-state directory-error" role="alert"><AlertCircle size={27} aria-hidden="true" /><h3>We couldn’t load your vendors.</h3><p>Try loading the directory again.</p><button type="button" className="directory-secondary-button" onClick={() => refetch()}>Try again</button></div>
        ) : filteredVendors.length ? (
          <div className="directory-grid">
            {filteredVendors.map((vendor, index) => {
              const rules = vendor.extractionRules || [];
              const coordinateCount = rules.filter((rule) => rule.method === 'coordinate').length;
              const heuristicCount = rules.length - coordinateCount;
              return (
                <article className="directory-card" key={vendor._id}>
                  <div className="directory-card-header">
                    <span className={'directory-avatar directory-avatar-' + (index % 3)} aria-hidden="true">{initials(vendor.vendorName)}</span>
                    <div className="directory-identity"><h3>{vendor.vendorName || 'Unnamed vendor'}</h3><p><Mail size={12} aria-hidden="true" /><span>{vendor.senderEmail || 'No sender email saved'}</span></p></div>
                  </div>
                  <div className="directory-rule-summary"><strong>{rules.length}<span> saved {rules.length === 1 ? 'field' : 'fields'}</span></strong><span>{rules.length ? 'Ready to recognize' : 'Room to learn'}</span></div>
                  <div className="directory-methods">
                    {coordinateCount > 0 && <span className="directory-method"><Crosshair size={12} aria-hidden="true" />{coordinateCount} coordinate</span>}
                    {heuristicCount > 0 && <span className="directory-method"><Search size={12} aria-hidden="true" />{heuristicCount} heuristic</span>}
                    {!rules.length && <span className="directory-no-rules">Add rules or review an invoice to teach its layout.</span>}
                  </div>
                  {rules.length > 0 && <ul className="directory-fields" aria-label="Saved invoice fields">{rules.slice(0, 4).map((rule, ruleIndex) => <li key={rule.targetField + '-' + ruleIndex} className="directory-field" title={rule.method === 'coordinate' ? 'Saved document position' : 'Heuristic field rule'}>{fieldLabel(rule.targetField)}</li>)}{rules.length > 4 && <li className="directory-field-more">+{rules.length - 4} more</li>}</ul>}
                  <div className="directory-card-actions"><button type="button" className="directory-secondary-button" onClick={() => setEditingVendor(vendor)} aria-label={'Edit rules for ' + (vendor.vendorName || 'vendor')}>Edit rules</button><Link className="directory-test-link" to="/simulate" aria-label={'Test an invoice from ' + (vendor.vendorName || 'vendor')}>Test invoice<ArrowUpRight size={15} aria-hidden="true" /></Link></div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="directory-state"><Store size={30} aria-hidden="true" /><h3>{searchQuery ? 'No vendors by that name.' : 'Your vendor circle starts here.'}</h3><p>{searchQuery ? 'Try another name or sender email.' : 'Add a profile, or process a sample invoice to create your first vendor.'}</p>{searchQuery ? <button type="button" className="directory-secondary-button" onClick={() => setSearchQuery('')}>Clear search</button> : <div className="directory-empty-actions"><button type="button" className="directory-add-button" onClick={() => setShowAddModal(true)}><Plus size={16} aria-hidden="true" />Add vendor</button><Link className="directory-test-link" to="/simulate">Try a sample<ArrowUpRight size={15} aria-hidden="true" /></Link></div>}</div>
        )}
      </section>

      <AddVendorModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} />
      <EditVendorModal isOpen={Boolean(editingVendor)} onClose={() => setEditingVendor(null)} vendor={editingVendor} />
    </div>
  );
}
