import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Edit, Trash2, Plus, Store, ExternalLink } from 'lucide-react';
import { ApiService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

export const RestaurantList: React.FC = () => {
  const { user } = useAuth();
  const [restaurants, setRestaurants] = useState<{ restaurant_id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    loadRestaurants();
  }, []);

  const loadRestaurants = async () => {
    try {
      const response = await ApiService.listRestaurants();
      // Handle both array response and object with restaurants property
      setRestaurants(Array.isArray(response) ? response : response.restaurants || []);
    } catch (error) {
      console.error('Error loading restaurants:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (restaurantId: string) => {
    if (!isAdmin) {
      alert('Only admins can delete restaurants');
      return;
    }

    if (!confirm('Are you sure you want to delete this restaurant?')) return;
    
    setDeleting(restaurantId);
    try {
      await ApiService.deleteRestaurant(restaurantId);
      setRestaurants(restaurants.filter(r => r.restaurant_id !== restaurantId));
    } catch (error) {
      console.error('Error deleting restaurant:', error);
    } finally {
      setDeleting(null);
    }
  };

  const generateChatLink = (restaurantId: string) => {
    return `/chat?restaurant_id=${restaurantId}&table_id=1`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full w-8 h-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">All Restaurants</h1>
          <p className="text-slate-600">Manage your restaurant AI assistants</p>
        </div>
        {isAdmin && (
          <Link
            to="/admin/create"
            className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Restaurant
          </Link>
        )}
      </div>

      {restaurants.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
          <Store className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-800 mb-2">No restaurants yet</h3>
          <p className="text-slate-600 mb-6">
            {isAdmin 
              ? 'Get started by adding your first restaurant to the platform.'
              : 'No restaurants are currently available.'
            }
          </p>
          {isAdmin && (
            <Link
              to="/admin/create"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Your First Restaurant
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-800">
                    Restaurant
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-800">
                    Restaurant ID
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-800">
                    Chat Link
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-slate-800">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {restaurants.map((restaurant) => (
                  <tr key={restaurant.restaurant_id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mr-4">
                          <Store className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-medium text-slate-800">{restaurant.name}</h3>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600 font-mono bg-slate-100 px-2 py-1 rounded">
                        {restaurant.restaurant_id}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        to={generateChatLink(restaurant.restaurant_id)}
                        className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        Open Chat
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end space-x-2">
                        {isAdmin && (
                          <>
                            <Link
                              to={`/admin/edit/${restaurant.restaurant_id}`}
                              className="flex items-center px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Edit
                            </Link>
                            <button
                              onClick={() => handleDelete(restaurant.restaurant_id)}
                              disabled={deleting === restaurant.restaurant_id}
                              className="flex items-center px-3 py-2 text-sm bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              {deleting === restaurant.restaurant_id ? 'Deleting...' : 'Delete'}
                            </button>
                          </>
                        )}
                        {!isAdmin && (
                          <span className="text-sm text-slate-500">View Only</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};