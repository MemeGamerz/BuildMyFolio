import React, { createContext, useState, useEffect } from 'react';
import api from '../api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const[user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    const userName = localStorage.getItem('userName');
    const userPlan = localStorage.getItem('userPlan');
    
    if (token && userId) {
      setUser({ token, id: userId, name: userName, plan: userPlan || 'Hobby' });
    }
    setLoading(false);
  },[]);

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { token, userId, name, plan } = response.data;
    
    localStorage.setItem('token', token);
    localStorage.setItem('userId', userId);
    if (name) localStorage.setItem('userName', name);
    if (plan) localStorage.setItem('userPlan', plan);
    
    setUser({ token, id: userId, name, plan: plan || 'Hobby' });
  };

  const register = async (name, gender, email, password) => {
    const response = await api.post('/auth/register', { name, gender, email, password });
    const { token, userId, name: userName, plan } = response.data;
    
    localStorage.setItem('token', token);
    localStorage.setItem('userId', userId);
    if (userName) localStorage.setItem('userName', userName);
    if (plan) localStorage.setItem('userPlan', plan);
    
    setUser({ token, id: userId, name: userName, plan: plan || 'Hobby' });
  };

  // Dynamic method to update UI instantly after Checkout Modal completes
  const updatePlan = (newPlan) => {
    localStorage.setItem('userPlan', newPlan);
    setUser(prev => ({ ...prev, plan: newPlan }));
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updatePlan, loading }}>
      {children}
    </AuthContext.Provider>
  );
};