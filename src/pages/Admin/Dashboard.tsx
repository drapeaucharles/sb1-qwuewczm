import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, Users, MessageSquare, TrendingUp, Store, RefreshCw } from 'lucide-react';
import { ApiService } from '../../services/api';

interface DashboardStats {
  totalRestaurants: number;
  activeChats: number;
  customerInteractions: number;
  growthRate: string;
}

export const AdminDashboard: React.FC = () => {
  const [restaurants, setRestaurants] = useState<{ restaurant_id: string; name: string }[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalRestaurants: 0,
    activeChats: 0,
    customerInteractions: 0,
    growthRate: '+0%',
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load restaurants and stats in parallel
      const [restaurantsResponse, statsResponse] = await Promise.all([
        ApiService.listRestaurants(),
        ApiService.getDashboardStats().catch(() => null), // Don't fail if stats endpoint doesn't exist
      ]);
      
      // Handle both array response and object with restaurants property
      const restaurantsList = Array.isArray(restaurantsResponse) 
        ? restaurantsResponse 
        : restaurantsResponse.restaurants || [];
      
      setRestaurants(restaurantsList);
      
      // Use stats from API if available, otherwise calculate from restaurant data
      if (statsResponse) {
        setStats(statsResponse);
      } else {
        setStats({
          totalRestaurants: restaurantsList.length,
          activeChats: 0, // Will show 0 until backend provides this
          customerInteractions: 0, // Will show 0 until backend provides this
          growthRate: '+0%', // Will show 0% until backend provides this
        });
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Set empty state on error
      setRestaurants([]);
      setStats({
        totalRestaurants: 0,
        activeChats: 0,
        customerInteractions: 0,
        growthRate: '+0%',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const statsConfig = [
    {
      name: 'Total Restaurants',
      value: stats.totalRestaurants.toString(),
      icon: Store,
      color: 'from-blue-500 to-blue-600',
    },
    {
      name: 'Active Chats',
      value: stats.activeChats.toString(),
      icon: MessageSquare,
      color: 'from-green-500 to-green-600',
      note: stats.activeChats === 0 ? 'Live data coming soon' : undefined,
    },
    {
      name: 'Customer Interactions',
      value: stats.customerInteractions > 0 ? stats.customerInteractions.toLocaleString() : '0',
      icon: Users,
      color: 'from-purple-500 to-purple-600',
      note: stats.customerInteractions === 0 ? 'Live data coming soon' : undefined,
    },
    {
      name: 'Growth Rate',
      value: stats.growthRate,
      icon: TrendingUp,
      color: 'from-orange-500 to-orange-600',
      note: stats.growthRate === '+0%' ? 'Live data coming soon' : undefined,
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Dashboard</h1>
          <p className="text-slate-600">Manage your restaurant AI assistant platform</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsConfig.map((stat) => (
          <div key={stat.name} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">{stat.name}</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">{stat.value}</p>
                {stat.note && (
                  <p className="text-xs text-slate-400 mt-1">{stat.note}</p>
                )}
              </div>
              <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-xl flex items-center justify-center`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="animate-pulse">
              <div className="h-6 bg-slate-200 rounded w-1/3 mb-4"></div>
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-slate-100 rounded-xl"></div>
                ))}
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="animate-pulse">
              <div className="h-6 bg-slate-200 rounded w-1/3 mb-4"></div>
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-12 bg-slate-100 rounded-xl"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Quick Actions and Recent Restaurants */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link
                to="/admin/create"
                className="flex items-center p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl hover:from-blue-100 hover:to-purple-100 transition-all duration-200 group"
              >
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mr-4">
                  <PlusCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-medium text-slate-800 group-hover:text-slate-900">
                    Add New Restaurant
                  </h3>
                  <p className="text-sm text-slate-600">Set up AI assistant for a new restaurant</p>
                </div>
              </Link>
              
              <Link
                to="/admin/restaurants"
                className="flex items-center p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl hover:from-green-100 hover:to-blue-100 transition-all duration-200 group"
              >
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-600 rounded-xl flex items-center justify-center mr-4">
                  <Store className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-medium text-slate-800 group-hover:text-slate-900">
                    Manage Restaurants
                  </h3>
                  <p className="text-sm text-slate-600">Edit, update, or remove existing restaurants</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Recent Restaurants */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">Recent Restaurants</h2>
            {restaurants.length > 0 ? (
              <div className="space-y-3">
                {restaurants.slice(0, 5).map((restaurant) => (
                  <div
                    key={restaurant.restaurant_id}
                    className="flex items-center p-3 bg-slate-50 rounded-xl"
                  >
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                      <Store className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-slate-800">{restaurant.name}</h3>
                      <p className="text-sm text-slate-600">ID: {restaurant.restaurant_id}</p>
                    </div>
                    <Link
                      to={`/admin/edit/${restaurant.restaurant_id}`}
                      className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      Edit
                    </Link>
                  </div>
                ))}
                {restaurants.length > 5 && (
                  <Link
                    to="/admin/restaurants"
                    className="block text-center text-sm text-blue-600 hover:text-blue-800 transition-colors pt-2"
                  >
                    View all {restaurants.length} restaurants →
                  </Link>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Store className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-600 mb-2">No restaurants added yet</p>
                <Link
                  to="/admin/create"
                  className="text-blue-500 hover:text-blue-600 font-medium text-sm"
                >
                  Add your first restaurant
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};