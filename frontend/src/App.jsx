import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import GoogleAuthCallback from './pages/auth/GoogleAuthCallback';
import RequireAuth from './components/auth/RequireAuth';
import MainLayout from './components/layout/MainLayout';
import Dashboard from './pages/dashboard/Dashboard';
import Vendors from './pages/vendors/Vendors';
import Settings from './pages/settings/Settings';
import SimulatePage from './pages/devtools/SimulatePage';

import VisualMapper from './components/Review/VisualMapper';

function App() {
  return (
    <div className="min-h-screen">
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/auth/google/callback" element={<GoogleAuthCallback />} />
        <Route path="/auth/success" element={<GoogleAuthCallback />} />

        <Route element={<RequireAuth />}>
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/vendors" element={<Vendors />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/simulate" element={<SimulatePage />} />
            <Route path="/review/:invoiceId" element={<VisualMapper />} />
          </Route>
        </Route>
      </Routes>
    </div>
  );
}

export default App;

