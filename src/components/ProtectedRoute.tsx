import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { user, isAuthenticated, isAuthLoading } = useAuth();
  const location = useLocation();

  // Show loading spinner while authentication is being restored
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="animate-spin rounded-full w-8 h-8 border-b-2 border-blue-500"></div>
          </div>
          <h1 className="text-xl font-bold text-slate-800 mb-2">Loading...</h1>
          <p className="text-slate-600">Restoring your session</p>
        </div>
      </div>
    );
  }

  // Only check authentication after loading is complete
  if (!isAuthenticated || !user) {
    // Store the attempted location for redirect after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access if required
  if (requiredRole && user.role !== requiredRole) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🚫</span>
          </div>
          <h1 className="text-xl font-bold text-slate-800 mb-2">Access Denied</h1>
          <p className="text-slate-600 mb-4">
            You don't have permission to access this page.
          </p>
          <p className="text-sm text-slate-500">
            Required role: <span className="font-mono bg-slate-100 px-2 py-1 rounded">{requiredRole}</span>
          </p>
          <p className="text-sm text-slate-500">
            Your role: <span className="font-mono bg-slate-100 px-2 py-1 rounded">{user.role}</span>
          </p>
          <div className="mt-4 space-x-2">
            <button
              onClick={() => window.history.back()}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Go Back
            </button>
            <a
              href={user.role === 'admin' ? '/admin' : '/owner'}
              className="inline-block px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
            >
              Go to Dashboard
            </a>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};