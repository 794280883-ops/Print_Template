import * as authService from "../services/authService.js";
import * as userRepository from "../repositories/userRepository.js";
import { appError } from "../utils/response.js";

export async function requireAuth(req, res, next) {
  try {
    const token = getBearerToken(req);
    if (!token) throw appError("请先登录", 40100, 401);

    const payload = authService.verifyToken(token);
    if (!payload?.userId) throw appError("登录已过期，请重新登录", 40100, 401);

    const user = await userRepository.findById(payload.userId);
    if (!user || !user.status) throw appError("登录已过期，请重新登录", 40100, 401);

    req.user = user;
    req.permissions = await authService.getPermissionCodesForUser(user.id);
    next();
  } catch (error) {
    next(error);
  }
}

export function requirePermission(permission) {
  return (req, res, next) => {
    try {
      const required = typeof permission === "function" ? permission(req) : permission;
      const requiredList = Array.isArray(required) ? required : [required];
      const permissions = new Set(req.permissions || []);
      const allowed = requiredList.some((code) => code && permissions.has(code));
      if (!allowed) throw appError("无权限访问该接口", 40300, 403);
      next();
    } catch (error) {
      next(error);
    }
  };
}

function getBearerToken(req) {
  const authorization = req.get("authorization") || "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : "";
}
