import { ArrowUpRight } from 'lucide-react';
import { formatCurrency } from '../../utils/currencyUtils';

export default function OverviewMetrics({ stats, baseCurrency, onFilter }) {
  return (
    <section className="switch-metrics" id="kpi-metrics-section" aria-label="Invoice overview">
      <button type="button" className="switch-metric metric-total" onClick={() => onFilter('all')}><span className="switch-metric-label">All invoices<ArrowUpRight size={17} aria-hidden="true" /></span><strong>{stats.total}</strong><span>The whole paper trail</span></button>
      <article className="switch-metric metric-volume"><span className="switch-metric-label">Invoice volume<span className="metric-currency">{baseCurrency}</span></span><strong className="metric-money">{formatCurrency(stats.totalAmount, baseCurrency)}</strong><span>Across your vendor invoices</span></article>
      <button type="button" className="switch-metric metric-processed" onClick={() => onFilter('processed')}><span className="switch-metric-label">Processed<ArrowUpRight size={17} aria-hidden="true" /></span><strong>{stats.processed}<small> / {stats.total}</small></strong><span>{stats.syncRate}% of your register</span><i className="metric-progress" style={{ '--metric-progress': stats.syncRate + '%' }} /></button>
      <button type="button" className="switch-metric metric-review" onClick={() => onFilter('review_needed')}><span className="switch-metric-label">Needs a look<ArrowUpRight size={17} aria-hidden="true" /></span><strong>{stats.review}</strong><span>{stats.review ? 'Your review queue is waiting' : 'Your review queue is clear'}</span></button>
    </section>
  );
}
