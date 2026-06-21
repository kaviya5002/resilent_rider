import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import './Login.css';

function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'rider',
  });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setApiError('');
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setApiError('');

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const found = users.find(u => u.email === formData.email && u.role === formData.role);

    if (!found) {
      setApiError('No account found with this email and role.');
      setIsLoading(false);
      return;
    }

    if (found.password !== formData.password) {
      setApiError('Incorrect password.');
      setIsLoading(false);
      return;
    }

    const userData = { id: found.id, name: found.name, email: found.email, role: found.role };
    login('local-token-' + found.id, userData);
    setIsLoading(false);
  };

  return (
    <div className="login-page">
      <motion.div
        className="login-card"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className="login-header"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h1>Welcome Back</h1>
          <p>Sign in to your ResilientRider account</p>
        </motion.div>

        {apiError && (
          <motion.div
            className="api-error-banner"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            ⚠️ {apiError}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <motion.div
            className="form-group"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={errors.email ? 'error' : ''}
              placeholder="you@example.com"
            />
            {errors.email && (
              <motion.span
                className="error-message"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {errors.email}
              </motion.span>
            )}
          </motion.div>

          <motion.div
            className="form-group"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={errors.password ? 'error' : ''}
              placeholder="Enter your password"
            />
            {errors.password && (
              <motion.span
                className="error-message"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {errors.password}
              </motion.span>
            )}
          </motion.div>

          <motion.div
            className="form-group"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <label>Login As</label>
            <div className="role-selection">
              <label className={`role-option ${formData.role === 'rider' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="role"
                  value="rider"
                  checked={formData.role === 'rider'}
                  onChange={handleChange}
                />
                <div className="role-content">
                  <span className="role-icon">🏍️</span>
                  <div>
                    <strong>Rider</strong>
                    <small>Gig Worker</small>
                  </div>
                </div>
              </label>

              <label className={`role-option ${formData.role === 'admin' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="role"
                  value="admin"
                  checked={formData.role === 'admin'}
                  onChange={handleChange}
                />
                <div className="role-content">
                  <span className="role-icon">🏢</span>
                  <div>
                    <strong>Admin</strong>
                    <small>Insurance Provider</small>
                  </div>
                </div>
              </label>
            </div>
          </motion.div>

          <motion.div
            className="form-actions"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <Link to="/forgot-password" className="forgot-link">
              Forgot password?
            </Link>
          </motion.div>

          <motion.button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={isLoading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            {isLoading ? (
              <span className="loading-spinner">
                <span className="spinner"></span>
                Signing in...
              </span>
            ) : (
              'Sign In'
            )}
          </motion.button>

          <motion.div
            className="signup-prompt"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <p>
              Don't have an account?{' '}
              <Link to="/signup" className="signup-link">
                Sign up
              </Link>
            </p>
          </motion.div>
        </form>
      </motion.div>

      <div className="login-background">
        <div className="bg-shape shape-1"></div>
        <div className="bg-shape shape-2"></div>
        <div className="bg-shape shape-3"></div>
      </div>
    </div>
  );
}

export default Login;
