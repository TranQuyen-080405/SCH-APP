import { cloneElement, useEffect, useState } from "react";
import { Navigate } from "react-router";
import { me } from "../services/authApi.js";

export default function ProtectedRoute({ children }) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState({ status: "loading", user: null, message: "" });

  useEffect(() => {
    let live = true;
    me()
      .then((user) => {
        if (live) setState({ status: "ready", user, message: "" });
      })
      .catch((error) => {
        if (!live) return;
        if (error.status === 401) {
          setState({ status: "anon", user: null, message: "" });
          return;
        }
        setState({
          status: "error",
          user: null,
          message: error.message || "Không kết nối được máy chủ.",
        });
      });
    return () => {
      live = false;
    };
  }, [attempt]);

  if (state.status === "loading") {
    return (
      <div className="grid min-h-dvh place-items-center bg-canvas text-base text-ink">
        Đang tải...
      </div>
    );
  }

  if (state.status === "anon") return <Navigate to="/login" replace />;

  if (state.status === "error") {
    return (
      <div className="grid min-h-dvh place-items-center bg-canvas px-6 text-center text-ink">
        <div className="flex flex-col items-center gap-4">
          <p>{state.message}</p>
          <button
            type="button"
            className="inline-flex h-11 items-center rounded-control bg-primary px-4 text-white hover:bg-primary-hover"
            onClick={() => {
              setState({ status: "loading", user: null, message: "" });
              setAttempt((value) => value + 1);
            }}
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return cloneElement(children, { user: state.user });
}
