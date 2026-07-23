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

export function updateBusinessData(bizType, bizCode, fields, dbId) {
  return request(`/business-data/${encodeURIComponent(bizType)}/${encodeURIComponent(bizCode)}`, {
    method: "PUT",
    body: JSON.stringify({ fields, _dbId: dbId }),
  });
}

export function deleteBusinessDataBatch(bizType, ids) {
  return request(`/business-data/batch/${encodeURIComponent(bizType)}`, {
    method: "DELETE",
    body: JSON.stringify({ ids }),
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

export async function exportBusinessData(bizType) {
  const store = usePermissionStore();
  await downloadAuthenticatedBlob(
    `/business-data/export/${encodeURIComponent(bizType)}`,
    `${bizType}_业务数据.xlsx`,
    { apiBaseUrl: API_BASE_URL, token: store.getToken() },
  );
}
