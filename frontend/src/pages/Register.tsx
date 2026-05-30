import { Link } from "react-router-dom";
import RegistrationForm from "../components/RegistrationForm";

export default function Register() {
  return (
    <div className="auth-container">
      <h1>Register</h1>
      <RegistrationForm />
      <p>
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  );
}
