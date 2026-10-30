import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Store, FlaskConical, Settings, Compass, ArrowUpRight, FileSpreadsheet } from 'lucide-react';
import { launchGuidedTour } from '../../utils/guidedTour';

const navigation = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { to: '/vendors', label: 'Vendors', icon: Store },
  { to: '/simulate', label: 'Playground', icon: FlaskConical },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <aside className="switch-sidebar" aria-label="Main navigation">
      <div className="switch-sidebar-spine" aria-hidden="true"><span>PDF → SHEET</span></div>
      <Link to="/dashboard" className="switch-brand" aria-label="PDF2Sheet home">
        <span className="switch-brand-icon"><FileSpreadsheet size={23} strokeWidth={2.2} aria-hidden="true" /></span>
        <span>pdf2sheet<span className="brand-period">.</span></span>
      </Link>
      <p className="switch-sidebar-label">Workspace index</p>
      <nav className="switch-navigation" aria-label="Workspace">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => 'switch-nav-link' + (isActive ? ' is-active' : '')}>
              <Icon size={19} aria-hidden="true" /><span className="switch-nav-title">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
      <div className="switch-sidebar-space" />
      <button className="switch-tour-card" type="button" onClick={() => launchGuidedTour(navigate, location.pathname)} aria-label="Start guided tour">
        <Compass size={22} strokeWidth={1.7} aria-hidden="true" />
        <span className="switch-tour-copy"><strong>Take the tour</strong><span>From PDF to a sheet row.</span></span>
      </button>
      <a className="switch-sheet-link" href="https://docs.google.com/spreadsheets/d/10XdMg1XgLa8PlRGMDr3_XTZ_0Igu2lI8B5oj8C5B4rs" target="_blank" rel="noopener noreferrer"><FileSpreadsheet size={17} aria-hidden="true" /><span>Demo spreadsheet</span><ArrowUpRight size={15} aria-hidden="true" /></a>
    </aside>
  );
}
