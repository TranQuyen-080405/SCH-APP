import { HttpError } from "../errors.js";

export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    next(err);
    return;
  }
  // Express báo JSON hỏng bằng SyntaxError tiếng Anh; hợp đồng chỉ cho một câu.
  if (err.type === "entity.parse.failed" || (err instanceof SyntaxError && err.status === 400)) {
    res.status(400).json({ error: "Body không phải JSON" });
    return;
  }
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  console.error(err);
  res.status(500).json({ error: "Lỗi máy chủ" });
}
