import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Activity,
  AlertTriangle,
  BrainCircuit,
  CheckCircle2,
  RefreshCw,
  ShieldAlert,
  Target,
} from "lucide-react";
import { motion } from "framer-motion";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

function severityConfig(severity) {
  const value = severity?.toLowerCase() || "low";

  const configs = {
    critical: {
      label: "CRITICAL",
      text: "text-[var(--hg-critical)]",
      border: "border-[#5b2929]",
      bg: "bg-[#180f0f]",
      ring: "ring-[var(--hg-critical)]/20",
      dot: "bg-[var(--hg-critical)]",
      badge: "hg-badge--critical",
      led: "hg-led--critical",
    },
    high: {
      label: "HIGH",
      text: "text-[var(--hg-high)]",
      border: "border-[#513624]",
      bg: "bg-[#17110d]",
      ring: "ring-[var(--hg-high)]/20",
      dot: "bg-[var(--hg-high)]",
      badge: "hg-badge--high",
      led: "hg-led--warning",
    },
    medium: {
      label: "MEDIUM",
      text: "text-[var(--hg-medium)]",
      border: "border-[#4a4025]",
      bg: "bg-[#15130c]",
      ring: "ring-[var(--hg-medium)]/20",
      dot: "bg-[var(--hg-medium)]",
      badge: "hg-badge--medium",
      led: "hg-led--warning",
    },
    low: {
      label: "LOW",
      text: "text-[var(--hg-low)]",
      border: "border-[#293847]",
      bg: "bg-[#0d1217]",
      ring: "ring-[var(--hg-low)]/20",
      dot: "bg-[var(--hg-low)]",
      badge: "hg-badge--low",
      led: "hg-led--blue",
    },
  };

  return configs[value] || configs.low;
}

function scoreLabel(score) {
  if (score >= 70) return "Critical Threat";
  if (score >= 50) return "High Threat";
  if (score >= 20) return "Moderate Threat";
  return "Low Threat";
}

function scoreWidth(score) {
  return Math.min(100, Math.max(0, score));
}

async function fetchActiveSession() {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/sessions`
  );

  const payload = await response.json().catch(() => null);

  if (!response.ok || payload?.success === false) {
    throw new Error(
      payload?.error?.message ||
        payload?.message ||
        "Unable to retrieve attack sessions."
    );
  }

  const sessions = Array.isArray(payload?.data)
    ? payload.data
    : [];

  if (sessions.length === 0) {
    return null;
  }

  return (
    sessions.find(
      (session) => session.status === "active"
    ) || sessions[0]
  );
}

async function fetchDetection(sessionId) {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/detection/${sessionId}`
  );

  const payload = await response.json().catch(() => null);

  if (!response.ok || payload?.success === false) {
    throw new Error(
      payload?.error?.message ||
        payload?.message ||
        "Unable to retrieve threat analysis."
    );
  }

  return payload?.data || null;
}

export function ThreatAnalysisPage() {
  const [session, setSession] = useState(null);
  const [detection, setDetection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadAnalysis = useCallback(
    async (showRefresh = false) => {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        const activeSession =
          await fetchActiveSession();

        setSession(activeSession);

        if (!activeSession) {
          setDetection(null);
          return;
        }

        const result = await fetchDetection(
          activeSession.id
        );

        setDetection(result);
      } catch (err) {
        setError(
          err.message ||
            "Unable to load threat analysis."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    loadAnalysis();
  }, [loadAnalysis]);

  const severity = useMemo(
    () =>
      severityConfig(
        detection?.severity ||
          session?.severity ||
          "low"
      ),
    [detection, session]
  );

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

      <section className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <div className="hg-label">
            Analyze / Threat Analysis
          </div>

          <h2 className="mt-2 text-xl font-semibold tracking-tight text-white sm:text-2xl">
            Threat Analysis
          </h2>

          <p className="mt-1 max-w-2xl text-[11px] leading-5 text-[#777] sm:text-[12px]">
            Rule-based analysis of the current attack
            session and its observed behavior.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadAnalysis(true)}
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

          Refresh Analysis
        </button>
      </section>

      {error && (
        <div className="mb-4 rounded-lg border border-[#4a2929] bg-[#171010] px-4 py-3 text-[10px] text-[#d99090]">
          {error}
        </div>
      )}

      {loading ? (
        <AnalysisLoading />
      ) : !session ? (
        <EmptyAnalysis />
      ) : (
        <>
          {/* =================================================
              SESSION CONTEXT
              ================================================= */}

          <section className="mb-4 hg-inset rounded-lg px-4 py-3 sm:px-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-2.5">
                <span
                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${severity.dot}`}
                />

                <span className="hg-label">
                  Analyzing Session
                </span>

                <span className="truncate hg-mono text-[9px] text-[#888]">
                  {session.id}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="hg-mono text-[9px] text-[#555]">
                  {session.source_ip ||
                    "Unknown source"}
                </span>

                <span
                  className={[
                    "text-[9px] font-medium uppercase",
                    session.status === "active"
                      ? "text-[var(--hg-success)]"
                      : "text-[#777]",
                  ].join(" ")}
                >
                  {session.status}
                </span>
              </div>
            </div>
          </section>

          {/* =================================================
              MAIN ANALYSIS GRID
              ================================================= */}

          <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
            {/* SCORE */}

            <div className="hg-raised min-w-0 overflow-hidden">
              <div className="hg-panel-header flex items-center gap-3 px-4 py-4 sm:px-5">
                <div className="hg-inset flex h-8 w-8 items-center justify-center rounded-md">
                  <ShieldAlert
                    size={15}
                    className={severity.text}
                    strokeWidth={1.8}
                  />
                </div>

                <div>
                  <h3 className="text-[12px] font-semibold text-[#e5e5e5] sm:text-[13px]">
                    Threat Score
                  </h3>

                  <p className="mt-1 text-[10px] text-[#666]">
                    Current session risk assessment
                  </p>
                </div>
              </div>

              <div className="p-5 sm:p-7">
                <div className="flex flex-col items-center justify-center py-4">
                  <div
                    className={[
                      "flex h-40 w-40 items-center justify-center rounded-full border bg-[#0c0c0c] ring-8 sm:h-48 sm:w-48",
                      severity.border,
                      severity.bg,
                      severity.ring,
                    ].join(" ")}
                  >
                    <div className="text-center">
                      <div
                        className={[
                          "hg-mono text-5xl font-semibold tracking-tight",
                          severity.text,
                        ].join(" ")}
                      >
                        {score}
                      </div>

                      <div className="mt-2 text-[9px] uppercase tracking-[0.18em] text-[#666]">
                        Risk Score
                      </div>
                    </div>
                  </div>

                  <div
                    className={[
                      "mt-5 text-[11px] font-semibold uppercase tracking-[0.12em]",
                      severity.text,
                    ].join(" ")}
                  >
                    {scoreLabel(score)}
                  </div>

                  <div className="mt-2">
                    <span
                      className={`hg-badge ${severity.badge}`}
                    >
                      <span
                        className={`hg-led ${severity.led}`}
                      />

                      {severity.label}
                    </span>
                  </div>
                </div>

                {/* Score bar */}

                <div className="mt-6">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="hg-label">
                      Threat Level
                    </span>

                    <span className="hg-mono text-[9px] text-[#666]">
                      {score}/100+
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-[#1c1c1c]">
                    <motion.div
                      initial={{
                        width: 0,
                      }}
                      animate={{
                        width: `${scoreWidth(
                          score
                        )}%`,
                      }}
                      transition={{
                        duration: 0.6,
                        ease: "easeOut",
                      }}
                      className={[
                        "h-full rounded-full",
                        severity.dot,
                      ].join(" ")}
                    />
                  </div>

                  <div className="mt-2 flex justify-between text-[8px] text-[#4d4d4d]">
                    <span>LOW</span>
                    <span>MEDIUM</span>
                    <span>HIGH</span>
                    <span>CRITICAL</span>
                  </div>
                </div>
              </div>
            </div>

            {/* DETECTION REASONS */}

            <div className="hg-raised min-w-0 overflow-hidden">
              <div className="hg-panel-header flex items-center gap-3 px-4 py-4 sm:px-5">
                <div className="hg-inset flex h-8 w-8 items-center justify-center rounded-md">
                  <BrainCircuit
                    size={15}
                    className="text-[var(--hg-gold-bright)]"
                    strokeWidth={1.8}
                  />
                </div>

                <div>
                  <h3 className="text-[12px] font-semibold text-[#e5e5e5] sm:text-[13px]">
                    Detection Reasons
                  </h3>

                  <p className="mt-1 text-[10px] text-[#666]">
                    Rules triggered by observed behavior
                  </p>
                </div>
              </div>

              <div className="p-4 sm:p-5">
                {reasons.length === 0 ? (
                  <div className="flex min-h-[250px] flex-col items-center justify-center text-center">
                    <CheckCircle2
                      size={24}
                      className="text-[var(--hg-success)]"
                    />

                    <p className="mt-3 text-[11px] text-[#aaa]">
                      No threat rules triggered.
                    </p>

                    <p className="mt-1 max-w-xs text-[9px] leading-5 text-[#555]">
                      The current session has not
                      accumulated enough suspicious
                      behavior to trigger detection
                      rules.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {reasons.map(
                      (reason, index) => (
                        <DetectionReason
                          key={`${reason}-${index}`}
                          reason={reason}
                          index={index}
                        />
                      )
                    )}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* =================================================
              SESSION METRICS
              ================================================= */}

          <section className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <MetricCard
              icon={<Target size={14} />}
              label="Requests"
              value={session.request_count ?? 0}
            />

            <MetricCard
              icon={<Activity size={14} />}
              label="Score"
              value={score}
              accent
            />

            <MetricCard
              icon={<ShieldAlert size={14} />}
              label="Severity"
              value={
                detection?.severity ||
                session.severity ||
                "low"
              }
              accentClass={severity.text}
            />

            <MetricCard
              icon={<AlertTriangle size={14} />}
              label="Rules Triggered"
              value={reasons.length}
            />
          </section>

          {/* =================================================
              SCORING EXPLANATION
              ================================================= */}

          <section className="mt-4 hg-raised overflow-hidden">
            <div className="hg-panel-header flex items-center gap-3 px-4 py-4 sm:px-5">
              <div className="hg-inset flex h-8 w-8 items-center justify-center rounded-md">
                <AlertTriangle
                  size={14}
                  className="text-[var(--hg-gold-bright)]"
                />
              </div>

              <div>
                <h3 className="text-[12px] font-semibold text-[#e5e5e5] sm:text-[13px]">
                  Detection Summary
                </h3>

                <p className="mt-1 text-[10px] text-[#666]">
                  Why HoneyGuard classified this session
                  at its current severity
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-0 divide-y divide-[#222] sm:grid-cols-2 sm:divide-x sm:divide-y-0">
              <SummaryItem
                label="Session Source"
                value={
                  session.source_ip ||
                  "Unknown"
                }
              />

              <SummaryItem
                label="Risk Classification"
                value={scoreLabel(score)}
              />
            </div>
          </section>
        </>
      )}
    </motion.div>
  );
}

/* =========================================================
   DETECTION REASON
   ========================================================= */

function DetectionReason({
  reason,
  index,
}) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        x: 8,
      }}
      animate={{
        opacity: 1,
        x: 0,
      }}
      transition={{
        duration: 0.2,
        delay: Math.min(index * 0.04, 0.2),
      }}
      className="flex items-start gap-3 rounded-lg border border-[#252525] bg-[#101010] px-3.5 py-3.5"
    >
      <div className="hg-inset flex h-6 w-6 shrink-0 items-center justify-center rounded-md">
        <span className="hg-mono text-[9px] text-[var(--hg-gold-bright)]">
          {String(index + 1).padStart(2, "0")}
        </span>
      </div>

      <div className="min-w-0 pt-0.5">
        <p className="text-[10px] leading-5 text-[#c5c5c5] sm:text-[11px]">
          {reason}
        </p>
      </div>
    </motion.div>
  );
}

/* =========================================================
   METRIC
   ========================================================= */

function MetricCard({
  icon,
  label,
  value,
  accent = false,
  accentClass = "",
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
          accent
            ? "text-[var(--hg-gold-bright)]"
            : "",
          accentClass,
        ].join(" ")}
      >
        {value}
      </div>
    </div>
  );
}

/* =========================================================
   SUMMARY ITEM
   ========================================================= */

function SummaryItem({ label, value }) {
  return (
    <div className="px-4 py-4 sm:px-5">
      <div className="hg-label">
        {label}
      </div>

      <div className="mt-2 hg-mono text-[10px] text-[#aaa]">
        {value}
      </div>
    </div>
  );
}

/* =========================================================
   STATES
   ========================================================= */

function AnalysisLoading() {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <div className="hg-raised h-[440px] animate-pulse bg-[#101010]" />
      <div className="hg-raised h-[440px] animate-pulse bg-[#101010]" />
    </div>
  );
}

function EmptyAnalysis() {
  return (
    <div className="hg-raised flex min-h-[360px] flex-col items-center justify-center px-6 text-center">
      <ShieldAlert
        size={28}
        className="text-[#444]"
      />

      <h3 className="mt-4 text-[13px] font-semibold text-[#aaa]">
        No Attack Session Available
      </h3>

      <p className="mt-2 max-w-md text-[10px] leading-5 text-[#555]">
        Start a new demo session and generate
        traffic against the HoneyGuard decoys to
        populate threat analysis.
      </p>
    </div>
  );
}