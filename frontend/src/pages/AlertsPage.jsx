import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  RefreshCw,
  ShieldAlert,
  Target,
} from "lucide-react";
import { motion } from "framer-motion";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

const EVENT_TITLES = {
  admin_login: "Administrative Login Probe",
  wordpress: "WordPress Enumeration",
  jenkins: "Jenkins Console Enumeration",
  grafana: "Grafana Dashboard Probe",
  env_file: "Environment File Discovery",
  backup: "Backup Discovery",
  database: "Database Probe",
  internal_api: "Internal API Probe",
};

function getSeverity(event) {
  const type = event?.event_type?.toLowerCase() || "";
  const path = event?.path?.toLowerCase() || "";

  if (
    type === "env_file" ||
    path.includes(".env")
  ) {
    return "critical";
  }

  if (
    type === "admin_login" ||
    type === "wordpress" ||
    type === "jenkins" ||
    type === "grafana"
  ) {
    return "high";
  }

  if (
    type === "backup" ||
    type === "database" ||
    type === "internal_api"
  ) {
    return "medium";
  }

  return "low";
}

function severityConfig(severity) {
  const configs = {
    critical: {
      label: "CRITICAL",
      text: "text-[var(--hg-critical)]",
      dot: "bg-[var(--hg-critical)]",
      border: "border-[#542929]",
      bg: "bg-[#160d0d]",
      icon: AlertCircle,
    },
    high: {
      label: "HIGH",
      text: "text-[var(--hg-high)]",
      dot: "bg-[var(--hg-high)]",
      border: "border-[#513624]",
      bg: "bg-[#17110d]",
      icon: AlertTriangle,
    },
    medium: {
      label: "MEDIUM",
      text: "text-[var(--hg-medium)]",
      dot: "bg-[var(--hg-medium)]",
      border: "border-[#4b4225]",
      bg: "bg-[#15130c]",
      icon: ShieldAlert,
    },
    low: {
      label: "LOW",
      text: "text-[var(--hg-low)]",
      dot: "bg-[var(--hg-low)]",
      border: "border-[#293847]",
      bg: "bg-[#0d1217]",
      icon: CheckCircle2,
    },
  };

  return configs[severity] || configs.low;
}

function getTitle(event) {
  return (
    EVENT_TITLES[event?.event_type] ||
    event?.event_type ||
    "Security Event"
  );
}

function formatTime(timestamp) {
  if (!timestamp) return "—";

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString([], {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
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

export function AlertsPage() {
  const [events, setEvents] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadAlerts = useCallback(
    async (manual = false) => {
      if (manual) {
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
            "Unable to load alerts."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  const alerts = useMemo(
    () =>
      events.map((event) => ({
        ...event,
        severity: getSeverity(event),
        title: getTitle(event),
      })),
    [events]
  );

  const counts = useMemo(() => {
    return alerts.reduce(
      (result, alert) => {
        result.total += 1;
        result[alert.severity] += 1;
        return result;
      },
      {
        total: 0,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
      }
    );
  }, [alerts]);

  const filteredAlerts = useMemo(() => {
    if (filter === "all") {
      return alerts;
    }

    return alerts.filter(
      (alert) => alert.severity === filter
    );
  }, [alerts, filter]);

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
            Monitor / Alerts
          </div>

          <h2 className="mt-2 text-xl font-semibold tracking-tight text-white sm:text-2xl">
            Security Alerts
          </h2>

          <p className="mt-1 max-w-2xl text-[11px] leading-5 text-[#777] sm:text-[12px]">
            Security events classified by threat severity
            for rapid incident review.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadAlerts(true)}
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

          Refresh Alerts
        </button>
      </section>

      {error && (
        <div className="mb-4 rounded-lg border border-[#4a2929] bg-[#171010] px-4 py-3 text-[10px] text-[#d99090]">
          {error}
        </div>
      )}

      {/* SUMMARY */}

      <section className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <AlertMetric
          label="Total Alerts"
          value={counts.total}
          icon={<Target size={14} />}
        />

        <AlertMetric
          label="Critical"
          value={counts.critical}
          icon={<AlertCircle size={14} />}
          accent="critical"
        />

        <AlertMetric
          label="High"
          value={counts.high}
          icon={<AlertTriangle size={14} />}
          accent="high"
        />

        <AlertMetric
          label="Medium"
          value={counts.medium}
          icon={<ShieldAlert size={14} />}
          accent="medium"
        />
      </section>

      {/* FILTERS */}

      <section className="mb-4 hg-raised overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 px-4 py-3 sm:px-5">
          <span className="mr-1 hg-label">
            Filter
          </span>

          {[
            ["all", "All", counts.total],
            [
              "critical",
              "Critical",
              counts.critical,
            ],
            ["high", "High", counts.high],
            [
              "medium",
              "Medium",
              counts.medium,
            ],
            ["low", "Low", counts.low],
          ].map(([value, label, count]) => {
            const active = filter === value;

            return (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={[
                  "flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-[9px] font-medium transition-colors",
                  active
                    ? "border-[#444] bg-[#1a1a1a] text-[#ddd]"
                    : "border-transparent text-[#666] hover:border-[#2c2c2c] hover:text-[#aaa]",
                ].join(" ")}
              >
                {label}

                <span className="hg-mono text-[8px] text-[#555]">
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ALERT LIST */}

      <section className="hg-raised overflow-hidden">
        <div className="hg-panel-header flex items-center justify-between px-4 py-4 sm:px-5">
          <div>
            <h3 className="text-[12px] font-semibold text-[#e5e5e5] sm:text-[13px]">
              Alert Stream
            </h3>

            <p className="mt-1 text-[10px] text-[#666]">
              {filteredAlerts.length} alert
              {filteredAlerts.length === 1
                ? ""
                : "s"} displayed
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--hg-success)] shadow-[0_0_6px_rgba(74,222,128,0.5)]" />

            <span className="text-[9px] uppercase tracking-[0.12em] text-[#666]">
              Monitoring
            </span>
          </div>
        </div>

        {loading ? (
          <AlertsLoading />
        ) : filteredAlerts.length === 0 ? (
          <EmptyAlerts />
        ) : (
          <div className="divide-y divide-[#202020]">
            {filteredAlerts.map(
              (alert, index) => (
                <AlertRow
                  key={alert.id || index}
                  alert={alert}
                  index={index}
                />
              )
            )}
          </div>
        )}
      </section>
    </motion.div>
  );
}

/* =========================================================
   ALERT METRIC
   ========================================================= */

function AlertMetric({
  label,
  value,
  icon,
  accent,
}) {
  const config = accent
    ? severityConfig(accent)
    : null;

  return (
    <div className="hg-raised min-w-0 p-4">
      <div
        className={[
          "flex items-center gap-2",
          config?.text || "text-[#555]",
        ].join(" ")}
      >
        {icon}

        <span className="hg-label">
          {label}
        </span>
      </div>

      <div
        className={[
          "mt-3 hg-mono text-lg font-semibold",
          config?.text || "text-[#ddd]",
        ].join(" ")}
      >
        {value}
      </div>
    </div>
  );
}

/* =========================================================
   ALERT ROW
   ========================================================= */

function AlertRow({
  alert,
  index,
}) {
  const config = severityConfig(
    alert.severity
  );

  const Icon = config.icon;

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 5,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.18,
        delay: Math.min(index * 0.025, 0.2),
      }}
      className="group px-4 py-4 transition-colors hover:bg-[#101010] sm:px-5"
    >
      <div className="flex items-start gap-3">
        {/* ICON */}

        <div
          className={[
            "hg-inset flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
            config.text,
          ].join(" ")}
        >
          <Icon
            size={14}
            strokeWidth={1.8}
          />
        </div>

        {/* MAIN */}

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-[11px] font-semibold text-[#ddd] sm:text-[12px]">
                  {alert.title}
                </h4>

                <span
                  className={[
                    "flex items-center gap-1.5 text-[8px] font-medium tracking-[0.08em]",
                    config.text,
                  ].join(" ")}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${config.dot}`}
                  />

                  {config.label}
                </span>
              </div>

              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="hg-mono text-[9px] text-[#777]">
                  {alert.method ||
                    alert.http_method ||
                    "—"}{" "}
                  {alert.path || "—"}
                </span>

                <span className="text-[#333]">
                  •
                </span>

                <span className="hg-mono text-[9px] text-[#555]">
                  {alert.source_ip ||
                    "Unknown source"}
                </span>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1.5 text-[8px] text-[#555]">
              <Clock3 size={10} />

              {formatTime(
                alert.timestamp ||
                  alert.created_at
              )}
            </div>
          </div>

          {/* DETAILS */}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span
              className={[
                "rounded border px-2 py-1 hg-mono text-[8px]",
                config.border,
                config.bg,
                config.text,
              ].join(" ")}
            >
              HTTP{" "}
              {alert.status_code ?? "—"}
            </span>

            <span className="rounded border border-[#292929] bg-[#0e0e0e] px-2 py-1 hg-mono text-[8px] text-[#555]">
              {alert.event_type ||
                "security_event"}
            </span>

            {alert.session_id && (
              <span className="max-w-full truncate rounded border border-[#292929] bg-[#0e0e0e] px-2 py-1 hg-mono text-[8px] text-[#555] sm:max-w-[260px]">
                session: {alert.session_id}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* =========================================================
   STATES
   ========================================================= */

function AlertsLoading() {
  return (
    <div className="space-y-px">
      {[1, 2, 3, 4].map((item) => (
        <div
          key={item}
          className="h-[105px] animate-pulse bg-[#101010]"
        />
      ))}
    </div>
  );
}

function EmptyAlerts() {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center px-6 text-center">
      <CheckCircle2
        size={28}
        className="text-[var(--hg-success)]"
      />

      <h3 className="mt-4 text-[13px] font-semibold text-[#aaa]">
        No Alerts Found
      </h3>

      <p className="mt-2 max-w-md text-[10px] leading-5 text-[#555]">
        There are no security events matching
        the current filter.
      </p>
    </div>
  );
}