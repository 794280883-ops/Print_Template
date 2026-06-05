import { request, toQuery } from "./request.js";

export function listBusinessData(type, params = {}) {
  return searchBusinessData({ bizType: type, ...params });
}

export function listBusinessTypes() {
  return request("/business-data/types");
}

export function listWarehouses(params = {}) {
  return request(`/business-data/warehouses${toQuery(params)}`);
}

export function searchBusinessData(params = {}) {
  return request(`/business-data/search${toQuery(params)}`);
}

export function getBusinessDataDetail(bizType, bizCode) {
  return request(`/business-data/detail/${encodeURIComponent(bizType)}/${encodeURIComponent(bizCode)}`);
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
