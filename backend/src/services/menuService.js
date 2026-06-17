import * as menuRepo from "../repositories/menuRepository.js";
import { appError } from "../utils/response.js";

export async function listMenus() { return menuRepo.listAllMenus(); }

export async function createMenu(payload) {
  if (!payload.name || !payload.type) throw appError("菜单名称和类型必填", 40000, 400);
  return menuRepo.createMenu({
    parent_id: payload.parent_id || 0, name: payload.name.trim(), type: payload.type,
    path: payload.path || null, component: payload.component || null,
    permission_code: payload.permission_code || null, icon: payload.icon || null,
    sort_no: payload.sort_no || 0, visible: payload.visible !== undefined ? payload.visible : 1, status: 1,
  });
}

export async function updateMenu(id, payload) {
  const exists = await menuRepo.findById(id);
  if (!exists) throw appError("菜单不存在", 40400, 404);
  return menuRepo.updateMenu(id, {
    parent_id: payload.parent_id !== undefined ? payload.parent_id : exists.parent_id,
    name: payload.name || exists.name, type: payload.type || exists.type,
    path: payload.path !== undefined ? payload.path : exists.path,
    component: payload.component !== undefined ? payload.component : exists.component,
    permission_code: payload.permission_code !== undefined ? payload.permission_code : exists.permission_code,
    icon: payload.icon !== undefined ? payload.icon : exists.icon,
    sort_no: payload.sort_no !== undefined ? payload.sort_no : exists.sort_no,
    visible: payload.visible !== undefined ? payload.visible : exists.visible,
    status: payload.status !== undefined ? payload.status : exists.status,
  });
}

export async function deleteMenu(id) {
  const affected = await menuRepo.deleteMenu(id);
  if (!affected) throw appError("菜单不存在", 40400, 404);
  return { deleted: true };
}
