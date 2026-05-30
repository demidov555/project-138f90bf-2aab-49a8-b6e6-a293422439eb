import axios from "axios";

// Base URL for all API requests. Can be overridden via Vite env variable.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || "/api",
});

// Reads accessToken from localStorage.
function getAccessToken(): string | null {
  return localStorage.getItem("accessToken");
}

// Inject Authorization header if token is present.
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };
  }
  return config;
});

export default api;
