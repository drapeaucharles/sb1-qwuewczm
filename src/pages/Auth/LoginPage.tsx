import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LoginForm } from '../../components/Auth/LoginForm';
import { useAuth } from '../../contexts/AuthContext';
import { ApiService } from '../../services/api';

export const LoginPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Get the intended destination from location state
  const from = location.state?.from?.pathname || null;

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      if (from && from !== '/login') {
        navigate(from, { replace: true });
      } else {
        // Default redirect based on role would be handled by the login function
        navigate('/owner', { replace: true });
      }
    }
  }, [isAuthenticated, navigate, from]);

  const handleLogin = async (restaurantId: string, password: string) => {
    setLoading(true);
    setError('');

    try {
      // Call API login with restaurant_id and password
      const response = await ApiService.login({ restaurant_id: restaurantId, password });
      console.log("Login API response:", response);

      // Pass all required data to AuthContext.login()
      login(
        response.access_token,
        response.refresh_token,
        response.role,
        response.restaurant_id,
        restaurantId // Use the login input as email fallback
      );
      
      // Redirect based on intended destination or role
      if (from && from !== '/login') {
        navigate(from, { replace: true });
      } else if (response.role === 'admin') {
        navigate('/admin', { replace: true });
      } else if (response.role === 'owner' || response.role === 'staff') {
        navigate('/owner', { replace: true });
      } else {
        navigate('/owner', { replace: true }); // Default fallback
      }
    } catch (err) {
      setError('Invalid restaurant ID or password. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return <LoginForm onLogin={handleLogin} loading={loading} error={error} />;
};