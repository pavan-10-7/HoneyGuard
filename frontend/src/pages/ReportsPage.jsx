import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Clock3,
  FileText,
  Printer,
  RefreshCw,
  ShieldAlert,
  Target,
} from "lucide-react";
import { motion } from "framer-motion";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000";

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

function getTitle(event) {
  return (
    EVENT_TITLES[event?.event_type] ||
    event?.event_type ||
    "Security Event"
  );
}

function severityConfig(severity) {
  const value =
    severity?.toLowerCase() || "low";

  const configs = {
    critical: {
      label: "CRITICAL",
      text: "text-[var(--hg-critical)]",
      border: "border-[#542929]",
      bg: "bg-[#160d0d]",
      dot: "bg-[var(--hg-critical)]",
    },
    high: {
      label: "HIGH",
      text: "text-[var(--hg-high)]",
      border: "border-[#513624]",
      bg: "bg-[#17110d]",
      dot: "bg-[var(--hg-high)]",
    },
    medium: {
      label: "MEDIUM",
      text: "text-[var(--hg-medium)]",
      border: "border-[#4b4225]",
      bg: "bg-[#15130c]",
      dot: "bg-[var(--hg-medium)]",
    },
    low: {
      label: "LOW",
      text: "text-[var(--hg-low)]",
      border: "border-[#293847]",
      bg: "bg-[#0d1217]",
      dot: "bg-[var(--hg-low)]",
    },
  };

  return configs[value] || configs.low;
}

function formatDate(timestamp) {
  if (!timestamp) return "—";

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

function formatShortDate(timestamp) {
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

async function fetchSessions() {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/sessions`
  );

  const payload =
    await response.json().catch(() => null);

  if (
    !response.ok ||
    payload?.success === false
  ) {
    throw new Error(
      payload?.error?.message ||
        payload?.message ||
        "Unable to retrieve attack sessions."
    );
  }

  return Array.isArray(payload?.data)
    ? payload.data
    : [];
}

async function fetchSession(sessionId) {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/sessions/${sessionId}`
  );

  const payload =
    await response.json().catch(() => null);

  if (
    !response.ok ||
    payload?.success === false
  ) {
    throw new Error(
      payload?.error?.message ||
        payload?.message ||
        "Unable to retrieve attack session."
    );
  }

  return payload?.data || null;
}

async function fetchDetection(sessionId) {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/detection/${sessionId}`
  );

  const payload =
    await response.json().catch(() => null);

  if (
    !response.ok ||
    payload?.success === false
  ) {
    throw new Error(
      payload?.error?.message ||
        payload?.message ||
        "Unable to retrieve threat analysis."
    );
  }

  return payload?.data || null;
}

async function fetchTimeline(sessionId) {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/timeline/${sessionId}`
  );

  const payload =
    await response.json().catch(() => null);

  if (
    !response.ok ||
    payload?.success === false
  ) {
    throw new Error(
      payload?.error?.message ||
        payload?.message ||
        "Unable to retrieve attack timeline."
    );
  }

  return Array.isArray(payload?.data)
    ? payload.data
    : [];
}

export function ReportsPage() {
  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] =
    useState("");
  const [session, setSession] = useState(null);
  const [detection, setDetection] =
    useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] =
    useState(false);
  const [error, setError] = useState("");

  const loadSessions = useCallback(
    async (manual = false) => {
      if (manual) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        const data = await fetchSessions();

        setSessions(data);

        if (data.length === 0) {
          setSelectedSessionId("");
          setSession(null);
          setDetection(null);
          setTimeline([]);
          return;
        }

        const active =
          data.find(
            (item) =>
              item.status === "active"
          ) || data[0];

        const id =
          selectedSessionId || active.id;

        setSelectedSessionId(id);
      } catch (err) {
        setError(
          err.message ||
            "Unable to load report data."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [selectedSessionId]
  );

  const loadReport = useCallback(
    async (sessionId) => {
      if (!sessionId) {
        return;
      }

      setError("");

      try {
        const [
          sessionData,
          detectionData,
          timelineData,
        ] = await Promise.all([
          fetchSession(sessionId),
          fetchDetection(sessionId),
          fetchTimeline(sessionId),
        ]);

        setSession(sessionData);
        setDetection(detectionData);
        setTimeline(timelineData);
      } catch (err) {
        setError(
          err.message ||
            "Unable to generate report."
        );
      }
    },
    []
  );

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    if (selectedSessionId) {
      loadReport(selectedSessionId);
    }
  }, [selectedSessionId, loadReport]);

  const eventBreakdown = useMemo(() => {
    return timeline.reduce(
      (result, event) => {
        const type =
          event.event_type ||
          "unknown";

        result[type] =
          (result[type] || 0) + 1;

        return result;
      },
      {}
    );
  }, [timeline]);

  const severity =
    detection?.severity ||
    session?.severity ||
    "low";

  const config =
    severityConfig(severity);

  const score = Number(
    detection?.score ??
      session?.score ??
      0
  );

  const reasons = Array.isArray(
    detection?.reasons
  )
    ? detection.reasons
    : [];

  const handlePrint = () => {
    window.print();
  };

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
          HEADER
          ===================================================== */}

      <section className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between print:hidden">
        <div className="min-w-0">
          <div className="hg-label">
            Reports / Incident Report
          </div>

          <h2 className="mt-2 text-xl font-semibold tracking-tight text-white sm:text-2xl">
            Incident Reports
          </h2>

          <p className="mt-1 max-w-2xl text-[11px] leading-5 text-[#777] sm:text-[12px]">
            Review and export a complete report
            for an observed HoneyGuard attack
            session.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() =>
              loadSessions(true)
            }
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

          <button
            type="button"
            onClick={handlePrint}
            disabled={!session}
            className="hg-control flex min-h-[42px] items-center justify-center gap-2 px-3 py-2 text-[10px] font-medium disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Printer size={13} />

            Print / Save PDF
          </button>
        </div>
      </section>

      {error && (
        <div className="mb-4 rounded-lg border border-[#4a2929] bg-[#171010] px-4 py-3 text-[10px] text-[#d99090] print:hidden">
          {error}
        </div>
      )}

      {/* =====================================================
          SESSION SELECTOR
          ===================================================== */}

      {!loading && sessions.length > 0 && (
        <section className="mb-4 hg-raised overflow-hidden print:hidden">
          <div className="hg-panel-header flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div>
              <h3 className="text-[12px] font-semibold text-[#e5e5e5]">
                Report Session
              </h3>

              <p className="mt-1 text-[10px] text-[#666]">
                Select an attack session to generate
                its report.
              </p>
            </div>

            <select
              value={selectedSessionId}
              onChange={(event) =>
                setSelectedSessionId(
                  event.target.value
                )
              }
              className="min-h-[38px] w-full rounded-md border border-[#303030] bg-[#111] px-3 text-[10px] text-[#aaa] outline-none transition-colors focus:border-[#555] sm:w-[360px]"
            >
              {sessions.map(
                (item) => (
                  <option
                    key={item.id}
                    value={item.id}
                  >
                    {item.source_ip ||
                      "Unknown"}{" "}
                    · {item.severity ||
                      "low"}{" "}
                    ·{" "}
                    {formatShortDate(
                      item.last_seen
                    )}
                    {item.status ===
                    "active"
                      ? " · ACTIVE"
                      : ""}
                  </option>
                )
              )}
            </select>
          </div>
        </section>
      )}

      {/* =====================================================
          REPORT
          ===================================================== */}

      {loading ? (
        <ReportLoading />
      ) : !session ? (
        <EmptyReport />
      ) : (
        <div
          id="honeyguard-report"
          className="space-y-4"
        >
          {/* REPORT TITLE */}

          <section className="hg-raised overflow-hidden">
            <div className="p-5 sm:p-7">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <FileText
                      size={17}
                      className="text-[var(--hg-gold-bright)]"
                    />

                    <span className="hg-label">
                      HoneyGuard Security Report
                    </span>
                  </div>

                  <h3 className="mt-3 text-lg font-semibold text-white sm:text-xl">
                    Attack Session Incident Report
                  </h3>

                  <p className="mt-1 text-[10px] text-[#666]">
                    Generated from observed
                    telemetry and rule-based
                    threat analysis.
                  </p>
                </div>

                <div
                  className={[
                    "flex w-fit items-center gap-2 rounded-md border px-3 py-2",
                    config.border,
                    config.bg,
                  ].join(" ")}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${config.dot}`}
                  />

                  <span
                    className={[
                      "text-[9px] font-semibold tracking-[0.12em]",
                      config.text,
                    ].join(" ")}
                  >
                    {config.label}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* SESSION OVERVIEW */}

          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <ReportMetric
              icon={<Target size={14} />}
              label="Threat Score"
              value={score}
              accent={config.text}
            />

            <ReportMetric
              icon={<ShieldAlert size={14} />}
              label="Severity"
              value={severity}
              accent={config.text}
            />

            <ReportMetric
              icon={<Target size={14} />}
              label="Requests"
              value={
                session.request_count ??
                timeline.length
              }
            />

            <ReportMetric
              icon={<Clock3 size={14} />}
              label="Status"
              value={
                session.status ||
                "unknown"
              }
            />
          </section>

          {/* SESSION DETAILS */}

          <section className="hg-raised overflow-hidden">
            <ReportSectionHeader
              icon={<CalendarClock size={14} />}
              title="Session Details"
              subtitle="Attack session metadata"
            />

            <div className="grid grid-cols-1 divide-y divide-[#222] sm:grid-cols-2 sm:divide-x sm:divide-y-0">
              <DetailItem
                label="Session ID"
                value={session.id}
                mono
              />

              <DetailItem
                label="Source IP"
                value={
                  session.source_ip ||
                  "Unknown"
                }
                mono
              />

              <DetailItem
                label="First Seen"
                value={formatDate(
                  session.first_seen
                )}
              />

              <DetailItem
                label="Last Seen"
                value={formatDate(
                  session.last_seen
                )}
              />
            </div>
          </section>

          {/* THREAT ASSESSMENT */}

          <section className="hg-raised overflow-hidden">
            <ReportSectionHeader
              icon={<ShieldAlert size={14} />}
              title="Threat Assessment"
              subtitle="Rule-based analysis of observed behavior"
            />

            <div className="grid grid-cols-1 gap-5 p-5 lg:grid-cols-[220px_minmax(0,1fr)] sm:p-6">
              <div className="flex items-center justify-center">
                <div
                  className={[
                    "flex h-40 w-40 items-center justify-center rounded-full border bg-[#0c0c0c]",
                    config.border,
                  ].join(" ")}
                >
                  <div className="text-center">
                    <div
                      className={[
                        "hg-mono text-4xl font-semibold",
                        config.text,
                      ].join(" ")}
                    >
                      {score}
                    </div>

                    <div className="mt-2 text-[8px] uppercase tracking-[0.15em] text-[#555]">
                      Risk Score
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="hg-label">
                  Detection Reasons
                </div>

                {reasons.length === 0 ? (
                  <div className="mt-4 flex items-center gap-2 text-[10px] text-[#777]">
                    <CheckCircle2
                      size={13}
                      className="text-[var(--hg-success)]"
                    />

                    No detection rules
                    triggered.
                  </div>
                ) : (
                  <div className="mt-3 space-y-2">
                    {reasons.map(
                      (reason, index) => (
                        <div
                          key={`${reason}-${index}`}
                          className="flex items-start gap-2.5 rounded-md border border-[#252525] bg-[#101010] px-3 py-2.5"
                        >
                          <span className="hg-mono shrink-0 text-[8px] text-[var(--hg-gold-bright)]">
                            {String(
                              index + 1
                            ).padStart(
                              2,
                              "0"
                            )}
                          </span>

                          <span className="text-[10px] leading-5 text-[#aaa]">
                            {reason}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* EVENT BREAKDOWN */}

          <section className="hg-raised overflow-hidden">
            <ReportSectionHeader
              icon={<Target size={14} />}
              title="Attack Activity"
              subtitle="Observed event distribution"
            />

            <div className="grid grid-cols-1 gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_280px] sm:p-6">
              <div className="space-y-2">
                {timeline.length === 0 ? (
                  <p className="text-[10px] text-[#555]">
                    No timeline events recorded.
                  </p>
                ) : (
                  timeline.map(
                    (event, index) => (
                      <TimelineRow
                        key={
                          event.id ||
                          index
                        }
                        event={event}
                      />
                    )
                  )
                )}
              </div>

              <div className="rounded-lg border border-[#252525] bg-[#101010] p-4">
                <div className="hg-label">
                  Event Breakdown
                </div>

                <div className="mt-4 space-y-3">
                  {Object.entries(
                    eventBreakdown
                  ).map(
                    ([
                      type,
                      count,
                    ]) => (
                      <div
                        key={type}
                        className="flex items-center justify-between gap-3"
                      >
                        <span className="truncate text-[9px] text-[#777]">
                          {getTitle({
                            event_type:
                              type,
                          })}
                        </span>

                        <span className="hg-mono text-[9px] text-[#aaa]">
                          {count}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* FOOTER */}

          <section className="hg-inset rounded-lg px-4 py-4 text-center">
            <p className="text-[9px] leading-5 text-[#555]">
              HoneyGuard generated this report from
              captured decoy telemetry and the
              configured rule-based detection engine.
            </p>
          </section>
        </div>
      )}
    </motion.div>
  );
}

/* =========================================================
   REPORT METRIC
   ========================================================= */

function ReportMetric({
  icon,
  label,
  value,
  accent = "",
}) {
  return (
    <div className="hg-raised min-w-0 p-4">
      <div className="flex items-center gap-2 text-[#555]">
        {icon}

        <span className="hg-label">
          {label}
        </span>
      </div>

      <div
        className={[
          "mt-3 truncate hg-mono text-lg font-semibold",
          accent || "text-[#ddd]",
        ].join(" ")}
      >
        {value}
      </div>
    </div>
  );
}

/* =========================================================
   SECTION HEADER
   ========================================================= */

function ReportSectionHeader({
  icon,
  title,
  subtitle,
}) {
  return (
    <div className="hg-panel-header flex items-center gap-3 px-4 py-4 sm:px-5">
      <div className="hg-inset flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[var(--hg-gold-bright)]">
        {icon}
      </div>

      <div>
        <h3 className="text-[12px] font-semibold text-[#e5e5e5] sm:text-[13px]">
          {title}
        </h3>

        <p className="mt-1 text-[10px] text-[#666]">
          {subtitle}
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   DETAIL
   ========================================================= */

function DetailItem({
  label,
  value,
  mono = false,
}) {
  return (
    <div className="px-4 py-4 sm:px-5">
      <div className="hg-label">
        {label}
      </div>

      <div
        className={[
          "mt-2 break-all text-[10px] text-[#aaa]",
          mono
            ? "hg-mono"
            : "",
        ].join(" ")}
      >
        {value}
      </div>
    </div>
  );
}

/* =========================================================
   TIMELINE ROW
   ========================================================= */

function TimelineRow({ event }) {
  return (
    <div className="flex items-start gap-3 rounded-md border border-[#252525] bg-[#101010] px-3 py-3">
      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#171717]">
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--hg-gold-bright)]" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <span className="truncate text-[10px] font-medium text-[#bbb]">
            {event.title ||
              getTitle(event)}
          </span>

          <span className="shrink-0 hg-mono text-[8px] text-[#555]">
            {formatShortDate(
              event.timestamp
            )}
          </span>
        </div>

        <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
          <span className="hg-mono text-[8px] text-[#666]">
            {event.method ||
              event.http_method ||
              "—"}
          </span>

          <span className="hg-mono text-[8px] text-[#888]">
            {event.path || "—"}
          </span>

          <span className="hg-mono text-[8px] text-[#555]">
            HTTP{" "}
            {event.status_code ??
              "—"}
          </span>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   STATES
   ========================================================= */

function ReportLoading() {
  return (
    <div className="space-y-4">
      <div className="hg-raised h-[150px] animate-pulse bg-[#101010]" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="hg-raised h-[105px] animate-pulse bg-[#101010]"
          />
        ))}
      </div>
      <div className="hg-raised h-[300px] animate-pulse bg-[#101010]" />
    </div>
  );
}

function EmptyReport() {
  return (
    <div className="hg-raised flex min-h-[400px] flex-col items-center justify-center px-6 text-center">
      <FileText
        size={30}
        className="text-[#444]"
      />

      <h3 className="mt-4 text-[13px] font-semibold text-[#aaa]">
        No Attack Sessions Available
      </h3>

      <p className="mt-2 max-w-md text-[10px] leading-5 text-[#555]">
        Start a HoneyGuard demo session and
        generate attack traffic before creating
        an incident report.
      </p>
    </div>
  );
}