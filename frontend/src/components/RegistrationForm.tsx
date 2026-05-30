import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";

interface FormValues {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export default function RegistrationForm() {
  const navigate = useNavigate();

  const [values, setValues] = useState<FormValues>({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  function validate(current: FormValues): FormErrors {
    const newErrors: FormErrors = {};

    if (!current.email) {
      newErrors.email = "Email обязателен";
    } else if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,}$/i.test(current.email)) {
      newErrors.email = "Неверный формат email";
    }

    if (!current.password) {
      newErrors.password = "Пароль обязателен";
    } else if (current.password.length < 8) {
      newErrors.password = "Пароль должен быть не короче 8 символов";
    }

    if (!current.confirmPassword) {
      newErrors.confirmPassword = "Подтверждение пароля обязательно";
    } else if (current.password !== current.confirmPassword) {
      newErrors.confirmPassword = "Пароли не совпадают";
    }

    return newErrors;
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const validationErrors = validate(values);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length !== 0) return;

    // Заглушка регистрации
    setSubmitting(true);
    console.log("Registration data", values);

    setTimeout(() => {
      window.alert("Регистрация успешна. Пожалуйста, войдите.");
      navigate("/login");
    }, 500);
  }

  const isValid = Object.keys(validate(values)).length === 0;

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <h2>Регистрация</h2>

      <div className="form-group">
        <label htmlFor="name">Имя</label>
        <input
          id="name"
          name="name"
          type="text"
          placeholder="Ваше имя"
          aria-label="Имя"
          value={values.name}
          onChange={handleChange}
        />
        {errors.name && <span className="error-text">{errors.name}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="email">Email *</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          placeholder="example@mail.com"
          aria-label="Email"
          value={values.email}
          onChange={handleChange}
        />
        {errors.email && <span className="error-text">{errors.email}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="password">Пароль *</label>
        <input
          id="password"
          name="password"
          type="password"
          required
          placeholder="Минимум 8 символов"
          aria-label="Пароль"
          value={values.password}
          onChange={handleChange}
        />
        {errors.password && <span className="error-text">{errors.password}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="confirmPassword">Подтвердите пароль *</label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          placeholder="Повторите пароль"
          aria-label="Подтверждение пароля"
          value={values.confirmPassword}
          onChange={handleChange}
        />
        {errors.confirmPassword && (
          <span className="error-text">{errors.confirmPassword}</span>
        )}
      </div>

      <button
        type="submit"
        aria-label="Зарегистрироваться"
        disabled={!isValid || submitting}
        className="primary-btn"
      >
        {submitting ? "..." : "Зарегистрироваться"}
      </button>
    </form>
  );
}
