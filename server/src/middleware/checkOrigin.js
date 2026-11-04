import { HttpError } from "../errors.js";

const WRITE = new Set(["POST", "PATCH", "DELETE"]);

export function checkOrigin(req, res, next) {
  if (!WRITE.has(req.method)) {
    next();
    return;
  }
  const origin = req.get("origin");
  if (origin && origin !== process.env.CLIENT_ORIGIN) {
    next(new HttpError(403, "Nguồn request không hợp lệ"));
    return;
  }
  next();
}
