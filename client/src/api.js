/**
 * Thin fetch wrapper for the Loan Tracker API.
 * Throws an ApiError carrying the server's message and any field-level errors,
 * so pages can surface them to the user instead of a console.
 */

export class ApiError extends Error {
  constructor(message, { status, errors } = {}) {
    super(message);
    this.status = status;
    this.errors = errors ?? {};
  }
}

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(path, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
  } catch {
    throw new ApiError('Could not reach the server. Is the API running on port 4000?');
  }

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(body.message ?? `Request failed (${response.status}).`, {
      status: response.status,
      errors: body.errors,
    });
  }
  return body;
}

export function submitApplication(payload) {
  return request('/api/applications', { method: 'POST', body: JSON.stringify(payload) });
}

export function fetchApplications({ status, sortBy, order }) {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (sortBy) params.set('sortBy', sortBy);
  if (order) params.set('order', order);
  return request(`/api/applications?${params}`);
}

export function fetchApplication(id) {
  return request(`/api/applications/${id}`);
}
