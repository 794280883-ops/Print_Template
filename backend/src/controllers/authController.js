import * as authService from "../services/authService.js";
import { sendSuccess, appError } from "../utils/response.js";

export async function login(req, res) {
  const { username, password } = req.body || {};
  if (!username || !password) throw appError("请输入用户名和密码", 40000, 400);
  sendSuccess(res, await authService.login(username, password));
}
