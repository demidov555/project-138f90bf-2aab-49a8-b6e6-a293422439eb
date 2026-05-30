import { Navigate, Route, Routes } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import AuthPage from "./pages/AuthPage";
import { useAuth } from "./hooks/useAuth";
import Loader from "./components/Loader";

export default function App() {
  const { user, loading } = useAuth();

  if (loading) return <Loader />;

  return (
    <Routes>
      {/* Root route renders combined AuthPage when user is not authenticated */}
      <Route
        path="/"
        element={user ? <Navigate to="/dashboard" replace /> : <AuthPage />}
      />

      {/* Legacy paths redirect to root */}
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="/register" element={<Navigate to="/" replace />} />

      {/* Protected dashboard */}
      <Route
        path="/dashboard"
        element={user ? <Dashboard /> : <Navigate to="/" replace />}
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
