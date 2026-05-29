const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api/v1";

export async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });
  const payload = await response.json().catch(() => ({ code: response.ok ? 0 : 50000, message: response.statusText, data: null }));
  if (!response.ok || payload.code !== 0) {
    const error = new Error(payload.message || "请求失败");
    error.response = payload;
    error.status = response.status;
    throw error;
  }
  return payload.data;
}

export function toQuery(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") search.set(key, value);
  });
  const text = search.toString();
  return text ? `?${text}` : "";
}
