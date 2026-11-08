import { useState } from "react";
import { Link, useNavigate } from "react-router";
import FormField from "../components/FormField.jsx";
import { splitError } from "../services/api.js";
import { register } from "../services/authApi.js";

const emptyError = { form: "", fields: {} };

export default function RegisterPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState(emptyError);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;
    if (password !== passwordConfirm) {
      setError({
        form: "",
        fields: { passwordConfirm: "Xác nhận mật khẩu không khớp" },
      });
      return;
    }
    setSubmitting(true);
    setError(emptyError);
    try {
      await register({ email, password, passwordConfirm });
      navigate("/login", { state: { created: true } });
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
          Đăng ký
        </h1>
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
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            error={error.fields.password}
          />
          <FormField
            label="Xác nhận mật khẩu"
            name="passwordConfirm"
            type="password"
            autoComplete="new-password"
            value={passwordConfirm}
            onChange={(event) => setPasswordConfirm(event.target.value)}
            error={error.fields.passwordConfirm}
          />
          <button
            type="submit"
            className="inline-flex h-11 w-full items-center justify-center rounded-control bg-primary text-white transition-colors duration-200 hover:bg-primary-hover disabled:opacity-60"
            disabled={submitting}
          >
            {submitting ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
          </button>
        </form>
        <Link to="/login" className="text-center text-sm text-primary">
          Đã có tài khoản? Đăng nhập
        </Link>
      </div>
    </main>
  );
}
