import axios from "axios";
import { getAccessToken } from "../contexts/AuthContext";

// Determine base URL: in development we may override via VITE_API_URL,
// otherwise (production build) we always point to the Render backend.
const baseURL =
  (import.meta.env.VITE_API_URL as string) ||
  "https://project-e506628f-8ee9-434a-9890.onrender.com";

const api = axios.create({
  baseURL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

export default api;
