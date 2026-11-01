const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";
const STORAGE_KEY = "civic-pulse-role";

export const api = {
  async request(path, options = {}) {
    const response = await fetch(API_BASE + path, {
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
      ...options
    });
    if (!response.ok) {
      const detail = await response.text();
      throw new Error(detail || `Request failed: ${response.status}`);
    }
    if (response.status === 204) return null;
    return response.json();
  },
  listIssues(params = {}) {
    const query = new URLSearchParams();
    if (params.status) query.set("status", params.status);
    if (params.category) query.set("category", params.category);
    if (params.minSeverity) query.set("min_severity", params.minSeverity);
    if (params.limit) query.set("limit", params.limit);
    const suffix = query.toString() ? `?${query}` : "";
    return this.request(`/issues${suffix}`);
  },
  getIssue(id) {
    return this.request(`/issues/${id}`);
  },
  createIssue(payload) {
    return this.request("/issues", { method: "POST", body: JSON.stringify(payload) });
  },
  updateStatus(id, payload) {
    return this.request(`/issues/${id}/status`, { method: "PATCH", body: JSON.stringify(payload) });
  },
  rateIssue(id, payload) {
    return this.request(`/issues/${id}/ratings`, { method: "POST", body: JSON.stringify(payload) });
  },
  listComments(issueId) {
    return this.request(`/issues/${issueId}/comments`);
  },
  addComment(issueId, payload) {
    return this.request(`/issues/${issueId}/comments`, { method: "POST", body: JSON.stringify(payload) });
  },
  supportIssue(issueId, payload = {}) {
    return this.request(`/issues/${issueId}/support`, { method: "POST", body: JSON.stringify(payload) });
  },
  getStats() {
    return this.request("/stats");
  },
  getCategories() {
    return this.request("/meta/categories");
  },
  previewTriage(payload) {
    const query = new URLSearchParams({ description: payload.description });
    if (payload.category) query.set("category", payload.category);
    return this.request(`/triage/preview?${query}`);
  },
  getCommunityFeed() {
    return this.request("/community/feed");
  },
  resetSeed(payload) {
    return this.request("/admin/seed-reset", { method: "POST", body: JSON.stringify(payload) });
  },
  health() {
    return this.request("/health");
  },
  getTelemetry() {
    return this.request("/api/telemetry");
  },
  getPredictions(payload = {}) {
    return this.request("/api/predictions", { method: "POST", body: JSON.stringify(payload) });
  },
  chatAI(payload) {
    return this.request("/api/chat", { method: "POST", body: JSON.stringify(payload) });
  },
  transcribeAudio(payload) {
    return this.request("/api/transcribe", { method: "POST", body: JSON.stringify(payload) });
  },
  tts(payload) {
    return this.request("/api/tts", { method: "POST", body: JSON.stringify(payload) });
  },
  generateBroadcast(payload) {
    return this.request("/api/broadcast", { method: "POST", body: JSON.stringify(payload) });
  }
};

export function getSavedRole() {
  return localStorage.getItem(STORAGE_KEY) || "citizen";
}

export function saveRole(role) {
  localStorage.setItem(STORAGE_KEY, role);
}
