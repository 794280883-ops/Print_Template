import bcrypt from "bcryptjs";
import * as userRepo from "../repositories/userRepository.js";
import { appError } from "../utils/response.js";

export async function listUsers(query) {
  const page = Number(query.page) || 1;
  const pageSize = Math.min(Number(query.pageSize) || 20, 100);
  return userRepo.listUsers({ page, pageSize, keyword: query.keyword || "" });
}

export async function createUser(payload) {
  if (!payload.username || !payload.password) throw appError("用户名和密码必填", 40000, 400);
  const hashed = await bcrypt.hash(payload.password, 10);
  return userRepo.createUser({
    username: payload.username.trim(),
    password: hashed,
    nickname: payload.nickname || payload.username,
    email: payload.email || null,
    roleIds: Array.isArray(payload.roleIds) ? payload.roleIds : [],
  });
}

export async function updateUser(id, payload) {
  const exists = await userRepo.findById(id);
  if (!exists) throw appError("用户不存在", 40400, 404);
  return userRepo.updateUser(id, {
    nickname: payload.nickname || exists.nickname,
    email: payload.email !== undefined ? payload.email : exists.email,
    status: payload.status !== undefined ? payload.status : exists.status,
    roleIds: payload.roleIds,
  });
}

export async function changePassword(id, newPassword) {
  if (!newPassword || newPassword.length < 6) throw appError("密码至少 6 位", 40000, 400);
  const exists = await userRepo.findById(id);
  if (!exists) throw appError("用户不存在", 40400, 404);
  const hashed = await bcrypt.hash(newPassword, 10);
  await userRepo.changePassword(id, hashed);
  return { changed: true };
}

export async function deleteUser(id) {
  const affected = await userRepo.deleteUser(id);
  if (!affected) throw appError("用户不存在", 40400, 404);
  return { deleted: true };
}
