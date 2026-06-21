import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import DarkModeToggle from './DarkModeToggle';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import './Navbar.css';

function Navbar() {
  const [isOpen, setIsOpen]     = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, logout }        = useAuth();
  const { unreadCount }         = useNotifications() || {};
  const location                = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => { setIsOpen(false); }, [location.pathname]);

  const closeMenu = () => setIsOpen(false);
  const isActive  = (path) => location.pathname === path ? 'active' : '';

  const isRider = user?.role === 'rider';
  const isAdmin = user?.role === 'admin';

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="navbar-container">

        {/* Brand — always visible */}
        <Link
          to={isAdmin ? '/admin-dashboard' : isRider ? '/user-dashboard' : '/'}
          className="navbar-brand"
          onClick={closeMenu}
        >
          ResilientRider
        </Link>

        <button
          className={`hamburger ${isOpen ? 'active' : ''}`}
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
        >
          <span></span><span></span><span></span>
        </button>

        <div className={`navbar-menu ${isOpen ? 'active' : ''}`}>

          {/* ── PUBLIC navbar (not logged in) ── */}
          {!user && (
            <ul className="navbar-links">
              <li><Link to="/" className={isActive('/')}>Home</Link></li>
              <li><Link to="/how-it-works" className={isActive('/how-it-works')}>How It Works</Link></li>
              <li><Link to="/ai-technology" className={isActive('/ai-technology')}>AI Technology</Link></li>
              <li><Link to="/benefits" className={isActive('/benefits')}>Benefits</Link></li>
              <li><Link to="/contact" className={isActive('/contact')}>Contact</Link></li>
            </ul>
          )}

          {/* ── RIDER navbar ── */}
          {isRider && (
            <ul className="navbar-links">
              <li><Link to="/user-dashboard" className={isActive('/user-dashboard')}>Dashboard</Link></li>
              <li><Link to="/user-profile" className={isActive('/user-profile')}>Profile</Link></li>
            </ul>
          )}

          {/* ── ADMIN navbar ── */}
          {isAdmin && (
            <ul className="navbar-links">
              <li><Link to="/admin-dashboard" className={isActive('/admin-dashboard')}>Dashboard</Link></li>
              <li><Link to="/admin-profile" className={isActive('/admin-profile')}>Profile</Link></li>
            </ul>
          )}

          <div className="navbar-buttons">
            <DarkModeToggle />
            {user ? (
              <>
                <span className="navbar-user">👤 {user.name?.split(' ')[0]}</span>
                {unreadCount > 0 && (
                  <Link to="/user-dashboard" className="navbar-notif-badge" title={`${unreadCount} unread notifications`}>
                    🔔 <span>{unreadCount > 99 ? '99+' : unreadCount}</span>
                  </Link>
                )}
                <button className="btn btn-outline" onClick={logout}>Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-outline">Login</Link>
                <Link to="/signup" className="btn btn-primary">Sign Up</Link>
              </>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
}

export default Navbar;
