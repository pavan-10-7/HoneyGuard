import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, RefreshCw, Clock3 } from "lucide-react";
import { motion } from "framer-motion";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

function formatDateTime(timestamp) {
  if (!timestamp) return "—";

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString([], {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function formatRelativeTime(timestamp) {
  if (!timestamp) return "—";

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) return "—";

  const seconds = Math.max(
    0,
    Math.floor((Date.now() - date.getTime()) / 1000)
  );

  if (seconds < 5) return "Just now";
  if (seconds < 60) return `${seconds}s ago`;

  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);

  if (hours < 24) return `${hours}h ago`;

  return `${Math.floor(hours / 24)}d ago`;
}

function getSeverity(event) {
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

function severityClasses(severity) {
  switch (severity) {
    case "critical":
      return {
        dot: "bg-[var(--hg-critical)]",
        line: "border-[var(--hg-critical)]",
        text: "text-[var(--hg-critical)]",
        badge: "hg-badge--critical",
        led: "hg-led--critical",
      };

    case "high":
      return {
        dot: "bg-[var(--hg-high)]",
        line: "border-[var(--hg-high)]",
        text: "text-[var(--hg-high)]",
        badge: "hg-badge--high",
        led: "hg-led--warning",
      };

    case "medium":
      return {
        dot: "bg-[var(--hg-medium)]",
        line: "border-[var(--hg-medium)]",
        text: "text-[var(--hg-medium)]",
        badge: "hg-badge--medium",
        led: "hg-led--warning",
      };

    default:
      return {
        dot: "bg-[var(--hg-low)]",
        line: "border-[var(--hg-low)]",
        text: "text-[var(--hg-low)]",
        badge: "hg-badge--low",
        led: "hg-led--blue",
      };
  }
}

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

  return titles[event?.event_type] || "Suspicious Endpoint Access";
}

async function fetchTimeline() {
  const sessionsResponse = await fetch(
    `${API_BASE_URL}/api/v1/sessions`
  );

  const sessionsPayload =
    await sessionsResponse.json().catch(() => null);

  if (
    !sessionsResponse.ok ||
    sessionsPayload?.success === false
  ) {
    throw new Error(
      sessionsPayload?.error?.message ||
        sessionsPayload?.message ||
        "Unable to retrieve attack sessions."
    );
  }

  const sessions = Array.isArray(sessionsPayload?.data)
    ? sessionsPayload.data
    : [];

  if (sessions.length === 0) {
    return [];
  }

  // Prefer the currently active session.
  // Otherwise use the most recently created session.
  const session =
    sessions.find(
      (item) => item.status === "active"
    ) || sessions[0];

  const timelineResponse = await fetch(
    `${API_BASE_URL}/api/v1/timeline/${session.id}`
  );

  const timelinePayload =
    await timelineResponse.json().catch(() => null);

  if (
    !timelineResponse.ok ||
    timelinePayload?.success === false
  ) {
    throw new Error(
      timelinePayload?.error?.message ||
        timelinePayload?.message ||
        "Unable to retrieve timeline."
    );
  }

  return Array.isArray(timelinePayload?.data)
    ? timelinePayload.data
    : [];
}

export function TimelinePage() {
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  const loadTimeline = useCallback(
    async (showRefresh = false) => {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        const data = await fetchTimeline();
        setTimeline(data);
      } catch (err) {
        setError(
          err.message || "Unable to load timeline."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    loadTimeline();
  }, [loadTimeline]);

  const filteredTimeline = useMemo(() => {
    if (filter === "all") {
      return timeline;
    }

    return timeline.filter(
      (event) => getSeverity(event) === filter
    );
  }, [timeline, filter]);

  const counts = useMemo(() => {
    const result = {
      all: timeline.length,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };

    timeline.forEach((event) => {
      const severity = getSeverity(event);

      if (result[severity] !== undefined) {
        result[severity] += 1;
      }
    });

    return result;
  }, [timeline]);

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
      {/* HEADER */}

      <section className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <div className="hg-label">
            Monitor / Threat Timeline
          </div>

          <h2 className="mt-2 text-xl font-semibold tracking-tight text-white sm:text-2xl">
            Threat Timeline
          </h2>

          <p className="mt-1 max-w-2xl text-[11px] leading-5 text-[#777] sm:text-[12px]">
            Chronological reconstruction of suspicious
            activity captured by HoneyGuard.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadTimeline(true)}
          disabled={refreshing}
          className="hg-control flex min-h-[42px] items-center justify-center gap-2 px-3 py-2 text-[10px] font-medium disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw
            size={13}
            className={refreshing ? "animate-spin" : ""}
          />

          Refresh
        </button>
      </section>

      {error && (
        <div className="mb-4 rounded-lg border border-[#4a2929] bg-[#171010] px-4 py-3 text-[10px] text-[#d99090]">
          {error}
        </div>
      )}

      {/* SUMMARY */}

      <section className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <TimelineSummary
          label="All Events"
          value={counts.all}
          active={filter === "all"}
          onClick={() => setFilter("all")}
        />

        <TimelineSummary
          label="Critical"
          value={counts.critical}
          active={filter === "critical"}
          onClick={() => setFilter("critical")}
          severity="critical"
        />

        <TimelineSummary
          label="High"
          value={counts.high}
          active={filter === "high"}
          onClick={() => setFilter("high")}
          severity="high"
        />

        <TimelineSummary
          label="Medium"
          value={counts.medium}
          active={filter === "medium"}
          onClick={() => setFilter("medium")}
          severity="medium"
        />
      </section>

      {/* TIMELINE */}

      <section className="hg-raised overflow-hidden">
        <div className="hg-panel-header flex items-center justify-between gap-3 px-4 py-4 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="hg-inset flex h-8 w-8 shrink-0 items-center justify-center rounded-md">
              <Clock3
                size={15}
                className="text-[var(--hg-gold-bright)]"
                strokeWidth={1.8}
              />
            </div>

            <div className="min-w-0">
              <h3 className="truncate text-[12px] font-semibold text-[#e5e5e5] sm:text-[13px]">
                Attack Progression
              </h3>

              <p className="mt-1 truncate text-[10px] text-[#666]">
                {filteredTimeline.length} event
                {filteredTimeline.length === 1
                  ? ""
                  : "s"} in sequence
              </p>
            </div>
          </div>

          <Activity
            size={14}
            className="shrink-0 text-[#555]"
          />
        </div>

        {loading ? (
          <TimelineLoading />
        ) : filteredTimeline.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <Clock3
              size={22}
              className="mx-auto text-[#4a4a4a]"
            />

            <p className="mt-3 text-[11px] text-[#777]">
              No timeline events available.
            </p>
          </div>
        ) : (
          <div className="px-4 py-5 sm:px-7 sm:py-7">
            <div className="relative">
              {/* Vertical timeline line */}
              <div className="absolute bottom-4 left-[11px] top-4 w-px bg-[#292929] sm:left-[15px]" />

              <div className="space-y-0">
                {filteredTimeline.map(
                  (event, index) => (
                    <TimelineItem
                      key={event.id}
                      event={event}
                      index={index}
                      isLast={
                        index ===
                        filteredTimeline.length - 1
                      }
                    />
                  )
                )}
              </div>
            </div>
          </div>
        )}
      </section>
    </motion.div>
  );
}

/* =========================================================
   SUMMARY CARD
   ========================================================= */

function TimelineSummary({
  label,
  value,
  active,
  onClick,
  severity,
}) {
  const colors = severity
    ? severityClasses(severity)
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

        {colors && (
          <span
            className={`h-1.5 w-1.5 rounded-full ${colors.dot}`}
          />
        )}
      </div>

      <div
        className={[
          "hg-mono mt-4 text-xl font-semibold",
          colors
            ? colors.text
            : "text-white",
        ].join(" ")}
      >
        {value}
      </div>
    </button>
  );
}

/* =========================================================
   TIMELINE ITEM
   ========================================================= */

function TimelineItem({
  event,
  index,
  isLast,
}) {
  const severity = getSeverity(event);
  const colors = severityClasses(severity);

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 8,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.22,
        delay: Math.min(index * 0.025, 0.2),
      }}
      className="relative grid grid-cols-[24px_minmax(0,1fr)] gap-3 sm:grid-cols-[32px_minmax(0,1fr)] sm:gap-4"
    >
      {/* Timeline marker */}

      <div className="relative flex justify-center">
        <div
          className={[
            "relative z-10 mt-5 h-2.5 w-2.5 rounded-full border-2 border-[#0c0c0c] ring-1 ring-[#333] sm:mt-6 sm:h-3 sm:w-3",
            colors.dot,
          ].join(" ")}
        />
      </div>

      {/* Event card */}

      <div
        className={[
          "mb-4 min-w-0 rounded-lg border border-[#242424] bg-[#101010] p-4 transition-colors duration-150 hover:border-[#333] sm:mb-5 sm:p-5",
          !isLast
            ? ""
            : "mb-1",
        ].join(" ")}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-[11px] font-semibold text-[#ddd] sm:text-[12px]">
                {getEventTitle(event)}
              </h4>

              <span
                className={`hg-badge ${colors.badge}`}
              >
                <span
                  className={`hg-led ${colors.led}`}
                />

                {severity}
              </span>
            </div>

            <div className="mt-2 hg-mono text-[9px] text-[#555]">
              {event.event_type ||
                "security_event"}
            </div>
          </div>

          <div className="shrink-0 sm:text-right">
            <div className="hg-mono text-[9px] text-[#999]">
              {formatDateTime(event.timestamp)}
            </div>

            <div className="mt-1 text-[8px] text-[#555]">
              {formatRelativeTime(event.timestamp)}
            </div>
          </div>
        </div>

        {/* Request details */}

        <div className="mt-4 grid grid-cols-1 gap-2 border-t border-[#202020] pt-3 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center sm:gap-4">
          <div className="flex items-center gap-2">
            <span className="hg-mono text-[9px] font-semibold text-[#aaa]">
              {event.method || "GET"}
            </span>

            <span className="hg-mono text-[8px] text-[#555]">
              {event.status_code ?? "—"}
            </span>
          </div>

          <div className="min-w-0 truncate hg-mono text-[9px] text-[#777]">
            {event.path || "—"}
          </div>

          <div className="hg-mono text-[8px] text-[#555] sm:text-right">
            {event.source_ip || "—"}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function TimelineLoading() {
  return (
    <div className="space-y-4 px-5 py-6">
      {Array.from({ length: 6 }).map(
        (_, index) => (
          <div
            key={index}
            className="animate-pulse rounded-lg border border-[#202020] bg-[#101010] p-5"
          >
            <div className="h-3 w-44 rounded bg-[#202020]" />

            <div className="mt-3 h-2 w-28 rounded bg-[#181818]" />

            <div className="mt-5 h-2 w-full max-w-[500px] rounded bg-[#181818]" />
          </div>
        )
      )}
    </div>
  );
}