const configuredApiUrl = (import.meta.env.VITE_API_URL || "").trim();

// In Vite dev, prefer same-origin requests and let the dev server proxy /api to Next.
export const API_URL = import.meta.env.DEV
  ? ""
  : (configuredApiUrl || "http://localhost:3000").replace(/\/$/, "");

function getDevApiOrigins() {
  if (!import.meta.env.DEV) {
    return [];
  }

  const candidates = [];

  if (configuredApiUrl) {
    candidates.push(configuredApiUrl.replace(/\/$/, ""));
  }

  if (typeof window !== "undefined") {
    candidates.push(`http://${window.location.hostname}:3000`);
  }

  candidates.push("http://localhost:3000");
  candidates.push("http://127.0.0.1:3000");

  return [...new Set(candidates)];
}

async function readResponseBody(response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return {
      message: text,
    };
  }
}

function shouldRetryWithDirectApi(response, data) {
  if (!import.meta.env.DEV) {
    return false;
  }

  const contentType = response.headers.get("content-type") || "";

  if (response.status === 404 && contentType.includes("text/html")) {
    return true;
  }

  if (typeof data?.message === "string" && data.message.startsWith("<!DOCTYPE html>")) {
    return true;
  }

  return false;
}

export async function apiRequest(path, options = {}) {
  const headers = new Headers(options.headers || {});
  const isFormData = options.body instanceof FormData;

  if (options.body && !isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const requestUrls = import.meta.env.DEV
    ? [path, ...getDevApiOrigins().map((origin) => `${origin}${path}`)]
    : [`${API_URL}${path}`];

  let lastError = null;

  for (let index = 0; index < requestUrls.length; index += 1) {
    const requestUrl = requestUrls[index];

    try {
      const response = await fetch(requestUrl, {
        credentials: "include",
        ...options,
        headers,
      });
      const data = await readResponseBody(response);

      if (shouldRetryWithDirectApi(response, data) && index < requestUrls.length - 1) {
        continue;
      }

      return {
        ok: response.ok,
        status: response.status,
        data,
      };
    } catch (error) {
      lastError = error;
    }
  }

  return {
    ok: false,
    status: 0,
    error: lastError,
    data: {
      message: "Unable to reach the API server",
    },
  };
}
