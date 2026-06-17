import * as userService from "../services/userService.js";
import { sendSuccess } from "../utils/response.js";
export async function list(req, res) { sendSuccess(res, await userService.listUsers(req.query)); }
export async function create(req, res) { sendSuccess(res, await userService.createUser(req.body)); }
export async function update(req, res) { sendSuccess(res, await userService.updateUser(req.params.id, req.body)); }
export async function remove(req, res) { sendSuccess(res, await userService.deleteUser(req.params.id)); }
export async function changePassword(req, res) { sendSuccess(res, await userService.changePassword(req.params.id, req.body.password)); }
