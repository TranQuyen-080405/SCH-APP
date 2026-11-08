import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import FormField from "../components/FormField.jsx";
import { splitError } from "../services/api.js";
import { login } from "../services/authApi.js";

const emptyError = { form: "", fields: {} };
const DEMO_EMAIL = "user@example.com";
const DEMO_PASSWORD = "12345678";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const created = Boolean(location.state?.created);
  const [email, setEmail] = useState(DEMO_EMAIL);
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [error, setError] = useState(emptyError);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(emptyError);
    try {
      await login({ email, password });
      navigate("/", { replace: true });
    } catch (err) {
      setError(splitError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-dvh bg-canvas px-6 pt-8 md:grid md:place-items-center md:p-6">
      <div className="flex w-full flex-col gap-6 md:w-[400px] md:rounded-card md:border md:border-line md:bg-surface md:p-8">
        <h1 className="font-display text-4xl font-normal tracking-tight">
          Đăng nhập
        </h1>
        {created ? (
          <p className="text-sm text-success" role="status">
            Tài khoản đã được tạo. Đăng nhập để tiếp tục.
          </p>
        ) : null}
        {error.form ? (
          <p className="text-sm text-danger" role="alert">
            {error.form}
          </p>
        ) : null}
        <form
          className="flex flex-col gap-4"
          noValidate
          onSubmit={handleSubmit}
        >
          <FormField
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            error={error.fields.email}
          />
          <FormField
            label="Mật khẩu"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            error={error.fields.password}
          />
          <button
            type="submit"
            className="inline-flex h-11 w-full items-center justify-center rounded-control bg-primary text-white transition-colors duration-200 hover:bg-primary-hover disabled:opacity-60"
            disabled={submitting}
          >
            {submitting ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>
        <Link to="/register" className="text-center text-sm text-primary">
          Chưa có tài khoản? Đăng ký
        </Link>
      </div>
    </main>
  );
}
