import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children, requireAuth = true, userType = null }) => {
  const { user, isLoading } = useAuth();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If authentication is required but user is not authenticated
  if (requireAuth && !user) {
    return <Navigate to="/login" replace />;
  }

  // If authentication is NOT required but user IS authenticated, redirect to appropriate dashboard
  if (!requireAuth && user) {
    if (user.userType === 'farmer') {
      return <Navigate to="/dashboard" replace />;
    } else if (user.userType === 'government') {
      return <Navigate to="/government-dashboard" replace />;
    }
  }

  // If specific user type is required, check user type
  if (userType && user?.userType !== userType) {
    // Redirect to appropriate dashboard based on user type
    if (user?.userType === 'farmer') {
      return <Navigate to="/dashboard" replace />;
    } else if (user?.userType === 'government') {
      return <Navigate to="/government-dashboard" replace />;
    }
    // If no user type, redirect to login
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;