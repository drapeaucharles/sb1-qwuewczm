import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Edit, MessageSquare, LogOut, Utensils, User, Users, MessageCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface RestaurantOwnerLayoutProps {
  children: React.ReactNode;
}

export const RestaurantOwnerLayout: React.FC<RestaurantOwnerLayoutProps> = ({ children }) => {
  const location = useLocation();
  const { logout, user } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/owner', icon: Home },
    { name: 'Edit Restaurant', href: '/owner/edit', icon: Edit, roleRequired: 'owner' },
    { name: 'Chat Logs (Old)', href: '/owner/logs', icon: MessageSquare },
    { name: 'Conversations', href: '/owner/chat', icon: Users },
  ];

  const handleLogout = () => {
    logout();
  };

  // Filter navigation based on user role
  const filteredNavigation = navigation.filter(item => 
    !item.roleRequired || user?.role === item.roleRequired
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-xl border-r border-slate-200">
          <div className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Utensils className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">Restaurant Panel</h1>
                <p className="text-sm text-slate-500">
                  {user?.role === 'owner' ? 'Owner Dashboard' : 'Staff Dashboard'}
                </p>
              </div>
            </div>
          </div>
          
          <nav className="px-3 pb-6">
            {filteredNavigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-4 py-3 mb-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-green-500 to-blue-600 text-white shadow-lg'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                  }`}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}
            
            <div className="mt-8 pt-4 border-t border-slate-200">
              {/* User info */}
              <div className="flex items-center px-4 py-2 mb-2 text-sm text-slate-600">
                <User className="w-4 h-4 mr-2" />
                <div>
                  <p className="font-medium">{user?.email || 'User'}</p>
                  <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
                </div>
              </div>
              
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 rounded-xl transition-all duration-200"
              >
                <LogOut className="w-5 h-5 mr-3" />
                Sign Out
              </button>
            </div>
          </nav>
        </div>

        {/* Main content */}
        <div className="flex-1">
          <div className="p-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};