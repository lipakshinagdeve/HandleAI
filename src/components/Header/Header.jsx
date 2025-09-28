import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { authAPI } from '../../utils/api';
import './Header.scss';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useUser();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      logout();
      // Use replace: true to prevent going back to protected pages
      navigate('/', { replace: true });
      // Clear the browser history to prevent back navigation
      window.history.replaceState(null, '', '/');
    }
  };

  return (
    <header className={`header ${isScrolled ? 'scrolled' : ''}`}>
      <div className="container">
        <div className="header__content">
          <Link to="/" className="header__logo">
            <span className="logo-text">Handle</span>
          </Link>
          
          <nav className="header__nav">
            <Link 
              to="/" 
              className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
            >
              Home
            </Link>
            
            {user && (
              <>
                <Link 
                  to="/dashboard" 
                  className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
                >
                  Dashboard
                </Link>
                <Link 
                  to="/settings" 
                  className={`nav-link ${location.pathname === '/settings' ? 'active' : ''}`}
                >
                  Settings
                </Link>
                <button 
                  onClick={handleLogout}
                  className="nav-link logout-btn"
                >
                  Logout
                </button>
              </>
            )}
            
            {!user && (
              <>
                <Link 
                  to="/login" 
                  className={`nav-link ${location.pathname === '/login' ? 'active' : ''}`}
                >
                  Login
                </Link>
                <Link 
                  to="/signup" 
                  className={`nav-link login-btn ${location.pathname === '/signup' ? 'active' : ''}`}
                >
                  Sign Up
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;