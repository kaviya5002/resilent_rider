import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function AdminRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <span style={{ opacity: 0.5, fontSize: '1rem' }}>Loading...</span>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (user.role !== 'admin') return <Navigate to="/user-dashboard" replace />;

  return children;
}

export default AdminRoute;
