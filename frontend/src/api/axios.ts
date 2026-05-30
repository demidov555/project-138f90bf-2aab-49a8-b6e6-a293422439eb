import axios from "axios";
import { getAccessToken } from "../contexts/AuthContext";

// Determine API base URL from environment variable (set during deployment).
// For Vite, only variables prefixed with VITE_ are exposed to the client.
// FALLBACK: if not provided, default to relative "/api" for local development.
const apiDomain = (import.meta.env.VITE_API_URL as string | undefined) || "";
const apiBaseUrl = `${apiDomain.replace(/\/+$/, "")}/api`;

const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`
    };
  }
  return config;
});

export default api;
