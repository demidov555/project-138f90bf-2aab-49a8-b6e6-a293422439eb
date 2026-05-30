import { Link } from "react-router-dom";
import RegistrationForm from "../components/RegistrationForm";

export default function Register() {
  return (
    <div className="auth-container">
      <RegistrationForm />
      <p className="switch-auth">
        Уже есть аккаунт? <Link to="/login">Войти</Link>
      </p>
    </div>
  );
}
