import { request } from "./request.js";

export function listUsers(params) {
  const qs = new URLSearchParams(params).toString();
  return request(`/users${qs ? '?' + qs : ''}`);
}
export function createUser(data) { return request("/users", { method: "POST", body: JSON.stringify(data) }); }
export function updateUser(id, data) { return request(`/users/${id}`, { method: "PUT", body: JSON.stringify(data) }); }
export function deleteUser(id) { return request(`/users/${id}`, { method: "DELETE" }); }
export function changePassword(id, password) { return request(`/users/${id}/password`, { method: "PUT", body: JSON.stringify({ password }) }); }
