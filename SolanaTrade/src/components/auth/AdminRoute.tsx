import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface AdminRouteProps {
  children: ReactNode;
}

// Wrapper component that will only allow access to admin users
export function AdminRoute({ children }: AdminRouteProps) {
  const { isAuthenticated, isAdmin } = useAuth();
  
  // If user is not authenticated, redirect to login page
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // If user is authenticated but not an admin, redirect to dashboard
  if (isAuthenticated && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  
  // If user is an admin, render the protected content
  return <>{children}</>;
} 