import React from 'react';
import { MessageCircle, Utensils } from 'lucide-react';

interface ChatLayoutProps {
  children: React.ReactNode;
  restaurantName?: string;
}

export const ChatLayout: React.FC<ChatLayoutProps> = ({ children, restaurantName }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-10 safe-area-inset-top">
        <div className="px-4 py-3">
          <div className="flex items-center justify-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Utensils className="w-5 h-5 text-white" />
            </div>
            <div className="text-center">
              <h1 className="text-lg font-bold text-slate-800 truncate max-w-[200px]">
                {restaurantName || 'Restaurant AI Assistant'}
              </h1>
              <p className="text-sm text-slate-500">Ask me about our menu!</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col min-h-0">
        {children}
      </div>
    </div>
  );
};