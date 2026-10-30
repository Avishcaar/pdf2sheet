import { ArrowUpRight, RefreshCw, Upload } from 'lucide-react';

export default function InvoiceWelcome({ onUpload, onSync, isUploading, isSyncing }) {
  return (
    <div id="invoice-intake-section" className="handoff-hero-intro">
      <div className="handoff-hero-copy">
        <p className="handoff-hero-overline">PDF2Sheet / from document to data</p>
        <h1 id="handoff-hero-title">See the <span>handoff</span> happen.</h1>
        <p className="handoff-hero-description">An invoice arrives. Its details find their place. Follow the journey from PDF to spreadsheet, then try it with your own.</p>
      </div>
      <div className="handoff-hero-action-group">
        <div className="handoff-hero-actions">
          <button type="button" className="switch-button switch-button-lime" onClick={onUpload} disabled={isUploading}><Upload size={17} aria-hidden="true" />{isUploading ? 'Reading your PDF…' : 'Upload an invoice'}<ArrowUpRight size={18} aria-hidden="true" /></button>
          <button type="button" className="switch-button handoff-inbox-button" onClick={onSync} disabled={isSyncing}><RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} aria-hidden="true" />{isSyncing ? 'Checking inbox…' : 'Check inbox'}</button>
        </div>
        <p className="handoff-hero-caption">The illustrated flow below uses sample data.</p>
      </div>
    </div>
  );
}
