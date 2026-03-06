export const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:3000").replace(/\/$/, "");

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

export async function apiRequest(path, options = {}) {
  try {
    const headers = new Headers(options.headers || {});
    const isFormData = options.body instanceof FormData;

    if (options.body && !isFormData && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    const response = await fetch(`${API_URL}${path}`, {
      credentials: "include",
      ...options,
      headers,
    });

    return {
      ok: response.ok,
      status: response.status,
      data: await readResponseBody(response),
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      error,
      data: {
        message: "Unable to reach the API server",
      },
    };
  }
}
