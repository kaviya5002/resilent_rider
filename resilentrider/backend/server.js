require('dotenv').config();
const http    = require('http');
const express = require('express');
const cors    = require('cors');
const { Server } = require('socket.io');
const connectDB = require('./config/db');

// Route imports
const authRoutes          = require('./routes/authRoutes');
const riderRoutes         = require('./routes/riderRoutes');
const adminRoutes         = require('./routes/adminRoutes');
const insuranceRoutes     = require('./routes/insuranceRoutes');
const loanRoutes          = require('./routes/loanRoutes');
const aiRoutes            = require('./routes/aiRoutes');
const earningsRoutes      = require('./routes/earningsRoutes');
const claimsRoutes        = require('./routes/claimsRoutes');
const registrationRoutes  = require('./modules/registration-intelligence/registrationRoutes');
const policyRoutes        = require('./modules/policy-engine/policyRoutes');
const pricingRoutes       = require('./modules/pricing-engine/pricingRoutes');
const claimsIntelligenceRoutes = require('./modules/claims-intelligence/claimsRoutes');
const automationRoutes    = require('./modules/automation-engine/automationRoutes');
const profileRoutes       = require('./modules/profile-settings/profileRoutes');
const advancedPolicyRoutes = require('./modules/advanced-policy-intelligence/advancedPolicyRoutes');
const locationRoutes      = require('./modules/location-tracking/locationRoutes');
const weatherRoutes       = require('./modules/weather-intelligence/weatherRoutes');
const paymentRoutes       = require('./modules/payment/paymentRoutes');
const notificationRoutes  = require('./modules/notifications/notificationRoutes');

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  process.env.FRONTEND_URL || 'https://your-netlify-app.netlify.app',
];

const app    = express();
const server = http.createServer(app);

// ─── Socket.IO ────────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: { origin: ALLOWED_ORIGINS, methods: ['GET', 'POST'], credentials: true },
});

// Make io accessible in all route handlers via req.app.get('io')
app.set('io', io);

io.on('connection', (socket) => {
  // Client sends { userId } to join their private room
  // Room name is the plain userId string — matches createAndEmit
  socket.on('join', ({ userId }) => {
    if (userId) {
      socket.join(String(userId));
      console.log(`🔌 [Socket] User ${userId} joined room ${userId}`);
    }
  });

  socket.on('disconnect', () => {
    console.log(`🔌 [Socket] Client disconnected: ${socket.id}`);
  });
});

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({ origin: ALLOWED_ORIGINS, credentials: true }));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: false }));

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth',                  authRoutes);
app.use('/api/rider',                 riderRoutes);
app.use('/api/admin',                 adminRoutes);
app.use('/api/insurance',             insuranceRoutes);
app.use('/api/loans',                 loanRoutes);
app.use('/api/ai',                    aiRoutes);
app.use('/api/earnings',              earningsRoutes);
app.use('/api/claims',                claimsRoutes);
app.use('/api/registration',          registrationRoutes);
app.use('/api/policy',                policyRoutes);
app.use('/api/pricing',               pricingRoutes);
app.use('/api/claims-intelligence',   claimsIntelligenceRoutes);
app.use('/api/automation',            automationRoutes);
app.use('/api',                       profileRoutes);
app.use('/api/policy',                advancedPolicyRoutes);
app.use('/api/location',              locationRoutes);
app.use('/api/weather',               weatherRoutes);
app.use('/api/payment',               paymentRoutes);
app.use('/api/notifications',         notificationRoutes);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/', (req, res) => res.status(200).json({ success: true, message: '🚀 ResilientRider API is running' }));
app.get('/api/health', (req, res) => res.status(200).json({ success: true, message: '🚀 ResilientRider API is running', environment: process.env.NODE_ENV }));

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` }));

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: err.message || 'Internal Server Error' });
});

// ─── Connect DB then Start Server ─────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📡 Environment: ${process.env.NODE_ENV}`);
    console.log(`🔌 Socket.IO ready`);
  });
};

startServer();
