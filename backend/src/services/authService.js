import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import * as userRepository from "../repositories/userRepository.js";
import * as menuRepository from "../repositories/menuRepository.js";
import { env } from "../config/env.js";
import { appError } from "../utils/response.js";

const JWT_EXPIRES_IN = "24h";

export async function login(username, password) {
  const user = await userRepository.findByUsername(username);
  if (!user || !user.status) throw appError("用户名或密码错误", 40000, 400);
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw appError("用户名或密码错误", 40000, 400);

  const token = jwt.sign({ userId: user.id, username: user.username }, env.jwtSecret, { expiresIn: JWT_EXPIRES_IN });
  const permissions = await getPermissionCodesForUser(user.id);
  const menuIds = new Set();
  const roleIds = await userRepository.getUserRoleIds(user.id);
  for (const rid of roleIds) {
    const mids = await menuRepository.getMenuIdsByRole(rid);
    mids.forEach(m => menuIds.add(m));
  }
  const menus = await menuRepository.getMenuTree(Array.from(menuIds));

  return {
    token,
    user: { id: user.id, username: user.username, nickname: user.nickname },
    permissions,
    menus,
  };
}

export function verifyToken(token) {
  try { return jwt.verify(token, env.jwtSecret); } catch { return null; }
}

export async function getPermissionCodesForUser(userId) {
  const roleIds = await userRepository.getUserRoleIds(userId);
  const permissions = [];
  for (const rid of roleIds) {
    const pms = await menuRepository.getPermissionCodesByRole(rid);
    pms.forEach(p => { if (p) permissions.push(p); });
  }
  return [...new Set(permissions)];
}
