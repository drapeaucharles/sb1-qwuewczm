import React, { useState, useEffect } from 'react';
import { RestaurantForm } from '../../components/Forms/RestaurantForm';
import { useAuth } from '../../contexts/AuthContext';
import { ApiService } from '../../services/api';
import { Restaurant } from '../../types/restaurant';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { transformFormDataToProfile } from '../../utils/restaurantUtils';

export const OwnerEditRestaurant: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadRestaurant();
  }, []);

  const loadRestaurant = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Use the new profile endpoint for authenticated users
      const data = await ApiService.getRestaurantProfile();
      console.log('Loaded restaurant profile:', data);
      setRestaurant(data);
    } catch (error) {
      console.error('Error loading restaurant profile:', error);
      setError(error instanceof Error ? error.message : 'Failed to load restaurant data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      console.log('Submitting restaurant profile update:', data);
      
      // Transform form data to profile API format
      const profileData = transformFormDataToProfile(data);
      
      // Use the new profile update endpoint
      await ApiService.updateRestaurantProfile(profileData);
      
      console.log('Restaurant profile updated successfully');
    } catch (error) {
      console.error('Failed to update restaurant profile:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => navigate('/owner')}
            className="flex items-center text-slate-600 hover:text-slate-800 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-slate-800">Edit Restaurant</h1>
          <p className="text-slate-600 mt-2">Update your restaurant information and AI assistant data</p>
        </div>
        
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full w-8 h-8 border-b-2 border-blue-500 mr-3"></div>
            <span className="text-slate-600">Loading restaurant data...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => navigate('/owner')}
            className="flex items-center text-slate-600 hover:text-slate-800 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-slate-800">Edit Restaurant</h1>
          <p className="text-slate-600 mt-2">Update your restaurant information and AI assistant data</p>
        </div>
        
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">Failed to Load Restaurant</h2>
          <p className="text-slate-600 mb-6">{error}</p>
          <div className="space-x-4">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate('/owner')}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => navigate('/owner')}
            className="flex items-center text-slate-600 hover:text-slate-800 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-slate-800">Edit Restaurant</h1>
          <p className="text-slate-600 mt-2">Update your restaurant information and AI assistant data</p>
        </div>
        
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-slate-400" />
          </div>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">Restaurant Not Found</h2>
          <p className="text-slate-600 mb-6">
            Unable to load restaurant information for your account.
          </p>
          <p className="text-sm text-slate-500">
            Restaurant ID: {user?.restaurant_id || 'Not available'}
          </p>
          <button
            onClick={() => navigate('/owner')}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <RestaurantForm
      restaurant={restaurant}
      onSubmit={handleSubmit}
      isEditing={true}
      isOwnerEdit={true}
    />
  );
};