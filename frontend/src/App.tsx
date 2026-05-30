import { Navigate, Route, Routes } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import AuthPage from "./pages/AuthPage";
import { useAuth } from "./hooks/useAuth";
import Loader from "./components/Loader";

export default function App() {
  const { user, loading, logout } = useAuth();

  if (loading) return <Loader />;

  return (
    <>
      {user && (
        <header className="app-header">
          <span className="user-info">{user.name || user.email}</span>
          <button onClick={logout}>Выйти</button>
        </header>
      )}
      <Routes>
        <Route
          path="/auth"
          element={user ? <Navigate to="/dashboard" /> : <AuthPage />}
        />
        <Route
          path="/dashboard"
          element={user ? <Dashboard /> : <Navigate to="/auth" />}
        />
        {/* fallback */}
        <Route
          path="*"
          element={<Navigate to={user ? "/dashboard" : "/auth"} />}
        />
      </Routes>
    </>
  );
}
