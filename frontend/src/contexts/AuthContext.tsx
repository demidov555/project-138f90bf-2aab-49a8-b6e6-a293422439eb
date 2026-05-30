import React, { createContext, useEffect, useState } from "react";
import {
  loginApi,
  registerApi,
  refreshApi,
  meApi,
  logoutApi
} from "../api/auth";
import { User } from "../types";

interface AuthContextValue {
  user: User | null;
  accessToken: string | null;
  initializing: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue>({} as AuthContextValue);

let accessTokenRef: string | null = null;
export const getAccessToken = () => accessTokenRef;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const token = await refreshApi();
        setAccessToken(token);
        accessTokenRef = token;
        const me = await meApi();
        setUser(me);
      } catch {
        setUser(null);
        setAccessToken(null);
        accessTokenRef = null;
      } finally {
        setInitializing(false);
      }
    };
    init();
  }, []);

  const login = async (email: string, password: string) => {
    const { user, accessToken } = await loginApi(email, password);
    setUser(user);
    setAccessToken(accessToken);
    accessTokenRef = accessToken;
  };

  const register = async (name: string, email: string, password: string) => {
    const { user, accessToken } = await registerApi(name, email, password);
    setUser(user);
    setAccessToken(accessToken);
    accessTokenRef = accessToken;
  };

  const logout = async () => {
    await logoutApi();
    setUser(null);
    setAccessToken(null);
    accessTokenRef = null;
  };

  return (
    <AuthContext.Provider
      value={{ user, accessToken, initializing, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};
