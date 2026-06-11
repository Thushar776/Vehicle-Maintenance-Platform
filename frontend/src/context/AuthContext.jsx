import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Auto load user on start
  useEffect(() => {
    const checkAuthStatus = async () => {
      const storedToken = localStorage.getItem('accessToken');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        setUser(JSON.parse(storedUser));
        
        try {
          // Verify token against /auth/me
          const res = await api.get('/auth/me');
          if (res.data.success && res.data.user) {
            setUser(res.data.user);
            localStorage.setItem('user', JSON.stringify(res.data.user));
          }
        } catch (err) {
          console.error('Session validation failed:', err.message);
          // Interceptor handles logout if expired, so we catch generally
        }
      }
      setLoading(false);
    };

    checkAuthStatus();

    // Event listener for token expiration triggered from api.js interceptor
    const handleLogoutEvent = () => {
      setUser(null);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
    };

    window.addEventListener('auth-logout', handleLogoutEvent);
    return () => window.removeEventListener('auth-logout', handleLogoutEvent);
  }, []);

  // Login action
  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.success && res.data.accessToken) {
        localStorage.setItem('accessToken', res.data.accessToken);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        setUser(res.data.user);
        return { success: true };
      }
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Invalid credentials or connection error',
      };
    }
  };

  // Register action
  const register = async (name, email, password) => {
    try {
      const res = await api.post('/api/auth/register', { name, email, password }); // In case api routing needs standard paths
      // Wait, we mapped /api/auth/register in routes, let's use relative path
      const registerRes = await api.post('/auth/register', { name, email, password });
      if (registerRes.data.success && registerRes.data.accessToken) {
        localStorage.setItem('accessToken', registerRes.data.accessToken);
        localStorage.setItem('user', JSON.stringify(registerRes.data.user));
        setUser(registerRes.data.user);
        return { success: true };
      }
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Registration failed. Try again.',
      };
    }
  };

  // Logout action
  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout request failed:', err.message);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      setUser(null);
    }
  };

  // Update profile details
  const updateProfile = async (name, email) => {
    try {
      const res = await api.put('/auth/me', { name, email });
      if (res.data.success && res.data.user) {
        localStorage.setItem('user', JSON.stringify(res.data.user));
        setUser(res.data.user);
        return { success: true };
      }
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Profile update failed.',
      };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
