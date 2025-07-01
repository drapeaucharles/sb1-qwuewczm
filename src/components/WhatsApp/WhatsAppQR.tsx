import React, { useState, useEffect } from 'react';
import { QrCode, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api/axiosClient';

interface WhatsAppQRProps {
  sessionId: string;
  onConnectionSuccess?: () => void;
}

export const WhatsAppQR: React.FC<WhatsAppQRProps> = ({ sessionId, onConnectionSuccess }) => {
  const { user } = useAuth();
  const [qrCode, setQrCode] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [retryCount, setRetryCount] = useState(0);
  const [checkingConnection, setCheckingConnection] = useState(false);

  const fetchQRCode = async () => {
    if (!user?.restaurant_id) {
      setError('Restaurant ID not available');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      console.log('===== WHATSAPP QR FETCH DEBUG =====');
      console.log('🔗 Session ID:', sessionId);
      console.log('🏪 Restaurant ID:', user.restaurant_id);
      console.log('📍 QR URL:', `/whatsapp/restaurant/${user.restaurant_id}/qr`);
      
      const response = await api.get(`/whatsapp/restaurant/${user.restaurant_id}/qr`);
      
      console.log('📝 QR Response data:', JSON.stringify(response.data, null, 2));
      
      if (response.data.success && response.data.qr_code) {
        setQrCode(response.data.qr_code);
        setError('');
        console.log('✅ QR code fetched successfully');
        
        // Start checking for connection status
        startConnectionCheck();
      } else {
        const errorMsg = response.data.error || 'Failed to generate QR code';
        setError(errorMsg);
        console.log('❌ QR fetch failed:', errorMsg);
      }
      
      console.log('===== END WHATSAPP QR FETCH DEBUG =====');
    } catch (err: any) {
      console.error('QR fetch error:', err);
      const errorMsg = err.response?.data?.detail || err.message || 'Network error while fetching QR code';
      setError(errorMsg);
      console.log('❌ QR fetch network error:', err);
      console.log('===== END WHATSAPP QR FETCH DEBUG =====');
    } finally {
      setLoading(false);
    }
  };

  const startConnectionCheck = () => {
    if (!user?.restaurant_id) return;

    const checkInterval = setInterval(async () => {
      setCheckingConnection(true);
      
      try {
        const response = await api.get(`/whatsapp/restaurant/${user.restaurant_id}/status`);
        
        if (response.data.connected) {
          clearInterval(checkInterval);
          setCheckingConnection(false);
          onConnectionSuccess?.();
        }
      } catch (err) {
        console.error('Connection check error:', err);
      } finally {
        setCheckingConnection(false);
      }
    }, 3000); // Check every 3 seconds

    // Clear interval after 5 minutes to prevent infinite checking
    setTimeout(() => {
      clearInterval(checkInterval);
      setCheckingConnection(false);
    }, 300000);
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    fetchQRCode();
  };

  useEffect(() => {
    fetchQRCode();
  }, [sessionId, user?.restaurant_id]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="animate-spin rounded-full w-8 h-8 border-b-2 border-green-600"></div>
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">Generating QR Code</h3>
          <p className="text-slate-600">Please wait while we prepare your WhatsApp QR code...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-red-200 p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-red-800 mb-2">QR Code Error</h3>
          <p className="text-red-600 text-sm mb-4">{error}</p>
          
          <button
            onClick={handleRetry}
            className="flex items-center justify-center px-4 py-2 border border-red-300 text-red-700 rounded-xl hover:bg-red-50 transition-colors mx-auto"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again {retryCount > 0 && `(${retryCount})`}
          </button>
        </div>
      </div>
    );
  }

  if (!qrCode) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-orange-200 p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <QrCode className="w-8 h-8 text-orange-600" />
          </div>
          <h3 className="text-lg font-semibold text-orange-800 mb-2">QR Code Not Ready</h3>
          <p className="text-orange-600 text-sm mb-4">
            QR code is being generated. Please wait a moment and try again.
          </p>
          
          <button
            onClick={handleRetry}
            className="flex items-center justify-center px-4 py-2 border border-orange-300 text-orange-700 rounded-xl hover:bg-orange-50 transition-colors mx-auto"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh {retryCount > 0 && `(${retryCount})`}
          </button>
        </div>
      </div>
    );
  }

  return (
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

        {/* Connection Status */}
        {checkingConnection && (
          <div className="bg-blue-50 rounded-xl p-4 mb-4">
            <div className="flex items-center justify-center text-blue-700">
              <div className="animate-spin rounded-full w-4 h-4 border-b-2 border-blue-600 mr-2"></div>
              Waiting for WhatsApp connection...
            </div>
          </div>
        )}

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
            onClick={handleRetry}
            className="flex items-center px-4 py-2 border border-green-300 text-green-700 rounded-xl hover:bg-green-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh QR
          </button>
        </div>
      </div>
    </div>
  );
};

