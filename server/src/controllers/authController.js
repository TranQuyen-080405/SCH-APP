import * as authService from "../services/authService.js";

export async function register(req, res) {
  const user = await authService.register(req.body);
  res.status(201).json({ user });
}

export async function login(req, res) {
  const user = await authService.login(req.body);
  req.session.userId = user.id;
  res.json({ user });
}

export async function me(req, res) {
  const user = authService.me(req.session?.userId);
  res.json({ user });
}

export function logout(req, res, next) {
  const done = () => {
    res.clearCookie("sid", {
      path: "/",
      httpOnly: true,
      sameSite: process.env.SESSION_COOKIE_SAME_SITE || "lax",
      secure: process.env.SESSION_COOKIE_SECURE === "true",
    });
    res.status(204).end();
  };
  if (!req.session) {
    done();
    return;
  }
  req.session.destroy((err) => {
    if (err) {
      next(err);
      return;
    }
    done();
  });
}
