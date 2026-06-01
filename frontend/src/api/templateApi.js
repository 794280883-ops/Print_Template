import { request, toQuery } from "./request.js";

export function listTemplates(filters = {}) {
  return request(`/templates${toQuery(filters)}`);
}

export function listOperationLogs() {
  return request("/templates/operation-logs");
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

export function publishTemplate(id) {
  return request(`/templates/${encodeURIComponent(id)}/publish`, { method: "POST" });
}

export function disableTemplate(id) {
  return request(`/templates/${encodeURIComponent(id)}/disable`, { method: "POST" });
}

export function copyTemplate(id) {
  return request(`/templates/${encodeURIComponent(id)}/copy`, { method: "POST" });
}

export function importTemplate(templateDsl) {
  return request("/templates/import", {
    method: "POST",
    body: JSON.stringify(templateDsl),
  });
}

export function deleteTemplate(id) {
  return request(`/templates/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export function exportTemplate(id) {
  return request(`/templates/${encodeURIComponent(id)}/export`);
}

export function listFields(templateType) {
  return request(`/template/fields/${encodeURIComponent(String(templateType).toUpperCase())}`);
}

export function previewPrint(payload) {
  return request("/print/preview", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function submitPrint(payload) {
  return request("/print/submit", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Generate and download a PDF for template printing.
 * Returns a Blob that can be used to trigger a browser download.
 */
export async function downloadPrintPdf(payload) {
  const res = await fetch("/api/v1/print/pdf", {
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

export function listPrintLogs() {
  return request("/print/logs");
}

export function generateAiTemplate(payload) {
  return request("/ai/templates/generate", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
