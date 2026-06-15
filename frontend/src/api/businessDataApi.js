import { request, toQuery } from "./request.js";

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

export function downloadImportTemplate(bizType) {
  const a = document.createElement("a");
  a.href = `/api/v1/business-data/template/${encodeURIComponent(bizType)}`;
  a.download = `${bizType}_导入模板.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export async function importBusinessData(bizType, file) {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch(`/api/v1/business-data/import/${encodeURIComponent(bizType)}`, {
    method: "POST",
    body: formData,
  });
  return response.json();
}
