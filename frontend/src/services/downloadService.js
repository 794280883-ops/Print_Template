export async function downloadAuthenticatedBlob(path, filename, options = {}) {
  const {
    apiBaseUrl = "/api/v1",
    token = "",
    fetchImpl = globalThis.fetch,
    documentRef = globalThis.document,
    urlApi = globalThis.URL,
  } = options;

  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetchImpl(`${apiBaseUrl}${path}`, { headers });
  if (!response.ok) {
    throw new Error(response.statusText || "下载失败");
  }

  const blob = await response.blob();
  const url = urlApi.createObjectURL(blob);
  const a = documentRef.createElement("a");
  a.href = url;
  a.download = filename;
  documentRef.body.appendChild(a);
  a.click();
  documentRef.body.removeChild(a);
  urlApi.revokeObjectURL(url);
}
