import * as roleRepo from "../repositories/roleRepository.js";
import { appError } from "../utils/response.js";

export async function listRoles() { return roleRepo.listRoles(); }

export async function createRole(payload) {
  if (!payload.code || !payload.name) throw appError("角色编码和名称必填", 40000, 400);
  return roleRepo.createRole({ code: payload.code.trim().toUpperCase(), name: payload.name.trim() });
}

export async function updateRole(id, payload) {
  const exists = await roleRepo.findById(id);
  if (!exists) throw appError("角色不存在", 40400, 404);
  return roleRepo.updateRole(id, {
    code: payload.code || exists.code,
    name: payload.name || exists.name,
    status: payload.status !== undefined ? payload.status : exists.status,
  });
}

export async function deleteRole(id) {
  const affected = await roleRepo.deleteRole(id);
  if (!affected) throw appError("角色不存在", 40400, 404);
  return { deleted: true };
}

export async function assignRoleMenus(roleId, menuIds) {
  await roleRepo.assignMenus(roleId, Array.isArray(menuIds) ? menuIds : []);
  return { roleId, menuIds: await roleRepo.getRoleMenuIds(roleId) };
}

export async function getRoleMenus(roleId) { return roleRepo.getRoleMenuIds(roleId); }
