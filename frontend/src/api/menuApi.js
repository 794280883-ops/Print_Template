import { request } from "./request.js";

export function listMenus() { return request("/menus"); }
export function createMenu(data) { return request("/menus", { method: "POST", body: JSON.stringify(data) }); }
export function updateMenu(id, data) { return request(`/menus/${id}`, { method: "PUT", body: JSON.stringify(data) }); }
export function deleteMenu(id) { return request(`/menus/${id}`, { method: "DELETE" }); }
