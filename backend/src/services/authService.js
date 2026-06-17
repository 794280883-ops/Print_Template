import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import * as userRepository from "../repositories/userRepository.js";
import * as menuRepository from "../repositories/menuRepository.js";
import { appError } from "../utils/response.js";

const JWT_SECRET = process.env.JWT_SECRET || "wms-print-template-jwt-secret";
const JWT_EXPIRES_IN = "24h";

export async function login(username, password) {
  const user = await userRepository.findByUsername(username);
  if (!user || !user.status) throw appError("用户名或密码错误", 40000, 400);
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw appError("用户名或密码错误", 40000, 400);

  const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  const roleIds = await userRepository.getUserRoleIds(user.id);
  const permissions = [];
  const menuIds = new Set();
  for (const rid of roleIds) {
    const pms = await menuRepository.getPermissionCodesByRole(rid);
    pms.forEach(p => { if (p) permissions.push(p); });
    const mids = await menuRepository.getMenuIdsByRole(rid);
    mids.forEach(m => menuIds.add(m));
  }
  const menus = await menuRepository.getMenuTree(Array.from(menuIds));

  return {
    token,
    user: { id: user.id, username: user.username, nickname: user.nickname },
    permissions: [...new Set(permissions)],
    menus,
  };
}

export function verifyToken(token) {
  try { return jwt.verify(token, JWT_SECRET); } catch { return null; }
}
