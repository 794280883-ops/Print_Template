import { request } from "./request.js";

export function listRoles() { return request("/roles"); }
export function createRole(data) { return request("/roles", { method: "POST", body: JSON.stringify(data) }); }
export function updateRole(id, data) { return request(`/roles/${id}`, { method: "PUT", body: JSON.stringify(data) }); }
export function deleteRole(id) { return request(`/roles/${id}`, { method: "DELETE" }); }
export function getRoleMenus(id) { return request(`/roles/${id}/menus`); }
export function assignRoleMenus(id, menuIds) { return request(`/roles/${id}/menus`, { method: "PUT", body: JSON.stringify({ menuIds }) }); }
