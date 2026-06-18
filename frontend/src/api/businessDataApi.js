import { API_BASE_URL, authorizedApiFetch, request, toQuery } from "./request.js";
import { usePermissionStore } from "../stores/permission.js";
import { downloadAuthenticatedBlob } from "../services/downloadService.js";

export function listBusinessData(type, params = {}) {
  return searchBusinessData({ bizType: type, ...params });
}

export function searchBusinessData(params = {}) {
  return request(`/business-data/search${toQuery(params)}`);
}

export function createBusinessData(bizType, fields) {
  return request("/business-data", {
    method: "POST",
    body: JSON.stringify({ bizType, fields }),
  });
}

export function updateBusinessData(bizType, bizCode, fields) {
  return request(`/business-data/${encodeURIComponent(bizType)}/${encodeURIComponent(bizCode)}`, {
    method: "PUT",
    body: JSON.stringify({ fields }),
  });
}

export function deleteBusinessData(bizType, bizCode) {
  return request(`/business-data/${encodeURIComponent(bizType)}/${encodeURIComponent(bizCode)}`, {
    method: "DELETE",
  });
}

export function deleteBusinessDataBatch(bizType, codes) {
  return request(`/business-data/batch/${encodeURIComponent(bizType)}`, {
    method: "DELETE",
    body: JSON.stringify({ codes }),
  });
}

export async function downloadImportTemplate(bizType) {
  const store = usePermissionStore();
  await downloadAuthenticatedBlob(
    `/business-data/template/${encodeURIComponent(bizType)}`,
    `${bizType}_导入模板.xlsx`,
    { apiBaseUrl: API_BASE_URL, token: store.getToken() },
  );
}

export async function importBusinessData(bizType, file) {
  const formData = new FormData();
  formData.append("file", file);
  const response = await authorizedApiFetch(`/business-data/import/${encodeURIComponent(bizType)}`, {
    method: "POST",
    body: formData,
  });
  return response.json();
}
