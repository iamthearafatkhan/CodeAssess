import { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access');
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get('me/')
      .then((res) => setUser(res.data))
      .catch(() => {
        localStorage.removeItem('access');
        localStorage.removeItem('refresh');
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const res = await api.post('login/', { email, password });
    localStorage.setItem('access', res.data.access);
    localStorage.setItem('refresh', res.data.refresh);
    const me = await api.get('me/');
    setUser(me.data);
    return me.data;
  };

  const register = async (payload) => {
    await api.post('register/', payload);
    return login(payload.email, payload.password);
  };

  const logout = () => {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    setUser(null);
  };

  const refreshUser = async () => {
    const me = await api.get('me/');
    setUser(me.data);
    return me.data;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}