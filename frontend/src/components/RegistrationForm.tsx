import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";

interface FormValues {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export default function RegistrationForm() {
  const navigate = useNavigate();

  const [values, setValues] = useState<FormValues>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");

  const validateEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setValues({ ...values, [e.target.name]: e.target.value });
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (values.name.trim().length < 2) {
      setError("Name must be at least 2 characters");
      return;
    }
    if (!validateEmail(values.email)) {
      setError("Invalid email");
      return;
    }
    if (values.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (values.password !== values.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    // Persist user to localStorage (demo only)
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    users.push({
      id: Date.now().toString(),
      name: values.name,
      email: values.email,
      password: values.password,
    });
    localStorage.setItem("users", JSON.stringify(users));

    alert("Аккаунт создан, войдите");
    navigate("/login");
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <p className="error">{error}</p>}
      <input
        name="name"
        placeholder="Name"
        value={values.name}
        onChange={handleChange}
      />
      <input
        name="email"
        type="email"
        placeholder="Email"
        value={values.email}
        onChange={handleChange}
      />
      <input
        name="password"
        type="password"
        placeholder="Password"
        value={values.password}
        onChange={handleChange}
      />
      <input
        name="confirmPassword"
        type="password"
        placeholder="Confirm password"
        value={values.confirmPassword}
        onChange={handleChange}
      />
      <button type="submit">Register</button>
    </form>
  );
}
