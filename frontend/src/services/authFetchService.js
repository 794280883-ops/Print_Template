export function createAuthHeaders(token, headers = {}) {
  const nextHeaders = { ...headers };
  if (token) nextHeaders.Authorization = `Bearer ${token}`;
  return nextHeaders;
}

export function authorizedFetch(path, options = {}, deps = {}) {
  const {
    apiBaseUrl = "/api/v1",
    token = "",
    fetchImpl = globalThis.fetch,
  } = deps;

  return fetchImpl(`${apiBaseUrl}${path}`, {
    ...options,
    headers: createAuthHeaders(token, options.headers || {}),
  });
}
