import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { UserPlus, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosClient';

export const CreateStaff: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [staffId, setStaffId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus('idle');
    setMessage('');

    // Validation
    if (password !== confirmPassword) {
      setStatus('error');
      setMessage('Passwords do not match');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setStatus('error');
      setMessage('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      const response = await api.post('/restaurant/create-staff', {
        restaurant_id: user?.restaurant_id,
        staff_id: staffId,
        password,
      });
      
      setStatus('success');
      setMessage('Staff account created successfully!');
      
      // Clear form
      setStaffId('');
      setPassword('');
      setConfirmPassword('');
      
      // Redirect after success
      setTimeout(() => {
        navigate('/owner');
      }, 2000);
    } catch (err: any) {
      console.error('Create staff error:', err);
      setStatus('error');
      setMessage(err.response?.data?.message || 'Error creating staff account');
    } finally {
      setLoading(false);
    }
  };

  // Check if user is owner
  if (!user || user.role !== 'owner') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🚫</span>
          </div>
          <h1 className="text-xl font-bold text-slate-800 mb-2">Access Denied</h1>
          <p className="text-slate-600 mb-4">
            Only restaurant owners can create staff accounts.
          </p>
          <button
            onClick={() => navigate('/owner')}
            className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => navigate('/owner')}
          className="flex items-center text-slate-600 hover:text-slate-800 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </button>
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Create Staff Account</h1>
        <p className="text-slate-600">
          Add a new staff member to help manage your restaurant's AI assistant.
        </p>
      </div>

      {/* Status Messages */}
      {status === 'success' && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
            <div>
              <h3 className="text-green-800 font-medium">Staff account created!</h3>
              <p className="text-green-700 text-sm">{message}</p>
            </div>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
            <div>
              <h3 className="text-red-800 font-medium">Error creating staff account</h3>
              <p className="text-red-700 text-sm">{message}</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <div className="flex items-center mb-6">
          <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-600 rounded-xl flex items-center justify-center mr-4">
            <UserPlus className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-800">Staff Account Details</h2>
            <p className="text-sm text-slate-600">Enter the login credentials for the new staff member</p>
          </div>
        </div>

        <form onSubmit={handleCreate} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Staff ID / Username *
            </label>
            <input
              type="text"
              value={staffId}
              onChange={(e) => setStaffId(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="e.g., john.doe or staff001"
              required
              disabled={loading}
            />
            <p className="text-xs text-slate-500 mt-1">
              This will be used as the login username for the staff member
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Password *
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Enter a secure password"
              required
              minLength={6}
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Confirm Password *
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Confirm the password"
              required
              minLength={6}
              disabled={loading}
            />
          </div>

          <div className="bg-blue-50 rounded-xl p-4">
            <h3 className="font-medium text-blue-900 mb-2">Staff Permissions</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• View chat logs and customer interactions</li>
              <li>• Access restaurant dashboard</li>
              <li>• Cannot edit restaurant information or menu</li>
              <li>• Cannot create or delete other staff accounts</li>
            </ul>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/owner')}
              className="px-6 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || status === 'success'}
              className="flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-xl hover:from-green-600 hover:to-blue-700 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full w-5 h-5 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : status === 'success' ? (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Created!
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5 mr-2" />
                  Create Staff Account
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};