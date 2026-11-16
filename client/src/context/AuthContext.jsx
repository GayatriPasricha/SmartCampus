import React, { createContext, useContext, useState, useEffect } from 'react';
import { getStoredUser, getToken, authApi } from '../api/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser());
  const [token, setToken] = useState(getToken());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      setToken(null);
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    window.addEventListener('auth:logout', handleUnauthorized);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
      window.removeEventListener('auth:logout', handleUnauthorized);
    };
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    const res = await authApi.login(email, password);
    setLoading(false);
    if (res.ok) {
      const token = res.token || res.raw?.token || getToken();
      const user = res.data;
      if (token && user) {
        setUser(user);
        setToken(token);
        return { success: true };
      }
    }
    return { success: false, message: res.message || 'Login failed' };
  };

  const register = async (name, email, password, role) => {
    setLoading(true);
    const res = await authApi.register(name, email, password, role);
    setLoading(false);
    if (res.ok) {
      const token = res.token || res.raw?.token || getToken();
      const user = res.data;
      if (token && user) {
        setUser(user);
        setToken(token);
        return { success: true };
      }
    }
    return { success: false, message: res.message || 'Registration failed' };
  };

  const logout = () => {
    authApi.logout();
    setUser(null);
    setToken(null);
  };

  const isStudent = user?.role === 'student';
  const isFaculty = user?.role === 'faculty';
  const isAdmin = user?.role === 'admin';
  const canManageAttendance = isFaculty || isAdmin;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token && !!user,
        isStudent,
        isFaculty,
        isAdmin,
        canManageAttendance,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
