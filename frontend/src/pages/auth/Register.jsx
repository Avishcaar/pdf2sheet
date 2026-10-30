import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styled from 'styled-components';
import api from '../../services/api';
import toast, { Toaster } from 'react-hot-toast';
import { useTheme } from '../../contexts/ThemeContext';
import ThemeSwitch from '../../components/common/ThemeSwitch';
import { Eye, EyeOff } from 'lucide-react';

export default function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { darkMode } = useTheme();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  });

  const handleGuestAccess = () => {
    localStorage.setItem('token', 'guest-demo-token');
    localStorage.setItem('demo_mode', 'true');
    localStorage.setItem('user', JSON.stringify({
      _id: '6ae0f1989e78e3eb2b71ff9c',
      email: 'guest@pdf2sheet.com',
      firstName: 'Guest',
      lastName: 'Reviewer',
      role: 'demo'
    }));
    toast.success('Welcome! Launching dashboard...');
    navigate('/dashboard');
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/register', formData);
      toast.success('Account created! Please sign in.');
      navigate('/login');
    } catch (err) {
      const errorData = err.response?.data;
      if (errorData?.details && errorData.details.length > 0) {
        errorData.details.forEach(detail => toast.error(detail.message));
      } else {
        toast.error(errorData?.error || 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <StyledWrapper $darkMode={darkMode} className="pdf2sheet-auth">
      <Toaster position="top-center" />
      <Link className="auth-play-brand" to="/dashboard">pdf2sheet.</Link>

      {/* Theme Switch */}
      <div className="theme-toggle-pos">
        <ThemeSwitch size="12px" />
      </div>

      {/* Decluttered Neo-Brutalist Form Card */}
      <div className="form-card">
        <div id="circleform" />

        <div id="introform">
          <h2>Create Account</h2>
          <div id="introformbehind">
            <p>||||||||||||||||||||||||||||||||||||||||</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="form-body">
          <div className="name-row">
            <div className="input-group">
              <label>First Name</label>
              <input
                className="tactile-input"
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="Jane"
                required
              />
            </div>
            <div className="input-group">
              <label>Last Name</label>
              <input
                className="tactile-input"
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Doe"
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label>Email</label>
            <input
              className="tactile-input"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="name@company.com"
              required
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <div className="password-wrapper">
              <input
                className="tactile-input"
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="toggle-eye"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="actions-wrapper">
            <button type="submit" disabled={loading} className="btn-primary">
              <span>{loading ? 'Creating...' : 'Get Started'}</span>
            </button>

            <button type="button" onClick={handleGuestAccess} className="btn-secondary">
              <span>Try as Guest</span>
            </button>
          </div>

          <div className="footer-links">
            <span>Already have an account?</span>
            <Link to="/login" className="link-create">
              Sign In
            </Link>
          </div>
        </form>
      </div>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  min-height: 100vh;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  background-color: ${props => props.$darkMode ? '#080b12' : '#f8fafc'};
  color: ${props => props.$darkMode ? '#f8fafc' : '#0f172a'};
  position: relative;
  font-family: inherit;

  .theme-toggle-pos {
    position: fixed;
    top: 1.5rem;
    right: 1.5rem;
    z-index: 50;
  }

  /* Neo-Brutalist Form Card */
  .form-card {
    --bg-card: ${props => props.$darkMode ? '#101524' : '#ffffff'};
    --color1: #f97316;
    --color2: #ea580c;
    --color3: #f59e0b;
    --border-base: ${props => props.$darkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.1)'};
    --input-bg: ${props => props.$darkMode ? '#0a0d17' : '#f8fafc'};
    --shadow-color: ${props => props.$darkMode ? 'rgba(0, 0, 0, 0.6)' : 'rgba(234, 88, 12, 0.2)'};

    width: 100%;
    max-width: 440px;
    background-color: var(--bg-card);
    border: 4px solid var(--color1);
    position: relative;
    overflow: hidden;
    border-radius: 20px;
    box-shadow: -8px 8px 0px var(--color2);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }

  .form-card:hover {
    transform: translateY(-2px);
    box-shadow: -10px 10px 0px var(--color2);
  }

  /* Quarter-Circle Cutout in Corner */
  #circleform {
    width: 5em;
    height: 5em;
    border-bottom-right-radius: 50%;
    background: linear-gradient(135deg, var(--color3), var(--color2));
    position: absolute;
    top: -2.5em;
    left: -2.5em;
    z-index: 10;
    box-shadow:
      0.25em 0.25em 0em 0.8em var(--bg-card),
      0.25em 0.25em 0em 1.2em var(--color1);
  }

  /* Animated Header Banner */
  #introform {
    width: 100%;
    height: 4.8em;
    background-color: var(--color1);
    display: flex;
    justify-content: flex-end;
    align-items: center;
    position: relative;
    overflow: hidden;
    padding-right: 1.5rem;
    z-index: 1;
  }

  #introform h2 {
    color: #ffffff;
    font-size: 1.45rem;
    font-weight: 800;
    letter-spacing: -0.02em;
    margin: 0;
    position: relative;
    z-index: 2;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }

  #introformbehind {
    position: absolute;
    width: 120%;
    top: -0.8em;
    right: 0;
    z-index: 0;
    animation: translateform 4s infinite linear;
    pointer-events: none;
  }

  #introformbehind p {
    color: rgba(255, 255, 255, 0.3);
    font-family: monospace;
    font-size: 24px;
    font-weight: 700;
    letter-spacing: 3px;
    margin: 0;
    user-select: none;
  }

  @keyframes translateform {
    0% {
      transform: translateX(-5%);
      top: -1em;
    }
    50% {
      top: -0.6em;
    }
    100% {
      transform: translateX(25%);
      top: -1em;
    }
  }

  /* Form Body */
  .form-body {
    padding: 1.8rem 1.8rem 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.15rem;
  }

  .name-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
  }

  .input-group {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .input-group label {
    font-size: 0.85rem;
    font-weight: 700;
    letter-spacing: 0.01em;
    color: ${props => props.$darkMode ? '#e2e8f0' : '#1e293b'};
  }

  .password-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  .tactile-input {
    width: 100%;
    padding: 0.75rem 1rem;
    background-color: var(--input-bg);
    border: 2px solid var(--border-base);
    border-right: 4px solid var(--color1);
    border-bottom: 4px solid var(--color1);
    border-radius: 12px;
    font-size: 0.95rem;
    color: ${props => props.$darkMode ? '#ffffff' : '#0f172a'};
    transition: all 0.2s ease;
    outline: none;
  }

  .password-wrapper .tactile-input {
    padding-right: 2.75rem;
  }

  .tactile-input:focus {
    border-color: var(--color1);
    box-shadow: 3px 3px 0px var(--color2);
    transform: translateX(2px);
  }

  .tactile-input::placeholder {
    color: ${props => props.$darkMode ? '#64748b' : '#94a3b8'};
  }

  .toggle-eye {
    position: absolute;
    right: 0.75rem;
    background: transparent;
    border: none;
    cursor: pointer;
    color: ${props => props.$darkMode ? '#94a3b8' : '#64748b'};
    padding: 0.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.2s ease;
  }

  .toggle-eye:hover {
    color: var(--color1);
  }

  /* Buttons */
  .actions-wrapper {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-top: 0.5rem;
  }

  .btn-primary {
    width: 100%;
    padding: 0.85rem 1.25rem;
    background: linear-gradient(135deg, var(--color2), var(--color1));
    border: none;
    border-right: 4px solid #9a3412;
    border-bottom: 4px solid #9a3412;
    border-radius: 12px;
    color: #ffffff;
    font-weight: 700;
    font-size: 0.95rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    cursor: pointer;
    box-shadow: 2px 2px 0px rgba(0, 0, 0, 0.2);
    transition: all 0.15s ease;
  }

  .btn-primary:hover:not(:disabled) {
    transform: translate(1px, 1px);
    box-shadow: 1px 1px 0px rgba(0, 0, 0, 0.3);
  }

  .btn-primary:active:not(:disabled) {
    transform: translate(3px, 3px);
    box-shadow: none;
  }

  .btn-primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-secondary {
    width: 100%;
    padding: 0.75rem 1.25rem;
    background: transparent;
    border: 2px solid var(--color1);
    border-radius: 12px;
    color: ${props => props.$darkMode ? '#f8fafc' : '#0f172a'};
    font-weight: 700;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .btn-secondary:hover {
    background-color: ${props => props.$darkMode ? 'rgba(249, 115, 22, 0.12)' : 'rgba(249, 115, 22, 0.08)'};
    border-color: var(--color2);
  }

  /* Minimal Footer */
  .footer-links {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    font-size: 0.85rem;
    margin-top: 0.25rem;
    color: ${props => props.$darkMode ? '#94a3b8' : '#64748b'};
  }

  .link-create {
    color: var(--color1);
    font-weight: 700;
    text-decoration: none;
  }

  .link-create:hover {
    color: var(--color2);
    text-decoration: underline;
  }
`;
