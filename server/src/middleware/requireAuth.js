import { HttpError } from "../errors.js";

export function requireAuth(req, res, next) {
  if (!req.session?.userId) {
    next(new HttpError(401, "Chưa đăng nhập"));
    return;
  }
  next();
}
