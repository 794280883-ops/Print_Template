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
