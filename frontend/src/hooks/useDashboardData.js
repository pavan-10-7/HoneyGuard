import { useCallback, useEffect, useRef, useState } from "react";
import {
  getDashboard,
  getDetection,
  getSession,
  getSessions,
  getTimeline,
} from "../services/dashboardService";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function getWebSocketUrl() {
  if (!API_BASE_URL) {
    return null;
  }

  return API_BASE_URL.replace(/^http/, "ws") + "/ws";
}

function unwrapMessage(message) {
  if (!message || typeof message !== "object") {
    return null;
  }

  return {
    type: message.type,
    data: message.data,
  };
}

export function useDashboardData() {
  const [dashboard, setDashboard] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [detection, setDetection] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [wsConnected, setWsConnected] = useState(false);

  const socketRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const mountedRef = useRef(true);

  const loadDashboard = useCallback(async () => {
    const data = await getDashboard();

    if (!mountedRef.current) {
      return data;
    }

    setDashboard(data);

    return data;
  }, []);

  const loadSessions = useCallback(async () => {
    const data = await getSessions();

    if (!mountedRef.current) {
      return data;
    }

    setSessions(data);

    return data;
  }, []);

  const loadSessionDetails = useCallback(async (sessionId) => {
    if (!sessionId) {
      return null;
    }

    const [sessionResult, timelineResult, detectionResult] =
      await Promise.allSettled([
        getSession(sessionId),
        getTimeline(sessionId),
        getDetection(sessionId),
      ]);

    if (!mountedRef.current) {
      return null;
    }

    if (sessionResult.status === "fulfilled") {
      setSessions((current) => {
        const nextSession = sessionResult.value;

        const exists = current.some(
          (session) => session.id === nextSession.id
        );

        if (!exists) {
          return [nextSession, ...current];
        }

        return current.map((session) =>
          session.id === nextSession.id
            ? { ...session, ...nextSession }
            : session
        );
      });
    }

    if (timelineResult.status === "fulfilled") {
      setTimeline(timelineResult.value ?? []);
    }

    if (detectionResult.status === "fulfilled") {
      setDetection(detectionResult.value);
    }

    return {
      session:
        sessionResult.status === "fulfilled"
          ? sessionResult.value
          : null,
      timeline:
        timelineResult.status === "fulfilled"
          ? timelineResult.value
          : [],
      detection:
        detectionResult.status === "fulfilled"
          ? detectionResult.value
          : null,
    };
  }, []);

  const refreshAll = useCallback(async () => {
    try {
      setError(null);

      const dashboardData = await loadDashboard();

      await loadSessions();

      const activeSession =
        dashboardData?.latest_sessions?.find(
          (session) => session.status === "active"
        ) ??
        dashboardData?.latest_sessions?.[0];

      if (activeSession?.id) {
        await loadSessionDetails(activeSession.id);
      } else {
        setTimeline([]);
        setDetection(null);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load HoneyGuard dashboard."
        );
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [loadDashboard, loadSessions, loadSessionDetails]);

  useEffect(() => {
    mountedRef.current = true;

    refreshAll();

    return () => {
      mountedRef.current = false;
    };
  }, [refreshAll]);

  useEffect(() => {
    const websocketUrl = getWebSocketUrl();

    if (!websocketUrl) {
      return undefined;
    }

    let shouldReconnect = true;

    const connect = () => {
      if (!shouldReconnect || !mountedRef.current) {
        return;
      }

      const socket = new WebSocket(websocketUrl);

      socketRef.current = socket;

      socket.onopen = () => {
        if (!mountedRef.current) {
          return;
        }

        reconnectAttemptsRef.current = 0;
        setWsConnected(true);
      };

      socket.onmessage = async (event) => {
        try {
          const parsed = JSON.parse(event.data);
          const message = unwrapMessage(parsed);

          if (!message) {
            return;
          }

          if (message.type === "new_event") {
            const newEvent = message.data;

            setDashboard((current) => {
              if (!current) {
                return current;
              }

              const existingEvents =
                current.latest_events ?? [];

              const alreadyExists = existingEvents.some(
                (item) => item.id === newEvent?.id
              );

              return {
                ...current,
                total_events:
                  typeof current.total_events === "number"
                    ? current.total_events + (alreadyExists ? 0 : 1)
                    : current.total_events,
                latest_events: alreadyExists
                  ? existingEvents
                  : [newEvent, ...existingEvents].slice(0, 10),
              };
            });

            if (newEvent?.session_id) {
              await loadSessionDetails(
                newEvent.session_id
              );
            }
          }

          if (message.type === "session_updated") {
            const updatedSession = message.data;

            setSessions((current) => {
              const exists = current.some(
                (session) =>
                  session.id === updatedSession?.id
              );

              if (!exists) {
                return [updatedSession, ...current];
              }

              return current.map((session) =>
                session.id === updatedSession.id
                  ? { ...session, ...updatedSession }
                  : session
              );
            });

            setDashboard((current) => {
              if (!current) {
                return current;
              }

              return {
                ...current,
                active_sessions:
                  updatedSession?.status === "active"
                    ? Math.max(
                        current.active_sessions ?? 0,
                        1
                      )
                    : current.active_sessions,
                latest_sessions:
                  current.latest_sessions?.map(
                    (session) =>
                      session.id === updatedSession.id
                        ? {
                            ...session,
                            ...updatedSession,
                          }
                        : session
                  ) ?? current.latest_sessions,
              };
            });

            if (updatedSession?.id) {
              await loadSessionDetails(
                updatedSession.id
              );
            }
          }

          if (message.type === "dashboard_updated") {
            const updatedDashboard = message.data;

            setDashboard((current) => ({
              ...(current ?? {}),
              ...(updatedDashboard ?? {}),
            }));
          }
        } catch (err) {
          console.error(
            "HoneyGuard WebSocket message error:",
            err
          );
        }
      };

      socket.onclose = () => {
        if (!mountedRef.current) {
          return;
        }

        setWsConnected(false);

        if (!shouldReconnect) {
          return;
        }

        const attempt =
          reconnectAttemptsRef.current;

        const delay = Math.min(
          1000 * 2 ** attempt,
          10000
        );

        reconnectAttemptsRef.current =
          Math.min(attempt + 1, 5);

        reconnectTimerRef.current =
          window.setTimeout(connect, delay);
      };

      socket.onerror = () => {
        setWsConnected(false);
      };
    };

    connect();

    return () => {
      shouldReconnect = false;

      if (reconnectTimerRef.current) {
        window.clearTimeout(
          reconnectTimerRef.current
        );
      }

      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }

      setWsConnected(false);
    };
  }, [loadSessionDetails]);

  return {
    dashboard,
    sessions,
    timeline,
    detection,
    loading,
    error,
    wsConnected,
    refresh: refreshAll,
  };
}