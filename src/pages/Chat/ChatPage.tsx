import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChatLayout } from '../../components/Layout/ChatLayout';
import { ChatInterface } from '../../components/Chat/ChatInterface';
import { LiveApiService } from '../../services/liveApi';

export const ChatPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const restaurantId = searchParams.get('restaurant_id');
  const tableId = searchParams.get('table_id');
  const [restaurantName, setRestaurantName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const loadRestaurantInfo = async () => {
      if (restaurantId) {
        try {
          // Try to get restaurant info from the live API
          const restaurantInfo = await LiveApiService.getRestaurantInfo(restaurantId);
          if (restaurantInfo && restaurantInfo.data?.name) {
            setRestaurantName(restaurantInfo.data.name);
          } else if (restaurantInfo && restaurantInfo.name) {
            setRestaurantName(restaurantInfo.name);
          } else {
            // Fallback to a generic name if API doesn't provide restaurant info
            setRestaurantName('Restaurant');
          }
        } catch (error) {
          console.error('Error loading restaurant info:', error);
          setRestaurantName('Restaurant');
        }
      }
      setLoading(false);
    };

    // Validate required parameters
    if (!restaurantId || !tableId) {
      setError('Missing required parameters');
      setLoading(false);
      return;
    }

    loadRestaurantInfo();
  }, [restaurantId, tableId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="animate-spin rounded-full w-8 h-8 border-b-2 border-blue-500"></div>
          </div>
          <h1 className="text-xl font-bold text-slate-800 mb-2">Loading...</h1>
          <p className="text-slate-600">Setting up your chat experience</p>
        </div>
      </div>
    );
  }

  if (error || !restaurantId || !tableId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">❌</span>
          </div>
          <h1 className="text-xl font-bold text-slate-800 mb-2">Invalid Chat Link</h1>
          <p className="text-slate-600 mb-4">
            This chat link is missing required parameters. Please make sure you're using a valid QR code or link provided by the restaurant.
          </p>
          <div className="mt-4 p-3 bg-slate-50 rounded-lg text-left">
            <p className="text-sm text-slate-600 font-mono mb-1">
              Expected: /chat?restaurant_id=xxx&table_id=xxx
            </p>
            <p className="text-sm text-slate-600 font-mono">
              Current: {window.location.pathname + window.location.search}
            </p>
          </div>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>Test URL:</strong><br />
              <a 
                href="/chat?restaurant_id=demo&table_id=1"
                className="underline hover:text-blue-900"
              >
                /chat?restaurant_id=demo&table_id=1
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ChatLayout restaurantName={restaurantName}>
      <ChatInterface
        restaurantId={restaurantId}
        tableId={tableId}
      />
    </ChatLayout>
  );
};