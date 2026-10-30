import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function MainLayout() {
  return (
    <div className="switch-app">
      <a className="switch-skip-link" href="#workspace-main">Skip to content</a>
      <Sidebar />
      <div className="switch-main">
        <Header />
        <main id="workspace-main" className="switch-content" tabIndex={-1}><div className="switch-content-inner"><Outlet /></div></main>
      </div>
    </div>
  );
}
