import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, RefreshCw, ShieldAlert, Wifi } from "lucide-react";
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

function getEventSeverity(event) {
  const type = event?.event_type?.toLowerCase() || "";
  const path = event?.path?.toLowerCase() || "";

  if (
    type === "env_file" ||
    type === "database" ||
    path.includes(".env") ||
    path.includes("database")
  ) {
    return "critical";
  }

  if (
    type === "admin_login" ||
    type === "jenkins" ||
    type === "grafana" ||
    type === "wordpress"
  ) {
    return "high";
  }

  if (
    type === "backup_file" ||
    path.includes("backup")
  ) {
    return "medium";
  }

  return "low";
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
      text: "text-[var(--hg-critical)]",
    },
    high: {
      badge: "hg-badge--high",
      led: "hg-led--warning",
      text: "text-[var(--hg-high)]",
    },
    medium: {
      badge: "hg-badge--medium",
      led: "hg-led--warning",
      text: "text-[var(--hg-medium)]",
    },
    low: {
      badge: "hg-badge--low",
      led: "hg-led--blue",
      text: "text-[var(--hg-low)]",
    },
  };

  return configs[value] || configs.low;
}

async function fetchEvents() {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/events`
  );

  const payload = await response.json().catch(() => null);

  if (!response.ok || payload?.success === false) {
    throw new Error(
      payload?.error?.message ||
        payload?.message ||
        "Unable to retrieve security events."
    );
  }

  return Array.isArray(payload?.data)
    ? payload.data
    : [];
}

export function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [wsConnected, setWsConnected] = useState(false);
  const [filter, setFilter] = useState("all");

  const loadEvents = useCallback(
    async (showRefresh = false) => {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        const data = await fetchEvents();
        setEvents(data);
      } catch (err) {
        setError(
          err.message ||
            "Unable to load security events."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  /*
   * Live WebSocket connection.
   *
   * new_event is inserted immediately at the top of
   * the feed. This means the page does not need to
   * refresh when demo_attack.py generates traffic.
   */
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

        socket.onmessage = (message) => {
          try {
            const payload = JSON.parse(message.data);

            if (
              payload.type !== "new_event" ||
              !payload.data
            ) {
              return;
            }

            const incomingEvent = payload.data;

            setEvents((current) => {
              if (
                current.some(
                  (event) =>
                    event.id === incomingEvent.id
                )
              ) {
                return current;
              }

              return [
                incomingEvent,
                ...current,
              ];
            });
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

  const filteredEvents = useMemo(() => {
    if (filter === "all") {
      return events;
    }

    return events.filter(
      (event) =>
        normalizeSeverity(
          event.severity || getEventSeverity(event)
        ) === filter
    );
  }, [events, filter]);

  const counts = useMemo(() => {
    const result = {
      all: events.length,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };

    events.forEach((event) => {
      const severity = normalizeSeverity(
        event.severity || getEventSeverity(event)
      );

      if (result[severity] !== undefined) {
        result[severity] += 1;
      }
    });

    return result;
  }, [events]);

  return (
    <motion.div
      className="mx-auto w-full max-w-[1800px]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: 0.2,
        ease: "easeOut",
      }}
    >
      {/* =====================================================
          PAGE HEADER
          ===================================================== */}

      <section className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <div className="hg-label">
            Monitor / Live Events
          </div>

          <h2 className="mt-2 text-xl font-semibold tracking-tight text-white sm:text-2xl">
            Live Security Events
          </h2>

          <p className="mt-1 max-w-2xl text-[11px] leading-5 text-[#777] sm:text-[12px]">
            Real-time telemetry captured from HoneyGuard
            decoy endpoints.
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
                  ? "Receiving Live Events"
                  : "Reconnecting..."}
              </span>
            </div>

            <span className="hg-mono text-[9px] text-[#5f5f5f]">
              {wsConnected ? "LIVE" : "OFFLINE"}
            </span>
          </div>

          <button
            type="button"
            onClick={() => loadEvents(true)}
            disabled={refreshing}
            className="hg-control flex min-h-[42px] items-center justify-center gap-2 px-3 py-2 text-[10px] font-medium disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              size={13}
              className={
                refreshing
                  ? "animate-spin"
                  : ""
              }
            />

            Refresh
          </button>
        </div>
      </section>

      {error && (
        <div className="mb-4 rounded-lg border border-[#4a2929] bg-[#171010] px-4 py-3 text-[10px] text-[#d99090]">
          {error}
        </div>
      )}

      {/* =====================================================
          EVENT SUMMARY
          ===================================================== */}

      <section className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <EventSummary
          label="All Events"
          value={counts.all}
          active={filter === "all"}
          onClick={() => setFilter("all")}
        />

        <EventSummary
          label="Critical"
          value={counts.critical}
          active={filter === "critical"}
          onClick={() => setFilter("critical")}
          severity="critical"
        />

        <EventSummary
          label="High"
          value={counts.high}
          active={filter === "high"}
          onClick={() => setFilter("high")}
          severity="high"
        />

        <EventSummary
          label="Medium"
          value={counts.medium}
          active={filter === "medium"}
          onClick={() => setFilter("medium")}
          severity="medium"
        />
      </section>

      {/* =====================================================
          EVENT FEED
          ===================================================== */}

      <section className="hg-raised min-w-0 overflow-hidden">
        <div className="hg-panel-header flex items-center justify-between gap-3 px-4 py-4 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="hg-inset flex h-8 w-8 shrink-0 items-center justify-center rounded-md">
              <Activity
                size={15}
                className="text-[var(--hg-gold-bright)]"
                strokeWidth={1.8}
              />
            </div>

            <div className="min-w-0">
              <h3 className="truncate text-[12px] font-semibold text-[#e5e5e5] sm:text-[13px]">
                Security Event Feed
              </h3>

              <p className="mt-1 truncate text-[10px] text-[#666]">
                {filteredEvents.length} event
                {filteredEvents.length === 1
                  ? ""
                  : "s"} displayed
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-2 sm:flex">
            <Wifi
              size={12}
              className={
                wsConnected
                  ? "text-[var(--hg-success)]"
                  : "text-[#555]"
              }
            />

            <span className="hg-mono text-[8px] text-[#555]">
              WEBSOCKET
            </span>
          </div>
        </div>

        {loading ? (
          <EventsLoading />
        ) : filteredEvents.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <Activity
              size={22}
              className="mx-auto text-[#4a4a4a]"
            />

            <p className="mt-3 text-[11px] text-[#777]">
              No events match this filter.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[850px]">
                <thead>
                  <tr className="border-b border-[#242424] bg-[#0d0d0d] text-left">
                    <th className="px-5 py-3">
                      <span className="hg-label">
                        Time
                      </span>
                    </th>

                    <th className="px-4 py-3">
                      <span className="hg-label">
                        Event
                      </span>
                    </th>

                    <th className="px-4 py-3">
                      <span className="hg-label">
                        Request
                      </span>
                    </th>

                    <th className="px-4 py-3">
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
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#222]">
                  {filteredEvents.map(
                    (event, index) => (
                      <EventTableRow
                        key={event.id}
                        event={event}
                        isNew={index === 0}
                      />
                    )
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="divide-y divide-[#222] md:hidden">
              {filteredEvents.map(
                (event, index) => (
                  <EventMobileCard
                    key={event.id}
                    event={event}
                    isNew={index === 0}
                  />
                )
              )}
            </div>
          </>
        )}
      </section>
    </motion.div>
  );
}

/* =========================================================
   SUMMARY CARD
   ========================================================= */

function EventSummary({
  label,
  value,
  active,
  onClick,
  severity,
}) {
  const config = severity
    ? severityConfig(severity)
    : null;

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "hg-raised min-w-0 overflow-hidden p-4 text-left transition-all duration-150",
        active
          ? "border-[rgba(214,169,40,0.3)]"
          : "hover:border-[#353535]",
      ].join(" ")}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="hg-label">
          {label}
        </span>

        {config && (
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              severity === "critical"
                ? "bg-[var(--hg-critical)]"
                : severity === "high"
                  ? "bg-[var(--hg-high)]"
                  : "bg-[var(--hg-medium)]"
            }`}
          />
        )}
      </div>

      <div
        className={[
          "hg-mono mt-4 text-xl font-semibold",
          config
            ? config.text
            : "text-white",
        ].join(" ")}
      >
        {value}
      </div>
    </button>
  );
}

/* =========================================================
   DESKTOP ROW
   ========================================================= */

function EventTableRow({ event, isNew }) {
  const severity = normalizeSeverity(
    event.severity || getEventSeverity(event)
  );

  const config = severityConfig(severity);

  return (
    <motion.tr
      initial={
        isNew
          ? {
              opacity: 0,
              backgroundColor:
                "rgba(214,169,40,0.06)",
            }
          : false
      }
      animate={{
        opacity: 1,
        backgroundColor: "rgba(0,0,0,0)",
      }}
      transition={{
        duration: 0.45,
      }}
      className="transition-colors hover:bg-[#111]"
    >
      <td className="px-5 py-4">
        <div className="hg-mono text-[9px] text-[#999]">
          {formatDateTime(
            event.timestamp ||
              event.created_at
          )}
        </div>

        <div className="mt-1 text-[8px] text-[#555]">
          {formatRelativeTime(
            event.timestamp ||
              event.created_at
          )}
        </div>
      </td>

      <td className="px-4 py-4">
        <div className="flex items-center gap-2.5">
          <span
            className={`h-1.5 w-1.5 shrink-0 rounded-full ${
              severity === "critical"
                ? "bg-[var(--hg-critical)]"
                : severity === "high"
                  ? "bg-[var(--hg-high)]"
                  : severity === "medium"
                    ? "bg-[var(--hg-medium)]"
                    : "bg-[var(--hg-low)]"
            }`}
          />

          <div className="min-w-0">
            <div className="text-[10px] font-medium text-[#d4d4d4]">
              {getEventTitle(event)}
            </div>

            <div className="mt-1 hg-mono text-[8px] text-[#555]">
              {event.event_type || "security_event"}
            </div>
          </div>
        </div>
      </td>

      <td className="px-4 py-4">
        <div className="hg-mono text-[10px] text-[#aaa]">
          {event.http_method ||
            event.method ||
            "GET"}
        </div>

        <div className="mt-1 max-w-[260px] truncate hg-mono text-[9px] text-[#666]">
          {event.path || "—"}
        </div>
      </td>

      <td className="px-4 py-4">
        <span className="hg-mono text-[9px] text-[#999]">
          {event.source_ip || "—"}
        </span>
      </td>

      <td className="px-4 py-4">
        <span
          className={[
            "hg-mono text-[10px] font-semibold",
            Number(event.status_code) >= 400
              ? "text-[#b98b8b]"
              : "text-[#8f9f8f]",
          ].join(" ")}
        >
          {event.status_code ?? "—"}
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
    </motion.tr>
  );
}

/* =========================================================
   MOBILE CARD
   ========================================================= */

function EventMobileCard({ event, isNew }) {
  const severity = normalizeSeverity(
    event.severity || getEventSeverity(event)
  );

  const config = severityConfig(severity);

  return (
    <motion.div
      initial={
        isNew
          ? {
              opacity: 0,
              x: -8,
            }
          : false
      }
      animate={{
        opacity: 1,
        x: 0,
      }}
      transition={{
        duration: 0.25,
      }}
      className="p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <span
            className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
              severity === "critical"
                ? "bg-[var(--hg-critical)]"
                : severity === "high"
                  ? "bg-[var(--hg-high)]"
                  : severity === "medium"
                    ? "bg-[var(--hg-medium)]"
                    : "bg-[var(--hg-low)]"
            }`}
          />

          <div className="min-w-0">
            <div className="text-[11px] font-medium text-[#d4d4d4]">
              {getEventTitle(event)}
            </div>

            <div className="mt-1 hg-mono text-[8px] text-[#555]">
              {event.event_type ||
                "security_event"}
            </div>
          </div>
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

      <div className="mt-4 rounded-md border border-[#222] bg-[#0d0d0d] px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span className="hg-mono text-[9px] font-semibold text-[#aaa]">
            {event.http_method ||
              event.method ||
              "GET"}
          </span>

          <span className="truncate hg-mono text-[9px] text-[#777]">
            {event.path || "—"}
          </span>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-3">
        <MobileStat
          label="Source"
          value={event.source_ip || "—"}
        />

        <MobileStat
          label="Status"
          value={event.status_code ?? "—"}
        />

        <MobileStat
          label="Time"
          value={formatRelativeTime(
            event.timestamp ||
              event.created_at
          )}
        />
      </div>
    </motion.div>
  );
}

function MobileStat({ label, value }) {
  return (
    <div className="min-w-0">
      <div className="hg-label text-[8px]">
        {label}
      </div>

      <div className="mt-1 truncate hg-mono text-[9px] text-[#999]">
        {value}
      </div>
    </div>
  );
}

/* =========================================================
   HELPERS
   ========================================================= */

function getEventTitle(event) {
  if (event?.title) {
    return event.title;
  }

  const titles = {
    admin_login: "Administrative Login Probe",
    env_file: "Environment File Discovery",
    wordpress: "WordPress Enumeration",
    jenkins: "Jenkins Console Enumeration",
    grafana: "Grafana Dashboard Probe",
    backup_file: "Backup Discovery",
    database: "Database Probe",
    internal_api: "Internal API Probe",
  };

  return (
    titles[event?.event_type] ||
    "Suspicious Endpoint Access"
  );
}

function EventsLoading() {
  return (
    <div className="divide-y divide-[#222]">
      {Array.from({ length: 6 }).map(
        (_, index) => (
          <div
            key={index}
            className="animate-pulse px-5 py-5"
          >
            <div className="h-3 w-36 rounded bg-[#202020]" />

            <div className="mt-3 h-2 w-64 rounded bg-[#181818]" />

            <div className="mt-3 h-2 w-44 rounded bg-[#181818]" />
          </div>
        )
      )}
    </div>
  );
}