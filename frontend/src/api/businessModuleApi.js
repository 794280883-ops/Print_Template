import { request } from "./request.js";

export function listBusinessModules() {
  return request("/business-modules");
}

export function createBusinessModule(module) {
  return request("/business-modules", {
    method: "POST",
    body: JSON.stringify(module),
  });
}

export function deleteBusinessModule(moduleCode) {
  return request(`/business-modules/${encodeURIComponent(moduleCode)}`, {
    method: "DELETE",
  });
}

export function updateBusinessModule(moduleCode, module) {
  return request(`/business-modules/${encodeURIComponent(moduleCode)}`, {
    method: "PUT",
    body: JSON.stringify(module),
  });
}

export function createModuleField(moduleCode, field) {
  return request(`/business-modules/${encodeURIComponent(moduleCode)}/fields`, {
    method: "POST",
    body: JSON.stringify(field),
  });
}

export function updateModuleField(moduleCode, fieldCode, field) {
  return request(`/business-modules/${encodeURIComponent(moduleCode)}/fields/${encodeURIComponent(fieldCode)}`, {
    method: "PUT",
    body: JSON.stringify(field),
  });
}

export function disableModuleField(moduleCode, fieldCode) {
  return request(`/business-modules/${encodeURIComponent(moduleCode)}/fields/${encodeURIComponent(fieldCode)}/disable`, {
    method: "POST",
  });
}

export function enableModuleField(moduleCode, fieldCode) {
  return request(`/business-modules/${encodeURIComponent(moduleCode)}/fields/${encodeURIComponent(fieldCode)}/enable`, {
    method: "POST",
  });
}

export function deleteModuleField(moduleCode, fieldCode) {
  return request(`/business-modules/${encodeURIComponent(moduleCode)}/fields/${encodeURIComponent(fieldCode)}`, {
    method: "DELETE",
  });
}
