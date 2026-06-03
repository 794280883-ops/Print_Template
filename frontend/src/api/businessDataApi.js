import { request, toQuery } from "./request.js";

export function listBusinessData(type, params = {}) {
  return request(`/business-data${toQuery({ type, ...params })}`);
}

export function getBusinessData(id) {
  return request(`/business-data/${encodeURIComponent(id)}`);
}

export function createBusinessData(data) {
  return request("/business-data", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateBusinessData(id, data) {
  return request(`/business-data/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function importBusinessData(data) {
  return request("/business-data/import", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function deleteBusinessData(id) {
  return request(`/business-data/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
