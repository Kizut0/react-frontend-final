import { useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useUser } from "../contexts/useUser";

const initialForm = {
  username: "",
  email: "",
  password: "",
  firstname: "",
  lastname: "",
};

export default function Login() {
  const { user, isHydrating, login, register } = useUser();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedMode = searchParams.get("mode") === "register" ? "register" : "login";
  const [form, setForm] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  function updateForm(event) {
    const { name, value } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  }

  async function onSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    const result =
      requestedMode === "login"
        ? await login(form.email, form.password)
        : await register(form);

    if (!result.ok) {
      setError(result.message);
    }

    setIsSubmitting(false);
  }

  function onModeChange(nextMode) {
    setError("");
    navigate(`/login?mode=${nextMode}`);
  }

  if (isHydrating) {
    return (
      <div className="page-shell">
        <section className="panel loading-panel">
          <p className="eyebrow">Authentication</p>
          <h2>Loading your session...</h2>
        </section>
      </div>
    );
  }

  if (user.isLoggedIn) {
    return <Navigate to="/books" replace />;
  }

  return (
    <div className="page-shell auth-shell">
      <section className="panel auth-card">
        <h2 className="page-title">{requestedMode === "login" ? "Login" : "Create Account"}</h2>
        <p className="section-copy auth-copy">
          {requestedMode === "login"
            ? "Sign in to manage books and borrow records."
            : "Only admin@test.com and admin@gmail.com will register as ADMIN. All other emails become USER accounts."}
        </p>

        <div className="auth-toggle">
          <button
            type="button"
            className={`toggle-button ${requestedMode === "login" ? "active" : ""}`}
            onClick={() => onModeChange("login")}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`toggle-button ${requestedMode === "register" ? "active" : ""}`}
            onClick={() => onModeChange("register")}
          >
            Create Account
          </button>
        </div>

        <form className="form-grid auth-form" onSubmit={onSubmit}>
          {requestedMode === "register" && (
            <>
              <label className="field">
                <span>Username</span>
                <input
                  type="text"
                  name="username"
                  value={form.username}
                  onChange={updateForm}
                  placeholder="admin01"
                  required
                />
              </label>
              <label className="field">
                <span>First Name</span>
                <input
                  type="text"
                  name="firstname"
                  value={form.firstname}
                  onChange={updateForm}
                  placeholder="Aung"
                />
              </label>
              <label className="field">
                <span>Last Name</span>
                <input
                  type="text"
                  name="lastname"
                  value={form.lastname}
                  onChange={updateForm}
                  placeholder="Myat"
                />
              </label>
            </>
          )}

          <label className="field">
            <span>Email</span>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={updateForm}
              placeholder="admin@example.com"
              required
            />
          </label>

          <label className="field">
            <span>Password</span>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={updateForm}
              placeholder="Enter a secure password"
              required
            />
          </label>

          {error ? <p className="form-error">{error}</p> : null}

          <button type="submit" className="form-submit" disabled={isSubmitting}>
            {isSubmitting
              ? requestedMode === "login"
                ? "Signing in..."
                : "Creating account..."
              : requestedMode === "login"
                ? "Sign In"
                : "Create Account"}
          </button>
        </form>
      </section>
    </div>
  );
}
