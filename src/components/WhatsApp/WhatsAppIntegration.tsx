import React, { useState, useEffect } from 'react';
import { MessageCircle, QrCode, CheckCircle, AlertCircle, RefreshCw, ExternalLink } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { WhatsAppQR } from './WhatsAppQR';
import api from '../../api/axiosClient';

interface WhatsAppStatus {
  connected: boolean;
  phone_number?: string;
  last_connected?: string;
  session_status?: string;
}

const WHATSAPP_URL = 'https://restaurantchat-production.up.railway.app';

export const WhatsAppIntegration: React.FC = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState<WhatsAppStatus>({ connected: false });
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showQR, setShowQR] = useState(false);
  const [qrCode, setQrCode] = useState('');

  // Check WhatsApp status on component mount
  useEffect(() => {
    checkWhatsAppStatus();
    
    // Auto-refresh status every 30 seconds
    const statusInterval = setInterval(checkWhatsAppStatus, 30000);
    
    return () => {
      clearInterval(statusInterval);
    };
  }, []);

  const checkWhatsAppStatus = async () => {
    if (!user?.restaurant_id) return;
    
    setChecking(true);
    try {
      const response = await api.get(`/whatsapp/restaurant/${user.restaurant_id}/status`);
      setStatus(response.data);
      
      // If connected, hide QR code
      if (response.data.connected) {
        setShowQR(false);
      }
    } catch (error) {
      console.error('Error checking WhatsApp status:', error);
      // Don't show error for status check failures - just assume disconnected
      setStatus({ connected: false });
    } finally {
      setChecking(false);
    }
  };

  const handleGenerateQR = async () => {
    if (!user?.restaurant_id) {
      setError('Restaurant ID not available');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('===== WHATSAPP GENERATE QR DEBUG =====');
      console.log('🔗 Restaurant ID:', user.restaurant_id);
      console.log('🌐 API URL:', `${WHATSAPP_URL}/whatsapp/session/${user.restaurant_id}/start`);
      
      // Updated to use FastAPI proxy route
      const response = await fetch(`${WHATSAPP_URL}/whatsapp/session/${user.restaurant_id}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
          // No need to manually add x-api-key - FastAPI proxy handles this
        }
      });

      console.log('📝 Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('📝 Response data:', JSON.stringify(data, null, 2));

      if (data.qr_code) {
        setQrCode(data.qr_code);
        setShowQR(true);
        setSuccess('QR code generated successfully! Scan with WhatsApp to connect.');
        console.log('✅ QR code generated successfully');
      } else {
        const errorMsg = data.error || data.detail || 'Failed to generate QR code';
        setError(errorMsg);
        console.log('❌ QR generation failed:', errorMsg);
      }
      
      console.log('===== END WHATSAPP GENERATE QR DEBUG =====');
    } catch (error: any) {
      console.error('WhatsApp QR generation error:', error);
      const errorMsg = error.message || 'Failed to generate QR code. Please try again.';
      setError(errorMsg);
      console.log('❌ QR generation failed:', errorMsg);
      console.log('===== END WHATSAPP GENERATE QR DEBUG =====');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!user?.restaurant_id) return;
    
    if (!confirm('Are you sure you want to disconnect WhatsApp? Customers will no longer be able to reach you via WhatsApp.')) {
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      await api.post(`/whatsapp/restaurant/${user.restaurant_id}/disconnect`);
      setStatus({ connected: false });
      setSuccess('WhatsApp disconnected successfully');
      setShowQR(false);
      setQrCode('');
      checkWhatsAppStatus();
    } catch (error: any) {
      console.error('WhatsApp disconnect error:', error);
      setError(error.response?.data?.message || 'Failed to disconnect WhatsApp');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectionSuccess = () => {
    setShowQR(false);
    setQrCode('');
    setSuccess('WhatsApp connected successfully!');
    checkWhatsAppStatus();
  };

  const handleRefresh = async () => {
    setChecking(true);
    await checkWhatsAppStatus();
  };

  const formatPhoneNumber = (phone: string) => {
    // Basic formatting for display
    if (phone.startsWith('+')) return phone;
    return `+${phone}`;
  };

  return (
    <div className="space-y-6">
      {/* Main Integration Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-800">WhatsApp Integration</h2>
              <p className="text-sm text-slate-600">Connect your WhatsApp Business for customer communication</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handleRefresh}
              disabled={checking}
              className="p-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              title="Refresh status"
            >
              <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
            </button>
            
            {/* Status Indicator */}
            <div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              status.connected 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              {status.connected ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Connected
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 mr-1" />
                  Not Connected
                </>
              )}
            </div>
          </div>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
              <p className="text-green-700 text-sm">{success}</p>
            </div>
          </div>
        )}

        {/* Connection Status Details */}
        {status.connected && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4">
            <h3 className="font-medium text-green-800 mb-2">WhatsApp Business Connected</h3>
            <div className="space-y-2 text-sm text-green-700">
              {status.phone_number && (
                <p>Phone: {formatPhoneNumber(status.phone_number)}</p>
              )}
              {status.last_connected && (
                <p>Connected: {new Date(status.last_connected).toLocaleString()}</p>
              )}
              {status.session_status && (
                <p>Status: {status.session_status}</p>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3 mb-6">
          {!status.connected ? (
            <button
              onClick={handleGenerateQR}
              disabled={loading}
              className="flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full w-5 h-5 border-b-2 border-white mr-2"></div>
                  Generating QR...
                </>
              ) : (
                <>
                  <QrCode className="w-5 h-5 mr-2" />
                  Generate QR Code
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleDisconnect}
              disabled={loading}
              className="flex items-center px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full w-5 h-5 border-b-2 border-white mr-2"></div>
                  Disconnecting...
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 mr-2" />
                  Disconnect WhatsApp
                </>
              )}
            </button>
          )}
          
          <a
            href="https://business.whatsapp.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center px-4 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            WhatsApp Business
          </a>
        </div>

        {/* QR Code Display */}
        {showQR && qrCode && (
          <div className="bg-white rounded-2xl shadow-sm border border-green-200 p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <QrCode className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-green-800 mb-2">Scan QR Code</h3>
              <p className="text-green-600 text-sm mb-6">
                Open WhatsApp on your phone and scan this QR code to connect your restaurant
              </p>
              
              {/* QR Code Display */}
              <div className="bg-white p-4 rounded-xl border-2 border-green-200 mb-6 inline-block">
                <img 
                  src={qrCode} 
                  alt="WhatsApp QR Code" 
                  className="w-64 h-64 mx-auto"
                  onError={() => setError('Failed to load QR code image')}
                />
              </div>

              {/* Instructions */}
              <div className="bg-green-50 rounded-xl p-6 text-left">
                <h4 className="font-medium text-green-900 mb-3">How to connect:</h4>
                <ol className="text-sm text-green-800 space-y-2 list-decimal list-inside">
                  <li>Open WhatsApp on your phone</li>
                  <li>Tap Menu (⋮) → Linked Devices</li>
                  <li>Tap "Link a Device"</li>
                  <li>Point your phone at this QR code</li>
                  <li>Wait for connection confirmation</li>
                </ol>
              </div>

              <div className="mt-6 flex justify-center space-x-4">
                <button
                  onClick={handleGenerateQR}
                  className="flex items-center px-4 py-2 border border-green-300 text-green-700 rounded-xl hover:bg-green-50 transition-colors"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh QR
                </button>
                <button
                  onClick={() => {
                    setShowQR(false);
                    setQrCode('');
                  }}
                  className="flex items-center px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Help Section */}
        <div className="mt-6 pt-6 border-t border-slate-200">
          <h4 className="font-medium text-slate-800 mb-3">Benefits of WhatsApp Integration</h4>
          <ul className="text-sm text-slate-600 space-y-2">
            <li className="flex items-start">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
              Customers can message you directly from the chat interface
            </li>
            <li className="flex items-start">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
              Receive notifications for new customer messages
            </li>
            <li className="flex items-start">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
              Respond to customers using your familiar WhatsApp Business app
            </li>
            <li className="flex items-start">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
              Seamless integration with your existing AI assistant
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};