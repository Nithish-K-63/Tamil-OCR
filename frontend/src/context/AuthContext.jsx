import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('tamilocr_user');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return null; }
    }
    return {
      name: "Arun Kumar",
      email: "name@department.gov.in",
      role: "Project Administrator",
      department: "Tamil Nadu Heritage Records Division",
      badgeId: "TN-ARCH-2025",
      avatar: "AK"
    };
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => !!user);

  useEffect(() => {
    if (user) {
      localStorage.setItem('tamilocr_user', JSON.stringify(user));
      setIsAuthenticated(true);
    } else {
      localStorage.removeItem('tamilocr_user');
      setIsAuthenticated(false);
    }
  }, [user]);

  const login = (email, password, rememberMe = true) => {
    const mockUser = {
      name: email.split('@')[0].replace('.', ' ').toUpperCase() || "Archive Specialist",
      email: email,
      role: "Archive Officer & OCR Specialist",
      department: "Directorate of Historical Archives, Tamil Nadu",
      badgeId: `TN-GOV-${Math.floor(1000 + Math.random() * 9000)}`,
      avatar: email.substring(0, 2).toUpperCase()
    };
    setUser(mockUser);
    return { success: true, user: mockUser };
  };

  const register = (userData) => {
    const newUser = {
      name: userData.fullName || "New Officer",
      email: userData.email,
      role: userData.role || "OCR Analyst",
      department: userData.department || "Tamil Nadu Archives",
      badgeId: userData.badgeId || `TN-NEW-${Math.floor(1000 + Math.random() * 9000)}`,
      avatar: (userData.fullName || "NO").substring(0, 2).toUpperCase()
    };
    setUser(newUser);
    return { success: true, user: newUser };
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
