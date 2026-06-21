const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT and attach user to request
const protect = (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ success: false, message: 'Not authorized, token invalid' });
  }

  User.findById(decoded.id).select('-password')
    .then((user) => {
      if (!user) {
        return res.status(401).json({ success: false, message: 'User not found' });
      }
      req.user = user;
      next();
    })
    .catch(() => res.status(500).json({ success: false, message: 'Server error' }));
};

// Restrict to admin role only
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ success: false, message: 'Access denied. Admins only.' });
};

module.exports = { protect, adminOnly };
