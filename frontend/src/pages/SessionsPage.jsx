import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowUpRight,
  Clock3,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  Target,
  Activity,
} from "lucide-react";
import { motion } from "framer-motion";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

function getWebSocketUrl() {
  try {
    const url = new URL(API_BASE_URL);
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    url.pathname = "/ws";
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return "ws://127.0.0.1:8000/ws";
  }
}

function normalizeSeverity(severity) {
  return severity?.toString().toLowerCase() || "low";
}

function formatDateTime(timestamp) {
  if (!timestamp) {
    return "—";
  }

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function formatRelativeTime(timestamp) {
  if (!timestamp) {
    return "—";
  }

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  const seconds = Math.max(
    0,
    Math.floor((Date.now() - date.getTime()) / 1000)
  );

  if (seconds < 5) {
    return "Just now";
  }

  if (seconds < 60) {
    return `${seconds}s ago`;
  }

  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours}h ago`;
  }

  return `${Math.floor(hours / 24)}d ago`;
}

function severityConfig(severity) {
  const value = normalizeSeverity(severity);

  const configs = {
    critical: {
      badge: "hg-badge--critical",
      led: "hg-led--critical",
      dot: "hg-status-dot--critical",
      text: "text-[var(--hg-critical)]",
    },
    high: {
      badge: "hg-badge--high",
      led: "hg-led--warning",
      dot: "hg-status-dot--high",
      text: "text-[var(--hg-high)]",
    },
    medium: {
      badge: "hg-badge--medium",
      led: "hg-led--warning",
      dot: "hg-status-dot--medium",
      text: "text-[var(--hg-medium)]",
    },
    low: {
      badge: "hg-badge--low",
      led: "hg-led--blue",
      dot: "hg-status-dot--low",
      text: "text-[var(--hg-low)]",
    },
  };

  return configs[value] || configs.low;
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);

  const payload = await response.json().catch(() => null);

  if (!response.ok || payload?.success === false) {
    throw new Error(
      payload?.error?.message ||
        payload?.message ||
        `Request failed with status ${response.status}`
    );
  }

  return payload?.data;
}

export function SessionsPage() {
  const { sessionId } = useParams();

  if (sessionId) {
    return <SessionDetailPage sessionId={sessionId} />;
  }

  return <SessionsListPage />;
}

/* =========================================================
   SESSIONS LIST
   ========================================================= */

function SessionsListPage() {
  const navigate = useNavigate();

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [wsConnected, setWsConnected] = useState(false);
  const [startingDemo, setStartingDemo] = useState(false);
  const [demoMessage, setDemoMessage] = useState("");

  const loadSessions = useCallback(async (showRefreshState = false) => {
    if (showRefreshState) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const data = await fetchJson(
        `${API_BASE_URL}/api/v1/sessions`
      );

      setSessions(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Unable to load attack sessions.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    let socket;
    let reconnectTimer;
    let cancelled = false;

    const connect = () => {
      if (cancelled) {
        return;
      }

      try {
        socket = new WebSocket(getWebSocketUrl());

        socket.onopen = () => {
          setWsConnected(true);
        };

        socket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);

            if (message.type === "session_updated") {
              const updated = message.data;

              if (!updated?.id) {
                return;
              }

              setSessions((current) => {
                const exists = current.some(
                  (session) => session.id === updated.id
                );

                if (!exists) {
                  return [updated, ...current];
                }

                return current.map((session) =>
                  session.id === updated.id
                    ? { ...session, ...updated }
                    : session
                );
              });
            }

            if (message.type === "new_event") {
              const eventData = message.data;

              if (!eventData?.session_id) {
                return;
              }

              /*
               * The backend normally follows new_event with
               * session_updated. This event is intentionally
               * handled here only to make the page react
               * immediately if that ordering changes.
               */
              setSessions((current) =>
                current.map((session) =>
                  session.id === eventData.session_id
                    ? {
                        ...session,
                        last_seen:
                          eventData.timestamp ||
                          session.last_seen,
                      }
                    : session
                )
              );
            }
          } catch {
            // Ignore malformed WebSocket messages.
          }
        };

        socket.onclose = () => {
          setWsConnected(false);

          if (!cancelled) {
            reconnectTimer = window.setTimeout(
              connect,
              2000
            );
          }
        };

        socket.onerror = () => {
          setWsConnected(false);
        };
      } catch {
        setWsConnected(false);
      }
    };

    connect();

    return () => {
      cancelled = true;

      if (reconnectTimer) {
        window.clearTimeout(reconnectTimer);
      }

      if (socket) {
        socket.close();
      }
    };
  }, []);

  const activeSessions = useMemo(
    () =>
      sessions.filter(
        (session) => session.status === "active"
      ).length,
    [sessions]
  );

  const criticalSessions = useMemo(
    () =>
      sessions.filter(
        (session) =>
          normalizeSeverity(session.severity) === "critical"
      ).length,
    [sessions]
  );

  const handleStartDemo = async () => {
    setStartingDemo(true);
    setDemoMessage("");
    setError("");

    try {
      const data = await fetchJson(
        `${API_BASE_URL}/api/v1/sessions/demo/new`,
        {
          method: "POST",
        }
      );

      setDemoMessage(
        data?.message ||
          "Demo session reset. The next attack will start a fresh session."
      );

      await loadSessions(true);
    } catch (err) {
      setError(
        err.message ||
          "Unable to start a new demo session."
      );
    } finally {
      setStartingDemo(false);
    }
  };

  return (
    <motion.div
      className="mx-auto w-full max-w-[1800px]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      {/* =====================================================
          PAGE HEADER
          ===================================================== */}

      <section className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <div className="hg-label">
            Monitor / Attack Sessions
          </div>

          <h2 className="mt-2 text-xl font-semibold tracking-tight text-white sm:text-2xl">
            Attack Sessions
          </h2>

          <p className="mt-1 max-w-2xl text-[11px] leading-5 text-[#777] sm:text-[12px]">
            Review correlated attacker activity, threat
            scores, severity, and session history.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="hg-inset flex min-h-[42px] items-center justify-between gap-3 rounded-lg px-4 py-2.5">
            <div className="flex items-center gap-2.5">
              <span
                className={`hg-status-dot ${
                  wsConnected
                    ? "hg-status-dot--success"
                    : "hg-status-dot--warning"
                }`}
              />

              <span className="text-[10px] font-medium text-[#bdbdbd]">
                {wsConnected
                  ? "Live Updates"
                  : "Reconnecting..."}
              </span>
            </div>

            <span className="hg-mono text-[9px] text-[#5f5f5f]">
              {wsConnected ? "LIVE" : "OFFLINE"}
            </span>
          </div>

          <button
            type="button"
            onClick={() => loadSessions(true)}
            disabled={refreshing}
            className="hg-control flex min-h-[42px] items-center justify-center gap-2 px-3 py-2 text-[10px] font-medium disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              size={13}
              className={
                refreshing ? "animate-spin" : ""
              }
            />
            Refresh
          </button>

          <button
            type="button"
            onClick={handleStartDemo}
            disabled={startingDemo}
            className="hg-control flex min-h-[42px] items-center justify-center gap-2 border-[rgba(214,169,40,0.28)] px-3 py-2 text-[10px] font-medium text-[var(--hg-gold-bright)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RotateCcw
              size={13}
              className={
                startingDemo ? "animate-spin" : ""
              }
            />
            {startingDemo
              ? "Resetting..."
              : "Start New Demo Session"}
          </button>
        </div>
      </section>

      {error && (
        <div className="mb-4 rounded-lg border border-[#4a2929] bg-[#171010] px-4 py-3 text-[10px] text-[#d99090]">
          {error}
        </div>
      )}

      {demoMessage && (
        <div className="mb-4 rounded-lg border border-[#39321c] bg-[#15130c] px-4 py-3 text-[10px] text-[#c7ae69]">
          {demoMessage}
        </div>
      )}

      {/* =====================================================
          SUMMARY
          ===================================================== */}

      <section className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SummaryCard
          label="Total Sessions"
          value={sessions.length}
          icon={Target}
        />

        <SummaryCard
          label="Active Sessions"
          value={activeSessions}
          icon={Activity}
        />

        <SummaryCard
          label="Critical Sessions"
          value={criticalSessions}
          icon={ShieldAlert}
        />
      </section>

      {/* =====================================================
          SESSION TABLE
          ===================================================== */}

      <section className="hg-raised min-w-0 overflow-hidden">
        <div className="hg-panel-header flex items-center justify-between gap-3 px-4 py-4 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="hg-inset flex h-8 w-8 shrink-0 items-center justify-center rounded-md">
              <Target
                size={15}
                className="text-[var(--hg-gold-bright)]"
                strokeWidth={1.8}
              />
            </div>

            <div className="min-w-0">
              <h3 className="truncate text-[12px] font-semibold text-[#e5e5e5] sm:text-[13px]">
                Correlated Attack Activity
              </h3>

              <p className="mt-1 truncate text-[10px] text-[#666]">
                One row represents one attacker session
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <SessionLoading />
        ) : sessions.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <Target
              size={22}
              className="mx-auto text-[#4a4a4a]"
            />

            <p className="mt-3 text-[11px] text-[#777]">
              No attack sessions recorded.
            </p>

            <p className="mt-1 text-[9px] text-[#555]">
              Run the HoneyGuard demo attack to generate
              a session.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[760px]">
                <thead>
                  <tr className="border-b border-[#242424] bg-[#0d0d0d] text-left">
                    <th className="px-5 py-3">
                      <span className="hg-label">
                        Source
                      </span>
                    </th>

                    <th className="px-4 py-3">
                      <span className="hg-label">
                        Status
                      </span>
                    </th>

                    <th className="px-4 py-3">
                      <span className="hg-label">
                        Severity
                      </span>
                    </th>

                    <th className="px-4 py-3">
                      <span className="hg-label">
                        Requests
                      </span>
                    </th>

                    <th className="px-4 py-3">
                      <span className="hg-label">
                        Score
                      </span>
                    </th>

                    <th className="px-4 py-3">
                      <span className="hg-label">
                        Last Seen
                      </span>
                    </th>

                    <th className="px-5 py-3 text-right">
                      <span className="hg-label">
                        Details
                      </span>
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#222]">
                  {sessions.map((session) => (
                    <SessionTableRow
                      key={session.id}
                      session={session}
                      onOpen={() =>
                        navigate(
                          `/sessions/${session.id}`
                        )
                      }
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="divide-y divide-[#222] md:hidden">
              {sessions.map((session) => (
                <SessionMobileCard
                  key={session.id}
                  session={session}
                  onOpen={() =>
                    navigate(
                      `/sessions/${session.id}`
                    )
                  }
                />
              ))}
            </div>
          </>
        )}
      </section>
    </motion.div>
  );
}

/* =========================================================
   SESSION DETAIL
   ========================================================= */

function SessionDetailPage({ sessionId }) {
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [wsConnected, setWsConnected] = useState(false);

  const loadSession = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await fetchJson(
        `${API_BASE_URL}/api/v1/sessions/${sessionId}`
      );

      setSession(data);
    } catch (err) {
      setError(
        err.message || "Unable to load this session."
      );
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  useEffect(() => {
    let socket;
    let reconnectTimer;
    let cancelled = false;

    const connect = () => {
      if (cancelled) {
        return;
      }

      try {
        socket = new WebSocket(getWebSocketUrl());

        socket.onopen = () => {
          setWsConnected(true);
        };

        socket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);

            if (
              message.type === "session_updated" &&
              message.data?.id === sessionId
            ) {
              setSession((current) => ({
                ...(current || {}),
                ...message.data,
              }));
            }

            if (
              message.type === "new_event" &&
              message.data?.session_id === sessionId
            ) {
              loadSession();
            }
          } catch {
            // Ignore malformed messages.
          }
        };

        socket.onclose = () => {
          setWsConnected(false);

          if (!cancelled) {
            reconnectTimer = window.setTimeout(
              connect,
              2000
            );
          }
        };

        socket.onerror = () => {
          setWsConnected(false);
        };
      } catch {
        setWsConnected(false);
      }
    };

    connect();

    return () => {
      cancelled = true;

      if (reconnectTimer) {
        window.clearTimeout(reconnectTimer);
      }

      if (socket) {
        socket.close();
      }
    };
  }, [sessionId, loadSession]);

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-[1800px]">
        <SessionLoading />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="mx-auto w-full max-w-[1800px]">
        <button
          type="button"
          onClick={() => navigate("/sessions")}
          className="hg-control mb-5 flex items-center gap-2 px-3 py-2 text-[10px]"
        >
          <ArrowLeft size={13} />
          Back to Sessions
        </button>

        <div className="rounded-lg border border-[#4a2929] bg-[#171010] px-4 py-4 text-[10px] text-[#d99090]">
          {error || "Session not found."}
        </div>
      </div>
    );
  }

  const severity = normalizeSeverity(
    session.severity
  );

  const config = severityConfig(severity);

  return (
    <motion.div
      className="mx-auto w-full max-w-[1800px]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* =====================================================
          HEADER
          ===================================================== */}

      <section className="mb-6">
        <button
          type="button"
          onClick={() => navigate("/sessions")}
          className="hg-control mb-5 flex items-center gap-2 px-3 py-2 text-[10px]"
        >
          <ArrowLeft size={13} />
          Back to Sessions
        </button>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="hg-label">
              Monitor / Attack Sessions / Detail
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h2 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
                Attack Session
              </h2>

              <span
                className={`hg-badge ${config.badge}`}
              >
                <span
                  className={`hg-led ${config.led}`}
                />
                {severity}
              </span>
            </div>

            <p className="hg-mono mt-2 break-all text-[10px] text-[#666]">
              {session.id}
            </p>
          </div>

          <div className="hg-inset flex items-center gap-2 px-3 py-2.5">
            <span
              className={`hg-status-dot ${
                wsConnected
                  ? "hg-status-dot--success"
                  : "hg-status-dot--warning"
              }`}
            />

            <span className="text-[10px] text-[#999]">
              {wsConnected
                ? "Live session updates"
                : "Reconnecting..."}
            </span>
          </div>
        </div>
      </section>

      {/* =====================================================
          SUMMARY
          ===================================================== */}

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <DetailMetric
          label="Source IP"
          value={session.source_ip}
          mono
        />

        <DetailMetric
          label="Requests"
          value={session.request_count}
        />

        <DetailMetric
          label="Threat Score"
          value={session.score}
          highlight
        />

        <DetailMetric
          label="Status"
          value={session.status}
          status={session.status}
        />
      </section>

      {/* =====================================================
          SESSION INFORMATION
          ===================================================== */}

      <section className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1.5fr]">
        <section className="hg-raised min-w-0 overflow-hidden">
          <div className="hg-panel-header flex items-center gap-3 px-4 py-4 sm:px-5">
            <div className="hg-inset flex h-8 w-8 items-center justify-center rounded-md">
              <Clock3
                size={15}
                className="text-[var(--hg-gold-bright)]"
              />
            </div>

            <div>
              <h3 className="text-[12px] font-semibold text-[#e5e5e5] sm:text-[13px]">
                Session Window
              </h3>

              <p className="mt-1 text-[10px] text-[#666]">
                Correlated activity period
              </p>
            </div>
          </div>

          <div className="space-y-4 p-4 sm:p-5">
            <InfoRow
              label="First Seen"
              value={formatDateTime(
                session.first_seen
              )}
            />

            <InfoRow
              label="Last Seen"
              value={formatDateTime(
                session.last_seen
              )}
            />

            <InfoRow
              label="Last Activity"
              value={formatRelativeTime(
                session.last_seen
              )}
            />

            <InfoRow
              label="Session Status"
              value={session.status}
              valueClass={
                session.status === "active"
                  ? "text-[var(--hg-success)]"
                  : "text-[#999]"
              }
            />
          </div>
        </section>

        <section className="hg-raised min-w-0 overflow-hidden">
          <div className="hg-panel-header flex items-center gap-3 px-4 py-4 sm:px-5">
            <div className="hg-inset flex h-8 w-8 items-center justify-center rounded-md">
              <ShieldAlert
                size={15}
                className={config.text}
              />
            </div>

            <div>
              <h3 className="text-[12px] font-semibold text-[#e5e5e5] sm:text-[13px]">
                Session Events
              </h3>

              <p className="mt-1 text-[10px] text-[#666]">
                Requests correlated to this attacker
              </p>
            </div>
          </div>

          <div className="divide-y divide-[#222]">
            {session.events?.length > 0 ? (
              session.events.map((event) => (
                <SessionEventRow
                  key={event.id}
                  event={event}
                />
              ))
            ) : (
              <div className="px-5 py-10 text-center text-[10px] text-[#666]">
                No events recorded for this session.
              </div>
            )}
          </div>
        </section>
      </section>
    </motion.div>
  );
}

/* =========================================================
   COMPONENTS
   ========================================================= */

function SummaryCard({ label, value, icon: Icon }) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="hg-raised min-w-0 overflow-hidden p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="hg-label">{label}</span>

        <div className="hg-inset flex h-8 w-8 items-center justify-center rounded-md">
          <Icon
            size={15}
            className="text-[var(--hg-gold-bright)]"
            strokeWidth={1.8}
          />
        </div>
      </div>

      <div className="hg-mono mt-5 text-2xl font-semibold text-white">
        {value}
      </div>
    </motion.div>
  );
}

function SessionTableRow({ session, onOpen }) {
  const severity = normalizeSeverity(
    session.severity
  );

  const config = severityConfig(severity);

  return (
    <tr className="transition-colors hover:bg-[#111]">
      <td className="px-5 py-4">
        <span className="hg-mono text-[10px] font-medium text-[#d4d4d4]">
          {session.source_ip}
        </span>
      </td>

      <td className="px-4 py-4">
        <span
          className={`inline-flex items-center gap-1.5 text-[9px] font-medium ${
            session.status === "active"
              ? "text-[var(--hg-success)]"
              : "text-[#777]"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              session.status === "active"
                ? "bg-[var(--hg-success)]"
                : "bg-[#555]"
            }`}
          />

          {session.status}
        </span>
      </td>

      <td className="px-4 py-4">
        <span
          className={`hg-badge ${config.badge}`}
        >
          <span
            className={`hg-led ${config.led}`}
          />
          {severity}
        </span>
      </td>

      <td className="hg-mono px-4 py-4 text-[10px] text-[#aaa]">
        {session.request_count}
      </td>

      <td className="hg-mono px-4 py-4 text-[10px] font-semibold text-white">
        {session.score}
      </td>

      <td className="px-4 py-4">
        <div className="hg-mono text-[10px] text-[#999]">
          {formatRelativeTime(session.last_seen)}
        </div>

        <div className="mt-1 text-[8px] text-[#555]">
          {formatDateTime(session.last_seen)}
        </div>
      </td>

      <td className="px-5 py-4 text-right">
        <button
          type="button"
          onClick={onOpen}
          className="hg-control inline-flex items-center gap-1.5 px-2.5 py-2 text-[9px]"
        >
          View
          <ArrowUpRight size={11} />
        </button>
      </td>
    </tr>
  );
}

function SessionMobileCard({ session, onOpen }) {
  const severity = normalizeSeverity(
    session.severity
  );

  const config = severityConfig(severity);

  return (
    <button
      type="button"
      onClick={onOpen}
      className="block w-full text-left transition-colors hover:bg-[#111]"
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <span
              className={`hg-status-dot ${config.dot}`}
            />

            <span className="hg-mono truncate text-[11px] font-medium text-[#d4d4d4]">
              {session.source_ip}
            </span>
          </div>

          <span
            className={`hg-badge shrink-0 ${config.badge}`}
          >
            <span
              className={`hg-led ${config.led}`}
            />
            {severity}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <MiniStat
            label="Requests"
            value={session.request_count}
          />

          <MiniStat
            label="Score"
            value={session.score}
          />

          <MiniStat
            label="Status"
            value={session.status}
          />
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span className="hg-mono text-[9px] text-[#555]">
            {formatRelativeTime(session.last_seen)}
          </span>

          <span className="flex items-center gap-1 text-[9px] text-[var(--hg-gold-bright)]">
            View session
            <ArrowUpRight size={11} />
          </span>
        </div>
      </div>
    </button>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="min-w-0">
      <div className="hg-label text-[8px]">
        {label}
      </div>

      <div className="hg-mono mt-1 truncate text-[10px] text-[#bdbdbd]">
        {value}
      </div>
    </div>
  );
}

function DetailMetric({
  label,
  value,
  mono = false,
  highlight = false,
  status,
}) {
  return (
    <div className="hg-raised min-w-0 overflow-hidden p-4">
      <div className="hg-label">{label}</div>

      <div
        className={[
          mono ? "hg-mono" : "",
          "mt-4 truncate text-xl font-semibold",
          highlight
            ? "text-[var(--hg-gold-bright)]"
            : "text-white",
          status === "active"
            ? "text-[var(--hg-success)]"
            : "",
        ].join(" ")}
      >
        {value}
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  valueClass = "text-[#bdbdbd]",
}) {
  return (
    <div className="flex flex-col gap-1.5 border-b border-[#222] pb-3 last:border-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <span className="hg-label">{label}</span>

      <span
        className={`hg-mono break-all text-[10px] ${valueClass}`}
      >
        {value}
      </span>
    </div>
  );
}

function SessionEventRow({ event }) {
  return (
    <div className="px-4 py-4 sm:px-5">
      <div className="flex min-w-0 items-start gap-3">
        <div className="hg-inset flex h-8 w-8 shrink-0 items-center justify-center rounded-md">
          <Activity
            size={13}
            className="text-[var(--hg-gold-bright)]"
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
            <span className="text-[11px] font-medium text-[#d4d4d4]">
              {event.event_type || "Security Event"}
            </span>

            <span className="hg-mono shrink-0 text-[9px] text-[#555]">
              {formatDateTime(event.timestamp)}
            </span>
          </div>

          <div className="hg-mono mt-2 break-all text-[9px] text-[#777]">
            {event.http_method || "GET"}{" "}
            {event.path || "—"}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[8px] text-[#555]">
            <span>
              Status {event.status_code ?? "—"}
            </span>

            <span>
              Source {event.source_ip || "—"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function SessionLoading() {
  return (
    <div className="divide-y divide-[#222]">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse px-5 py-5"
        >
          <div className="h-3 w-32 rounded bg-[#202020]" />
          <div className="mt-3 h-2 w-56 rounded bg-[#181818]" />
          <div className="mt-3 h-2 w-40 rounded bg-[#181818]" />
        </div>
      ))}
    </div>
  );
}