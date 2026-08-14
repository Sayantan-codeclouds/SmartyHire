import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('sh_token');
      if (token) {
        try {
          const res = await api.get('/auth/me');
          if (res.data.success) {
            setUser(res.data.user);
            setCompany(res.data.user.company);
          }
        } catch (err) {
          console.error('[Auth Check Failed]', err);
          localStorage.removeItem('sh_token');
          localStorage.removeItem('sh_refreshToken');
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.success) {
      localStorage.setItem('sh_token', res.data.token);
      localStorage.setItem('sh_refreshToken', res.data.refreshToken);
      setUser(res.data.user);
      setCompany(res.data.user.company);
    }
    return res.data;
  };

  const registerCompany = async (companyName, name, email, password) => {
    const res = await api.post('/auth/register', { companyName, name, email, password });
    if (res.data.success) {
      localStorage.setItem('sh_token', res.data.token);
      localStorage.setItem('sh_refreshToken', res.data.refreshToken);
      setUser(res.data.user);
      setCompany(res.data.user.company);
    }
    return res.data;
  };

  const updateUserProfile = async (formData) => {
    const res = await api.put('/auth/profile', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    if (res.data.success) {
      setUser((prev) => ({ ...prev, ...res.data.user }));
    }
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('sh_token');
    localStorage.removeItem('sh_refreshToken');
    setUser(null);
    setCompany(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, company, loading, login, registerCompany, updateUserProfile, logout, setCompany, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
