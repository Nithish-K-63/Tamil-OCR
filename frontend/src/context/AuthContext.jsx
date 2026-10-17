import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { loginApi, registerApi, getCurrentUserApi, logoutApi } from '../api/authApi';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('tamilocr_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('tamilocr_token') || null;
  });

  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem('tamilocr_token')));

  // Validate active session token with backend on initial mount
  useEffect(() => {
    let isMounted = true;

    const verifySession = async () => {
      const activeToken = localStorage.getItem('tamilocr_token');
      if (!activeToken) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        const response = await getCurrentUserApi(activeToken);
        if (isMounted && response?.user) {
          setUser(response.user);
          localStorage.setItem('tamilocr_user', JSON.stringify(response.user));
        }
      } catch (err) {
        console.warn("[Auth] Session validation failed or expired:", err.message);
        if (isMounted) {
          setUser(null);
          setToken(null);
          localStorage.removeItem('tamilocr_token');
          localStorage.removeItem('tamilocr_user');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    verifySession();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (email, password, rememberMe = true) => {
    const result = await loginApi(email, password, rememberMe);
    if (result && result.token && result.user) {
      setToken(result.token);
      setUser(result.user);
      localStorage.setItem('tamilocr_token', result.token);
      localStorage.setItem('tamilocr_user', JSON.stringify(result.user));
      return { success: true, user: result.user };
    }
    throw new Error(result?.message || 'Authentication failed');
  }, []);

  const register = useCallback(async (userData) => {
    const result = await registerApi(userData);
    if (result && result.success) {
      if (result.token && result.user) {
        setToken(result.token);
        setUser(result.user);
        localStorage.setItem('tamilocr_token', result.token);
        localStorage.setItem('tamilocr_user', JSON.stringify(result.user));
      }
      return result;
    }
    throw new Error(result?.message || 'Registration failed');
  }, []);

  const setAuthSession = useCallback((authToken, authUser) => {
    setToken(authToken);
    setUser(authUser);
    localStorage.setItem('tamilocr_token', authToken);
    localStorage.setItem('tamilocr_user', JSON.stringify(authUser));
  }, []);

  const logout = useCallback(async () => {
    const currentToken = token || localStorage.getItem('tamilocr_token');
    try {
      if (currentToken) {
        await logoutApi(currentToken);
      }
    } catch {
      // Ignore network errors during logout
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('tamilocr_token');
      localStorage.removeItem('tamilocr_user');
    }
  }, [token]);

  const isAuthenticated = Boolean(user && token);

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated,
      loading,
      login,
      register,
      logout,
      setAuthSession
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
