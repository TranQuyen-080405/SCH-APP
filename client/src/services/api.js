const FIELD_ERRORS = {
  "Email không được để trống": "email",
  "Email không đúng định dạng": "email",
  "Mật khẩu không được để trống": "password",
  "Mật khẩu phải từ 8 đến 128 ký tự": "password",
  "Xác nhận mật khẩu không được để trống": "passwordConfirm",
  "Xác nhận mật khẩu không khớp": "passwordConfirm",
  "Tiêu đề không được để trống": "title",
  "Tiêu đề không được dài quá 200 ký tự": "title",
  "Tiêu đề không được dài quá 120 ký tự": "title",
  "Tiêu đề ghi chú không hợp lệ": "title",
  "Nội dung ghi chú không hợp lệ": "content",
  "Nội dung không được dài quá 10000 ký tự": "content",
  "Ngày ghi chú không hợp lệ": "notedOn",
  "Mô tả không hợp lệ": "description",
  "Mô tả không được dài quá 2000 ký tự": "description",
  "Deadline không phải ngày hợp lệ": "deadline",
  "Trạng thái không hợp lệ": "status",
  "Độ ưu tiên không hợp lệ": "priority",
  "Ghi chú kết quả không hợp lệ": "outcomeNote",
  "Ghi chú kết quả không được dài quá 2000 ký tự": "outcomeNote",
  "Tự đánh giá không hợp lệ": "outcomeRating",
};

export class ApiError extends Error {
  constructor(status, message, network = false) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.network = network;
  }
}

export async function request(path, { method = "GET", body } = {}) {
  const init = { method };
  if (body !== undefined) {
    init.headers = { "Content-Type": "application/json" };
    init.body = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(path, init);
  } catch {
    throw new ApiError(0, "Không kết nối được máy chủ.", true);
  }

  if (response.status === 204) return null;

  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    throw new ApiError(response.status, data?.error || "Lỗi máy chủ");
  }

  return data;
}

export function splitError(error) {
  const message = error?.message || "Lỗi máy chủ";
  const field = FIELD_ERRORS[message];
  if (!field) return { form: message, fields: {} };
  return { form: "", fields: { [field]: message } };
}
