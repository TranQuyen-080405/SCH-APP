import { ApiError, request } from "./api.js";

export function register(body) {
  return request("/api/auth/register", { method: "POST", body });
}

export function login(body) {
  return request("/api/auth/login", { method: "POST", body });
}

export function logout() {
  return request("/api/auth/logout", { method: "POST" });
}

export async function me() {
  const data = await request("/api/auth/me");
  if (!data?.user) throw new ApiError(500, "Lỗi máy chủ");
  return data.user;
}
