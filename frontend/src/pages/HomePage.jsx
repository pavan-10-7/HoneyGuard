import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Clock3,
  ShieldAlert,
  Target,
  TrendingUp,
} from "lucide-react";
import { useDashboardData } from "../hooks/useDashboardData";

function formatRelativeTime(timestamp) {
  if (!timestamp) {
    return "—";
  }

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  const diffSeconds = Math.max(
    0,
    Math.floor((Date.now() - date.getTime()) / 1000)
  );

  if (diffSeconds < 5) {
    return "Just now";
  }

  if (diffSeconds < 60) {
    return `${diffSeconds} sec ago`;
  }

  const minutes = Math.floor(diffSeconds / 60);

  if (minutes < 60) {
    return `${minutes} min ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours} hr ago`;
  }

  return `${Math.floor(hours / 24)} d ago`;
}

function formatTime(timestamp) {
  if (!timestamp) {
    return "—";
  }

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function normalizeSeverity(severity) {
  return (
    severity?.toString()?.toLowerCase() || "low"
  );
}

function getEventSeverity(event) {
  const type = event?.event_type?.toLowerCase();

  if (
    type === "env_file" ||
    type === "database" ||
    type === "database_dump"
  ) {
    return "critical";
  }

  if (
    type === "admin_login" ||
    type === "jenkins" ||
    type === "grafana"
  ) {
    return "high";
  }

  if (
    type === "wordpress" ||
    type === "backup_file"
  ) {
    return "medium";
  }

  if (event?.status_code >= 500) {
    return "high";
  }

  return "low";
}

function getThreatLevel(score) {
  if (score >= 70) {
    return {
      label: "CRITICAL",
      badge: "hg-badge--critical",
      led: "hg-led--critical",
    };
  }

  if (score >= 50) {
    return {
      label: "HIGH",
      badge: "hg-badge--high",
      led: "hg-led--warning",
    };
  }

  if (score >= 20) {
    return {
      label: "ELEVATED",
      badge: "hg-badge--medium",
      led: "hg-led--warning",
    };
  }

  return {
    label: "LOW",
    badge: "hg-badge--low",
    led: "hg-led--blue",
  };
}

function buildSeverityDistribution(events = []) {
  const counts = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };

  events.forEach((event) => {
    counts[getEventSeverity(event)] += 1;
  });

  const total = events.length || 1;

  return {
    critical: Math.round(
      (counts.critical / total) * 100
    ),
    high: Math.round(
      (counts.high / total) * 100
    ),
    medium: Math.round(
      (counts.medium / total) * 100
    ),
    low: Math.round(
      (counts.low / total) * 100
    ),
  };
}

function getTimelineTitle(item) {
  if (item?.title) {
    return item.title;
  }

  const titles = {
    admin_login: "Administrative interface probed",
    env_file: "Sensitive environment file targeted",
    wordpress: "WordPress administration endpoint",
    jenkins: "Jenkins console enumeration",
    grafana: "Grafana dashboard probe",
    backup_file: "Backup archive discovered",
  };

  return (
    titles[item?.event_type] ||
    "Suspicious endpoint accessed"
  );
}

function getTimelineSeverity(item) {
  return normalizeSeverity(
    item?.severity || getEventSeverity(item)
  ).toUpperCase();
}

export function HomePage() {
  const {
    dashboard,
    sessions,
    timeline,
    detection,
    loading,
    error,
    wsConnected,
  } = useDashboardData();

  const latestEvents =
    dashboard?.latest_events ?? [];

  const latestSessions =
    sessions?.length > 0
      ? sessions
      : dashboard?.latest_sessions ?? [];

  const activeSession =
    latestSessions.find(
      (session) => session.status === "active"
    ) ??
    dashboard?.latest_sessions?.find(
      (session) => session.status === "active"
    ) ??
    latestSessions[0];

  const threatScore =
    detection?.score ??
    activeSession?.score ??
    0;

  const threatSeverity = normalizeSeverity(
    detection?.severity ??
      activeSession?.severity ??
      "low"
  );

  const distribution =
    buildSeverityDistribution(latestEvents);

  const threatLevel =
    getThreatLevel(threatScore);

  const metrics = [
    {
      label: "Total Events",
      value: dashboard?.total_events ?? 0,
      change: wsConnected ? "LIVE" : "—",
      icon: Activity,
      tone: "gold",
    },
    {
      label: "Active Sessions",
      value: String(
        dashboard?.active_sessions ??
          latestSessions.filter(
            (session) => session.status === "active"
          ).length
      ).padStart(2, "0"),
      change: wsConnected ? "LIVE" : "—",
      icon: Target,
      tone: "blue",
    },
    {
      label: "Critical Threats",
      value: latestSessions.filter(
        (session) =>
          normalizeSeverity(session.severity) ===
          "critical"
      ).length,
      change: threatSeverity.toUpperCase(),
      icon: ShieldAlert,
      tone: "critical",
    },
    {
      label: "Avg. Threat Score",
      value: threatScore,
      change: threatSeverity.toUpperCase(),
      icon: TrendingUp,
      tone: "warning",
    },
  ];

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
          PAGE HEADING
          ===================================================== */}

      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between"
      >
        <div className="min-w-0">
          <div className="hg-label">
            Overview / Live Monitoring
          </div>

          <h2 className="mt-2 text-xl font-semibold tracking-tight text-white sm:text-2xl">
            Threat Overview
          </h2>

          <p className="mt-1 max-w-2xl text-[11px] leading-5 text-[#777] sm:text-[12px]">
            Monitor deception activity, attack sessions,
            and emerging threats across the HoneyGuard
            environment.
          </p>
        </div>

        <div className="hg-inset flex min-h-[42px] w-full shrink-0 items-center justify-between gap-3 rounded-lg px-4 py-2.5 sm:w-auto sm:min-w-[190px]">
          <div className="flex items-center gap-2.5">
            <span
              className={`hg-status-dot ${
                wsConnected
                  ? "hg-status-dot--success"
                  : "hg-status-dot--warning"
              }`}
            />

            <span className="text-[10px] font-medium text-[#bdbdbd] sm:text-[11px]">
              {wsConnected
                ? "Monitoring Active"
                : "Connecting..."}
            </span>
          </div>

          <span className="hg-mono text-[9px] tracking-wide text-[#5f5f5f]">
            {wsConnected ? "LIVE" : "CONNECTING"}
          </span>
        </div>
      </motion.section>

      {error && (
        <div className="mb-4 rounded-lg border border-[#4a2929] bg-[#171010] px-4 py-3 text-[10px] text-[#d99090]">
          Unable to load live HoneyGuard data: {error}
        </div>
      )}

      {/* =====================================================
          METRICS
          ===================================================== */}

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric, index) => (
          <MetricCard
            key={metric.label}
            metric={metric}
            index={index}
            loading={loading}
          />
        ))}
      </section>

      {/* =====================================================
          LIVE MONITORING
          ===================================================== */}

      <section className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1.35fr_1fr]">
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.12,
            duration: 0.25,
          }}
          className="hg-raised min-w-0 overflow-hidden"
        >
          <PanelHeader
            title="Live Event Feed"
            subtitle="Real-time decoy interactions"
            icon={Activity}
            action="View all"
          />

          <div className="divide-y divide-[#222]">
            {loading && latestEvents.length === 0 ? (
              <LoadingRows count={4} />
            ) : latestEvents.length > 0 ? (
              latestEvents
                .slice(0, 6)
                .map((event) => (
                  <EventRow
                    key={event.id}
                    event={{
                      type:
                        event.event_type ??
                        "unknown_event",
                      path: event.path,
                      source: event.source_ip,
                      time: formatRelativeTime(
                        event.timestamp
                      ),
                      severity:
                        event.severity ??
                        getEventSeverity(event),
                    }}
                  />
                ))
            ) : (
              <EmptyState text="No security events recorded." />
            )}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.16,
            duration: 0.25,
          }}
          className="hg-raised min-w-0 overflow-hidden"
        >
          <PanelHeader
            title="Active Attack Sessions"
            subtitle="Currently correlated activity"
            icon={Target}
            action="View sessions"
          />

          <div className="space-y-2 p-3">
            {loading && latestSessions.length === 0 ? (
              <LoadingRows count={2} />
            ) : latestSessions.length > 0 ? (
              latestSessions
                .slice(0, 4)
                .map((session) => (
                  <SessionRow
                    key={session.id}
                    session={{
                      ip: session.source_ip,
                      requests: session.request_count,
                      score: session.score,
                      severity: session.severity,
                      lastSeen: formatRelativeTime(
                        session.last_seen
                      ),
                    }}
                  />
                ))
            ) : (
              <EmptyState text="No attack sessions recorded." />
            )}
          </div>
        </motion.section>
      </section>

      {/* =====================================================
          TIMELINE + DISTRIBUTION
          ===================================================== */}

      <section className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1.45fr_1fr]">
        {/* ===================================================
            THREAT TIMELINE
            =================================================== */}

        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.2,
            duration: 0.25,
          }}
          className="hg-raised min-w-0 overflow-hidden"
        >
          <PanelHeader
            title="Threat Timeline"
            subtitle="Recent attack progression"
            icon={Clock3}
            action="Open timeline"
          />

          <div className="px-4 py-5 sm:px-6 sm:py-6">
            {timeline.length > 0 ? (
              <div className="relative ml-1 border-l border-[#303030] pl-6 sm:ml-2 sm:pl-8">
                {timeline
                  .slice(0, 6)
                  .map((item, index) => (
                    <TimelineItem
                      key={item.id}
                      time={formatTime(
                        item.timestamp
                      )}
                      title={getTimelineTitle(item)}
                      detail={`${item.method ?? "GET"} ${
                        item.path ?? "—"
                      }`}
                      severity={getTimelineSeverity(
                        item
                      )}
                      active={index === 0}
                      last={
                        index ===
                        Math.min(
                          timeline.length,
                          6
                        ) -
                          1
                      }
                    />
                  ))}
              </div>
            ) : (
              <EmptyState text="No timeline activity available." />
            )}
          </div>
        </motion.section>

        {/* ===================================================
            THREAT DISTRIBUTION
            =================================================== */}

        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.24,
            duration: 0.25,
          }}
          className="hg-raised min-w-0 overflow-hidden"
        >
          <PanelHeader
            title="Threat Distribution"
            subtitle="Current severity breakdown"
            icon={ShieldAlert}
          />

          <div className="flex min-h-[350px] flex-col p-5 sm:p-6">
            <div className="grid flex-1 grid-cols-1 items-center gap-5 sm:grid-cols-[minmax(150px,0.85fr)_1fr] sm:gap-6">
              <div className="flex justify-center">
                <div className="relative aspect-square w-[155px] max-w-full sm:w-[170px]">
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: `conic-gradient(
                        #ef4444 0deg ${distribution.critical * 3.6}deg,
                        #f97316 ${distribution.critical * 3.6}deg ${
                          (distribution.critical +
                            distribution.high) *
                          3.6
                        }deg,
                        #eab308 ${
                          (distribution.critical +
                            distribution.high) *
                          3.6
                        }deg ${
                          (distribution.critical +
                            distribution.high +
                            distribution.medium) *
                          3.6
                        }deg,
                        #3b82f6 ${
                          (distribution.critical +
                            distribution.high +
                            distribution.medium) *
                          3.6
                        }deg 360deg
                      )`,
                    }}
                  />

                  <div className="absolute inset-[7px] rounded-full bg-[#101010] shadow-[inset_2px_2px_6px_rgba(0,0,0,0.9),inset_-1px_-1px_2px_rgba(255,255,255,0.04)]" />

                  <div className="absolute inset-[14px] flex items-center justify-center rounded-full bg-[#0c0c0c] shadow-[0_2px_7px_rgba(0,0,0,0.8)]">
                    <div className="flex flex-col items-center text-center">
                      <span className="hg-mono hg-metric-value text-[30px] font-semibold leading-none text-white">
                        {threatScore}
                      </span>

                      <span className="hg-label mt-2 text-[8px]">
                        Threat Score
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="min-w-0 space-y-2.5">
                <SeverityLegend
                  label="Critical"
                  value={`${distribution.critical}%`}
                  color="bg-[var(--hg-critical)]"
                />

                <SeverityLegend
                  label="High"
                  value={`${distribution.high}%`}
                  color="bg-[var(--hg-high)]"
                />

                <SeverityLegend
                  label="Medium"
                  value={`${distribution.medium}%`}
                  color="bg-[var(--hg-medium)]"
                />

                <SeverityLegend
                  label="Low"
                  value={`${distribution.low}%`}
                  color="bg-[var(--hg-low)]"
                />
              </div>
            </div>

            <div className="hg-divider my-5" />

            <div className="flex items-center justify-between gap-3">
              <span className="hg-label">
                Overall Threat Level
              </span>

              <span
                className={`hg-badge ${threatLevel.badge}`}
              >
                <span
                  className={`hg-led ${threatLevel.led}`}
                />
                {threatLevel.label}
              </span>
            </div>
          </div>
        </motion.section>
      </section>
    </motion.div>
  );
}

/* =========================================================
   METRIC CARD
   ========================================================= */

function MetricCard({
  metric,
  index,
  loading,
}) {
  const Icon = metric.icon;

  const iconColor =
    metric.tone === "critical"
      ? "text-[var(--hg-critical)]"
      : metric.tone === "warning"
        ? "text-[var(--hg-medium)]"
        : metric.tone === "blue"
          ? "text-[var(--hg-low)]"
          : "text-[var(--hg-gold-bright)]";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{
        delay: index * 0.05,
        duration: 0.22,
      }}
      className="hg-raised min-w-0 overflow-hidden p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="hg-label">
          {metric.label}
        </span>

        <div className="hg-inset flex h-8 w-8 shrink-0 items-center justify-center rounded-md">
          <Icon
            size={15}
            className={iconColor}
            strokeWidth={1.8}
          />
        </div>
      </div>

      <div className="mt-5 flex items-end justify-between gap-3">
        <span className="hg-mono hg-metric-value truncate text-2xl font-semibold tracking-tight text-white">
          {loading && metric.value === 0
            ? "—"
            : metric.value}
        </span>

        <span className="hg-mono shrink-0 text-[10px] text-[var(--hg-success)]">
          {metric.change}
        </span>
      </div>

      <div className="hg-meter mt-3">
        <span
          className={
            metric.tone === "critical"
              ? "w-[72%] bg-[var(--hg-critical)]"
              : metric.tone === "warning"
                ? "w-[58%] bg-[var(--hg-medium)]"
                : metric.tone === "blue"
                  ? "w-[41%] bg-[var(--hg-low)]"
                  : "w-[67%] bg-[var(--hg-gold)]"
          }
        />
      </div>
    </motion.div>
  );
}

/* =========================================================
   PANEL HEADER
   ========================================================= */

function PanelHeader({
  title,
  subtitle,
  icon: Icon,
  action,
}) {
  return (
    <div className="hg-panel-header flex min-w-0 items-center justify-between gap-3 px-4 py-4 sm:px-5">
      <div className="flex min-w-0 items-center gap-3">
        <div className="hg-inset flex h-8 w-8 shrink-0 items-center justify-center rounded-md">
          <Icon
            size={15}
            className="text-[var(--hg-gold-bright)]"
            strokeWidth={1.8}
          />
        </div>

        <div className="min-w-0">
          <h3 className="truncate text-[12px] font-semibold text-[#e5e5e5] sm:text-[13px]">
            {title}
          </h3>

          <p className="mt-1 truncate text-[10px] text-[#666]">
            {subtitle}
          </p>
        </div>
      </div>

      {action && (
        <button
          type="button"
          className="hg-control group ml-2 flex shrink-0 items-center gap-1.5 px-2.5 py-2 text-[9px] font-medium"
        >
          <span className="hidden sm:inline">
            {action}
          </span>

          <ArrowUpRight
            size={11}
            className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
          />
        </button>
      )}
    </div>
  );
}

/* =========================================================
   EVENT ROW
   ========================================================= */

function EventRow({ event }) {
  const severity =
    event.severity?.toLowerCase() || "low";

  const config = {
    critical: {
      badge: "hg-badge--critical",
      led: "hg-led--critical",
      icon: "text-[var(--hg-critical)]",
    },
    high: {
      badge: "hg-badge--high",
      led: "hg-led--warning",
      icon: "text-[var(--hg-high)]",
    },
    medium: {
      badge: "hg-badge--medium",
      led: "hg-led--warning",
      icon: "text-[var(--hg-medium)]",
    },
    low: {
      badge: "hg-badge--low",
      led: "hg-led--blue",
      icon: "text-[var(--hg-low)]",
    },
  }[severity] || {
    badge: "hg-badge--low",
    led: "hg-led--blue",
    icon: "text-[var(--hg-low)]",
  };

  return (
    <div className="hg-slide-in flex min-w-0 items-center gap-3 px-3 py-3.5 sm:px-4">
      <div className="hg-inset flex h-9 w-9 shrink-0 items-center justify-center rounded-md">
        <AlertTriangle
          size={14}
          className={config.icon}
          strokeWidth={1.8}
        />
      </div>

      <div className="min-w-0 flex-1">
        <span className="hg-mono block truncate text-[10px] font-medium text-[#d4d4d4]">
          {event.type}
        </span>

        <div className="mt-1 flex min-w-0 items-center gap-2">
          <span className="hg-mono truncate text-[9px] text-[#656565]">
            {event.path}
          </span>

          <span className="shrink-0 text-[#333]">
            •
          </span>

          <span className="hg-mono hidden shrink-0 text-[9px] text-[#555] sm:inline">
            {event.source}
          </span>
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <span
          className={`hg-badge ${config.badge}`}
        >
          <span
            className={`hg-led ${config.led}`}
          />

          {severity}
        </span>

        <span className="hg-mono text-[8px] text-[#555]">
          {event.time}
        </span>
      </div>
    </div>
  );
}

/* =========================================================
   SESSION ROW
   ========================================================= */

function SessionRow({ session }) {
  const severity =
    session.severity?.toLowerCase() || "low";

  const config = {
    critical: {
      badge: "hg-badge--critical",
      led: "hg-led--critical",
      dot: "hg-status-dot--critical",
    },
    high: {
      badge: "hg-badge--high",
      led: "hg-led--warning",
      dot: "hg-status-dot--high",
    },
    medium: {
      badge: "hg-badge--medium",
      led: "hg-led--warning",
      dot: "hg-status-dot--medium",
    },
    low: {
      badge: "hg-badge--low",
      led: "hg-led--blue",
      dot: "hg-status-dot--low",
    },
  }[severity] || {
    badge: "hg-badge--low",
    led: "hg-led--blue",
    dot: "hg-status-dot--low",
  };

  return (
    <div className="hg-inset min-w-0 p-3 transition-colors hover:border-[#3a3a3a]">
      <div className="flex min-w-0 items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={`hg-status-dot ${config.dot}`}
          />

          <span className="hg-mono truncate text-[11px] font-medium text-[#d4d4d4]">
            {session.ip}
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

      <div className="mt-3 grid grid-cols-3 gap-2">
        <MiniStat
          label="Requests"
          value={session.requests}
        />

        <MiniStat
          label="Score"
          value={session.score}
        />

        <MiniStat
          label="Last Seen"
          value={session.lastSeen}
        />
      </div>
    </div>
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

/* =========================================================
   TIMELINE ITEM
   ========================================================= */

function TimelineItem({
  time,
  title,
  detail,
  severity,
  active,
  last,
}) {
  const dotClass = {
    CRITICAL: "hg-status-dot--critical",
    HIGH: "hg-status-dot--high",
    MEDIUM: "hg-status-dot--medium",
    LOW: "hg-status-dot--low",
  }[severity] || "hg-status-dot--low";

  const textClass = {
    CRITICAL: "text-[var(--hg-critical)]",
    HIGH: "text-[var(--hg-high)]",
    MEDIUM: "text-[var(--hg-medium)]",
    LOW: "text-[var(--hg-low)]",
  }[severity] || "text-[var(--hg-low)]";

  return (
    <div
      className={`relative ${
        last ? "" : "pb-7 sm:pb-8"
      }`}
    >
      {!last && (
        <div className="absolute -left-[22px] top-5 bottom-0 w-px bg-[#292929] sm:-left-[29px]" />
      )}

      <span
        className={`absolute -left-[27px] top-[14px] h-3 w-3 rounded-full border-2 border-[#111] ${dotClass} ${
          active
            ? "shadow-[0_0_10px_rgba(239,68,68,0.55)]"
            : ""
        } sm:-left-[34px]`}
      />

      <div className="rounded-lg border border-[#292929] bg-[#0d0d0d] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] sm:px-5 sm:py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="truncate text-[11px] font-semibold text-[#dddddd] sm:text-[12px]">
                {title}
              </span>

              {active && (
                <span className="hg-badge shrink-0 hg-badge--critical">
                  LIVE
                </span>
              )}
            </div>

            <div className="hg-mono mt-2 text-[9px] text-[#626262] sm:text-[10px]">
              {detail}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-4 sm:flex-col sm:items-end sm:gap-1.5">
            <span
              className={`text-[9px] font-semibold tracking-[0.08em] ${textClass}`}
            >
              {severity}
            </span>

            <span className="hg-mono text-[9px] text-[#555]">
              {time}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   SEVERITY LEGEND
   ========================================================= */

function SeverityLegend({
  label,
  value,
  color,
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-[#292929] bg-[#101010] px-3.5 py-3">
      <div className="flex items-center gap-2.5">
        <span
          className={`h-2 w-2 shrink-0 rounded-full ${color}`}
        />

        <span className="text-[10px] font-medium text-[#a4a4a4]">
          {label}
        </span>
      </div>

      <span className="hg-mono text-[10px] font-semibold text-[#777]">
        {value}
      </span>
    </div>
  );
}

/* =========================================================
   STATES
   ========================================================= */

function LoadingRows({ count = 3 }) {
  return (
    <>
      {Array.from({ length: count }).map(
        (_, index) => (
          <div
            key={index}
            className="flex items-center gap-3 px-4 py-4"
          >
            <div className="h-9 w-9 animate-pulse rounded-md bg-[#181818]" />

            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-2.5 w-1/3 animate-pulse rounded bg-[#181818]" />
              <div className="h-2 w-1/2 animate-pulse rounded bg-[#151515]" />
            </div>
          </div>
        )
      )}
    </>
  );
}

function EmptyState({ text }) {
  return (
    <div className="px-4 py-8 text-center text-[10px] text-[#555]">
      {text}
    </div>
  );
}