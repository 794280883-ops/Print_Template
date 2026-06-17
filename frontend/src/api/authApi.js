import { request } from "./request.js";

export function login(username, password) {
  return request("/auth/login", { method: "POST", body: JSON.stringify({ username, password }) });
}
