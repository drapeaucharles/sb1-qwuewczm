import React, { useState, useEffect } from 'react';
import { MessageSquare, Clock, User, Bot, RefreshCw, Power, PowerOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ApiService } from '../../services/api';
import { ChatLog } from '../../types/auth';

export const ChatLogs: React.FC = () => {
  console.log("✅ ChatLogs component mounted");
  const { user } = useAuth();
  const [logs, setLogs] = useState<ChatLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string>('');
  const [togglingAI, setTogglingAI] = useState<string>(''); // Track which client is being toggled

  // Debug log to track user state
  console.log("User in ChatLogs:", user);
  console.log("Logs state:", logs);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadChatLogs();
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const toggleAI = async (client_id: string, enabled: boolean) => {
    if (!user?.restaurant_id) return;
    
    setTogglingAI(client_id);
    
    try {
      await ApiService.toggleAI(user.restaurant_id, client_id, enabled);

      // Update UI immediately
      setLogs((prev) =>
        prev.map((log) =>
          log.client_id === client_id ? { ...log, ai_enabled: enabled } : log
        )
      );
    } catch (err) {
      console.error("Toggle AI failed", err);
      setError('Failed to toggle AI. Please try again.');
    } finally {
      setTogglingAI('');
    }
  };

  const loadChatLogs = async () => {
    if (!refreshing) setLoading(true);
    setError('');

    console.log("Loading chat logs for:", user.restaurant_id);

    try {
      const response = await ApiService.getChatLogs(user.restaurant_id);
      console.log("Chat logs response:", response);

      if (Array.isArray(response)) {
        setLogs(response);
      } else {
        setLogs([]);
        console.warn("Unexpected chat logs response:", response);
      }
    } catch (error) {
      console.error('Error loading chat logs:', error);
      setError(error instanceof Error ? error.message : 'Failed to load chat logs');
      setLogs([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    console.log("👀 useEffect triggered with user:", user);

    if (!user) {
      console.warn("⚠️ No user found. Skipping load.");
      return;
    }

    if (user.restaurant_id) {
      console.log("✅ Found restaurant_id:", user.restaurant_id);
      loadChatLogs();
    } else {
      console.error("❌ No restaurant ID in user");
      setLoading(false);
      setError('No restaurant ID found in user profile');
    }
  }, [user]);

  if (!user?.restaurant_id) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Chat Logs (Legacy)</h1>
          <p className="text-slate-600">Customer conversations with your AI assistant</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
          <MessageSquare className="w-16 h-16 text-red-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-800 mb-2">Unable to Load Chat Logs</h3>
          <p className="text-slate-600 mb-4">
            You're logged in but missing restaurant info. Please re-login or contact support.
          </p>
          <div className="text-sm text-slate-500 bg-slate-50 rounded-lg p-3">
            <p className="font-medium mb-2">Debug info:</p>
            <p>User exists: {user ? 'Yes' : 'No'}</p>
            <p>Restaurant ID: {user?.restaurant_id || 'Missing'}</p>
            <p>Role: {user?.role || 'Missing'}</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Chat Logs (Legacy)</h1>
          <p className="text-slate-600">Customer conversations with your AI assistant</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
          <div className="animate-spin rounded-full w-8 h-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading chat logs...</p>
          <p className="text-sm text-slate-500 mt-2">Restaurant: {user.restaurant_id}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Chat Logs (Legacy)</h1>
          <p className="text-slate-600">Customer conversations with your AI assistant</p>
          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-xl">
            <p className="text-sm text-blue-800">
              💡 <strong>New:</strong> Try the improved{' '}
              <a href="/owner/chat" className="underline hover:text-blue-900">
                Customer Conversations
              </a>{' '}
              view with grouped chats and AI controls.
            </p>
          </div>
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

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center">
            <MessageSquare className="w-5 h-5 text-red-600 mr-3" />
            <div>
              <h3 className="text-red-800 font-medium">Error loading chat logs</h3>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {logs.length === 0 && !error ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
          <MessageSquare className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-800 mb-2">No chat logs yet</h3>
          <p className="text-slate-600 mb-4">
            Customer conversations will appear here once they start chatting with your AI assistant.
          </p>
          <div className="text-sm text-slate-500 bg-slate-50 rounded-lg p-3">
            <p>Restaurant ID: {user.restaurant_id}</p>
            <p>Logs loaded: {logs.length}</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {logs.map((log, index) => (
            <div key={index} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">T{log.table_id}</span>
                  </div>
                  <span className="text-sm font-medium text-slate-700">Table {log.table_id}</span>
                  {log.client_id && (
                    <>
                      <span className="text-slate-400">•</span>
                      <span className="text-sm text-slate-500 font-mono">
                        Client {log.client_id.slice(0, 8)}...
                      </span>
                    </>
                  )}
                </div>
                <div className="flex items-center space-x-3">
                  {/* AI Toggle Button */}
                  {log.client_id && (
                    <button
                      onClick={() => toggleAI(log.client_id, !log.ai_enabled)}
                      disabled={togglingAI === log.client_id}
                      className={`flex items-center px-3 py-1 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 ${
                        log.ai_enabled 
                          ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                          : 'bg-green-100 text-green-600 hover:bg-green-200'
                      }`}
                    >
                      {togglingAI === log.client_id ? (
                        <div className="animate-spin rounded-full w-3 h-3 border-b-2 border-current mr-1"></div>
                      ) : log.ai_enabled ? (
                        <PowerOff className="w-3 h-3 mr-1" />
                      ) : (
                        <Power className="w-3 h-3 mr-1" />
                      )}
                      {log.ai_enabled ? 'Stop' : 'Start'}
                    </button>
                  )}
                  
                  <div className="flex items-center text-sm text-slate-500">
                    <Clock className="w-4 h-4 mr-1" />
                    {formatTimestamp(log.timestamp)}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-slate-300 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-slate-600" />
                  </div>
                  <div className="flex-1">
                    <div className="bg-slate-100 rounded-2xl rounded-bl-md px-4 py-3">
                      <p className="text-sm text-slate-800">{log.message}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-2xl rounded-bl-md px-4 py-3">
                      <p className="text-sm text-slate-800">{log.answer}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Status Indicator */}
              {log.client_id && (
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <p className={`text-xs font-medium ${
                    log.ai_enabled ? 'text-green-600' : 'text-orange-600'
                  }`}>
                    AI: {log.ai_enabled ? 'Active' : 'Paused'}
                  </p>
                </div>
              )}
            </div>
          ))}

          {process.env.NODE_ENV === 'development' && (
            <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-600">
              <p className="font-medium mb-2">Debug Info:</p>
              <p>Total logs: {logs.length}</p>
              <p>Restaurant ID: {user.restaurant_id}</p>
              <p>User role: {user.role}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};