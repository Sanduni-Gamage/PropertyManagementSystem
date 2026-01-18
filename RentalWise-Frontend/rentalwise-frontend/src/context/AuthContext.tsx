import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';


type User = {
  role: string;
  email?: string;
  
};

type DecodedToken = {
  role: string;
  email?: string;
  exp: number; // Expiration time in seconds
};

interface AuthContextType {
  user: User | null;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); 
  const navigate = useNavigate();

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
    toast.warn('Session expired. You’ve been logged out.');
    navigate('/login');
  }, [navigate]);

  const login = (token: string) => {
    localStorage.setItem('token', token);
    const decoded: DecodedToken = jwtDecode(token);
    setUser({ role: decoded.role, email: decoded.email });

    // Set auto logout based on token expiration
    const expiryTimeMs = decoded.exp * 1000 - Date.now();
    if (expiryTimeMs > 0) {
      setTimeout(logout, expiryTimeMs);
    } else {
      logout(); // Token already expired
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded: DecodedToken = jwtDecode(token);
        if (decoded.exp * 1000 > Date.now()) {
          setUser({ role: decoded.role, email: decoded.email });

          // Auto logout timer
          const timeLeft = decoded.exp * 1000 - Date.now();
          setTimeout(logout, timeLeft);
        } else {
          logout(); // Token expired on load
        }
      } catch (err) {
        console.error('Invalid token');
        logout();
      }
    }
    setLoading(false);
  }, [logout]);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
    {!loading ? children : <div className="text-center py-10">Loading authentication...</div>}
  </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
