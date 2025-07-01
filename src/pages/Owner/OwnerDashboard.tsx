import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Edit, MessageSquare, TrendingUp, Users, ExternalLink, UserPlus, MessageCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ApiService } from '../../services/api';
import { WhatsAppIntegration } from '../../components/WhatsApp/WhatsAppIntegration';

export const OwnerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [restaurant, setRestaurant] = useState<{ restaurant_id: string; name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'whatsapp'>('overview');

  const isOwner = user?.role === 'owner';

  useEffect(() => {
    loadRestaurantInfo();
  }, []);

  const loadRestaurantInfo = async () => {
    try {
      if (user?.restaurant_id) {
        const response = await ApiService.listRestaurants();
        // Handle both array response and object with restaurants property
        const restaurantsList = Array.isArray(response) ? response : response.restaurants || [];
        const restaurantData = restaurantsList.find(r => r.restaurant_id === user.restaurant_id);
        setRestaurant(restaurantData || null);
      }
    } catch (error) {
      console.error('Error loading restaurant info:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateChatLink = () => {
    if (!user?.restaurant_id) return '#';
    return `/chat?restaurant_id=${user.restaurant_id}&table_id=1`;
  };

  const stats = [
    {
      name: 'Today\'s Chats',
      value: '12',
      icon: MessageSquare,
      color: 'from-blue-500 to-blue-600',
    },
    {
      name: 'Active Tables',
      value: '8',
      icon: Users,
      color: 'from-green-500 to-green-600',
    },
    {
      name: 'Response Rate',
      value: '98%',
      icon: TrendingUp,
      color: 'from-purple-500 to-purple-600',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full w-8 h-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">
          Welcome back!
        </h1>
        <p className="text-slate-600">
          {restaurant ? `Managing ${restaurant.name}` : 'Restaurant Dashboard'} 
          {!isOwner && ' (Staff Access)'}
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-8">
        <div className="border-b border-slate-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              Overview
            </button>
            {isOwner && (
              <button
                onClick={() => setActiveTab('whatsapp')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors flex items-center ${
                  activeTab === 'whatsapp'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                WhatsApp Integration
              </button>
            )}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {stats.map((stat) => (
              <div key={stat.name} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">{stat.name}</p>
                    <p className="text-2xl font-bold text-slate-800 mt-1">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-xl flex items-center justify-center`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                {/* Edit Restaurant - Owner Only */}
                {isOwner && (
                  <Link
                    to="/owner/edit"
                    className="flex items-center p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl hover:from-blue-100 hover:to-purple-100 transition-all duration-200 group"
                  >
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mr-4">
                      <Edit className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-800 group-hover:text-slate-900">
                        Edit Restaurant Info
                      </h3>
                      <p className="text-sm text-slate-600">Update menu, hours, and details</p>
                    </div>
                  </Link>
                )}
                
                {/* Customer Conversations - Available to all */}
                <Link
                  to="/owner/chat"
                  className="flex items-center p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl hover:from-green-100 hover:to-blue-100 transition-all duration-200 group"
                >
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-600 rounded-xl flex items-center justify-center mr-4">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-800 group-hover:text-slate-900">
                      Customer Conversations
                    </h3>
                    <p className="text-sm text-slate-600">View grouped customer chats</p>
                  </div>
                </Link>
                
                {/* Chat Logs (Old) - Available to all */}
                <Link
                  to="/owner/logs"
                  className="flex items-center p-4 bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl hover:from-slate-100 hover:to-gray-100 transition-all duration-200 group"
                >
                  <div className="w-10 h-10 bg-gradient-to-r from-slate-500 to-gray-600 rounded-xl flex items-center justify-center mr-4">
                    <MessageSquare className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-800 group-hover:text-slate-900">
                      Chat Logs (Old)
                    </h3>
                    <p className="text-sm text-slate-600">Legacy chat log view</p>
                  </div>
                </Link>

                {/* Create Staff - Owner Only */}
                {isOwner && (
                  <Link
                    to="/owner/create-staff"
                    className="flex items-center p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl hover:from-purple-100 hover:to-pink-100 transition-all duration-200 group"
                  >
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mr-4">
                      <UserPlus className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-800 group-hover:text-slate-900">
                        Create Staff Account
                      </h3>
                      <p className="text-sm text-slate-600">Add new staff members</p>
                    </div>
                  </Link>
                )}

                {/* WhatsApp Integration Quick Link - Owner Only */}
                {isOwner && (
                  <button
                    onClick={() => setActiveTab('whatsapp')}
                    className="flex items-center w-full p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl hover:from-green-100 hover:to-emerald-100 transition-all duration-200 group"
                  >
                    <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mr-4">
                      <MessageCircle className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-medium text-slate-800 group-hover:text-slate-900">
                        WhatsApp Integration
                      </h3>
                      <p className="text-sm text-slate-600">Connect your WhatsApp Business</p>
                    </div>
                  </button>
                )}

                {/* Test Chat Interface - Available to all */}
                <a
                  href={generateChatLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl hover:from-orange-100 hover:to-red-100 transition-all duration-200 group"
                >
                  <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl flex items-center justify-center mr-4">
                    <ExternalLink className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-800 group-hover:text-slate-900">
                      Test Chat Interface
                    </h3>
                    <p className="text-sm text-slate-600">Preview customer experience</p>
                  </div>
                </a>
              </div>
            </div>

            {/* Restaurant Info */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">Restaurant Info</h2>
              {restaurant ? (
                <div className="space-y-4">
                  <div className="flex items-center p-4 bg-slate-50 rounded-xl">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-600 rounded-xl flex items-center justify-center mr-4">
                      <span className="text-white font-bold text-lg">
                        {restaurant.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-800">{restaurant.name}</h3>
                      <p className="text-sm text-slate-600">ID: {restaurant.restaurant_id}</p>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-blue-50 rounded-xl">
                    <h4 className="font-medium text-slate-800 mb-2">QR Code Link</h4>
                    <p className="text-sm text-slate-600 font-mono break-all">
                      {window.location.origin}{generateChatLink()}
                    </p>
                  </div>

                  {/* Role-based access notice */}
                  {!isOwner && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                      <h4 className="font-medium text-yellow-800 mb-1">Staff Access</h4>
                      <p className="text-sm text-yellow-700">
                        You have staff-level access. Contact the owner to modify restaurant settings.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-slate-600">Restaurant information not found</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* WhatsApp Integration Tab */}
      {activeTab === 'whatsapp' && isOwner && (
        <div className="max-w-4xl">
          <WhatsAppIntegration />
        </div>
      )}
    </div>
  );
};