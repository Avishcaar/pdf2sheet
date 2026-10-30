import { useMemo } from 'react';
import { Check, FileSearch } from 'lucide-react';
import { convertCurrency, formatCurrency } from '../../utils/currencyUtils';

export default function SpendAnalytics({ invoices, baseCurrency = 'USD' }) {
  const data = useMemo(() => {
    const vendors = new Map();
    const audit = { valid: 0, mismatch: 0, pending: 0 };
    const engines = { model: 0, spatial: 0, other: 0 };
    let total = 0;
    for (const invoice of invoices || []) {
      const extracted = invoice.extractedData || {};
      const raw = Number.parseFloat(String(extracted.totalAmount ?? 0).replace(/[^0-9.-]/g, ''));
      const amount = convertCurrency(Number.isFinite(raw) ? raw : 0, extracted.currency || 'USD', baseCurrency);
      const name = invoice.vendorName || extracted.vendorName || 'Unregistered vendor';
      const vendor = vendors.get(name) || { name, amount: 0, count: 0 };
      vendor.amount += amount;
      vendor.count += 1;
      vendors.set(name, vendor);
      total += amount;
      if (extracted.mathAudit?.isValid === true) audit.valid += 1;
      else if (extracted.mathAudit?.isValid === false) audit.mismatch += 1;
      else audit.pending += 1;
      const engine = String(extracted.engine || '').toLowerCase();
      if (engine.includes('groq') || engine.includes('llama')) engines.model += 1;
      else if (engine.includes('spatial') || engine.includes('coordinate') || invoice.vendorMapId) engines.spatial += 1;
      else engines.other += 1;
    }
    const ranked = [...vendors.values()].sort((a, b) => b.amount - a.amount);
    const checked = audit.valid + audit.mismatch;
    return { vendors: ranked, total, audit, engines, checked, rate: checked ? Math.round(audit.valid / checked * 100) : null };
  }, [invoices, baseCurrency]);

  return (
    <div className="insights-grid">
      <section className="insights-vendors" aria-labelledby="vendor-spend-title">
        <div className="insights-panel-heading"><div><h3 id="vendor-spend-title">Where it went</h3><p>Your largest vendors, in {baseCurrency}.</p></div><span>{data.vendors.length} vendors</span></div>
        {data.vendors.length ? <div className="insights-ranking">{data.vendors.slice(0, 6).map((vendor, index) => {
          const max = Math.max(0, data.vendors[0]?.amount || 0);
          const width = max ? Math.max(0, vendor.amount / max * 100) : 0;
          return <div className="insights-vendor-row" key={vendor.name}><span className="insights-rank">{String(index + 1).padStart(2, '0')}</span><div className="insights-vendor-details"><div><strong>{vendor.name}</strong><span>{formatCurrency(vendor.amount, baseCurrency)}</span></div><div className="insights-bar"><i style={{ width: width + '%' }} /></div><small>{vendor.count} invoice{vendor.count === 1 ? '' : 's'}{data.total > 0 ? ' · ' + Math.round(vendor.amount / data.total * 100) + '% of total' : ''}</small></div></div>;
        })}</div> : <div className="insights-empty"><FileSearch size={27} strokeWidth={1.6} aria-hidden="true" /><strong>A clearer picture starts here.</strong><p>Add an invoice to see your vendor spend take shape.</p></div>}
      </section>
      <section className="insights-audit" aria-labelledby="audit-title">
        <div className="insights-panel-heading"><div><h3 id="audit-title">Numbers that add up</h3><p>Recorded arithmetic checks.</p></div><span className="insights-check-mark"><Check size={17} aria-hidden="true" /></span></div>
        <div className="insights-audit-middle"><div className="insights-ring" style={{ '--audit-progress': (data.rate || 0) + '%' }}><div><strong>{data.rate === null ? '—' : data.rate + '%'}</strong><span>{data.rate === null ? 'No checks yet' : 'of checks passed'}</span></div></div><dl className="insights-audit-counts"><div><dt><i className="audit-dot-pass" />Passed</dt><dd>{data.audit.valid}</dd></div><div><dt><i className="audit-dot-mismatch" />Mismatch</dt><dd>{data.audit.mismatch}</dd></div><div><dt><i className="audit-dot-pending" />Not checked</dt><dd>{data.audit.pending}</dd></div></dl></div>
        <div className="insights-engine-note"><span>Extraction methods</span><div><strong>{data.engines.model}</strong> model extraction<span>·</span><strong>{data.engines.spatial}</strong> saved rules</div>{data.engines.other > 0 && <small>{data.engines.other} with no recorded method</small>}</div>
      </section>
    </div>
  );
}
