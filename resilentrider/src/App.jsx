import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import HowItWorks from './pages/HowItWorks';
import AITechnology from './pages/AITechnology';
import Benefits from './pages/Benefits';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Signup from './pages/Signup';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import EarningsCalendar from './pages/EarningsCalendar';
import UserProfile from './pages/UserProfile';
import AdminProfile from './pages/AdminProfile';
import AIChatbot from './components/AIChatbot';
import ParticleBackground from './components/ParticleBackground';
import ScrollToTop from './components/ScrollToTop';
import NotificationToast from './components/NotificationToast';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import { useAuth } from './context/AuthContext';

// Redirects logged-in users away from public pages to their dashboard
function PublicOnlyRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (user) {
    return <Navigate to={user.role === 'admin' ? '/admin-dashboard' : '/user-dashboard'} replace />;
  }

  return children;
}

function AppRoutes() {
  return (
    <AnimatePresence mode="wait">
      <Routes>
        <Route path="/" element={<MainLayout />}>

          {/* ── Public pages — redirect to dashboard if logged in ── */}
          <Route index element={<PublicOnlyRoute><Home /></PublicOnlyRoute>} />
          <Route path="how-it-works" element={<PublicOnlyRoute><HowItWorks /></PublicOnlyRoute>} />
          <Route path="ai-technology" element={<PublicOnlyRoute><AITechnology /></PublicOnlyRoute>} />
          <Route path="benefits"      element={<PublicOnlyRoute><Benefits /></PublicOnlyRoute>} />
          <Route path="contact"       element={<PublicOnlyRoute><Contact /></PublicOnlyRoute>} />
          <Route path="login"         element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
          <Route path="signup"        element={<PublicOnlyRoute><Signup /></PublicOnlyRoute>} />

          {/* ── Rider protected routes ── */}
          <Route path="user-dashboard" element={<ProtectedRoute role="rider"><UserDashboard /></ProtectedRoute>} />
          <Route path="earnings-calendar" element={<ProtectedRoute role="rider"><EarningsCalendar /></ProtectedRoute>} />
          <Route path="user-profile"   element={<ProtectedRoute role="rider"><UserProfile /></ProtectedRoute>} />

          {/* ── Admin protected routes ── */}
          <Route path="admin-dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="admin-profile"   element={<AdminRoute><AdminProfile /></AdminRoute>} />

          {/* ── Fallback ── */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Route>
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <ParticleBackground />
          <ScrollToTop />
          <AppRoutes />
          <AIChatbot />
          <NotificationToast />
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
