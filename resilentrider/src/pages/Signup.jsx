import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import './Signup.css';

function Signup() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    role: 'rider',
  });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone) => {
    const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
    return phoneRegex.test(phone);
  };

  const checkPasswordStrength = (password) => {
    if (password.length === 0) return '';
    if (password.length < 8) return 'weak';
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z\d]/.test(password)) strength++;

    if (strength <= 2) return 'weak';
    if (strength <= 3) return 'medium';
    return 'strong';
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Name must be at least 2 characters';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.phoneNumber) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!validatePhone(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid phone number';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    // Update password strength
    if (name === 'password') {
      setPasswordStrength(checkPasswordStrength(value));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setApiError('');

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const exists = users.find(u => u.email === formData.email);

    if (exists) {
      setApiError('Email already registered. Please login.');
      setIsLoading(false);
      return;
    }

    const newUser = {
      id: Date.now().toString(),
      name: formData.fullName,
      email: formData.email,
      phone: formData.phoneNumber,
      password: formData.password,
      role: formData.role,
    };

    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));

    const userData = { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role };
    login('local-token-' + newUser.id, userData);
    setIsLoading(false);
  };

  const getPasswordStrengthColor = () => {
    switch (passwordStrength) {
      case 'weak': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'strong': return '#10B981';
      default: return '#D9CBC2';
    }
  };

  const getPasswordStrengthWidth = () => {
    switch (passwordStrength) {
      case 'weak': return '33%';
      case 'medium': return '66%';
      case 'strong': return '100%';
      default: return '0%';
    }
  };

  return (
    <div className="signup-page">
      <motion.div 
        className="signup-card"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div 
          className="signup-header"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h1>Create Your Account</h1>
          <p>Join ResilientRider and ride with confidence</p>
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

        <form onSubmit={handleSubmit} className="signup-form">
          <motion.div 
            className="form-group"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <label htmlFor="fullName">Full Name</label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              className={errors.fullName ? 'error' : ''}
              placeholder="John Doe"
            />
            {errors.fullName && (
              <motion.span 
                className="error-message"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {errors.fullName}
              </motion.span>
            )}
          </motion.div>

          <motion.div 
            className="form-row"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="form-group">
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
            </div>

            <div className="form-group">
              <label htmlFor="phoneNumber">Phone Number</label>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                className={errors.phoneNumber ? 'error' : ''}
                placeholder="+1 (555) 123-4567"
              />
              {errors.phoneNumber && (
                <motion.span 
                  className="error-message"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {errors.phoneNumber}
                </motion.span>
              )}
            </div>
          </motion.div>

          <motion.div 
            className="form-group"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={errors.password ? 'error' : ''}
              placeholder="At least 8 characters"
            />
            {formData.password && (
              <div className="password-strength">
                <div className="strength-bar">
                  <motion.div 
                    className="strength-fill"
                    initial={{ width: 0 }}
                    animate={{ 
                      width: getPasswordStrengthWidth(),
                      backgroundColor: getPasswordStrengthColor()
                    }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <span className="strength-text" style={{ color: getPasswordStrengthColor() }}>
                  {passwordStrength && `Password strength: ${passwordStrength}`}
                </span>
              </div>
            )}
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
            transition={{ delay: 0.6 }}
          >
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={errors.confirmPassword ? 'error' : ''}
              placeholder="Re-enter your password"
            />
            {formData.confirmPassword && formData.password === formData.confirmPassword && (
              <motion.span 
                className="success-message"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                ✓ Passwords match
              </motion.span>
            )}
            {errors.confirmPassword && (
              <motion.span 
                className="error-message"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {errors.confirmPassword}
              </motion.span>
            )}
          </motion.div>

          <motion.div 
            className="form-group"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
          >
            <label>Sign Up As</label>
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
                    <small>Gig Worker / Delivery Rider</small>
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
            className="terms-agreement"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <p>
              By signing up, you agree to our{' '}
              <Link to="/terms">Terms of Service</Link> and{' '}
              <Link to="/privacy">Privacy Policy</Link>
            </p>
          </motion.div>

          <motion.button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={isLoading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            {isLoading ? (
              <span className="loading-spinner">
                <span className="spinner"></span>
                Creating account...
              </span>
            ) : (
              'Create Account'
            )}
          </motion.button>

          <motion.div 
            className="login-prompt"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.0 }}
          >
            <p>
              Already have an account?{' '}
              <Link to="/login" className="login-link">
                Sign in
              </Link>
            </p>
          </motion.div>
        </form>
      </motion.div>

      <div className="signup-background">
        <div className="bg-shape shape-1"></div>
        <div className="bg-shape shape-2"></div>
        <div className="bg-shape shape-3"></div>
      </div>
    </div>
  );
}

export default Signup;
