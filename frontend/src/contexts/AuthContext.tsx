import React, { createContext, useEffect, useState } from "react";
import { User } from "../types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const defaultValue: AuthContextValue = {
  user: null,
  loading: true,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  login: async () => {},
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  register: async () => {},
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  logout: () => {}
};

export const AuthContext = createContext<AuthContextValue>(defaultValue);

function getUsers() {
  try {
    return JSON.parse(localStorage.getItem("users") || "[]") as Array<{
      email: string;
      password: string;
    }>;
  } catch {
    return [];
  }
}

function saveUsers(users: { email: string; password: string }[]) {
  localStorage.setItem("users", JSON.stringify(users));
}

function createUserObject(email: string): User {
  return {
    id: email,
    name: email.split("@")[0],
    email,
    role: email === "admin" ? "admin" : "user",
    created_at: new Date().toISOString()
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("currentUser");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        /* ignore */
      }
    }
    setLoading(false);
  }, []);

  async function login(email: string, password: string) {
    // системная учётка admin/admin
    if (email === "admin" && password === "admin") {
      const adminUser = createUserObject("admin");
      localStorage.setItem("currentUser", JSON.stringify(adminUser));
      setUser(adminUser);
      return;
    }

    const users = getUsers();
    const found = users.find((u) => u.email === email && u.password === password);
    if (!found) {
      throw new Error("Неверный email или пароль");
    }
    const userObj = createUserObject(found.email);
    localStorage.setItem("currentUser", JSON.stringify(userObj));
    setUser(userObj);
  }

  async function register(email: string, password: string) {
    const users = getUsers();
    if (users.some((u) => u.email === email)) {
      throw new Error("Пользователь с таким email уже зарегистрирован");
    }
    users.push({ email, password });
    saveUsers(users);
  }

  function logout() {
    localStorage.removeItem("currentUser");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
