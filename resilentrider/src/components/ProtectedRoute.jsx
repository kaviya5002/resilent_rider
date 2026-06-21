import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute
 * @param {string}  role      - 'rider' | 'admin' — required role for this route
 * @param {ReactNode} children
 */
function ProtectedRoute({ role, children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <span style={{ opacity: 0.5, fontSize: '1rem' }}>Loading...</span>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (role && user.role !== role) {
    return <Navigate to={user.role === 'admin' ? '/admin-dashboard' : '/user-dashboard'} replace />;
  }

  return children;
}

export default ProtectedRoute;
