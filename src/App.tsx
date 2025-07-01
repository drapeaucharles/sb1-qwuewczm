import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Layouts
import { AdminLayout } from './components/Layout/AdminLayout';
import { RestaurantOwnerLayout } from './components/Layout/RestaurantOwnerLayout';

// Admin Pages
import { AdminDashboard } from './pages/Admin/Dashboard';
import { CreateRestaurant } from './pages/Admin/CreateRestaurant';
import { EditRestaurant } from './pages/Admin/EditRestaurant';
import { RestaurantList } from './pages/Admin/RestaurantList';

// Auth Pages
import { LoginPage } from './pages/Auth/LoginPage';

// Owner Pages
import { OwnerDashboard } from './pages/Owner/OwnerDashboard';
import { OwnerEditRestaurant } from './pages/Owner/OwnerEditRestaurant';
import { ChatLogs } from './pages/Owner/ChatLogs';
import { GroupedChatLogs } from './pages/Owner/GroupedChatLogs';
import { CreateStaff } from './pages/Owner/CreateStaff';

// Public Pages
import { ChatPage } from './pages/Chat/ChatPage';

// Components
import { ProtectedRoute } from './components/ProtectedRoute';

function AppRoutes() {
  return (
    <Routes>
      {/* PUBLIC ROUTES - No authentication required */}
      <Route path="/chat" element={<ChatPage />} />
      <Route path="/menu" element={<div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4"><div className="bg-white rounded-2xl shadow-xl p-8 text-center"><h1 className="text-2xl font-bold text-slate-800 mb-2">Menu Page</h1><p className="text-slate-600">Coming Soon</p></div></div>} />
      <Route path="/order" element={<div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4"><div className="bg-white rounded-2xl shadow-xl p-8 text-center"><h1 className="text-2xl font-bold text-slate-800 mb-2">Order Page</h1><p className="text-slate-600">Coming Soon</p></div></div>} />
      
      {/* Auth Routes */}
      <Route path="/login" element={<LoginPage />} />
      
      {/* PROTECTED ROUTES - Authentication required */}
      
      {/* Admin Routes (Global SaaS Management) - Role-based protection */}
      <Route path="/admin" element={
        <ProtectedRoute requiredRole="admin">
          <AdminLayout>
            <AdminDashboard />
          </AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/create" element={
        <ProtectedRoute requiredRole="admin">
          <AdminLayout>
            <CreateRestaurant />
          </AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/edit/:id" element={
        <ProtectedRoute requiredRole="admin">
          <AdminLayout>
            <EditRestaurant />
          </AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/restaurants" element={
        <ProtectedRoute requiredRole="admin">
          <AdminLayout>
            <RestaurantList />
          </AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/chat" element={
        <ProtectedRoute requiredRole="admin">
          <AdminLayout>
            <GroupedChatLogs />
          </AdminLayout>
        </ProtectedRoute>
      } />
      
      {/* Restaurant Owner Routes (Protected) - Owner and Staff access */}
      <Route path="/owner" element={
        <ProtectedRoute>
          <RestaurantOwnerLayout>
            <OwnerDashboard />
          </RestaurantOwnerLayout>
        </ProtectedRoute>
      } />
      <Route path="/owner/edit" element={
        <ProtectedRoute requiredRole="owner">
          <RestaurantOwnerLayout>
            <OwnerEditRestaurant />
          </RestaurantOwnerLayout>
        </ProtectedRoute>
      } />
      <Route path="/owner/logs" element={
        <ProtectedRoute>
          <RestaurantOwnerLayout>
            <ChatLogs />
          </RestaurantOwnerLayout>
        </ProtectedRoute>
      } />
      <Route path="/owner/chat" element={
        <ProtectedRoute>
          <RestaurantOwnerLayout>
            <GroupedChatLogs />
          </RestaurantOwnerLayout>
        </ProtectedRoute>
      } />
      <Route path="/owner/create-staff" element={
        <ProtectedRoute requiredRole="owner">
          <RestaurantOwnerLayout>
            <CreateStaff />
          </RestaurantOwnerLayout>
        </ProtectedRoute>
      } />
      
      {/* Default redirect - only redirect to login if not on a public route */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      
      {/* Catch-all route for 404 */}
      <Route path="*" element={
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">❌</span>
            </div>
            <h1 className="text-xl font-bold text-slate-800 mb-2">Page Not Found</h1>
            <p className="text-slate-600 mb-4">
              The page you're looking for doesn't exist.
            </p>
            <div className="space-y-2">
              <a
                href="/chat?restaurant_id=demo&table_id=1"
                className="block px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
              >
                Try Demo Chat
              </a>
              <a
                href="/login"
                className="block px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
              >
                Restaurant Login
              </a>
            </div>
          </div>
        </div>
      } />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;