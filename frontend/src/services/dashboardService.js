import { apiRequest } from "./apiClient";

export async function getDashboard() {
  const response = await apiRequest("/api/v1/dashboard");

  if (!response?.success) {
    throw new Error(
      response?.error?.message ||
        response?.message ||
        "Unable to load dashboard data."
    );
  }

  return response.data;
}

export async function getSessions() {
  const response = await apiRequest("/api/v1/sessions");

  if (!response?.success) {
    throw new Error(
      response?.error?.message ||
        response?.message ||
        "Unable to load attack sessions."
    );
  }

  return response.data ?? [];
}

export async function getSession(sessionId) {
  const response = await apiRequest(
    `/api/v1/sessions/${sessionId}`
  );

  if (!response?.success) {
    throw new Error(
      response?.error?.message ||
        response?.message ||
        "Unable to load attack session."
    );
  }

  return response.data;
}

export async function getTimeline(sessionId) {
  const response = await apiRequest(
    `/api/v1/timeline/${sessionId}`
  );

  if (!response?.success) {
    throw new Error(
      response?.error?.message ||
        response?.message ||
        "Unable to load threat timeline."
    );
  }

  return response.data ?? [];
}

export async function getDetection(sessionId) {
  const response = await apiRequest(
    `/api/v1/detection/${sessionId}`
  );

  if (!response?.success) {
    throw new Error(
      response?.error?.message ||
        response?.message ||
        "Unable to load threat analysis."
    );
  }

  return response.data;
}