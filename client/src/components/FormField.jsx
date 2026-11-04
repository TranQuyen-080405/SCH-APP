import { cloneElement, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export const controlClass =
  "box-border w-full min-w-0 max-w-full rounded-control border border-line bg-surface px-3 text-base text-ink";

export default function FormField({ label, name, error, type, children, ...rest }) {
  const [visible, setVisible] = useState(false);
  const password = type === "password";
  const describedBy = error ? `${name}-error` : undefined;
  const shared = {
    id: name,
    name,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": describedBy,
  };

  let control;
  if (children) {
    control = cloneElement(children, {
      ...shared,
      className: [controlClass, children.props.className].filter(Boolean).join(" "),
    });
  } else {
    control = (
      <div className="relative">
        <input
          {...rest}
          {...shared}
          type={password && visible ? "text" : type || "text"}
          className={`${controlClass} h-11 ${password ? "pr-12" : ""}`}
        />
        {password ? (
          <button
            type="button"
            className="absolute top-0 right-0 flex h-11 w-11 items-center justify-center text-muted"
            aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            aria-pressed={visible}
            onClick={() => setVisible((value) => !value)}
          >
            {visible ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={name} className="text-sm font-medium text-ink">
        {label}
      </label>
      {control}
      {error ? (
        <p id={`${name}-error`} role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
