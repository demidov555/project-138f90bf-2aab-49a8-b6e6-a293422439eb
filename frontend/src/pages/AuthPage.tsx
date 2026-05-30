import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

function validateEmail(email: string) {
  // simple RFC 5322 compliant regex
  const re = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;
  return re.test(email);
}

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const navigate = useNavigate();
  const { user, login, register } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) navigate("/dashboard");
  }, [user, navigate]);

  function reset() {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    // общие проверки
    if (!email || !password || (mode === "register" && !confirmPassword)) {
      setError("Заполните все поля");
      return;
    }
    if (!validateEmail(email)) {
      setError("Введите корректный email");
      return;
    }

    if (mode === "login") {
      try {
        await login(email, password);
        navigate("/dashboard");
      } catch (err: any) {
        setError(err.message || "Неверный email или пароль");
      }
    } else {
      // register mode
      if (password.length < 6) {
        setError("Пароль должен быть не короче 6 символов");
        return;
      }
      if (password !== confirmPassword) {
        setError("Пароли не совпадают");
        return;
      }
      try {
        await register(email, password);
        alert("Регистрация успешна, теперь войдите");
        setMode("login");
        reset();
      } catch (err: any) {
        setError(err.message || "Ошибка регистрации");
      }
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-tabs">
          <button
            className={mode === "login" ? "active" : ""}
            onClick={() => {
              setMode("login");
              reset();
            }}
          >
            Войти
          </button>
          <button
            className={mode === "register" ? "active" : ""}
            onClick={() => {
              setMode("register");
              reset();
            }}
          >
            Регистрация
          </button>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {mode === "register" && (
            <input
              type="password"
              placeholder="Подтверждение пароля"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          )}
          {error && <div className="error-text">{error}</div>}
          <button type="submit" className="primary-btn">
            {mode === "login" ? "Войти" : "Зарегистрироваться"}
          </button>
        </form>
      </div>
    </div>
  );
}
