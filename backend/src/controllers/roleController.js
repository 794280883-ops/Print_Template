import * as roleService from "../services/roleService.js";
import { sendSuccess } from "../utils/response.js";
export async function list(req, res) { sendSuccess(res, await roleService.listRoles()); }
export async function create(req, res) { sendSuccess(res, await roleService.createRole(req.body)); }
export async function update(req, res) { sendSuccess(res, await roleService.updateRole(req.params.id, req.body)); }
export async function remove(req, res) { sendSuccess(res, await roleService.deleteRole(req.params.id)); }
export async function assignMenus(req, res) { sendSuccess(res, await roleService.assignRoleMenus(req.params.id, req.body.menuIds)); }
export async function getMenus(req, res) { sendSuccess(res, await roleService.getRoleMenus(req.params.id)); }
