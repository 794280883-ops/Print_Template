import { API_BASE_URL, request, toQuery } from "./request.js";

export function listTemplates(filters = {}) {
  return request(`/templates${toQuery(filters)}`);
}

export function recordDesignLog(id) {
  return request(`/templates/${encodeURIComponent(id)}/design-log`, { method: "POST" });
}

export function getTemplate(id) {
  return request(`/templates/${encodeURIComponent(id)}`);
}

export function createTemplate(template) {
  return request("/templates", {
    method: "POST",
    body: JSON.stringify(template),
  });
}

export function updateTemplate(id, template) {
  return request(`/templates/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(template),
  });
}

export function updateTemplateName(id, templateName) {
  return request(`/templates/${encodeURIComponent(id)}/name`, {
    method: "PATCH",
    body: JSON.stringify({ templateName }),
  });
}

export function enableTemplate(id) {
  return request(`/templates/${encodeURIComponent(id)}/enable`, { method: "POST" });
}

export function disableTemplate(id) {
  return request(`/templates/${encodeURIComponent(id)}/disable`, { method: "POST" });
}

export function batchUpdateTemplateStatus(ids, status) {
  return request("/templates/status", {
    method: "POST",
    body: JSON.stringify({ ids, status }),
  });
}

export function copyTemplate(id) {
  return request(`/templates/${encodeURIComponent(id)}/copy`, { method: "POST" });
}

export function deleteTemplate(id) {
  return request(`/templates/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export function listFields(templateType) {
  return request(`/template/fields/${encodeURIComponent(String(templateType).toUpperCase())}`);
}

/**
 * Generate and download a PDF for template printing.
 * Returns a Blob that can be used to trigger a browser download.
 */
export async function downloadPrintPdf(payload) {
  const res = await fetch(`${API_BASE_URL}/print/pdf`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "PDF generation failed" }));
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  return res.blob();
}
