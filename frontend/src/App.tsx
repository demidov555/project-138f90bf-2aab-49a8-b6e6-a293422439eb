import { Navigate, Route, Routes } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import AuthPage from "./pages/AuthPage";
import Register from "./pages/Register";
import { useAuth } from "./hooks/useAuth";
import Loader from "./components/Loader";

export default function App() {
  const { user, loading } = useAuth();

  if (loading) return <Loader />;

  return (
    <Routes>
      {!user ? (
        <>
          {/* Public routes */}
          <Route path="/login" element={<AuthPage />} />
          <Route path="/register" element={<Register />} />
          {/* Legacy redirect from old /auth path */}
          <Route path="/auth" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </>
      ) : (
        <>
          <Route path="/" element={<Dashboard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </>
      )}
    </Routes>
  );
}
