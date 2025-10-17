const BASE_URL = "http://45.77.247.228:5001/api";

async function request(path, { method = "GET", headers = {}, body, signal } = {}) {
  const finalHeaders = {
    "Content-Type": "application/json",
    ...headers,
  };

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: finalHeaders,
    body,
    signal,
    credentials: "omit",
  });

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await response.json().catch(() => undefined) : undefined;

  if (!response.ok) {
    const error = new Error(payload?.message || payload?.error || response.statusText || "Request failed");
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

export async function fetchExportProfiles(signal) {
  return request("/export-profiles", { signal });
}

export async function fetchExportProfileById(id, signal) {
  if (!id) throw new Error("Profile id is required");
  return request(`/export-profiles/${encodeURIComponent(id)}`, { signal });
}

export async function createExportProfile(name, settings, signal) {
  const payload = JSON.stringify({ name, settings });
  return request("/export-profiles", { method: "POST", body: payload, signal });
}

export async function updateExportProfile(id, name, settings, signal) {
  const payload = JSON.stringify({ name, settings });
  return request(`/export-profiles/${encodeURIComponent(id)}`, { method: "PUT", body: payload, signal });
}

export async function deleteExportProfile(id, signal) {
  return request(`/export-profiles/${encodeURIComponent(id)}`, { method: "DELETE", signal });
}

export async function updateProfileColorOptions(id, colorOptions, signal) {
  const payload = JSON.stringify({ colorOptions });
  return request(`/export-profiles/${encodeURIComponent(id)}/color-options`, { method: "PATCH", body: payload, signal });
}

export async function updateProfileImages(id, images, signal) {
  const payload = JSON.stringify({ images });
  return request(`/export-profiles/${encodeURIComponent(id)}/images`, { method: "PATCH", body: payload, signal });
}

export async function optimizeProductTitleRemote(title, signal) {
  const payload = JSON.stringify({ title });
  const data = await request("/product/optimize-title", { method: "POST", body: payload, signal });
  return data?.optimizedTitle || title;
}
