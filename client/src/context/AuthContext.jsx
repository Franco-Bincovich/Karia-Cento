// context/AuthContext.jsx
// JWT almacenado SOLO en estado React — nunca localStorage.
// Al refrescar la página el usuario tiene que volver a loguearse (comportamiento correcto).

import { createContext, useState, useCallback } from 'react';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);

  const login = useCallback((tokenRecibido, datosUsuario) => {
    setToken(tokenRecibido);
    setUser(datosUsuario);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}
