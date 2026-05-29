import * as printRepository from "../repositories/printRepository.js";
import { getTemplate } from "./templateService.js";

export async function previewPrint(payload) {
  const template = await getTemplate(payload.templateId);
  return {
    template,
    data: payload.data || {},
  };
}

export async function submitPrint(payload) {
  return printRepository.createPrintLog(payload);
}

export async function listPrintLogs() {
  return printRepository.listPrintLogs();
}
