import * as menuService from "../services/menuService.js";
import { sendSuccess } from "../utils/response.js";
export async function list(req, res) { sendSuccess(res, await menuService.listMenus()); }
export async function create(req, res) { sendSuccess(res, await menuService.createMenu(req.body)); }
export async function update(req, res) { sendSuccess(res, await menuService.updateMenu(req.params.id, req.body)); }
export async function remove(req, res) { sendSuccess(res, await menuService.deleteMenu(req.params.id)); }
