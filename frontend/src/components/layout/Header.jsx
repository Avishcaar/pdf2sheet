import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeftRight, ChevronDown, Compass, LogOut, Moon, Sun } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { launchGuidedTour } from '../../utils/guidedTour';
import toast from 'react-hot-toast';

function readUser() {
  const guest = { firstName: 'Guest', lastName: 'Reviewer', email: 'guest@pdf2sheet.com', role: 'demo' };
  try {
    if (localStorage.getItem('token') !== 'guest-demo-token') return JSON.parse(localStorage.getItem('user')) || guest;
  } catch { return guest; }
  return guest;
}

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useTheme();
  const [user, setUser] = useState(readUser);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const guest = user.role === 'demo' || localStorage.getItem('token') === 'guest-demo-token';
  const titles = { '/dashboard': 'Overview', '/vendors': 'Vendors', '/simulate': 'Playground', '/settings': 'Settings' };
  const title = titles[location.pathname] || 'Invoice review';

  useEffect(() => {
    const update = () => setUser(readUser());
    window.addEventListener('storage', update);
    return () => window.removeEventListener('storage', update);
  }, []);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const close = (event) => {
      if (event.key === 'Escape' || (event.type === 'mousedown' && !menuRef.current?.contains(event.target))) setMenuOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', close); };
  }, [menuOpen]);

  const signOut = () => {
    ['token', 'user', 'demo_mode'].forEach((key) => localStorage.removeItem(key));
    setMenuOpen(false);
    navigate('/login');
  };

  const switchMode = () => {
    if (guest) { signOut(); return; }
    localStorage.setItem('token', 'guest-demo-token');
    localStorage.setItem('demo_mode', 'true');
    localStorage.setItem('user', JSON.stringify({ _id: '6ae0f1989e78e3eb2b71ff9c', firstName: 'Guest', lastName: 'Reviewer', email: 'guest@pdf2sheet.com', role: 'demo' }));
    toast.success('Demo workspace opened');
    window.location.assign('/dashboard');
  };

  return (
    <header className="switch-header">
      <div className="switch-breadcrumb"><Link to="/dashboard">Workspace</Link><span aria-hidden="true">/</span><strong>{title}</strong></div>
      <div className="switch-header-actions">
        <span className="switch-workspace-mode">{guest ? 'Demo workspace' : 'Personal workspace'}</span>
        <button className="switch-icon-button mobile-tour-trigger" type="button" onClick={() => launchGuidedTour(navigate, location.pathname)} aria-label="Start guided tour" title="Start guided tour"><Compass size={19} aria-hidden="true" /></button>
        <button className="switch-icon-button" type="button" onClick={toggleDarkMode} aria-label={darkMode ? 'Switch to light theme' : 'Switch to dark theme'} title={darkMode ? 'Light theme' : 'Dark theme'}>{darkMode ? <Sun size={19} aria-hidden="true" /> : <Moon size={19} aria-hidden="true" />}</button>
        <div className="switch-profile" ref={menuRef}>
          <button className="switch-profile-trigger" type="button" onClick={() => setMenuOpen((open) => !open)} aria-expanded={menuOpen} aria-label="Account options"><span className="switch-avatar">{user.firstName?.[0] || 'G'}</span><span className="switch-profile-name">{user.firstName || 'Guest'}</span><ChevronDown size={14} aria-hidden="true" /></button>
          {menuOpen && <div className="switch-profile-menu"><strong>{user.firstName} {user.lastName || ''}</strong><p>{user.email}</p><Link to="/settings" onClick={() => setMenuOpen(false)}>Account settings</Link><button type="button" onClick={switchMode}><ArrowLeftRight size={15} aria-hidden="true" />{guest ? 'Use a personal account' : 'Open demo workspace'}</button><button type="button" onClick={signOut}><LogOut size={15} aria-hidden="true" />Sign out</button></div>}
        </div>
      </div>
    </header>
  );
}
