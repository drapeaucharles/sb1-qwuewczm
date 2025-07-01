import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, AlertCircle, Shield, Mic } from 'lucide-react';
import { getClientId } from '../../utils/ClientSession';
import { LiveApiService } from '../../services/liveApi';
import { ApiService } from '../../services/api';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  isError?: boolean;
  sender_type?: 'client' | 'restaurant' | 'ai';
  data_sender_type?: string; // Add support for data-sender-type attribute
}

interface ChatInterfaceProps {
  restaurantId: string;
  tableId: string;
  onSendMessage?: (message: string) => Promise<string>; // Keep for backward compatibility
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  restaurantId,
  tableId,
  onSendMessage, // This will be ignored in favor of live API
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hi! I'm your AI assistant. I can help you with information about our menu, ingredients, allergens, opening hours, and answer any questions you might have. What would you like to know?",
      isUser: false,
      timestamp: new Date(),
      sender_type: 'ai',
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [clientId] = useState(() => getClientId());
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [aiEnabled, setAiEnabled] = useState(true); // Track AI status
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

 useEffect(() => {
  console.log("🔍 Loaded messages:");
  messages.forEach((msg) => {
    console.log("sender_type:", msg.sender_type, "data_sender_type:", msg.data_sender_type, msg);
  });

  scrollToBottom();
}, [messages]);
  // Check backend connectivity on component mount
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const isHealthy = await LiveApiService.healthCheck();
        setConnectionStatus(isHealthy ? 'connected' : 'error');
      } catch (error) {
        console.error('Connection check failed:', error);
        setConnectionStatus('error');
      }
    };

    checkConnection();
  }, []);

  // Load existing conversation and set up auto-refresh
  useEffect(() => {
if (restaurantId && clientId) {
  loadConversation();

  const user = JSON.parse(localStorage.getItem('restaurant_user') || '{}');
  const isLoggedIn = !!user?.access_token;

  if (isLoggedIn) {
    checkAIStatus();
  }

  refreshIntervalRef.current = setInterval(() => {
    loadConversation(true);
    if (isLoggedIn) {
      checkAIStatus();
    }
  }, 3000);
}


    // Cleanup interval on unmount
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [restaurantId, clientId, aiEnabled]); // Add aiEnabled to dependencies

  // Check AI status for this client
  const checkAIStatus = async () => {
    try {
      const response = await ApiService.getLatestChatLogs(restaurantId);
      if (Array.isArray(response) && response.length > 0) {
        // Find the entry for this client
        const clientEntry = response.find(entry => entry.client_id === clientId);
        if (clientEntry && typeof clientEntry.ai_enabled === 'boolean') {
          const newAiEnabled = clientEntry.ai_enabled;
          if (newAiEnabled !== aiEnabled) {
            console.log(`🤖 AI status changed: ${aiEnabled} → ${newAiEnabled}`);
            setAiEnabled(newAiEnabled);
          }
        }
      }
    } catch (error) {
      console.error('Error checking AI status:', error);
    }
  };

  const loadConversation = async (silent = false) => {
    try {
      // Get full conversation for this client
      const response = await ApiService.getClientConversation(restaurantId, clientId);
      
      if (Array.isArray(response) && response.length > 0) {
        // ✅ New format: Each entry is already a separate message with sender_type
        // Filter out empty messages to prevent empty AI responses from showing
        const conversationMessages: Message[] = response
          .filter(msg => msg.message && msg.message.trim() !== '') // Filter out empty messages
          .map((msg, index) => {
            const isAudioClient = msg.sender_type === 'client_audio' || msg.data_sender_type === 'client_audio';
            const dataSender = msg.data_sender_type || (msg.sender_type === 'client_audio' ? 'client_audio' : undefined);
            
            return {
              id: `${index}-${msg.sender_type}`,
              text: msg.message,
              isUser: msg.sender_type === 'client' || isAudioClient,
              timestamp: new Date(msg.timestamp),
              sender_type: isAudioClient ? 'client' : msg.sender_type,
              data_sender_type: dataSender,
            };
          })
          .filter(msg => msg.id !== 'temp-bot'); // ✅ prevent temp-bot from showing up permanently

        // Always preserve recent local messages that might not be in backend yet (for both AI on/off)
        const latestBackendTime = conversationMessages.length > 0 
          ? Math.max(...conversationMessages.map(m => m.timestamp.getTime()))
          : 0;
        
        const localMessages = messages.filter(m => 
          m.id !== '1' && // Skip welcome message
          m.timestamp.getTime() > latestBackendTime &&
          (m.sender_type === 'client' || (!aiEnabled && m.isError)) // Preserve client messages and error messages when AI off
        );

        // Only update if we have new messages or if this is not a silent refresh
        if (!silent || conversationMessages.length !== messages.length - 1 - localMessages.length) {
          setMessages([
            {
              id: '1',
              text: "Hi! I'm your AI assistant. I can help you with information about our menu, ingredients, allergens, opening hours, and answer any questions you might have. What would you like to know?",
              isUser: false,
              timestamp: new Date(),
              sender_type: 'ai',
            },
            ...conversationMessages,
            ...localMessages // Add any local messages that aren't in backend yet
          ]);
        }
      }
    } catch (error) {
      if (!silent) {
        console.error('Error loading conversation:', error);
      }
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      isUser: true,
      timestamp: new Date(),
      sender_type: 'client',
    };

    // Always add user message immediately and keep it visible
    setMessages(prev => [
      ...prev,
      userMessage,
      ...(aiEnabled ? [{
        id: "temp-bot",
        text: "",
        isUser: false,
        timestamp: new Date(),
        sender_type: 'ai',
      }] : [])
    ]);
    const messageText = inputMessage;
    setInputMessage('');

    if (aiEnabled) {
      // AI enabled: Show loading and get AI response
      setIsLoading(true);

      try {
        // Use live API service
        const response = await LiveApiService.sendMessage({
          restaurantId,
          clientId,
          tableId,
          message: messageText
        });

        // Only add bot message if we got a non-empty response
        if (response && response.trim()) {
          const botMessage: Message = {
            id: (Date.now() + 1).toString(),
            text: response,
            isUser: false,
            timestamp: new Date(),
            sender_type: 'ai',
          };
          setMessages(prev => [...prev, botMessage]);
        }
      } catch (error) {
        console.error('Chat error:', error);
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: "Sorry, something went wrong. Please try again in a moment.",
          isUser: false,
          timestamp: new Date(),
          isError: true,
          sender_type: 'ai',
        };
        setMessages(prev => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    } else {
      // AI disabled: Just send message to backend for staff, no loading state
      try {
        await LiveApiService.sendMessage({
          restaurantId,
          clientId,
          tableId,
          message: messageText
        });
        console.log("📨 Message sent to staff (AI disabled)");
        
        // Schedule a gentle refresh to get any staff responses, but don't overwrite our user message
        setTimeout(() => {
          loadConversation(true);
        }, 2000);
      } catch (error) {
        console.error('Error sending message to staff:', error);
        // Show error message only if sending failed
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: "Failed to send message. Please check your connection and try again.",
          isUser: false,
          timestamp: new Date(),
          isError: true,
          sender_type: 'ai',
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    }
  };

  // Helper function to determine if a message is an audio transcript
  const isAudioTranscript = (msg: Message) => {
    return msg.data_sender_type === 'client_audio';
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Connection Status Indicator */}
      {connectionStatus === 'checking' && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2">
          <div className="flex items-center justify-center text-sm text-yellow-700">
            <div className="animate-spin rounded-full w-4 h-4 border-b-2 border-yellow-600 mr-2"></div>
            Connecting to restaurant...
          </div>
        </div>
      )}
      
      {connectionStatus === 'error' && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2">
          <div className="flex items-center justify-center text-sm text-red-700">
            <AlertCircle className="w-4 h-4 mr-2" />
            Connection issue - some features may not work
          </div>
        </div>
      )}

      {/* AI Status Indicator */}
      {!aiEnabled && (
        <div className="bg-orange-50 border-b border-orange-200 px-4 py-2">
          <div className="flex items-center justify-center text-sm text-orange-700">
            <AlertCircle className="w-4 h-4 mr-2" />
            AI assistant is currently paused - messages will be seen by restaurant staff
          </div>
        </div>
      )}

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4 min-h-0">
        <div className="chat-messages">
          {messages.map((msg, idx) => {
            // Don't render blank AI messages
            if (msg.sender_type === 'ai' && !msg.text?.trim()) return null;
            if (msg.id === 'temp-bot') return null;
            const type = (msg.data_sender_type === 'client_audio' || msg.sender_type === 'client_audio')
            ? 'client'
            : msg.sender_type;


            if (!type) {
              console.warn('⚠️ Missing sender_type in message:', msg);
            }

            // Determine bubble styling based on message type
            let bubbleClass = '';
            let avatarBgClass = '';
            let avatarIcon = null;
            
            if (type === 'client') {
              if (isAudioTranscript(msg)) {
                // Audio transcript: Purple bubble, right-aligned like client messages
                bubbleClass = 'audio-transcript-bubble';
                avatarBgClass = 'bg-purple-500';
                avatarIcon = <Mic className="w-4 h-4 text-white" />;
              } else {
                // Regular client message
                bubbleClass = 'client-bubble';
                avatarBgClass = 'bg-slate-300';
                avatarIcon = <User className="w-4 h-4 text-slate-600" />;
              }
            } else if (type === 'restaurant') {
              bubbleClass = 'restaurant-bubble';
              avatarBgClass = 'bg-gradient-to-br from-green-500 to-emerald-600';
              avatarIcon = <Shield className="w-4 h-4 text-white" />;
            } else if (type === 'ai') {
              bubbleClass = 'ai-bubble';
              avatarBgClass = msg.isError ? 'bg-red-100' : 'bg-gradient-to-br from-blue-500 to-purple-600';
              avatarIcon = msg.isError ? <AlertCircle className="w-4 h-4 text-red-600" /> : <Bot className="w-4 h-4 text-white" />;
            } else {
              bubbleClass = 'unknown-bubble';
              avatarBgClass = 'bg-slate-400';
              avatarIcon = <User className="w-4 h-4 text-white" />;
            }

            return (
              <div key={idx} className={`message-wrapper ${bubbleClass} ${
                msg.isUser ? 'justify-end' : 'justify-start'
              } flex items-start space-x-2`}>
                {!msg.isUser && (
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${avatarBgClass}`}>
                    {avatarIcon}
                  </div>
                )}
                
                <div className="message-content">
                  <p>{msg.text}</p>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs">
                      {msg.timestamp.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    {!msg.isUser && msg.sender_type === 'restaurant' && msg.data_sender_type !== 'client_audio' && !msg.isError && (
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                        Staff
                      </span>
                    )}
                    {isAudioTranscript(msg) && (
                      <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full flex items-center">
                        <Mic className="w-3 h-3 mr-1" />
                        Audio
                      </span>
                    )}
                  </div>
                </div>
                
                {msg.isUser && (
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${avatarBgClass}`}>
                    {avatarIcon}
                  </div>
                )}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Only show typing animation if AI is enabled AND loading */}
        {aiEnabled && isLoading && !messages.some(m => m.id === 'temp-bot') && (
          <div className="flex items-start space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mt-1">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-slate-100 border border-slate-200 rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-slate-200 bg-white p-3 safe-area-inset-bottom">
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={aiEnabled ? "Ask me about the menu..." : "Send a message to the restaurant..."}
            className="flex-1 px-4 py-3 border border-slate-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
            disabled={(!aiEnabled && isLoading) || connectionStatus === 'error'}
          />
          <button
            type="submit"
            disabled={(!aiEnabled && isLoading) || !inputMessage.trim() || connectionStatus === 'error'}
            className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full flex items-center justify-center hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
        
        {/* Debug info (only in development) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-2 text-xs text-slate-500 font-mono">
            Client ID: {clientId.slice(0, 8)}... | Restaurant: {restaurantId} | Table: {tableId} | AI: {aiEnabled ? 'ON' : 'OFF'}
          </div>
        )}
      </div>

      <style jsx>{`
        .message-wrapper {
          margin: 8px 0;
          display: flex;
        }

        .client-bubble .message-content {
          background-color: #e6f7ff;
          align-self: flex-end;
          margin-left: auto;
          color: #000;
          border-radius: 12px;
          padding: 10px;
          max-width: 75%;
        }

        .audio-transcript-bubble .message-content {
          background-color: #c084fc;
          align-self: flex-start;
          margin-left: auto;
          color: #fff;
          border-radius: 12px;
          padding: 10px;
          max-width: 75%;
        }

        .audio-transcript-bubble .message-content .text-xs {
          color: rgba(255, 255, 255, 0.8);
        }

        .restaurant-bubble .message-content {
          background-color: #cce5ff;
          align-self: flex-start;
          color: #000;
          border-radius: 12px;
          padding: 10px;
          max-width: 75%;
        }

        .ai-bubble .message-content {
          background-color: #f8f9fa;
          font-style: italic;
          border-left: 4px solid #999;
          color: #000;
          border-radius: 12px;
          padding: 10px;
          max-width: 75%;
        }

        .unknown-bubble .message-content {
          background-color: #fff3cd;
          border: 1px solid #ffeaa7;
          color: #856404;
          border-radius: 12px;
          padding: 10px;
          max-width: 75%;
        }
      `}</style>
    </div>
  );
};