import React, { useState, useEffect, useRef } from 'react';
import { X, Bot, User, ArrowLeft, Send, RefreshCw, Mic } from 'lucide-react';
import { ApiService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api/axiosClient';

interface Message {
  client_id: string;
  table_id: string;
  message: string;
  answer: string;
  timestamp: string;
  sender_type?: 'client' | 'restaurant' | 'ai' | 'client_audio';
}

interface ClientConversationPanelProps {
  clientId: string;
  onClose: () => void;
  isOpen: boolean;
}

export const ClientConversationPanel: React.FC<ClientConversationPanelProps> = ({
  clientId,
  onClose,
  isOpen,
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && clientId && user?.restaurant_id) {
      loadConversation();
      refreshIntervalRef.current = setInterval(() => {
        loadConversation(true);
      }, 5000);
    }
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [isOpen, clientId, user?.restaurant_id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversation = async (silent = false) => {
    if (!user?.restaurant_id || !clientId) return;
    if (!silent) {
      setLoading(true);
      setError('');
    }
    try {
      const response = await ApiService.getClientConversation(user.restaurant_id, clientId);
      setMessages(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Error loading client conversation:', error);
      if (!silent) {
        setError('Failed to load conversation');
        setMessages([]);
      }
    } finally {
      if (!silent) setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending || !user?.restaurant_id) return;
    setSending(true);
    try {
      await api.post('/chat', {
        restaurant_id: user.restaurant_id,
        client_id: clientId,
        sender_type: 'restaurant',
        message: newMessage,
      });
      setNewMessage('');
      await loadConversation(true);
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadConversation();
  };

  const chatMessages = messages.map((msg, index) => {
    // ✅ Fix: Include client_audio messages as client messages for visual styling
    const isClient = msg.sender_type === 'client' || msg.sender_type === 'client_audio';
    const isAudioTranscript = msg.sender_type === 'client_audio';

    if (!msg.sender_type) {
      console.warn(`⚠️ Message ${index + 1} has undefined sender_type!`, msg);
    }

    return {
      id: `${index}-${msg.sender_type || 'unknown'}`,
      text: msg.message,
      isUser: isClient, // ✅ This now includes client_audio messages
      timestamp: msg.timestamp,
      senderType: msg.sender_type || 'restaurant',
      isAudioTranscript, // ✅ Track if this is an audio transcript
    };
  });

  const sortedMessages = [...chatMessages].sort((a, b) => {
    return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <h2 className="text-xl font-semibold text-slate-800">Client Conversation</h2>
              <p className="text-sm text-slate-600">Client ID: <span className="font-mono bg-slate-100 px-2 py-1 rounded">{clientId}</span></p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button onClick={handleRefresh} disabled={refreshing} className="p-2 hover:bg-slate-100 rounded-xl">
              <RefreshCw className={`w-5 h-5 text-slate-600 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl">
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0">
          {loading ? (
            <div className="text-center">Loading conversation...</div>
          ) : error ? (
            <div className="text-center text-red-500">{error}</div>
          ) : sortedMessages.length === 0 ? (
            <div className="text-center">No messages yet</div>
          ) : (
            sortedMessages.map((msg) => (
              <div key={msg.id} className={`flex items-start space-x-2 ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
                {!msg.isUser && (
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mt-1 flex-shrink-0 ${
                    msg.senderType === 'restaurant' || msg.senderType === 'ai'
                      ? 'bg-gradient-to-br from-purple-500 to-purple-600'
                      : 'bg-slate-400'
                  }`}>
                    {(msg.senderType === 'restaurant' || msg.senderType === 'ai') && <Bot className="w-4 h-4 text-white" />}
                    {msg.senderType === 'client' && <User className="w-4 h-4 text-white" />}
                  </div>
                )}

                <div className={`px-3 py-2 rounded-xl text-sm border max-w-[70%] ${
                  msg.isUser
                    ? msg.isAudioTranscript
                      ? 'bg-purple-500 text-white border-purple-500 rounded-br-md' // ✅ Purple bubble for audio transcripts
                      : 'bg-blue-500 text-white border-blue-500 rounded-br-md' // Regular client messages
                    : 'bg-gray-100 border-gray-300 text-gray-800 rounded-bl-md'
                }`}>
                  <p className="break-words leading-relaxed">{msg.text}</p>
                  <div className="text-xs mt-1 flex justify-between items-center">
                    <span className={`${msg.isUser ? (msg.isAudioTranscript ? 'text-purple-100' : 'text-blue-100') : 'text-gray-500'}`}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <div className="flex items-center space-x-2">
                      {!msg.isUser && msg.senderType === 'restaurant' && (
                        <span className="px-2 py-1 bg-purple-200 text-purple-700 rounded-full text-xs">Staff</span>
                      )}
                      {msg.isAudioTranscript && (
                        <span className="px-2 py-1 bg-purple-200 text-purple-700 rounded-full text-xs flex items-center">
                          <Mic className="w-3 h-3 mr-1" />
                          Audio
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {msg.isUser && (
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mt-1 flex-shrink-0 ${
                    msg.isAudioTranscript ? 'bg-purple-500' : 'bg-blue-500'
                  }`}>
                    {msg.isAudioTranscript ? (
                      <Mic className="w-4 h-4 text-white" />
                    ) : (
                      <User className="w-4 h-4 text-white" />
                    )}
                  </div>
                )}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-6 border-t border-slate-200 bg-slate-50">
          <form onSubmit={handleSendMessage} className="flex space-x-3">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Send a message to the customer..."
              className="flex-1 px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={sending || !newMessage.trim()}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 flex items-center"
            >
              {sending ? (
                <div className="animate-spin rounded-full w-5 h-5 border-b-2 border-white mr-2"></div>
              ) : (
                <Send className="w-5 h-5 mr-2" />
              )}
              {sending ? 'Sending...' : 'Send'}
            </button>
          </form>
          <div className="text-sm text-slate-600 mt-3 flex justify-between">
            <div>Total messages: {sortedMessages.length} • Auto-refreshing every 5s</div>
            <div>Client: {clientId.slice(0, 8)}...</div>
          </div>
        </div>
      </div>
    </div>
  );
};

