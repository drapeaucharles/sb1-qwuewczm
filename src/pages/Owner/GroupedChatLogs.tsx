import React, { useState, useEffect } from 'react';
import { MessageSquare, Clock, User, Bot, RefreshCw, Users, Eye, Power, PowerOff, Mic } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ApiService } from '../../services/api';
import { ClientConversationPanel } from '../../components/Chat/ClientConversationPanel';

interface LatestChatLog {
  client_id: string;
  table_id: string;
  message: string;
  answer: string;
  timestamp: string;
  ai_enabled: boolean;
  sender_type: string; // Added sender_type to track who sent the message
}

export const GroupedChatLogs: React.FC = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<LatestChatLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string>('');
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [showConversation, setShowConversation] = useState(false);
  const [togglingAI, setTogglingAI] = useState<string>(''); // Track which client is being toggled

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadLatestChatLogs();
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatRelativeTime = (timestamp: string) => {
    const now = new Date();
    const messageTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - messageTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const loadLatestChatLogs = async () => {
    if (!refreshing) setLoading(true);
    setError('');

    if (!user?.restaurant_id) {
      setError('No restaurant ID found in user profile');
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const response = await ApiService.getLatestChatLogs(user.restaurant_id);
      console.log('Raw API response:', response);
      
      // Group messages by client_id and take last 2 messages per client
      const groupedByClient = new Map<string, LatestChatLog[]>();
      
      if (Array.isArray(response)) {
        response.forEach((entry: any) => {
          const clientId = entry.client_id;
          if (!groupedByClient.has(clientId)) {
            groupedByClient.set(clientId, []);
          }
          groupedByClient.get(clientId)!.push({
            client_id: entry.client_id,
            table_id: entry.table_id || '',
            message: entry.message,
            answer: '', // Not used in new format
            timestamp: entry.timestamp,
            ai_enabled: entry.ai_enabled,
            sender_type: entry.sender_type
          });
        });
      }
      
      // Convert grouped data to display format (one entry per client with their messages)
      const processedLogs: LatestChatLog[] = [];
      groupedByClient.forEach((messages, clientId) => {
        // Sort messages by timestamp (newest first)
        messages.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        
        // Take the most recent message as the primary entry
        if (messages.length > 0) {
          const primaryMessage = messages[0];
          processedLogs.push({
            ...primaryMessage,
            // Store all messages for this client in a custom property
            allMessages: messages
          } as any);
        }
      });
      
      // Sort by most recent activity
      processedLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      console.log('Processed logs:', processedLogs);
      setLogs(processedLogs);
    } catch (error) {
      console.error('Error loading latest chat logs:', error);
      setError(error instanceof Error ? error.message : 'Failed to load chat logs');
      setLogs([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
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

  const handleViewConversation = (clientId: string) => {
    setSelectedClientId(clientId);
    setShowConversation(true);
  };

  const handleCloseConversation = () => {
    setShowConversation(false);
    setSelectedClientId('');
  };

  useEffect(() => {
    if (user?.restaurant_id) {
      loadLatestChatLogs();
    } else {
      setLoading(false);
      setError('No restaurant ID found in user profile');
    }
  }, [user]);

  if (!user?.restaurant_id) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Customer Conversations</h1>
          <p className="text-slate-600">Latest messages from each customer</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
          <MessageSquare className="w-16 h-16 text-red-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-800 mb-2">Unable to Load Chat Logs</h3>
          <p className="text-slate-600 mb-4">
            You're logged in but missing restaurant info. Please re-login or contact support.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Customer Conversations</h1>
          <p className="text-slate-600">Latest messages from each customer</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
          <div className="animate-spin rounded-full w-8 h-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading customer conversations...</p>
        </div>
      </div>
    );
  }

  const activeConversations = logs.filter(log => log.ai_enabled).length;
  const pausedConversations = logs.filter(log => !log.ai_enabled).length;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Customer Conversations</h1>
          <p className="text-slate-600">Latest messages from each customer with AI control</p>
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

      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Conversations</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{logs.length}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">AI Active</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{activeConversations}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center">
              <Power className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">AI Paused</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">{pausedConversations}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
              <PowerOff className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Response Rate</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">
                {logs.length > 0 ? Math.round((activeConversations / logs.length) * 100) : 0}%
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center">
            <MessageSquare className="w-5 h-5 text-red-600 mr-3" />
            <div>
              <h3 className="text-red-800 font-medium">Error loading conversations</h3>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {logs.length === 0 && !error ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
          <MessageSquare className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-800 mb-2">No conversations yet</h3>
          <p className="text-slate-600 mb-4">
            Customer conversations will appear here once they start chatting with your AI assistant.
          </p>
          <div className="text-sm text-slate-500 bg-slate-50 rounded-lg p-3">
            <p>Restaurant ID: {user.restaurant_id}</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {logs.map((log) => (
            <div
              key={log.client_id}
              className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow"
            >
              {/* Client Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-800">
                      Client {log.client_id.slice(0, 8)}...
                    </h3>
                    <div className="flex items-center space-x-2 text-sm text-slate-500">
                      <span>Table {log.table_id || '?'}</span>
                      <span>•</span>
                      <span>{formatRelativeTime(log.timestamp)}</span>
                    </div>
                  </div>
                </div>
                
                {/* AI Status Indicator */}
                <div className="flex items-center space-x-2">
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    log.ai_enabled 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-orange-100 text-orange-700'
                  }`}>
                    AI: {log.ai_enabled ? 'Active' : 'Paused'}
                  </div>
                </div>
              </div>

              {/* Latest Messages Preview */}
              <div className="space-y-3 mb-4">
                {/* Display last 2 messages for this client */}
                {[...(log as any).allMessages || [log]]
				  .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()) // oldest → newest
				  .slice(-2) // last 2 in correct order
				  .map((msg, msgIndex) => {
                  // ✅ Fix: Include client_audio messages as client messages
                  const isClient = msg.sender_type === 'client' || msg.sender_type === 'client_audio';
                  const isAI = msg.sender_type === 'ai';
                  const isRestaurant = msg.sender_type === 'restaurant';
                  const isAudioTranscript = msg.sender_type === 'client_audio';
                  
                  return (
                    <div key={msgIndex} className="flex items-start space-x-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${
                        isClient ? (isAudioTranscript ? 'bg-purple-500' : 'bg-slate-300') : 
                        isAI ? 'bg-gradient-to-br from-blue-500 to-purple-600' :
                        'bg-gradient-to-br from-green-500 to-green-600'
                      }`}>
                        {isClient ? (
                          isAudioTranscript ? (
                            <Mic className="w-3 h-3 text-white" />
                          ) : (
                            <User className="w-3 h-3 text-slate-600" />
                          )
                        ) : isAI ? (
                          <Bot className="w-3 h-3 text-white" />
                        ) : (
                          <User className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className={`rounded-xl rounded-bl-md px-3 py-2 ${
                          isClient ? (isAudioTranscript ? 'bg-purple-50 border border-purple-200' : 'bg-slate-100') :
                          isAI ? 'bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200' :
                          'bg-gradient-to-r from-green-50 to-green-100 border border-green-200'
                        }`}>
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-xs font-medium ${
                              isClient ? (isAudioTranscript ? 'text-purple-600' : 'text-slate-600') :
                              isAI ? 'text-blue-600' :
                              'text-green-600'
                            }`}>
                              {isClient ? (isAudioTranscript ? 'Customer (Audio)' : 'Customer') : isAI ? 'AI Assistant' : 'Staff'}
                            </span>
                            <span className="text-xs text-slate-500">
                              {formatRelativeTime(msg.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm text-slate-800 line-clamp-2">{msg.message}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div className="flex items-center space-x-2">
                  {/* AI Toggle Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleAI(log.client_id, !log.ai_enabled);
                    }}
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
                    {log.ai_enabled ? 'Pause AI' : 'Start AI'}
                  </button>
                </div>
                
                <button
                  onClick={() => handleViewConversation(log.client_id)}
                  className="flex items-center px-3 py-1 bg-blue-100 text-blue-600 rounded-xl hover:bg-blue-200 text-sm font-medium transition-colors"
                >
                  <Eye className="w-3 h-3 mr-1" />
                  View Full Conversation
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Client Conversation Panel */}
      <ClientConversationPanel
        clientId={selectedClientId}
        onClose={handleCloseConversation}
        isOpen={showConversation}
      />
    </div>
  );
};

